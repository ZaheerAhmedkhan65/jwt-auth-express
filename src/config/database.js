class DatabaseConfig {
  constructor(options = {}) {
    this.options = {
      // Common options for MySQL variants
      dialect: options.dialect || 'mysql2',
      host: options.host || 'localhost',
      port: options.port || 3306,
      database: options.database || 'auth_db',
      username: options.username || 'root',
      password: options.password || '',
      
      // SSL options for TiDB Cloud
      ssl: options.ssl || false,
      sslCA: options.sslCA,
      sslCert: options.sslCert,
      sslKey: options.sslKey,
      
      // MySQL specific options
      timezone: options.timezone || '+00:00',
      charset: options.charset || 'utf8mb4',
      
      // Connection timeout
      connectTimeout: options.connectTimeout || 60000,
      
      ...options
    };
  }

  // Get MySQL connection configuration
  getConnectionConfig() {
    const { 
      host, 
      port, 
      database, 
      username, 
      password, 
      ssl, 
      timezone, 
      charset,
      connectTimeout 
    } = this.options;
    
    const baseConfig = {
      host,
      port: parseInt(port),
      user: username,
      password,
      database,
      charset,
      timezone,
      connectTimeout: connectTimeout || 60000
    };

    // TiDB Cloud requires SSL
    if (this.options.dialect === 'tidb' || ssl) {
      baseConfig.ssl = {
        rejectUnauthorized: false, // TiDB Cloud uses self-signed certificates
        ...(this.options.sslCA && { ca: this.options.sslCA })
      };
    }

    return baseConfig;
  }

  // Validate configuration
  validate() {
    const errors = [];
    const { dialect, host, database, username } = this.options;

    if (!host) {
      errors.push('Database host is required');
    }

    if (!database) {
      errors.push('Database name is required');
    }

    if (!username) {
      errors.push('Database username is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Environment specific configurations
DatabaseConfig.development = () => {
  return new DatabaseConfig({
    dialect: 'mysql2',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'auth_dev',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: false
  });
};

DatabaseConfig.production = () => {
  return new DatabaseConfig({
    dialect: 'mysql2',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
    sslCA: process.env.DB_SSL_CA
  });
};

DatabaseConfig.tidb = () => {
  return new DatabaseConfig({
    dialect: 'mysql2/promise',
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT || 4000,
    database: process.env.TIDB_DATABASE,
    username: process.env.TIDB_USERNAME,
    password: process.env.TIDB_PASSWORD,
    ssl: true,
    sslCA: process.env.TIDB_SSL_CA,
    connectTimeout: 60000
  });
};

module.exports = DatabaseConfig;