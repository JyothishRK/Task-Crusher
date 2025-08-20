const fs = require('fs');
const path = require('path');

/**
 * File system utilities for documentation generation
 */
class FileUtils {
    /**
     * Ensure directory exists, create if it doesn't
     */
    static ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * Read file content safely
     */
    static readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Write file content safely
     */
    static writeFile(filePath, content) {
        try {
            this.ensureDir(path.dirname(filePath));
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Generated: ${filePath}`);
        } catch (error) {
            console.error(`Error writing file ${filePath}:`, error.message);
        }
    }

    /**
     * Get all files in directory with specific extension
     */
    static getFiles(dirPath, extension = '.js') {
        try {
            return fs.readdirSync(dirPath)
                .filter(file => file.endsWith(extension))
                .map(file => path.join(dirPath, file));
        } catch (error) {
            console.error(`Error reading directory ${dirPath}:`, error.message);
            return [];
        }
    }
}

/**
 * Template system for consistent documentation formatting
 */
class TemplateEngine {
    /**
     * Render endpoint documentation template
     */
    static renderEndpoint(endpointData) {
        const { method, path, description, authentication, parameters, responses, examples } = endpointData;
        
        let template = `# ${method} ${path}\n\n`;
        template += `${description}\n\n`;
        
        // Authentication
        if (authentication === 'required') {
            template += `🔒 **Authentication Required**\n\n`;
        } else if (authentication === 'optional') {
            template += `🔓 **Authentication Optional**\n\n`;
        }
        
        // Parameters
        if (parameters) {
            if (parameters.path && parameters.path.length > 0) {
                template += `## Path Parameters\n\n`;
                parameters.path.forEach(param => {
                    template += `- **${param.name}** (${param.type}): ${param.description}\n`;
                });
                template += `\n`;
            }
            
            if (parameters.query && parameters.query.length > 0) {
                template += `## Query Parameters\n\n`;
                parameters.query.forEach(param => {
                    const optional = param.optional ? ' (optional)' : '';
                    template += `- **${param.name}** (${param.type}${optional}): ${param.description}\n`;
                });
                template += `\n`;
            }
            
            if (parameters.body) {
                template += `## Request Body\n\n`;
                template += `\`\`\`json\n${JSON.stringify(parameters.body, null, 2)}\n\`\`\`\n\n`;
            }
        }
        
        // Responses
        if (responses) {
            template += `## Responses\n\n`;
            Object.entries(responses).forEach(([status, response]) => {
                template += `### ${status} - ${response.description}\n\n`;
                if (response.example) {
                    template += `\`\`\`json\n${JSON.stringify(response.example, null, 2)}\n\`\`\`\n\n`;
                }
            });
        }
        
        // Examples
        if (examples && examples.length > 0) {
            template += `## Examples\n\n`;
            examples.forEach(example => {
                template += `### ${example.title}\n\n`;
                template += `**Request:**\n`;
                template += `\`\`\`http\n${example.request.method} ${example.request.url}\n`;
                if (example.request.headers) {
                    Object.entries(example.request.headers).forEach(([key, value]) => {
                        template += `${key}: ${value}\n`;
                    });
                }
                if (example.request.body) {
                    template += `\n${JSON.stringify(example.request.body, null, 2)}`;
                }
                template += `\n\`\`\`\n\n`;
                
                template += `**Response:**\n`;
                template += `\`\`\`json\n${JSON.stringify(example.response.body, null, 2)}\n\`\`\`\n\n`;
            });
        }
        
        return template;
    }

    /**
     * Render model documentation template
     */
    static renderModel(modelData) {
        const { name, description, fields, methods, relationships } = modelData;
        
        let template = `# ${name} Model\n\n`;
        template += `${description}\n\n`;
        
        // Fields
        if (fields && fields.length > 0) {
            template += `## Fields\n\n`;
            template += `| Field | Type | Required | Constraints | Description |\n`;
            template += `|-------|------|----------|-------------|-------------|\n`;
            
            fields.forEach(field => {
                const required = field.required ? '✅' : '❌';
                const constraints = field.constraints ? JSON.stringify(field.constraints) : '-';
                template += `| ${field.name} | ${field.type} | ${required} | ${constraints} | ${field.description} |\n`;
            });
            template += `\n`;
        }
        
        // Methods
        if (methods && methods.length > 0) {
            template += `## Methods\n\n`;
            methods.forEach(method => {
                template += `### ${method.name}()\n\n`;
                template += `${method.description}\n\n`;
                template += `**Returns:** ${method.returns}\n\n`;
            });
        }
        
        // Relationships
        if (relationships && relationships.length > 0) {
            template += `## Relationships\n\n`;
            relationships.forEach(rel => {
                template += `- **${rel.field}**: ${rel.type} to ${rel.model} - ${rel.description}\n`;
            });
            template += `\n`;
        }
        
        return template;
    }
}

/**
 * Main documentation generator
 */
class DocumentationGenerator {
    constructor() {
        this.sourceDir = path.join(__dirname, '../backend/src');
        this.outputDir = path.join(__dirname, '../docs/api');
    }

    /**
     * Initialize documentation structure
     */
    init() {
        console.log('🚀 Initializing documentation structure...');
        
        // Create directory structure
        FileUtils.ensureDir(this.outputDir);
        FileUtils.ensureDir(path.join(this.outputDir, 'endpoints'));
        FileUtils.ensureDir(path.join(this.outputDir, 'models'));
        FileUtils.ensureDir(path.join(this.outputDir, 'examples'));
        
        console.log('✅ Documentation structure created');
    }

    /**
     * Generate all documentation
     */
    async generate() {
        this.init();
        console.log('📚 Documentation generation complete!');
    }
}

// Export utilities for use in other modules
module.exports = {
    FileUtils,
    TemplateEngine,
    DocumentationGenerator
};

// Run if called directly
if (require.main === module) {
    const generator = new DocumentationGenerator();
    generator.generate().catch(console.error);
}