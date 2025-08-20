const ModelAnalyzer = require('../analyzers/model-analyzer');
const { FileUtils, TemplateEngine } = require('../generate-docs');
const path = require('path');

/**
 * Generates documentation for Mongoose models
 */
class ModelDocumentationGenerator {
    constructor() {
        this.analyzer = new ModelAnalyzer();
        this.outputDir = path.resolve(__dirname, '../../docs/api/models');
    }

    /**
     * Generate documentation for all models
     */
    generateAllModelDocs() {
        console.log('📝 Generating model documentation...');
        
        const models = this.analyzer.analyzeAllModels();
        
        Object.values(models).forEach(model => {
            this.generateModelDoc(model);
        });

        // Generate models index
        this.generateModelsIndex(models);
        
        console.log('✅ Model documentation generation complete');
    }

    /**
     * Generate documentation for a single model
     */
    generateModelDoc(modelData) {
        const content = this.renderModelDocumentation(modelData);
        const filename = `${modelData.name.toLowerCase()}.md`;
        const filePath = path.join(this.outputDir, filename);
        
        FileUtils.writeFile(filePath, content);
    }

    /**
     * Generate models index file
     */
    generateModelsIndex(models) {
        let content = '# Data Models\n\n';
        content += 'This section documents all data models used in the Task Crusher API.\n\n';
        content += '## Available Models\n\n';
        
        Object.values(models).forEach(model => {
            content += `- [${model.name}](./${model.name.toLowerCase()}.md) - ${this.getModelDescription(model)}\n`;
        });
        
        content += '\n## Model Relationships\n\n';
        content += 'The following diagram shows the relationships between models:\n\n';
        content += '```\n';
        content += 'User (1) -----> (N) Task\n';
        content += '  |                 |\n';
        content += '  |-- _id           |-- userId (ref: User)\n';
        content += '  |-- name          |-- title\n';
        content += '  |-- email         |-- description\n';
        content += '  |-- password      |-- dueDate\n';
        content += '  |-- age           |-- priority\n';
        content += '  |-- tokens        |-- category\n';
        content += '  |-- avatar        |-- isCompleted\n';
        content += '                    |-- repeatType\n';
        content += '```\n\n';
        
        const filePath = path.join(this.outputDir, 'README.md');
        FileUtils.writeFile(filePath, content);
    }

    /**
     * Render complete model documentation
     */
    renderModelDocumentation(modelData) {
        let content = `# ${modelData.name} Model\n\n`;
        content += `${this.getModelDescription(modelData)}\n\n`;
        
        // Table of Contents
        content += '## Table of Contents\n\n';
        content += '- [Fields](#fields)\n';
        if (modelData.methods && modelData.methods.length > 0) {
            content += '- [Methods](#methods)\n';
        }
        if (modelData.relationships && modelData.relationships.length > 0) {
            content += '- [Relationships](#relationships)\n';
        }
        if (modelData.indexes && modelData.indexes.length > 0) {
            content += '- [Indexes](#indexes)\n';
        }
        if (modelData.virtuals && modelData.virtuals.length > 0) {
            content += '- [Virtual Properties](#virtual-properties)\n';
        }
        if (modelData.middleware && modelData.middleware.length > 0) {
            content += '- [Middleware](#middleware)\n';
        }
        content += '- [Example](#example)\n\n';
        
        // Fields section
        content += this.renderFields(modelData.fields);
        
        // Methods section
        if (modelData.methods && modelData.methods.length > 0) {
            content += this.renderMethods(modelData.methods);
        }
        
        // Relationships section
        if (modelData.relationships && modelData.relationships.length > 0) {
            content += this.renderRelationships(modelData.relationships);
        }
        
        // Indexes section
        if (modelData.indexes && modelData.indexes.length > 0) {
            content += this.renderIndexes(modelData.indexes);
        }
        
        // Virtual properties section
        if (modelData.virtuals && modelData.virtuals.length > 0) {
            content += this.renderVirtuals(modelData.virtuals);
        }
        
        // Middleware section
        if (modelData.middleware && modelData.middleware.length > 0) {
            content += this.renderMiddleware(modelData.middleware);
        }
        
        // Example section
        content += this.renderExample(modelData);
        
        return content;
    }

    /**
     * Render fields section
     */
    renderFields(fields) {
        let content = '## Fields\n\n';
        
        if (!fields || fields.length === 0) {
            content += 'No fields documented.\n\n';
            return content;
        }
        
        content += '| Field | Type | Required | Default | Constraints | Description |\n';
        content += '|-------|------|----------|---------|-------------|-------------|\n';
        
        fields.forEach(field => {
            const required = field.required ? '✅ Yes' : '❌ No';
            const defaultValue = field.default ? `\`${field.default}\`` : '-';
            const constraints = this.formatConstraints(field.constraints);
            const type = field.ref ? `ObjectId (→ ${field.ref})` : field.type;
            
            content += `| **${field.name}** | ${type} | ${required} | ${defaultValue} | ${constraints} | ${field.description} |\n`;
        });
        
        content += '\n';
        return content;
    }

