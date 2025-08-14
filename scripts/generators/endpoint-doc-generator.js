const RouterAnalyzer = require('../analyzers/router-analyzer');
const { FileUtils } = require('../generate-docs');
const path = require('path');

/**
 * Generates documentation for API endpoints
 */
class EndpointDocumentationGenerator {
    constructor() {
        this.analyzer = new RouterAnalyzer();
        this.outputDir = path.resolve(__dirname, '../../docs/api/endpoints');
    }

    /**
     * Generate documentation for all endpoints
     */
    generateAllEndpointDocs() {
        console.log('📝 Generating endpoint documentation...');
        
        const routers = this.analyzer.analyzeAllRouters();
        
        Object.values(routers).forEach(router => {
            this.generateRouterDoc(router);
        });

        // Generate endpoints index
        this.generateEndpointsIndex(routers);
        
        console.log('✅ Endpoint documentation generation complete');
    }

    /**
     * Generate documentation for a single router
     */
    generateRouterDoc(routerData) {
        const content = this.renderRouterDocumentation(routerData);
        const filename = `${routerData.name.toLowerCase()}.md`;
        const filePath = path.join(this.outputDir, filename);
        
        FileUtils.writeFile(filePath, content);
    }

    /**
     * Generate endpoints index file
     */
    generateEndpointsIndex(routers) {
        let content = '# API Endpoints\n\n';
        content += 'This section documents all available API endpoints in the Task Crusher API.\n\n';
        content += '## Available Endpoints\n\n';
        
        Object.values(routers).forEach(router => {
            content += `### [${router.name}](${router.name.toLowerCase()}.md)\n\n`;
            
            if (router.endpoints && router.endpoints.length > 0) {
                router.endpoints.forEach(endpoint => {
                    const authIcon = endpoint.authentication === 'required' ? '🔒' : '🔓';
                    content += `- ${authIcon} \`${endpoint.method} ${endpoint.path}\` - ${endpoint.description}\n`;
                });
                content += '\n';
            }
        });
        
        content += '## Authentication\n\n';
        content += '🔒 = Authentication required\n';
        content += '🔓 = No authentication required\n\n';
        content += 'For detailed authentication information, see [Authentication Guide](../authentication.md).\n\n';
        
        const filePath = path.join(this.outputDir, 'README.md');
        FileUtils.writeFile(filePath, content);
    }

    /**
     * Render complete router documentation
     */
    renderRouterDocumentation(routerData) {
        let content = `# ${routerData.name} Endpoints\n\n`;
        content += `${this.getRouterDescription(routerData.name)}\n\n`;
        
        if (routerData.endpoints && routerData.endpoints.length > 0) {
            // Table of Contents
            content += '## Table of Contents\n\n';
            routerData.endpoints.forEach(endpoint => {
                const anchor = this.createAnchor(endpoint.method, endpoint.path);
                content += `- [${endpoint.method} ${endpoint.path}](#${anchor})\n`;
            });
            content += '\n';
            
            // Endpoint documentation
            routerData.endpoints.forEach(endpoint => {
                content += this.renderEndpointDocumentation(endpoint);
                content += '\n---\n\n';
            });
        } else {
            content += 'No endpoints documented.\n\n';
        }
        
        return content;
    }

    /**
     * Render individual endpoint documentation
     */
    renderEndpointDocumentation(endpoint) {
        const anchor = this.createAnchor(endpoint.method, endpoint.path);
        let content = `## ${endpoint.method} ${endpoint.path} {#${anchor}}\n\n`;
        
        content += `${endpoint.description}\n\n`;
        
        // Authentication
        if (endpoint.authentication === 'required') {
            content += '🔒 **Authentication Required**\n\n';
        } else if (endpoint.authentication === 'optional') {
            content += '🔓 **Authentication Optional**\n\n';
        } else {
            content += '🔓 **No Authentication Required**\n\n';
        }
        
        // Path Parameters
        if (endpoint.parameters && endpoint.parameters.path && endpoint.parameters.path.length > 0) {
            content += '### Path Parameters\n\n';
            content += '| Parameter | Type | Required | Description |\n';
            content += '|-----------|------|----------|-------------|\n';
            
            endpoint.parameters.path.forEach(param => {
                const required = param.required ? '✅ Yes' : '❌ No';
                content += `| **${param.name}** | ${param.type} | ${required} | ${param.description} |\n`;
            });
            content += '\n';
        }
        
        // Query Parameters
        if (endpoint.parameters && endpoint.parameters.query && endpoint.parameters.query.length > 0) {
            content += '### Query Parameters\n\n';
            content += '| Parameter | Type | Required | Description |\n';
            content += '|-----------|------|----------|-------------|\n';
            
            endpoint.parameters.query.forEach(param => {
                const required = param.required ? '✅ Yes' : '❌ No';
                content += `| **${param.name}** | ${param.type} | ${required} | ${param.description} |\n`;
            });
            content += '\n';
        }
        
        // Request Body
        if (endpoint.parameters && endpoint.parameters.body) {
            content += '### Request Body\n\n';
            content += this.renderRequestBody(endpoint.parameters.body);
            content += '\n';
        }
        
        // Responses
        if (endpoint.responses && Object.keys(endpoint.responses).length > 0) {
            content += '### Responses\n\n';
            
            Object.entries(endpoint.responses).forEach(([status, response]) => {
                content += `#### ${status} - ${response.description}\n\n`;
                
                if (response.schema) {
                    content += this.renderResponseSchema(response.schema, status);
                }
                
                content += this.generateResponseExample(status, endpoint);
                content += '\n';
            });
        }
        
        // Examples
        content += this.renderEndpointExamples(endpoint);
        
        return content;
    }

