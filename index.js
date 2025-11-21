//index.js
const JWTUtils = require('./src/utils/jwt');
const AuthController = require('./src/controllers/authController');
const TokenController = require('./src/controllers/tokenController');
const { authenticateToken, optionalAuth } = require('./src/middleware/auth');
const createAuthRoutes = require('./src/routes/authRoutes');
const EmailUtils = require('./src/utils/email');
const DatabaseConfig = require('./src/config/database');
const User = require('./src/models/User');

class DatabaseFactory {

    static async create(config) {
        const dbConfig = new DatabaseConfig(config);
    const validation = dbConfig.validate();
    
    if (!validation.isValid) {
      throw new Error(`Database configuration invalid: ${validation.errors.join(', ')}`);
    }

    const connectionConfig = dbConfig.getConnectionConfig();
    
    console.log('🔧 Creating database connection with config:', {
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
      user: connectionConfig.user,
      dialect: config.dialect
    });

    // Use mysql2/promise for better Promise support and connection pooling
    const mysql = require('mysql2/promise');
    
    // Create connection pool (better for production)
    const pool = mysql.createPool({
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.user,
      password: connectionConfig.password,
      database: connectionConfig.database,
      charset: connectionConfig.charset,
      timezone: connectionConfig.timezone,
      connectTimeout: connectionConfig.connectTimeout,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: connectionConfig.ssl || false
    });

    // Test the connection
    try {
      const connection = await pool.getConnection();
      console.log(`✅ ${config.dialect.toUpperCase()} database connected successfully`);
      connection.release(); // Release the connection back to the pool
      return pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
    }

    // Create connection pool for better performance
    static async createPool(config) {
        const dbConfig = new DatabaseConfig(config);
        const validation = dbConfig.validate();

        if (!validation.isValid) {
            throw new Error(`Database configuration invalid: ${validation.errors.join(', ')}`);
        }

        const poolConfig = dbConfig.getPoolConfig();

        switch (config.dialect) {
            case 'mysql':
                const mysql = require('mysql');
                return mysql.createPool(poolConfig);

            case 'mysql2':
            case 'tidb':
                const mysql2 = require('mysql2');
                return mysql2.createPool(poolConfig);

            default:
                throw new Error(`Unsupported database dialect: ${config.dialect}`);
        }
    }
}

class JwtAuthExpress {
    constructor(options = {}) {
        const {
            // JWT options
            secret,
            refreshSecret,

            // Database options
            database: dbConfig = {},

            // Email options
            emailConfig = {},

            // Token expiry
            tokenExpiry = {
                access: '15m',
                refresh: '7d'
            }
        } = options;

        if (!secret || !refreshSecret) {
            throw new Error('JWT secrets are required');
        }

        this.jwtUtils = new JWTUtils(secret, refreshSecret);
        this.emailUtils = new EmailUtils(emailConfig);
        this.dbConfig = dbConfig;

        // Set token expiry
        this.jwtUtils.accessTokenExpiry = tokenExpiry.access;
        this.jwtUtils.refreshTokenExpiry = tokenExpiry.refresh;

        this.db = null;
        this.userModel = null;
        this.authController = null;
        this.tokenController = null;
    }

    // Initialize database connection
    async init() {
        try {
            this.db = await DatabaseFactory.create(this.dbConfig);
            this.userModel = new User(this.db, {
                dialect: this.dbConfig.dialect,
                tableName: this.dbConfig.tableName || 'users'
            });

            // Initialize database tables (for SQL databases)
            if (this.dbConfig.dialect !== 'mongodb') {
                await this.userModel.initDatabase();
            }

            this.authController = new AuthController(this.jwtUtils, this.userModel, this.emailUtils);
            this.tokenController = new TokenController(this.jwtUtils, this.userModel);

            console.log(`Database connected successfully (${this.dbConfig.dialect})`);
            return this;
        } catch (error) {
            throw new Error(`Failed to initialize database: ${error.message}`);
        }
    }

    // Get authentication routes
    getRoutes(validationMiddleware) {
        if (!this.authController) {
            throw new Error('Authentication system not initialized. Call init() first.');
        }
        return createAuthRoutes(this.authController, validationMiddleware);
    }

    // Get token routes
    getTokenRoutes(validationMiddleware) {
        if (!this.tokenController) {
            throw new Error('Authentication system not initialized. Call init() first.');
        }

        const express = require('express');
        const router = express.Router();

        router.post('/verify', validationMiddleware, this.tokenController.verifyToken);
        router.post('/decode', validationMiddleware, this.tokenController.decodeToken);
        router.post('/revoke-all', this.getAuthMiddleware(), validationMiddleware, this.tokenController.revokeAllTokens);
        router.get('/info', this.getAuthMiddleware(), this.tokenController.getTokenInfo);
        router.post('/generate', this.getAuthMiddleware(), validationMiddleware, this.tokenController.generateCustomToken);

        return router;
    }

    getAuthMiddleware() {
        return authenticateToken(this.jwtUtils);
    }

    getOptionalAuthMiddleware() {
        return optionalAuth(this.jwtUtils);
    }

    getJwtUtils() {
        return this.jwtUtils;
    }

    getUserModel() {
        return this.userModel;
    }

    // Close database connection
    async close() {
        if (this.db) {
            switch (this.dbConfig.dialect) {
                case 'mongodb':
                    await this.db.client.close();
                    break;
                case 'mysql':
                case 'mysql2':
                case 'tidb':
                    await this.db.end();
                    break;
                case 'sqlite':
                    this.db.close();
                    break;
                case 'postgres':
                    await this.db.end();
                    break;
            }
        }

        if (this.emailUtils) {
            await this.emailUtils.close();
        }
    }
}

// Convenience function for quick setup
JwtAuthExpress.create = async (options) => {
    const auth = new JwtAuthExpress(options);
    await auth.init();
    return auth;
};

module.exports = JwtAuthExpress;