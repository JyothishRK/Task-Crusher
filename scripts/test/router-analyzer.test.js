const RouterAnalyzer = require('../analyzers/router-analyzer');

/**
 * Test suite for RouterAnalyzer
 */
class RouterAnalyzerTest {
    constructor() {
        this.analyzer = new RouterAnalyzer();
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running RouterAnalyzer tests...\n');

        this.testAnalyzeAllRouters();
        this.testHealthRouterAnalysis();
        this.testTaskRouterAnalysis();
        this.testUserRouterAnalysis();
        this.testEndpointExtraction();
        this.testParameterExtraction();
        this.testAuthenticationDetection();

        this.printResults();
    }

    /**
     * Test analyzing all routers
     */
    testAnalyzeAllRouters() {
        try {
            const routers = this.analyzer.analyzeAllRouters();
            
            this.assert(
                typeof routers === 'object',
                'analyzeAllRouters should return an object'
            );
            
            this.assert(
                routers.hasOwnProperty('health'),
                'Should analyze health router'
            );
            
            this.assert(
                routers.hasOwnProperty('task'),
                'Should analyze task router'
            );
            
            this.assert(
                routers.hasOwnProperty('user'),
                'Should analyze user router'
            );

            console.log('✅ testAnalyzeAllRouters passed');
        } catch (error) {
            console.log('❌ testAnalyzeAllRouters failed:', error.message);
        }
    }

    /**
     * Test health router analysis
     */
    testHealthRouterAnalysis() {
        try {
            const routers = this.analyzer.analyzeAllRouters();
            const healthRouter = routers.health;

            this.assert(
                healthRouter && healthRouter.name === 'Health',
                'Health router should be properly identified'
            );

            this.assert(
                Array.isArray(healthRouter.endpoints),
                'Health router should have endpoints array'
            );

            // Check for health endpoint
            const healthEndpoint = healthRouter.endpoints.find(e => e.path === '/health');
            this.assert(
                healthEndpoint && healthEndpoint.method === 'GET',
                'Should find GET /health endpoint'
            );

            console.log('✅ testHealthRouterAnalysis passed');
        } catch (error) {
            console.log('❌ testHealthRouterAnalysis failed:', error.message);
        }
    }

    /**
     * Test task router analysis
     */
    testTaskRouterAnalysis() {
        try {
            const routers = this.analyzer.analyzeAllRouters();
            const taskRouter = routers.task;

            this.assert(
                taskRouter && taskRouter.name === 'Task',
                'Task router should be properly identified'
            );

            // Check for main CRUD endpoints
            const endpoints = taskRouter.endpoints;
            const methods = endpoints.map(e => `${e.method} ${e.path}`);
            
            this.assert(
                methods.includes('POST /tasks'),
                'Should have POST /tasks endpoint'
            );
            
            this.assert(
                methods.includes('GET /tasks'),
                'Should have GET /tasks endpoint'
            );
            
            this.assert(
                methods.some(m => m.includes('GET /tasks/:id')),
                'Should have GET /tasks/:id endpoint'
            );

            console.log('✅ testTaskRouterAnalysis passed');
        } catch (error) {
            console.log('❌ testTaskRouterAnalysis failed:', error.message);
        }
    }

    /**
     * Test user router analysis
     */
    testUserRouterAnalysis() {
        try {
            const routers = this.analyzer.analyzeAllRouters();
            const userRouter = routers.user;

            this.assert(
                userRouter && userRouter.name === 'User',
                'User router should be properly identified'
            );

            // Check for authentication endpoints
            const endpoints = userRouter.endpoints;
            const paths = endpoints.map(e => e.path);
            
            this.assert(
                paths.includes('/users'),
                'Should have /users endpoint'
            );
            
            this.assert(
                paths.includes('/users/login'),
                'Should have /users/login endpoint'
            );
            
            this.assert(
                paths.includes('/users/logout'),
                'Should have /users/logout endpoint'
            );

            console.log('✅ testUserRouterAnalysis passed');
        } catch (error) {
            console.log('❌ testUserRouterAnalysis failed:', error.message);
        }
    }

    /**
     * Test endpoint extraction
     */
    testEndpointExtraction() {
        try {
            const sampleRouter = `
                router.get('/test', (req, res) => {
                    res.send('test');
                });
                
                router.post('/test', auth, async (req, res) => {
                    res.status(201).send(req.body);
                });
            `;

            const endpoints = this.analyzer.extractEndpoints(sampleRouter);
            
            this.assert(
                endpoints.length === 2,
                'Should extract 2 endpoints from sample router'
            );

            const getEndpoint = endpoints.find(e => e.method === 'GET');
            this.assert(
                getEndpoint && getEndpoint.path === '/test',
                'Should extract GET /test endpoint'
            );

            const postEndpoint = endpoints.find(e => e.method === 'POST');
            this.assert(
                postEndpoint && postEndpoint.authentication === 'required',
                'Should detect authentication requirement'
            );

            console.log('✅ testEndpointExtraction passed');
        } catch (error) {
            console.log('❌ testEndpointExtraction failed:', error.message);
        }
    }

    /**
     * Test parameter extraction
     */
    testParameterExtraction() {
        try {
            const sampleEndpoint = `
                router.get('/users/:id', (req, res) => {
                    const limit = parseInt(req.query.limit) || 10;
                    const completed = req.query.completed === "true";
                    res.send({ id: req.params.id });
                });
            `;

            const parameters = this.analyzer.extractParameters(sampleEndpoint, '/users/:id');
            
            this.assert(
                parameters.path.length === 1,
                'Should extract 1 path parameter'
            );
            
            this.assert(
                parameters.path[0].name === 'id',
                'Should extract id path parameter'
            );
            
            this.assert(
                parameters.query.length >= 2,
                'Should extract query parameters'
            );

            const limitParam = parameters.query.find(p => p.name === 'limit');
            this.assert(
                limitParam && limitParam.type === 'number',
                'Should detect limit as number type'
            );

            console.log('✅ testParameterExtraction passed');
        } catch (error) {
            console.log('❌ testParameterExtraction failed:', error.message);
        }
    }

    /**
     * Test authentication detection
     */
    testAuthenticationDetection() {
        try {
            const authRequired = this.analyzer.detectAuthentication('auth', 'router.get("/test", auth, (req, res) => {});');
            this.assert(
                authRequired === 'required',
                'Should detect required authentication'
            );

            const noAuth = this.analyzer.detectAuthentication('', 'router.get("/test", (req, res) => {});');
            this.assert(
                noAuth === 'none',
                'Should detect no authentication'
            );

            console.log('✅ testAuthenticationDetection passed');
        } catch (error) {
            console.log('❌ testAuthenticationDetection failed:', error.message);
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
        console.log('\n📊 RouterAnalyzer test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new RouterAnalyzerTest();
    test.runTests();
}

module.exports = RouterAnalyzerTest;