    /**
     * Render request body documentation
     */
    renderRequestBody(body) {
        let content = '';
        
        if (body.type === 'object' && body.properties) {
            if (typeof body.properties === 'string') {
                content += `${body.properties}\n\n`;
            } else {
                content += '```json\n';
                content += JSON.stringify(body.properties, null, 2);
                content += '\n```\n\n';
            }
        } else {
            content += `**Type:** ${body.type}\n`;
            if (body.description) {
                content += `**Description:** ${body.description}\n`;
            }
            content += '\n';
        }
        
        return content;
    }

    /**
     * Render response schema
     */
    renderResponseSchema(schema, status) {
        let content = '';
        
        if (schema && schema.properties) {
            content += '**Response Schema:**\n\n';
            content += '```json\n';
            content += JSON.stringify(schema.properties, null, 2);
            content += '\n```\n\n';
        }
        
        return content;
    }

    /**
     * Generate response example
     */
    generateResponseExample(status, endpoint) {
        let content = '**Example Response:**\n\n';
        content += '```json\n';
        
        const example = this.createResponseExample(status, endpoint);
        content += JSON.stringify(example, null, 2);
        
        content += '\n```\n\n';
        return content;
    }

    /**
     * Create response example based on endpoint and status
     */
    createResponseExample(status, endpoint) {
        const statusCode = parseInt(status);
        
        if (statusCode >= 400) {
            return {
                error: this.getErrorMessage(statusCode),
                status: 'error'
            };
        }
        
        // Success responses
        if (endpoint.path.includes('/health')) {
            return {
                status: 'ok',
                timestamp: '2024-01-15T10:30:00.000Z',
                uptime: 3600,
                service: 'task-app'
            };
        }
        
        if (endpoint.method === 'GET' && endpoint.path.includes('/tasks')) {
            if (endpoint.path.includes(':id')) {
                return this.createTaskExample();
            } else {
                return [this.createTaskExample()];
            }
        }
        
        if (endpoint.method === 'GET' && endpoint.path.includes('/users/me')) {
            return this.createUserExample();
        }
        
        if (endpoint.method === 'POST' && endpoint.path.includes('/users/login')) {
            return {
                user: this.createUserExample()
            };
        }
        
        if (endpoint.method === 'POST' && endpoint.path.includes('/tasks')) {
            return this.createTaskExample();
        }
        
        // Default success response
        return {
            message: 'Success',
            status: 'ok'
        };
    }

    /**
     * Create task example
     */
    createTaskExample() {
        return {
            _id: '507f1f77bcf86cd799439011',
            userId: '507f1f77bcf86cd799439012',
            title: 'Complete project documentation',
            description: 'Write comprehensive API documentation for the Task Crusher application',
            dueDate: '2024-01-20T09:00:00.000Z',
            priority: 'high',
            category: 'work',
            isCompleted: false,
            repeatType: 'none',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z'
        };
    }

    /**
     * Create user example
     */
    createUserExample() {
        return {
            _id: '507f1f77bcf86cd799439012',
            name: 'John Doe',
            email: 'john.doe@example.com',
            age: 25,
            emailEnabled: true,
            notificationTime: '09:00',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z'
        };
    }

    /**
     * Get error message for status code
     */
    getErrorMessage(statusCode) {
        const messages = {
            400: 'Bad Request - Invalid input data',
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Access denied',
            404: 'Not Found - Resource not found',
            405: 'Method Not Allowed',
            500: 'Internal Server Error'
        };
        
        return messages[statusCode] || 'Error occurred';
    }

