const fs = require('fs');
const path = require('path');

/**
 * Analyzes Express router files to extract endpoint information
 */
class RouterAnalyzer {
    constructor(routersDir = '../../backend/src/routers') {
        this.routersDir = path.resolve(__dirname, routersDir);
    }

    /**
     * Analyze all router files
     */
    analyzeAllRouters() {
        const routerFiles = this.getRouterFiles();
        const routers = {};

        routerFiles.forEach(filePath => {
            const routerName = path.basename(filePath, '.js');
            const routerData = this.analyzeRouterFile(filePath);
            if (routerData) {
                routers[routerName] = routerData;
            }
        });

        return routers;
    }

    /**
     * Get all JavaScript files in the routers directory
     */
    getRouterFiles() {
        try {
            return fs.readdirSync(this.routersDir)
                .filter(file => file.endsWith('.js'))
                .map(file => path.join(this.routersDir, file));
        } catch (error) {
            console.error(`Error reading routers directory: ${error.message}`);
            return [];
        }
    }

    /**
     * Analyze a single router file
     */
    analyzeRouterFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const routerName = path.basename(filePath, '.js');
            
            return {
                name: this.capitalizeFirst(routerName),
                filePath: filePath,
                endpoints: this.extractEndpoints(content),
                middleware: this.extractMiddleware(content),
                imports: this.extractImports(content)
            };
        } catch (error) {
            console.error(`Error analyzing router file ${filePath}: ${error.message}`);
            return null;
        }
    }

    /**
     * Extract endpoint definitions from router content
     */
    extractEndpoints(content) {
        const endpoints = [];
        
        // Find all router method calls and extract their complete function bodies
        const routerMethodRegex = /router\.(get|post|patch|put|delete|all)\s*\(\s*["']([^"']+)["']/g;
        
        let match;
        while ((match = routerMethodRegex.exec(content)) !== null) {
            const [, method, path] = match;
            const startIndex = match.index;
            
            // Find the complete function body by counting braces
            const endpointCode = this.extractCompleteEndpoint(content, startIndex);
            
            if (endpointCode) {
                // Extract middleware from the function signature
                const middlewareMatch = endpointCode.match(/router\.\w+\s*\(\s*["'][^"']+["']\s*,?\s*([^,{]*?),?\s*(?:async\s*)?\s*(?:\([^)]*\)|function)/);
                const middlewareStr = middlewareMatch ? middlewareMatch[1] : '';
                
                const endpoint = {
                    method: method.toUpperCase(),
                    path: path,
                    authentication: this.detectAuthentication(middlewareStr, endpointCode),
                    description: this.extractDescription(endpointCode, path, method),
                    parameters: this.extractParameters(endpointCode, path),
                    responses: this.extractResponses(endpointCode),
                    middleware: this.parseMiddleware(middlewareStr)
                };
                
                endpoints.push(endpoint);
            }
        }

        return endpoints;
    }

    /**
     * Extract complete endpoint code by counting braces
     */
    extractCompleteEndpoint(content, startIndex) {
        let braceCount = 0;
        let inFunction = false;
        let endIndex = startIndex;
        
        for (let i = startIndex; i < content.length; i++) {
            const char = content[i];
            
            if (char === '{') {
                braceCount++;
                inFunction = true;
            } else if (char === '}') {
                braceCount--;
                if (inFunction && braceCount === 0) {
                    endIndex = i + 1;
                    break;
                }
            }
        }
        
        return content.substring(startIndex, endIndex);
    }

    /**
     * Detect authentication requirements
     */
    detectAuthentication(middlewareStr, fullMatch) {
        if (middlewareStr.includes('auth') || fullMatch.includes('auth,')) {
            return 'required';
        }
        return 'none';
    }

    /**
     * Extract endpoint description from comments or infer from path/method
     */
    extractDescription(endpointCode, path, method) {
        // Look for comments above the endpoint (look further back in content)
        const fullContent = endpointCode;
        const endpointIndex = fullContent.indexOf(`router.${method.toLowerCase()}`);
        
        if (endpointIndex > 0) {
            // Look for comments in the 500 characters before the endpoint
            const beforeEndpoint = fullContent.substring(Math.max(0, endpointIndex - 500), endpointIndex);
            const lines = beforeEndpoint.split('\n');
            
            // Find the last comment line before the endpoint
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.startsWith('//') && !line.includes('router.') && line.length > 3) {
                    return line.replace('//', '').trim();
                }
            }
        }

        // Generate description based on method and path
        return this.generateDescription(method, path);
    }

    /**
     * Generate description based on method and path
     */
    generateDescription(method, path) {
        const pathParts = path.split('/').filter(p => p);
        const resource = pathParts[0] || 'resource';
        
        switch (method.toLowerCase()) {
            case 'get':
                if (path.includes(':id')) {
                    return `Get a specific ${resource.slice(0, -1)} by ID`;
                } else if (pathParts.length > 1) {
                    return `Get ${pathParts[pathParts.length - 1]} ${resource}`;
                } else {
                    return `Get all ${resource}`;
                }
            case 'post':
                if (pathParts.length > 1) {
                    return `${this.capitalizeFirst(pathParts[pathParts.length - 1])} ${resource.slice(0, -1)}`;
                } else {
                    return `Create a new ${resource.slice(0, -1)}`;
                }
            case 'patch':
            case 'put':
                return `Update a ${resource.slice(0, -1)}`;
            case 'delete':
                return `Delete a ${resource.slice(0, -1)}`;
            default:
                return `${method.toUpperCase()} ${path}`;
        }
    }

    /**
     * Extract parameters from endpoint
     */
    extractParameters(endpointCode, path) {
        const parameters = {
            path: [],
            query: [],
            body: null
        };

        // Extract path parameters
        const pathParams = path.match(/:(\w+)/g);
        if (pathParams) {
            pathParams.forEach(param => {
                const paramName = param.substring(1);
                parameters.path.push({
                    name: paramName,
                    type: 'string',
                    required: true,
                    description: `${paramName} identifier`
                });
            });
        }

        // Extract query parameters from code and comments
        const queryMatches = endpointCode.match(/req\.query\.(\w+)/g);
        if (queryMatches) {
            const uniqueParams = [...new Set(queryMatches)];
            uniqueParams.forEach(match => {
                const paramName = match.replace('req.query.', '');
                if (!parameters.query.find(p => p.name === paramName)) {
                    parameters.query.push({
                        name: paramName,
                        type: this.inferQueryParamType(paramName, endpointCode),
                        required: false,
                        description: this.getQueryParamDescription(paramName)
                    });
                }
            });
        }

        // Also extract from comment patterns like GET: /tasks?param=value
        const commentQueryMatch = endpointCode.match(/GET:\s*[^?]*\?([^)\s]+)/);
        if (commentQueryMatch) {
            const queryString = commentQueryMatch[1];
            const queryPairs = queryString.split('&');
            
            queryPairs.forEach(pair => {
                const [paramName] = pair.split('=');
                if (paramName && !parameters.query.find(p => p.name === paramName)) {
                    parameters.query.push({
                        name: paramName,
                        type: this.inferQueryParamType(paramName, endpointCode),
                        required: false,
                        description: this.getQueryParamDescription(paramName)
                    });
                }
            });
        }

        // Extract request body information
        if (endpointCode.includes('req.body')) {
            parameters.body = this.extractRequestBody(endpointCode);
        }

        return parameters;
    }

    /**
     * Infer query parameter type from usage
     */
    inferQueryParamType(paramName, code) {
        if (code.includes(`parseInt(req.query.${paramName})`)) {
            return 'number';
        }
        if (code.includes(`req.query.${paramName} === "true"`)) {
            return 'boolean';
        }
        return 'string';
    }

    /**
     * Get description for common query parameters
     */
    getQueryParamDescription(paramName) {
        const descriptions = {
            limit: 'Maximum number of items to return',
            skip: 'Number of items to skip for pagination',
            sortBy: 'Field to sort by with optional direction (field:asc or field:desc)',
            completed: 'Filter by completion status (true/false)',
            priority: 'Filter by priority level (low, medium, high)',
            category: 'Filter by category name'
        };
        
        return descriptions[paramName] || `${paramName} parameter`;
    }

    /**
     * Extract request body schema
     */
    extractRequestBody(endpointCode) {
        // Look for object destructuring or direct property access
        const bodyProps = [];
        
        // Match req.body.property patterns
        const bodyMatches = endpointCode.match(/req\.body\.(\w+)/g);
        if (bodyMatches) {
            const uniqueProps = [...new Set(bodyMatches.map(m => m.replace('req.body.', '')))];
            uniqueProps.forEach(prop => {
                bodyProps.push(prop);
            });
        }

        // Match object spread patterns
        const spreadMatch = endpointCode.match(/\.\.\.\s*req\.body/);
        if (spreadMatch) {
            return {
                type: 'object',
                description: 'Request body with model properties',
                properties: 'Varies based on model schema'
            };
        }

        if (bodyProps.length > 0) {
            return {
                type: 'object',
                properties: bodyProps.reduce((acc, prop) => {
                    acc[prop] = { type: 'string', description: `${prop} value` };
                    return acc;
                }, {})
            };
        }

        return null;
    }

    /**
     * Extract response information
     */
    extractResponses(endpointCode) {
        const responses = {};
        
        // Extract status codes
        const statusMatches = endpointCode.match(/res\.status\s*\(\s*(\d+)\s*\)/g);
        if (statusMatches) {
            statusMatches.forEach(match => {
                const status = match.match(/\d+/)[0];
                responses[status] = {
                    description: this.getStatusDescription(status),
                    schema: this.inferResponseSchema(endpointCode, status)
                };
            });
        }

        // Default success response if no explicit status
        if (Object.keys(responses).length === 0) {
            responses['200'] = {
                description: 'Success',
                schema: this.inferResponseSchema(endpointCode, '200')
            };
        }

        return responses;
    }

    /**
     * Get standard HTTP status descriptions
     */
    getStatusDescription(status) {
        const descriptions = {
            '200': 'Success',
            '201': 'Created',
            '400': 'Bad Request',
            '401': 'Unauthorized',
            '403': 'Forbidden',
            '404': 'Not Found',
            '405': 'Method Not Allowed',
            '500': 'Internal Server Error'
        };
        
        return descriptions[status] || 'Response';
    }

    /**
     * Infer response schema from code
     */
    inferResponseSchema(code, status) {
        if (status === '400' || status === '500') {
            return {
                type: 'object',
                properties: {
                    error: { type: 'string' }
                }
            };
        }

        if (code.includes('res.send(') || code.includes('res.json(')) {
            return {
                type: 'object',
                description: 'Response data'
            };
        }

        return null;
    }

    /**
     * Extract middleware information
     */
    extractMiddleware(content) {
        const middleware = [];
        
        // Look for middleware imports
        const authImport = content.match(/require\s*\(\s*['"][^'"]*auth[^'"]*['"]\s*\)/);
        if (authImport) {
            middleware.push({
                name: 'auth',
                description: 'Authentication middleware',
                type: 'authentication'
            });
        }

        const multerImport = content.match(/require\s*\(\s*['"]multer['"]\s*\)/);
        if (multerImport) {
            middleware.push({
                name: 'multer',
                description: 'File upload middleware',
                type: 'upload'
            });
        }

        return middleware;
    }

    /**
     * Extract import statements
     */
    extractImports(content) {
        const imports = [];
        
        const requireMatches = content.match(/const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
        if (requireMatches) {
            requireMatches.forEach(match => {
                const [, varName, modulePath] = match.match(/const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
                imports.push({
                    variable: varName,
                    module: modulePath,
                    type: this.getImportType(modulePath)
                });
            });
        }

        return imports;
    }

    /**
     * Get import type based on module path
     */
    getImportType(modulePath) {
        if (modulePath.startsWith('../models/')) return 'model';
        if (modulePath.startsWith('../middleware/')) return 'middleware';
        if (modulePath.startsWith('../utils/')) return 'utility';
        if (modulePath.startsWith('../emails/')) return 'email';
        if (!modulePath.startsWith('.')) return 'external';
        return 'internal';
    }

    /**
     * Parse middleware string
     */
    parseMiddleware(middlewareStr) {
        if (!middlewareStr || !middlewareStr.trim()) return [];
        
        const middleware = [];
        if (middlewareStr.includes('auth')) {
            middleware.push('auth');
        }
        if (middlewareStr.includes('upload')) {
            middleware.push('upload');
        }
        
        return middleware;
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

module.exports = RouterAnalyzer;