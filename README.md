# JWT Auth Express

A robust, production-ready JWT authentication package for Express.js with support for MySQL, MySQL2, and TiDB Cloud.

## Features

- ✅ User registration & authentication
- ✅ JWT access & refresh tokens
- ✅ Password reset functionality
- ✅ Email integration (with mock fallback)
- ✅ Multiple database support (MySQL, MySQL2, TiDB Cloud)
- ✅ Automatic table creation
- ✅ Comprehensive security features
- ✅ Production-ready error handling

## Quick Start

### Installation

```bash
npm install jwt-auth-express
```

### Usage

```javascript
const jwtAuth = require('jwt-auth-express');

const app = express();

app.use(jwtAuth({
    secretKey: 'my-secret-key',
    database: {
        type: 'mysql2',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'password',
        database: 'my_database',
    },
}))