    /**
     * Render endpoint examples
     */
    renderEndpointExamples(endpoint) {
        let content = '### Usage Examples\n\n';
        
        // cURL example
        content += '#### cURL\n\n';
        content += '```bash\n';
        content += this.generateCurlExample(endpoint);
        content += '\n```\n\n';
        
        // JavaScript fetch example
        content += '#### JavaScript (fetch)\n\n';
        content += '```javascript\n';
        content += this.generateJavaScriptExample(endpoint);
        content += '\n```\n\n';
        
        return content;
    }

    /**
     * Generate cURL example
     */
    generateCurlExample(endpoint) {
        let curl = `curl -X ${endpoint.method}`;
        
        // Add authentication if required
        if (endpoint.authentication === 'required') {
            curl += ' \\\n  --cookie "auth-token=your-auth-token"';
        }
        
        // Add content type for POST/PATCH requests
        if (['POST', 'PATCH', 'PUT'].includes(endpoint.method)) {
            curl += ' \\\n  -H "Content-Type: application/json"';
        }
        
        // Add request body for POST/PATCH requests
        if (['POST', 'PATCH', 'PUT'].includes(endpoint.method) && endpoint.parameters && endpoint.parameters.body) {
            curl += ' \\\n  -d \'';
            curl += JSON.stringify(this.generateRequestBodyExample(endpoint), null, 2);
            curl += '\'';
        }
        
        // Add URL
        const url = this.generateExampleUrl(endpoint);
        curl += ` \\\n  "${url}"`;
        
        return curl;
    }

    /**
     * Generate JavaScript fetch example
     */
    generateJavaScriptExample(endpoint) {
        const url = this.generateExampleUrl(endpoint);
        let js = `const response = await fetch('${url}', {\n`;
        js += `  method: '${endpoint.method}'`;
        
        if (endpoint.authentication === 'required') {
            js += ',\n  credentials: \'include\'';
        }
        
        if (['POST', 'PATCH', 'PUT'].includes(endpoint.method)) {
            js += ',\n  headers: {\n    \'Content-Type\': \'application/json\'\n  }';
            
            if (endpoint.parameters && endpoint.parameters.body) {
                js += ',\n  body: JSON.stringify(';
                js += JSON.stringify(this.generateRequestBodyExample(endpoint), null, 4);
                js += ')';
            }
        }
        
        js += '\n});\n\n';
        js += 'const data = await response.json();\n';
        js += 'console.log(data);';
        
        return js;
    }

    /**
     * Generate example URL
     */
    generateExampleUrl(endpoint) {
        let url = 'http://localhost:3000' + endpoint.path;
        
        // Replace path parameters with examples
        url = url.replace(':id', '507f1f77bcf86cd799439011');
        url = url.replace(':priority', 'high');
        url = url.replace(':category', 'work');
        
        // Add query parameters for GET requests
        if (endpoint.method === 'GET' && endpoint.parameters && endpoint.parameters.query && endpoint.parameters.query.length > 0) {
            const queryParams = [];
            endpoint.parameters.query.forEach(param => {
                if (param.name === 'limit') queryParams.push('limit=10');
                else if (param.name === 'skip') queryParams.push('skip=0');
                else if (param.name === 'completed') queryParams.push('completed=false');
                else if (param.name === 'priority') queryParams.push('priority=high');
                else if (param.name === 'category') queryParams.push('category=work');
                else if (param.name === 'sortBy') queryParams.push('sortBy=dueDate:asc');
            });
            
            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }
        }
        
        return url;
    }

    /**
     * Generate request body example
     */
    generateRequestBodyExample(endpoint) {
        if (endpoint.path.includes('/tasks') && endpoint.method === 'POST') {
            return {
                title: 'Complete project documentation',
                description: 'Write comprehensive API documentation',
                dueDate: '2024-01-20T09:00:00.000Z',
                priority: 'high',
                category: 'work'
            };
        }
        
        if (endpoint.path.includes('/users') && endpoint.method === 'POST') {
            if (endpoint.path.includes('/login')) {
                return {
                    email: 'john.doe@example.com',
                    password: 'securepassword123'
                };
            } else {
                return {
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    password: 'securepassword123',
                    age: 25
                };
            }
        }
        
        return {};
    }

    /**
     * Create anchor for table of contents
     */
    createAnchor(method, path) {
        return `${method.toLowerCase()}-${path.replace(/[/:]/g, '').replace(/\s+/g, '-')}`;
    }

    /**
     * Get router description
     */
    getRouterDescription(routerName) {
        const descriptions = {
            Health: 'Health check and monitoring endpoints for service status and uptime tracking.',
            Task: 'Task management endpoints for creating, reading, updating, and deleting tasks with filtering and sorting capabilities.',
            User: 'User management and authentication endpoints for account creation, login, logout, and profile management.'
        };
        
        return descriptions[routerName] || `${routerName} endpoints for the Task Crusher API.`;
    }
}

module.exports = EndpointDocumentationGenerator;