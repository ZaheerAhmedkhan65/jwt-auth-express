// src/controllers/tokenController.js
const CryptoUtils = require('../utils/crypto');

class TokenController {
  constructor(jwtUtils, userModel) {
    this.jwtUtils = jwtUtils;
    this.User = userModel;
  }

  // Verify access token
  verifyToken = async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const decoded = this.jwtUtils.verifyAccessToken(token);
      
      // Check if user still exists
      const user = await this.User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          expiresAt: decoded.exp * 1000 // Convert to milliseconds
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          valid: false,
          reason: error.message
        }
      });
    }
  }

  // Decode token without verification
  decodeToken = async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const decoded = this.jwtUtils.decodeToken(token);

      if (!decoded) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token format'
        });
      }

      res.json({
        success: true,
        data: {
          decoded,
          expiresAt: decoded.exp ? decoded.exp * 1000 : null,
          issuedAt: decoded.iat ? decoded.iat * 1000 : null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error decoding token',
        error: error.message
      });
    }
  }

  // Revoke all tokens for a user (admin function)
  revokeAllTokens = async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      await this.User.clearAllRefreshTokens(userId);

      res.json({
        success: true,
        message: 'All tokens revoked successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error revoking tokens',
        error: error.message
      });
    }
  }

  // Get token information
  getTokenInfo = async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'No token provided'
        });
      }

      const decoded = this.jwtUtils.decodeToken(token);
      
      if (!decoded) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token'
        });
      }

      const tokenInfo = {
        type: 'JWT',
        algorithm: decoded.alg || 'HS256',
        issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'N/A',
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A',
        subject: decoded.sub || 'N/A',
        issuer: decoded.iss || 'N/A',
        audience: decoded.aud || 'N/A',
        payload: decoded
      };

      // Check if token is expired
      if (decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        tokenInfo.expired = decoded.exp < now;
        tokenInfo.validFor = decoded.exp - now;
      }

      res.json({
        success: true,
        data: tokenInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting token info',
        error: error.message
      });
    }
  }

  // Generate custom token (for admin purposes)
  generateCustomToken = async (req, res) => {
    try {
      const { payload, expiresIn = '1h' } = req.body;

      if (!payload) {
        return res.status(400).json({
          success: false,
          message: 'Payload is required'
        });
      }

      const token = this.jwtUtils.generateAccessToken(payload, expiresIn);

      res.json({
        success: true,
        data: {
          token,
          expiresIn,
          payload
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating token',
        error: error.message
      });
    }
  }
}

module.exports = TokenController;