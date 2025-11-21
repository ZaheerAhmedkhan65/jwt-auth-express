require('dotenv').config();
const express = require('express');
const JwtAuthExpress = require('../index');

const app = express();
app.use(express.json());

async function startSimpleTest() {
  try {
    console.log('🧪 Starting Simple Test Server...');

    // Simple configuration for testing
    const auth = await JwtAuthExpress.create({
      secret: 'test-secret-123',
      refreshSecret: 'test-refresh-456',
      database: {
        dialect: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'auth_test_simple',
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        tableName: 'users_test'
      }
    });

    console.log('✅ Authentication system ready');

    // Basic validation middleware
    const simpleValidation = (req, res, next) => {
      console.log(`📨 ${req.method} ${req.path}`);
      next();
    };

    // Setup only essential routes
    app.use('/auth', auth.getRoutes(simpleValidation));

    // Test endpoint
    app.get('/test', async (req, res) => {
      try {
        // Test user data
        const testUser = {
          email: `test-${Date.now()}@example.com`,
          password: 'testpassword123',
          name: 'Test User'
        };

        // Test signup
        const signupResponse = await fetch('http://localhost:3001/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testUser)
        });
        const signupResult = await signupResponse.json();

        // Test signin
        const signinResponse = await fetch('http://localhost:3001/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password
          })
        });
        const signinResult = await signinResponse.json();

        res.json({
          success: true,
          tests: {
            signup: {
              status: signupResponse.status,
              success: signupResult.success,
              message: signupResult.message
            },
            signin: {
              status: signinResponse.status,
              success: signinResult.success,
              message: signinResult.message,
              hasTokens: !!signinResult.data?.tokens
            }
          }
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    const PORT = 3001;
    app.listen(PORT, () => {
      console.log(`🎯 Simple test server running on http://localhost:${PORT}`);
      console.log('   GET /test - Run basic authentication test');
    });

  } catch (error) {
    console.error('❌ Simple test failed:', error.message);
    console.log('\n💡 Try this instead:');
    console.log('   npm run test:mock');
  }
}

startSimpleTest();