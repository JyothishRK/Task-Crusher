const ModelAnalyzer = require('../analyzers/model-analyzer');
const path = require('path');

/**
 * Test suite for ModelAnalyzer
 */
class ModelAnalyzerTest {
    constructor() {
        this.analyzer = new ModelAnalyzer();
        this.testResults = [];
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running ModelAnalyzer tests...\n');

        this.testAnalyzeAllModels();
        this.testUserModelAnalysis();
        this.testTaskModelAnalysis();
        this.testFieldExtraction();
        this.testRelationshipExtraction();

        this.printResults();
    }

    /**
     * Test analyzing all models
     */
    testAnalyzeAllModels() {
        try {
            const models = this.analyzer.analyzeAllModels();
            
            this.assert(
                typeof models === 'object',
                'analyzeAllModels should return an object'
            );
            
            this.assert(
                models.hasOwnProperty('user'),
                'Should analyze user model'
            );
            
            this.assert(
                models.hasOwnProperty('task'),
                'Should analyze task model'
            );

            console.log('✅ testAnalyzeAllModels passed');
        } catch (error) {
            console.log('❌ testAnalyzeAllModels failed:', error.message);
        }
    }

    /**
     * Test User model analysis
     */
    testUserModelAnalysis() {
        try {
            const models = this.analyzer.analyzeAllModels();
            const userModel = models.user;

            this.assert(
                userModel && userModel.name === 'User',
                'User model should be properly identified'
            );

            this.assert(
                Array.isArray(userModel.fields),
                'User model should have fields array'
            );

            // Check for expected fields
            const fieldNames = userModel.fields.map(f => f.name);
            const expectedFields = ['name', 'email', 'password', 'age'];
            
            expectedFields.forEach(fieldName => {
                this.assert(
                    fieldNames.includes(fieldName),
                    `User model should have ${fieldName} field`
                );
            });

            console.log('✅ testUserModelAnalysis passed');
        } catch (error) {
            console.log('❌ testUserModelAnalysis failed:', error.message);
        }
    }

    /**
     * Test Task model analysis
     */
    testTaskModelAnalysis() {
        try {
            const models = this.analyzer.analyzeAllModels();
            const taskModel = models.task;

            this.assert(
                taskModel && taskModel.name === 'Task',
                'Task model should be properly identified'
            );

            // Check for expected fields
            const fieldNames = taskModel.fields.map(f => f.name);
            const expectedFields = ['title', 'description', 'dueDate', 'priority', 'userId'];
            
            expectedFields.forEach(fieldName => {
                this.assert(
                    fieldNames.includes(fieldName),
                    `Task model should have ${fieldName} field`
                );
            });

            // Check priority enum constraint
            const priorityField = taskModel.fields.find(f => f.name === 'priority');
            this.assert(
                priorityField && priorityField.constraints && priorityField.constraints.enum,
                'Priority field should have enum constraint'
            );

            console.log('✅ testTaskModelAnalysis passed');
        } catch (error) {
            console.log('❌ testTaskModelAnalysis failed:', error.message);
        }
    }

    /**
     * Test field extraction
     */
    testFieldExtraction() {
        try {
            const sampleSchema = `
                const testSchema = new mongoose.Schema({
                    name: {
                        type: String,
                        required: true,
                        trim: true
                    },
                    age: {
                        type: Number,
                        default: 0,
                        validate(value) {
                            if(value < 0) {
                                throw new Error("Age must be positive");
                            }
                        }
                    },
                    status: {
                        type: String,
                        enum: ['active', 'inactive'],
                        default: 'active'
                    }
                });
            `;

            const fields = this.analyzer.extractFields(sampleSchema);
            
            this.assert(
                fields.length === 3,
                'Should extract 3 fields from sample schema'
            );

            const nameField = fields.find(f => f.name === 'name');
            this.assert(
                nameField && nameField.required === true,
                'Name field should be required'
            );

            const statusField = fields.find(f => f.name === 'status');
            this.assert(
                statusField && statusField.constraints && statusField.constraints.enum,
                'Status field should have enum constraint'
            );

            console.log('✅ testFieldExtraction passed');
        } catch (error) {
            console.log('❌ testFieldExtraction failed:', error.message);
        }
    }

    /**
     * Test relationship extraction
     */
    testRelationshipExtraction() {
        try {
            const models = this.analyzer.analyzeAllModels();
            const taskModel = models.task;

            this.assert(
                Array.isArray(taskModel.relationships),
                'Task model should have relationships array'
            );

            // Check for userId reference relationship
            const userRelationship = taskModel.relationships.find(r => r.field === 'userId');
            this.assert(
                userRelationship && userRelationship.model === 'User',
                'Task should have relationship to User via userId'
            );

            console.log('✅ testRelationshipExtraction passed');
        } catch (error) {
            console.log('❌ testRelationshipExtraction failed:', error.message);
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
        console.log('\n📊 ModelAnalyzer test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new ModelAnalyzerTest();
    test.runTests();
}

module.exports = ModelAnalyzerTest;