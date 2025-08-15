const fs = require('fs');
const path = require('path');

/**
 * Comprehensive documentation validation and testing suite
 */
class DocumentationValidator {
    constructor() {
        this.docsDir = path.resolve(__dirname, '../../docs/api');
        this.results = {
            coverage: {},
            linkValidation: {},
            formatting: {},
            consistency: {},
            completeness: {}
        };
    }

    /**
     * Run all validation tests
     */
    async runAllValidations() {
        console.log('🔍 Running comprehensive documentation validation...\n');

        await this.validateDocumentationCoverage();
        await this.validateInternalLinks();
        await this.validateMarkdownFormatting();
        await this.validateConsistency();
        await this.validateCompleteness();

        this.generateValidationReport();
    }

    /**
     * Validate that all endpoints and models are documented
     */
    async validateDocumentationCoverage() {
        console.log('📊 Validating documentation coverage...');

        const coverage = {
            endpoints: this.validateEndpointCoverage(),
            models: this.validateModelCoverage(),
            examples: this.validateExampleCoverage(),
            errors: this.validateErrorCoverage()
        };

        this.results.coverage = coverage;
        console.log('✅ Documentation coverage validation complete\n');
    }

    /**
     * Validate endpoint documentation coverage
     */
    validateEndpointCoverage() {
        const expectedEndpoints = [
            // Health endpoints
            'GET /health',
            
            // User endpoints
            'POST /users',
            'POST /users/login',
            'POST /users/logout',
            'POST /users/logoutall',
            'GET /users/me',
            'PATCH /users/me',
            'DELETE /users/me',
            'POST /users/me/avatar',
            'DELETE /users/me/avatar',
            'GET /users/:id/avatar',
            
            // Task endpoints
            'POST /tasks',
            'GET /tasks',
            'GET /tasks/:id',
            'PATCH /tasks/:id',
            'DELETE /tasks/:id',
            'GET /tasks/priority/:priority',
            'GET /tasks/category/:category',
            'GET /tasks/overdue',
            'GET /tasks/today'
        ];

        const documentedEndpoints = [];
        const endpointFiles = [
            path.join(this.docsDir, 'endpoints/health.md'),
            path.join(this.docsDir, 'endpoints/user.md'),
            path.join(this.docsDir, 'endpoints/task.md')
        ];

        endpointFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                expectedEndpoints.forEach(endpoint => {
                    if (content.includes(endpoint)) {
                        documentedEndpoints.push(endpoint);
                    }
                });
            }
        });

        const missing = expectedEndpoints.filter(ep => !documentedEndpoints.includes(ep));
        const coverage = ((documentedEndpoints.length / expectedEndpoints.length) * 100).toFixed(1);

        return {
            total: expectedEndpoints.length,
            documented: documentedEndpoints.length,
            missing: missing,
            coverage: `${coverage}%`
        };
    }

    /**
     * Validate model documentation coverage
     */
    validateModelCoverage() {
        const expectedModels = ['User', 'Task'];
        const documentedModels = [];

        expectedModels.forEach(model => {
            const modelFile = path.join(this.docsDir, 'models', `${model.toLowerCase()}.md`);
            if (fs.existsSync(modelFile)) {
                documentedModels.push(model);
            }
        });

        const missing = expectedModels.filter(model => !documentedModels.includes(model));
        const coverage = ((documentedModels.length / expectedModels.length) * 100).toFixed(1);

        return {
            total: expectedModels.length,
            documented: documentedModels.length,
            missing: missing,
            coverage: `${coverage}%`
        };
    }

    /**
     * Validate example documentation coverage
     */
    validateExampleCoverage() {
        const expectedExamples = [
            'filtering-sorting.md',
            'authentication-flow.md',
            'task-management.md'
        ];

        const documentedExamples = [];
        const examplesDir = path.join(this.docsDir, 'examples');

        expectedExamples.forEach(example => {
            const exampleFile = path.join(examplesDir, example);
            if (fs.existsSync(exampleFile)) {
                documentedExamples.push(example);
            }
        });

        const missing = expectedExamples.filter(ex => !documentedExamples.includes(ex));
        const coverage = ((documentedExamples.length / expectedExamples.length) * 100).toFixed(1);

        return {
            total: expectedExamples.length,
            documented: documentedExamples.length,
            missing: missing,
            coverage: `${coverage}%`
        };
    }

    /**
     * Validate error documentation coverage
     */
    validateErrorCoverage() {
        const errorFile = path.join(this.docsDir, 'errors.md');
        const expectedErrorCodes = ['200', '201', '400', '401', '403', '404', '405', '500'];
        const documentedErrors = [];

        if (fs.existsSync(errorFile)) {
            const content = fs.readFileSync(errorFile, 'utf8');
            expectedErrorCodes.forEach(code => {
                if (content.includes(code)) {
                    documentedErrors.push(code);
                }
            });
        }

        const missing = expectedErrorCodes.filter(code => !documentedErrors.includes(code));
        const coverage = ((documentedErrors.length / expectedErrorCodes.length) * 100).toFixed(1);

        return {
            total: expectedErrorCodes.length,
            documented: documentedErrors.length,
            missing: missing,
            coverage: `${coverage}%`
        };
    }

    /**
     * Validate internal links
     */
    async validateInternalLinks() {
        console.log('🔗 Validating internal links...');

        const linkValidation = {
            validLinks: [],
            brokenLinks: [],
            totalLinks: 0
        };

        const markdownFiles = this.getAllMarkdownFiles(this.docsDir);

        for (const filePath of markdownFiles) {
            const content = fs.readFileSync(filePath, 'utf8');
            const links = this.extractInternalLinks(content);

            for (const link of links) {
                linkValidation.totalLinks++;
                const isValid = this.validateLink(link, filePath);
                
                if (isValid) {
                    linkValidation.validLinks.push({ file: filePath, link });
                } else {
                    linkValidation.brokenLinks.push({ file: filePath, link });
                }
            }
        }

        this.results.linkValidation = linkValidation;
        console.log('✅ Internal link validation complete\n');
    }

    /**
     * Extract internal links from markdown content
     */
    extractInternalLinks(content) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const links = [];
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const url = match[2];
            // Only check internal links (relative paths)
            if (!url.startsWith('http') && !url.startsWith('mailto:')) {
                links.push(url);
            }
        }

        return links;
    }

    /**
     * Validate a single link
     */
    validateLink(link, sourceFile) {
        // Remove anchor fragments
        const cleanLink = link.split('#')[0];
        if (!cleanLink) return true; // Anchor-only links are valid

        // Resolve relative path
        const sourceDir = path.dirname(sourceFile);
        const targetPath = path.resolve(sourceDir, cleanLink);

        return fs.existsSync(targetPath);
    }

    /**
     * Validate markdown formatting
     */
    async validateMarkdownFormatting() {
        console.log('📝 Validating markdown formatting...');

        const formatting = {
            validFiles: [],
            issues: []
        };

        const markdownFiles = this.getAllMarkdownFiles(this.docsDir);

        for (const filePath of markdownFiles) {
            const content = fs.readFileSync(filePath, 'utf8');
            const issues = this.checkMarkdownFormatting(content, filePath);

            if (issues.length === 0) {
                formatting.validFiles.push(filePath);
            } else {
                formatting.issues.push({ file: filePath, issues });
            }
        }

        this.results.formatting = formatting;
        console.log('✅ Markdown formatting validation complete\n');
    }

    /**
     * Check markdown formatting issues
     */
    checkMarkdownFormatting(content, filePath) {
        const issues = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const lineNumber = index + 1;

            // Check for proper heading hierarchy
            if (line.startsWith('#')) {
                const headingLevel = line.match(/^#+/)[0].length;
                if (headingLevel > 6) {
                    issues.push(`Line ${lineNumber}: Heading level too deep (${headingLevel})`);
                }
            }

            // Check for trailing whitespace
            if (line.endsWith(' ') || line.endsWith('\t')) {
                issues.push(`Line ${lineNumber}: Trailing whitespace`);
            }

            // Check for proper code block formatting
            if (line.includes('```') && !line.trim().startsWith('```')) {
                issues.push(`Line ${lineNumber}: Improper code block formatting`);
            }
        });

        // Check for proper document structure
        if (!content.startsWith('#')) {
            issues.push('Document should start with a main heading');
        }

        return issues;
    }

    /**
     * Validate consistency across documentation
     */
    async validateConsistency() {
        console.log('🔄 Validating consistency...');

        const consistency = {
            terminology: this.checkTerminologyConsistency(),
            formatting: this.checkFormattingConsistency(),
            examples: this.checkExampleConsistency()
        };

        this.results.consistency = consistency;
        console.log('✅ Consistency validation complete\n');
    }

    /**
     * Check terminology consistency
     */
    checkTerminologyConsistency() {
        const expectedTerms = {
            'Task Crusher API': 'Task Crusher API',
            'cookie-based authentication': 'cookie-based authentication',
            'HTTP-only cookies': 'HTTP-only cookies',
            'JWT': 'JWT'
        };

        const inconsistencies = [];
        const markdownFiles = this.getAllMarkdownFiles(this.docsDir);

        markdownFiles.forEach(filePath => {
            const content = fs.readFileSync(filePath, 'utf8');
            
            Object.entries(expectedTerms).forEach(([term, expected]) => {
                // Check for variations that might be inconsistent
                const variations = [
                    term.toLowerCase(),
                    term.toUpperCase(),
                    term.replace(/[-\s]/g, '')
                ];

                variations.forEach(variation => {
                    if (content.includes(variation) && variation !== expected) {
                        inconsistencies.push({
                            file: filePath,
                            found: variation,
                            expected: expected
                        });
                    }
                });
            });
        });

        return {
            total: Object.keys(expectedTerms).length,
            inconsistencies: inconsistencies
        };
    }

    /**
     * Check formatting consistency
     */
    checkFormattingConsistency() {
        const issues = [];
        const markdownFiles = this.getAllMarkdownFiles(this.docsDir);

        markdownFiles.forEach(filePath => {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for consistent code block language specification
            const codeBlocks = content.match(/```(\w*)/g) || [];
            const languagelessBlocks = codeBlocks.filter(block => block === '```');
            
            if (languagelessBlocks.length > 0) {
                issues.push({
                    file: filePath,
                    issue: `${languagelessBlocks.length} code blocks without language specification`
                });
            }
        });

        return { issues };
    }

    /**
     * Check example consistency
     */
    checkExampleConsistency() {
        const issues = [];
        const exampleFiles = [
            path.join(this.docsDir, 'examples/authentication-flow.md'),
            path.join(this.docsDir, 'examples/task-management.md'),
            path.join(this.docsDir, 'examples/filtering-sorting.md')
        ];

        exampleFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check for consistent base URL usage
                const baseUrls = content.match(/http:\/\/localhost:\d+/g) || [];
                const uniqueUrls = [...new Set(baseUrls)];
                
                if (uniqueUrls.length > 1) {
                    issues.push({
                        file: filePath,
                        issue: `Inconsistent base URLs: ${uniqueUrls.join(', ')}`
                    });
                }
            }
        });

        return { issues };
    }

    /**
     * Validate completeness of documentation
     */
    async validateCompleteness() {
        console.log('📋 Validating completeness...');

        const completeness = {
            requiredSections: this.checkRequiredSections(),
            codeExamples: this.checkCodeExamples(),
            errorDocumentation: this.checkErrorDocumentation()
        };

        this.results.completeness = completeness;
        console.log('✅ Completeness validation complete\n');
    }

    /**
     * Check for required sections in documentation
     */
    checkRequiredSections() {
        const requiredSections = {
            'README.md': ['Quick Start', 'Documentation Structure', 'Key Features'],
            'authentication.md': ['Overview', 'User Registration', 'User Login', 'Session Management'],
            'errors.md': ['Error Response Format', 'HTTP Status Codes', 'Validation Errors'],
            'endpoints/task.md': ['POST /tasks', 'GET /tasks', 'PATCH /tasks', 'DELETE /tasks'],
            'endpoints/user.md': ['POST /users', 'POST /users/login', 'GET /users/me'],
            'endpoints/health.md': ['GET /health']
        };

        const missing = [];

        Object.entries(requiredSections).forEach(([file, sections]) => {
            const filePath = path.join(this.docsDir, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                sections.forEach(section => {
                    if (!content.includes(section)) {
                        missing.push({ file, section });
                    }
                });
            } else {
                missing.push({ file, section: 'File does not exist' });
            }
        });

        return { missing };
    }

    /**
     * Check for adequate code examples
     */
    checkCodeExamples() {
        const files = [
            'README.md',
            'authentication.md',
            'examples/authentication-flow.md',
            'examples/task-management.md',
            'examples/filtering-sorting.md'
        ];

        const exampleCounts = {};

        files.forEach(file => {
            const filePath = path.join(this.docsDir, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const codeBlocks = (content.match(/```/g) || []).length / 2;
                exampleCounts[file] = Math.floor(codeBlocks);
            }
        });

        return { exampleCounts };
    }

    /**
     * Check error documentation completeness
     */
    checkErrorDocumentation() {
        const errorFile = path.join(this.docsDir, 'errors.md');
        const issues = [];

        if (fs.existsSync(errorFile)) {
            const content = fs.readFileSync(errorFile, 'utf8');
            
            // Check for error handling examples
            if (!content.includes('Error Handling Best Practices')) {
                issues.push('Missing error handling best practices section');
            }
            
            if (!content.includes('Troubleshooting')) {
                issues.push('Missing troubleshooting section');
            }
        } else {
            issues.push('Error documentation file does not exist');
        }

        return { issues };
    }

    /**
     * Get all markdown files recursively
     */
    getAllMarkdownFiles(dir) {
        const files = [];
        
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...this.getAllMarkdownFiles(fullPath));
            } else if (item.endsWith('.md')) {
                files.push(fullPath);
            }
        });
        
        return files;
    }

    /**
     * Generate comprehensive validation report
     */
    generateValidationReport() {
        console.log('📊 DOCUMENTATION VALIDATION REPORT');
        console.log('=====================================\n');

        // Coverage Report
        console.log('📊 COVERAGE ANALYSIS');
        console.log(`Endpoints: ${this.results.coverage.endpoints.coverage} (${this.results.coverage.endpoints.documented}/${this.results.coverage.endpoints.total})`);
        console.log(`Models: ${this.results.coverage.models.coverage} (${this.results.coverage.models.documented}/${this.results.coverage.models.total})`);
        console.log(`Examples: ${this.results.coverage.examples.coverage} (${this.results.coverage.examples.documented}/${this.results.coverage.examples.total})`);
        console.log(`Error Codes: ${this.results.coverage.errors.coverage} (${this.results.coverage.errors.documented}/${this.results.coverage.errors.total})`);
        
        if (this.results.coverage.endpoints.missing.length > 0) {
            console.log('\n❌ Missing Endpoint Documentation:');
            this.results.coverage.endpoints.missing.forEach(endpoint => {
                console.log(`   - ${endpoint}`);
            });
        }

        // Link Validation Report
        console.log('\n🔗 LINK VALIDATION');
        console.log(`Total Links: ${this.results.linkValidation.totalLinks}`);
        console.log(`Valid Links: ${this.results.linkValidation.validLinks.length}`);
        console.log(`Broken Links: ${this.results.linkValidation.brokenLinks.length}`);
        
        if (this.results.linkValidation.brokenLinks.length > 0) {
            console.log('\n❌ Broken Links:');
            this.results.linkValidation.brokenLinks.forEach(({ file, link }) => {
                console.log(`   - ${path.relative(this.docsDir, file)}: ${link}`);
            });
        }

        // Formatting Report
        console.log('\n📝 FORMATTING VALIDATION');
        console.log(`Files with Issues: ${this.results.formatting.issues.length}`);
        console.log(`Clean Files: ${this.results.formatting.validFiles.length}`);
        
        if (this.results.formatting.issues.length > 0) {
            console.log('\n❌ Formatting Issues:');
            this.results.formatting.issues.forEach(({ file, issues }) => {
                console.log(`   ${path.relative(this.docsDir, file)}:`);
                issues.forEach(issue => {
                    console.log(`     - ${issue}`);
                });
            });
        }

        // Consistency Report
        console.log('\n🔄 CONSISTENCY CHECK');
        console.log(`Terminology Issues: ${this.results.consistency.terminology.inconsistencies.length}`);
        console.log(`Formatting Issues: ${this.results.consistency.formatting.issues.length}`);
        console.log(`Example Issues: ${this.results.consistency.examples.issues.length}`);

        // Completeness Report
        console.log('\n📋 COMPLETENESS CHECK');
        console.log(`Missing Required Sections: ${this.results.completeness.requiredSections.missing.length}`);
        console.log(`Error Documentation Issues: ${this.results.completeness.errorDocumentation.issues.length}`);

        // Overall Score
        const overallScore = this.calculateOverallScore();
        console.log('\n🎯 OVERALL DOCUMENTATION SCORE');
        console.log(`${overallScore}/100`);
        
        if (overallScore >= 90) {
            console.log('🎉 Excellent! Your documentation is comprehensive and well-structured.');
        } else if (overallScore >= 80) {
            console.log('👍 Good documentation with minor improvements needed.');
        } else if (overallScore >= 70) {
            console.log('⚠️  Documentation needs some attention to reach production quality.');
        } else {
            console.log('❌ Documentation requires significant improvements.');
        }

        console.log('\n=====================================');
        console.log('Documentation validation complete! ✅');
    }

    /**
     * Calculate overall documentation score
     */
    calculateOverallScore() {
        const weights = {
            coverage: 0.3,
            links: 0.2,
            formatting: 0.2,
            consistency: 0.15,
            completeness: 0.15
        };

        // Coverage score (average of all coverage percentages)
        const coverageScores = [
            parseFloat(this.results.coverage.endpoints.coverage),
            parseFloat(this.results.coverage.models.coverage),
            parseFloat(this.results.coverage.examples.coverage),
            parseFloat(this.results.coverage.errors.coverage)
        ];
        const coverageScore = coverageScores.reduce((a, b) => a + b, 0) / coverageScores.length;

        // Link score
        const totalLinks = this.results.linkValidation.totalLinks;
        const validLinks = this.results.linkValidation.validLinks.length;
        const linkScore = totalLinks > 0 ? (validLinks / totalLinks) * 100 : 100;

        // Formatting score
        const totalFiles = this.results.formatting.validFiles.length + this.results.formatting.issues.length;
        const cleanFiles = this.results.formatting.validFiles.length;
        const formattingScore = totalFiles > 0 ? (cleanFiles / totalFiles) * 100 : 100;

        // Consistency score (inverse of issues)
        const consistencyIssues = this.results.consistency.terminology.inconsistencies.length +
                                this.results.consistency.formatting.issues.length +
                                this.results.consistency.examples.issues.length;
        const consistencyScore = Math.max(0, 100 - (consistencyIssues * 10));

        // Completeness score
        const completenessIssues = this.results.completeness.requiredSections.missing.length +
                                 this.results.completeness.errorDocumentation.issues.length;
        const completenessScore = Math.max(0, 100 - (completenessIssues * 15));

        // Calculate weighted score
        const overallScore = Math.round(
            (coverageScore * weights.coverage) +
            (linkScore * weights.links) +
            (formattingScore * weights.formatting) +
            (consistencyScore * weights.consistency) +
            (completenessScore * weights.completeness)
        );

        return overallScore;
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new DocumentationValidator();
    validator.runAllValidations().catch(console.error);
}

module.exports = DocumentationValidator;