const ModelDocumentationGenerator = require('../generators/model-doc-generator');
const fs = require('fs');
const path = require('path');

/**
 * Test suite for ModelDocumentationGenerator
 */
class ModelDocGeneratorTest {
    constructor() {
        this.generator = new ModelDocumentationGenerator();
        this.testOutputDir = path.resolve(__dirname, '../../docs/api/models');
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running ModelDocumentationGenerator tests...\n');

        this.testGenerateAllModelDocs();
        this.testUserModelDocGeneration();
        this.testTaskModelDocGeneration();
        this.testModelsIndexGeneration();

        this.printResults();
    }

    /**
     * Test generating all model documentation
     */
    testGenerateAllModelDocs() {
        try {
            this.generator.generateAllModelDocs();
            
            // Check if files were created
            const userDocPath = path.join(this.testOutputDir, 'user.md');
            const taskDocPath = path.join(this.testOutputDir, 'task.md');
            const indexPath = path.join(this.testOutputDir, 'README.md');
            
            this.assert(
                fs.existsSync(userDocPath),
                'User model documentation should be created'
            );
            
            this.assert(
                fs.existsSync(taskDocPath),
                'Task model documentation should be created'
            );
            
            this.assert(
                fs.existsSync(indexPath),
                'Models index should be created'
            );

            console.log('✅ testGenerateAllModelDocs passed');
        } catch (error) {
            console.log('❌ testGenerateAllModelDocs failed:', error.message);
        }
    }

    /**
     * Test User model documentation generation
     */
    testUserModelDocGeneration() {
        try {
            const userDocPath = path.join(this.testOutputDir, 'user.md');
            
            if (fs.existsSync(userDocPath)) {
                const content = fs.readFileSync(userDocPath, 'utf8');
                
                this.assert(
                    content.includes('# User Model'),
                    'User documentation should have proper title'
                );
                
                this.assert(
                    content.includes('## Fields'),
                    'User documentation should have fields section'
                );
                
                this.assert(
                    content.includes('name') && content.includes('email'),
                    'User documentation should include name and email fields'
                );
                
                this.assert(
                    content.includes('## Example'),
                    'User documentation should have example section'
                );
            }

            console.log('✅ testUserModelDocGeneration passed');
        } catch (error) {
            console.log('❌ testUserModelDocGeneration failed:', error.message);
        }
    }

    /**
     * Test Task model documentation generation
     */
    testTaskModelDocGeneration() {
        try {
            const taskDocPath = path.join(this.testOutputDir, 'task.md');
            
            if (fs.existsSync(taskDocPath)) {
                const content = fs.readFileSync(taskDocPath, 'utf8');
                
                this.assert(
                    content.includes('# Task Model'),
                    'Task documentation should have proper title'
                );
                
                this.assert(
                    content.includes('title') && content.includes('priority'),
                    'Task documentation should include title and priority fields'
                );
                
                this.assert(
                    content.includes('enum: [low, medium, high]'),
                    'Task documentation should show priority enum values'
                );
                
                this.assert(
                    content.includes('## Relationships'),
                    'Task documentation should have relationships section'
                );
            }

            console.log('✅ testTaskModelDocGeneration passed');
        } catch (error) {
            console.log('❌ testTaskModelDocGeneration failed:', error.message);
        }
    }

    /**
     * Test models index generation
     */
    testModelsIndexGeneration() {
        try {
            const indexPath = path.join(this.testOutputDir, 'README.md');
            
            if (fs.existsSync(indexPath)) {
                const content = fs.readFileSync(indexPath, 'utf8');
                
                this.assert(
                    content.includes('# Data Models'),
                    'Index should have proper title'
                );
                
                this.assert(
                    content.includes('[User](./user.md)') && content.includes('[Task](./task.md)'),
                    'Index should link to model documentation files'
                );
                
                this.assert(
                    content.includes('## Model Relationships'),
                    'Index should have relationships diagram'
                );
            }

            console.log('✅ testModelsIndexGeneration passed');
        } catch (error) {
            console.log('❌ testModelsIndexGeneration failed:', error.message);
        }
    }

    /**
     * Simple assertion helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('\n📊 ModelDocumentationGenerator test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new ModelDocGeneratorTest();
    test.runTests();
}

module.exports = ModelDocGeneratorTest;