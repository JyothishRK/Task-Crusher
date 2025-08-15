const fs = require('fs');
const path = require('path');

/**
 * Analyzes Mongoose model files to extract schema information
 */
class ModelAnalyzer {
    constructor(modelsDir = '../../backend/src/models') {
        this.modelsDir = path.resolve(__dirname, modelsDir);
    }

    /**
     * Analyze all model files in the models directory
     */
    analyzeAllModels() {
        const modelFiles = this.getModelFiles();
        const models = {};

        modelFiles.forEach(filePath => {
            const modelName = path.basename(filePath, '.js');
            const modelData = this.analyzeModelFile(filePath);
            if (modelData) {
                models[modelName] = modelData;
            }
        });

        return models;
    }

    /**
     * Get all JavaScript files in the models directory
     */
    getModelFiles() {
        try {
            return fs.readdirSync(this.modelsDir)
                .filter(file => file.endsWith('.js'))
                .map(file => path.join(this.modelsDir, file));
        } catch (error) {
            console.error(`Error reading models directory: ${error.message}`);
            return [];
        }
    }

    /**
     * Analyze a single model file
     */
    analyzeModelFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const modelName = path.basename(filePath, '.js');
            
            return {
                name: this.capitalizeFirst(modelName),
                filePath: filePath,
                fields: this.extractFields(content),
                methods: this.extractMethods(content),
                relationships: this.extractRelationships(content),
                indexes: this.extractIndexes(content),
                virtuals: this.extractVirtuals(content),
                middleware: this.extractMiddleware(content)
            };
        } catch (error) {
            console.error(`Error analyzing model file ${filePath}: ${error.message}`);
            return null;
        }
    }

    /**
     * Extract field definitions from schema
     */
    extractFields(content) {
        const fields = [];
        
        // Find schema definition - more flexible regex
        const schemaMatch = content.match(/const\s+\w+Schema\s*=\s*new\s+mongoose\.Schema\s*\(\s*\{([\s\S]*?)\}(?:\s*,\s*\{[\s\S]*?\})?\s*\)/);
        if (!schemaMatch) return fields;

        const schemaContent = schemaMatch[1];
        
        // Split by field definitions more carefully
        const lines = schemaContent.split('\n');
        let currentField = '';
        let braceCount = 0;
        let inField = false;
        
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('//')) continue;
            
            // Check if this line starts a new field
            const fieldStartMatch = line.match(/^(\w+)\s*:\s*/);
            if (fieldStartMatch && braceCount === 0) {
                // Process previous field if exists
                if (currentField) {
                    const field = this.parseFieldDefinition(currentField);
                    if (field) fields.push(field);
                }
                
                currentField = line;
                inField = true;
                
                // Count braces in this line
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;
                
                // If field ends on same line (simple field)
                if (braceCount === 0 && (line.includes(',') || line.endsWith('}') || line.endsWith(']'))) {
                    const field = this.parseFieldDefinition(currentField);
                    if (field) fields.push(field);
                    currentField = '';
                    inField = false;
                }
            } else if (inField) {
                currentField += '\n' + line;
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;
                
                // Field definition complete
                if (braceCount === 0) {
                    const field = this.parseFieldDefinition(currentField);
                    if (field) fields.push(field);
                    currentField = '';
                    inField = false;
                }
            }
        }
        
        // Process last field if exists
        if (currentField) {
            const field = this.parseFieldDefinition(currentField);
            if (field) fields.push(field);
        }

        return fields;
    }

    /**
     * Parse individual field definition
     */
    parseFieldDefinition(fieldText) {
        const nameMatch = fieldText.match(/^(\w+)\s*:/);
        if (!nameMatch) return null;

        const name = nameMatch[1];
        const field = {
            name,
            type: 'String',
            required: false,
            description: `${name} field`,
            constraints: {}
        };

        // Check if it's a simple field definition (field: Type)
        const simpleTypeMatch = fieldText.match(/^(\w+)\s*:\s*(\w+)(?:\s*,|\s*$)/);
        if (simpleTypeMatch && !fieldText.includes('{')) {
            field.type = this.normalizeType(simpleTypeMatch[2]);
            return field;
        }

        // Extract type
        const typeMatch = fieldText.match(/type\s*:\s*(\w+(?:\.\w+)*(?:\.\w+)*)/);
        if (typeMatch) {
            field.type = this.normalizeType(typeMatch[1]);
        }

        // Extract required
        if (fieldText.includes('required: true') || fieldText.includes('required : true')) {
            field.required = true;
        }

        // Extract default value
        const defaultMatch = fieldText.match(/default\s*:\s*([^,\n}]+)/);
        if (defaultMatch) {
            let defaultValue = defaultMatch[1].trim();
            // Clean up the default value
            if (defaultValue.endsWith(',')) {
                defaultValue = defaultValue.slice(0, -1);
            }
            field.default = defaultValue.replace(/['"]/g, '');
        }

        // Extract constraints
        const minlengthMatch = fieldText.match(/minlength\s*:\s*(\d+)/);
        if (minlengthMatch) {
            field.constraints.minlength = parseInt(minlengthMatch[1]);
        }

        const maxlengthMatch = fieldText.match(/maxlength\s*:\s*(\d+)/);
        if (maxlengthMatch) {
            field.constraints.maxlength = parseInt(maxlengthMatch[1]);
        }

        // Extract enum values
        const enumMatch = fieldText.match(/enum\s*:\s*\[(.*?)\]/s);
        if (enumMatch) {
            const enumValues = enumMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
            field.constraints.enum = enumValues.filter(v => v.length > 0);
        }

        // Extract validation function
        const validateMatch = fieldText.match(/validate\s*\([^)]*\)\s*\{[\s\S]*?\}/);
        if (validateMatch) {
            field.constraints.customValidation = true;
        }

        // Extract reference
        const refMatch = fieldText.match(/ref\s*:\s*['"](\w+)['"]/);
        if (refMatch) {
            field.ref = refMatch[1];
            field.type = 'ObjectId';
        }

        // Handle array fields
        if (fieldText.includes('[{') || fieldText.includes('type: [')) {
            field.type = 'Array';
        }

        return field;
    }

    /**
     * Extract method definitions
     */
    extractMethods(content) {
        const methods = [];
        
        // Instance methods
        const instanceMethodMatches = content.match(/\w+Schema\.methods\.(\w+)\s*=\s*function[^{]*\{[\s\S]*?\n\}/g);
        if (instanceMethodMatches) {
            instanceMethodMatches.forEach(methodMatch => {
                const nameMatch = methodMatch.match(/\.methods\.(\w+)/);
                if (nameMatch) {
                    methods.push({
                        name: nameMatch[1],
                        type: 'instance',
                        description: `Instance method: ${nameMatch[1]}`,
                        returns: 'Mixed'
                    });
                }
            });
        }

        // Static methods
        const staticMethodMatches = content.match(/\w+Schema\.statics\.(\w+)\s*=\s*async?\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\}/g);
        if (staticMethodMatches) {
            staticMethodMatches.forEach(methodMatch => {
                const nameMatch = methodMatch.match(/\.statics\.(\w+)/);
                if (nameMatch) {
                    methods.push({
                        name: nameMatch[1],
                        type: 'static',
                        description: `Static method: ${nameMatch[1]}`,
                        returns: 'Mixed'
                    });
                }
            });
        }

        return methods;
    }

    /**
     * Extract relationship information
     */
    extractRelationships(content) {
        const relationships = [];
        
        // Virtual relationships
        const virtualMatches = content.match(/\w+Schema\.virtual\s*\(\s*['"](\w+)['"]\s*,\s*\{[\s\S]*?\}\s*\)/g);
        if (virtualMatches) {
            virtualMatches.forEach(virtualMatch => {
                const nameMatch = virtualMatch.match(/virtual\s*\(\s*['"](\w+)['"]/);
                const refMatch = virtualMatch.match(/ref\s*:\s*['"](\w+)['"]/);
                const localFieldMatch = virtualMatch.match(/localField\s*:\s*['"](\w+)['"]/);
                const foreignFieldMatch = virtualMatch.match(/foreignField\s*:\s*['"](\w+)['"]/);
                
                if (nameMatch && refMatch) {
                    relationships.push({
                        field: nameMatch[1],
                        type: 'virtual',
                        model: refMatch[1],
                        localField: localFieldMatch ? localFieldMatch[1] : null,
                        foreignField: foreignFieldMatch ? foreignFieldMatch[1] : null,
                        description: `Virtual relationship to ${refMatch[1]}`
                    });
                }
            });
        }

        // Reference relationships (from field analysis)
        const fields = this.extractFields(content);
        fields.forEach(field => {
            if (field.ref) {
                relationships.push({
                    field: field.name,
                    type: 'reference',
                    model: field.ref,
                    description: `Reference to ${field.ref} model`
                });
            }
        });

        return relationships;
    }

    /**
     * Extract index definitions
     */
    extractIndexes(content) {
        const indexes = [];
        
        const indexMatches = content.match(/\w+Schema\.index\s*\(\s*\{([^}]+)\}(?:\s*,\s*\{([^}]+)\})?\s*\)/g);
        if (indexMatches) {
            indexMatches.forEach(indexMatch => {
                const fieldsMatch = indexMatch.match(/index\s*\(\s*\{([^}]+)\}/);
                if (fieldsMatch) {
                    indexes.push({
                        fields: fieldsMatch[1].trim(),
                        description: `Index on ${fieldsMatch[1].trim()}`
                    });
                }
            });
        }

        return indexes;
    }

    /**
     * Extract virtual properties
     */
    extractVirtuals(content) {
        const virtuals = [];
        
        const virtualMatches = content.match(/\w+Schema\.virtual\s*\(\s*['"](\w+)['"]\s*\)\.get\s*\([^{]*\{[\s\S]*?\}\s*\)/g);
        if (virtualMatches) {
            virtualMatches.forEach(virtualMatch => {
                const nameMatch = virtualMatch.match(/virtual\s*\(\s*['"](\w+)['"]/);
                if (nameMatch) {
                    virtuals.push({
                        name: nameMatch[1],
                        description: `Virtual property: ${nameMatch[1]}`,
                        type: 'getter'
                    });
                }
            });
        }

        return virtuals;
    }

    /**
     * Extract middleware (pre/post hooks)
     */
    extractMiddleware(content) {
        const middleware = [];
        
        const preMatches = content.match(/\w+Schema\.pre\s*\(\s*['"](\w+)['"]\s*,[\s\S]*?\}\s*\)/g);
        if (preMatches) {
            preMatches.forEach(preMatch => {
                const hookMatch = preMatch.match(/pre\s*\(\s*['"](\w+)['"]/);
                if (hookMatch) {
                    middleware.push({
                        type: 'pre',
                        hook: hookMatch[1],
                        description: `Pre-${hookMatch[1]} middleware`
                    });
                }
            });
        }

        const postMatches = content.match(/\w+Schema\.post\s*\(\s*['"](\w+)['"]\s*,[\s\S]*?\}\s*\)/g);
        if (postMatches) {
            postMatches.forEach(postMatch => {
                const hookMatch = postMatch.match(/post\s*\(\s*['"](\w+)['"]/);
                if (hookMatch) {
                    middleware.push({
                        type: 'post',
                        hook: hookMatch[1],
                        description: `Post-${hookMatch[1]} middleware`
                    });
                }
            });
        }

        return middleware;
    }

    /**
     * Normalize type names
     */
    normalizeType(type) {
        const typeMap = {
            'String': 'String',
            'Number': 'Number',
            'Boolean': 'Boolean',
            'Date': 'Date',
            'Buffer': 'Buffer',
            'mongoose.Schema.Types.ObjectId': 'ObjectId',
            'mongoose.Schema.Types.Mixed': 'Mixed'
        };

        return typeMap[type] || type;
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

module.exports = ModelAnalyzer;