    /**
     * Render methods section
     */
    renderMethods(methods) {
        let content = '## Methods\n\n';
        
        methods.forEach(method => {
            content += `### ${method.name}()\n\n`;
            content += `**Type:** ${method.type} method\n\n`;
            content += `${method.description}\n\n`;
            content += `**Returns:** \`${method.returns}\`\n\n`;
        });
        
        return content;
    }

    /**
     * Render relationships section
     */
    renderRelationships(relationships) {
        let content = '## Relationships\n\n';
        
        relationships.forEach(rel => {
            content += `### ${rel.field}\n\n`;
            content += `**Type:** ${rel.type}\n`;
            content += `**Related Model:** ${rel.model}\n`;
            if (rel.localField) content += `**Local Field:** ${rel.localField}\n`;
            if (rel.foreignField) content += `**Foreign Field:** ${rel.foreignField}\n`;
            content += `**Description:** ${rel.description}\n\n`;
        });
        
        return content;
    }

    /**
     * Render indexes section
     */
    renderIndexes(indexes) {
        let content = '## Indexes\n\n';
        content += 'The following indexes are defined for performance optimization:\n\n';
        
        indexes.forEach((index, i) => {
            content += `${i + 1}. \`${index.fields}\` - ${index.description}\n`;
        });
        
        content += '\n';
        return content;
    }

    /**
     * Render virtual properties section
     */
    renderVirtuals(virtuals) {
        let content = '## Virtual Properties\n\n';
        
        virtuals.forEach(virtual => {
            content += `### ${virtual.name}\n\n`;
            content += `**Type:** ${virtual.type}\n`;
            content += `**Description:** ${virtual.description}\n\n`;
        });
        
        return content;
    }

    /**
     * Render middleware section
     */
    renderMiddleware(middleware) {
        let content = '## Middleware\n\n';
        content += 'The following middleware hooks are defined:\n\n';
        
        middleware.forEach(mw => {
            content += `- **${mw.type}-${mw.hook}**: ${mw.description}\n`;
        });
        
        content += '\n';
        return content;
    }

    /**
     * Render example section
     */
    renderExample(modelData) {
        let content = '## Example\n\n';
        content += `Example ${modelData.name} document:\n\n`;
        content += '```json\n';
        
        const example = this.generateExampleDocument(modelData);
        content += JSON.stringify(example, null, 2);
        
        content += '\n```\n\n';
        return content;
    }

    /**
     * Generate example document based on model fields
     */
    generateExampleDocument(modelData) {
        const example = {};
        
        if (modelData.fields) {
            modelData.fields.forEach(field => {
                if (field.name === 'password' || field.name === 'tokens') {
                    return; // Skip sensitive fields
                }
                
                example[field.name] = this.generateExampleValue(field);
            });
        }
        
        // Add common fields
        example._id = "507f1f77bcf86cd799439011";
        example.createdAt = "2024-01-15T10:30:00.000Z";
        example.updatedAt = "2024-01-15T10:30:00.000Z";
        
        return example;
    }

    /**
     * Generate example value for a field
     */
    generateExampleValue(field) {
        if (field.default !== undefined) {
            return field.default;
        }
        
        if (field.constraints && field.constraints.enum) {
            return field.constraints.enum[0];
        }
        
        switch (field.type) {
            case 'String':
                return this.generateExampleString(field.name);
            case 'Number':
                return field.name === 'age' ? 25 : 1;
            case 'Boolean':
                return false;
            case 'Date':
                return "2024-01-20T09:00:00.000Z";
            case 'ObjectId':
                return "507f1f77bcf86cd799439011";
            case 'Array':
                return [];
            default:
                return null;
        }
    }

    /**
     * Generate example string based on field name
     */
    generateExampleString(fieldName) {
        const examples = {
            name: "John Doe",
            email: "john.doe@example.com",
            title: "Complete project documentation",
            description: "Write comprehensive API documentation for the Task Crusher application",
            category: "work",
            notificationTime: "09:00"
        };
        
        return examples[fieldName] || `Example ${fieldName}`;
    }

    /**
     * Format constraints for display
     */
    formatConstraints(constraints) {
        if (!constraints || Object.keys(constraints).length === 0) {
            return '-';
        }
        
        const parts = [];
        
        if (constraints.minlength) parts.push(`min: ${constraints.minlength}`);
        if (constraints.maxlength) parts.push(`max: ${constraints.maxlength}`);
        if (constraints.enum) parts.push(`enum: [${constraints.enum.join(', ')}]`);
        if (constraints.customValidation) parts.push('custom validation');
        
        return parts.length > 0 ? parts.join(', ') : '-';
    }

    /**
     * Get model description
     */
    getModelDescription(modelData) {
        const descriptions = {
            User: 'Represents a user account in the Task Crusher application with authentication and profile information.',
            Task: 'Represents a task item with scheduling, priority, and completion tracking capabilities.'
        };
        
        return descriptions[modelData.name] || `${modelData.name} model for the Task Crusher application.`;
    }
}

module.exports = ModelDocumentationGenerator;