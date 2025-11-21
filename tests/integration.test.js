const request = require('supertest');
const express = require('express');
const JwtAuthExpress = require('../index');

describe('JWT Auth Express Integration Tests', () => {
  let app;
  let auth;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    auth = await JwtAuthExpress.create({
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      database: {
        dialect: 'mysql2',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'auth_test',
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        tableName: 'test_users'
      }
    });

    app.use('/auth', auth.getRoutes((req, res, next) => next()));
  });

  test('User registration and login flow', async () => {
    const userData = {
      email: 'integration-test@example.com',
      password: 'password123',
      name: 'Integration Test User'
    };

    // Test signup
    const signupResponse = await request(app)
      .post('/auth/signup')
      .send(userData);
    
    expect(signupResponse.status).toBe(201);
    expect(signupResponse.body.success).toBe(true);
    expect(signupResponse.body.data.user.email).toBe(userData.email);

    // Test login
    const loginResponse = await request(app)
      .post('/auth/signin')
      .send({
        email: userData.email,
        password: userData.password
      });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
  });
});