// src/utils/email.js
const nodemailer = require('nodemailer');

class EmailUtils {
    constructor(config = {}) {
        this.config = config;
        this.transporter = null;
        this.isConfigured = false;

        this.initializeTransporter();
    }

    // Initialize email transporter with better error handling
    initializeTransporter() {
        try {
            // Check if email configuration is provided
            if (!this.config.service || !this.config.auth || !this.config.auth.user || !this.config.auth.pass) {
                console.log('📧 Email configuration not provided. Email features will be disabled.');
                this.isConfigured = false;
                return;
            }

            this.transporter = nodemailer.createTransport({
                service: this.config.service,
                auth: {
                    user: this.config.auth.user,
                    pass: this.config.auth.pass
                },
                pool: this.config.pool !== false,
                maxConnections: this.config.maxConnections || 5,
                maxMessages: this.config.maxMessages || 100,
                ...this.config.transporterOptions
            });

            // Verify connection with timeout
            this.transporter.verify((error) => {
                if (error) {
                    console.warn('⚠️ Email transporter verification failed. Email features disabled.');
                    console.warn('   Reason:', error.message);
                    this.isConfigured = false;
                } else {
                    console.log('✅ Email transporter is ready');
                    this.isConfigured = true;
                }
            });
        } catch (error) {
            console.warn('⚠️ Error initializing email transporter:', error.message);
            this.isConfigured = false;
        }
    }

    // Send password reset email with fallback
    async sendPasswordResetEmail(email, resetToken, userId) {
        if (!this.isConfigured) {
            console.log(`📧 [MOCK] Password reset for ${email}: ${resetToken}`);
            return {
                success: true,
                mock: true,
                message: 'Email service not configured - token logged to console'
            };
        }

        const resetLink = `${this.config.baseUrl || 'http://localhost:3000'}/reset-password?token=${resetToken}&userId=${userId}`;

        const mailOptions = {
            from: this.config.from || `"Auth System" <${this.config.auth.user}>`,
            to: email,
            subject: 'Password Reset Request',
            html: this._getPasswordResetTemplate(resetLink, resetToken)
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };
        } catch (error) {
            console.warn('⚠️ Failed to send password reset email:', error.message);
            console.log(`📧 [FALLBACK] Password reset for ${email}: ${resetToken}`);
            return {
                success: true,
                mock: true,
                error: error.message,
                message: 'Email failed - token logged to console'
            };
        }
    }

    // Send email verification
    async sendVerificationEmail(email, verificationToken, userId) {
        if (!this.isConfigured) {
            console.log(`📧 [MOCK] Password reset for ${email}: ${resetToken}`);
            return {
                success: true,
                mock: true,
                message: 'Email service not configured - token logged to console'
            };
        }

        const verificationLink = `${this.config.baseUrl || 'http://localhost:3000'}/verify-email?token=${verificationToken}&userId=${userId}`;

        const mailOptions = {
            from: this.config.from || `"Auth System" <${this.config.auth.user}>`,
            to: email,
            subject: 'Verify Your Email Address',
            html: this._getVerificationTemplate(verificationLink)
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };
        } catch (error) {
            console.warn('⚠️ Failed to send password reset email:', error.message);
            console.log(`📧 [FALLBACK] Password reset for ${email}: ${resetToken}`);
            return {
                success: true,
                mock: true,
                error: error.message,
                message: 'Email failed - token logged to console'
            };
        }
    }

    // Send welcome email
    async sendWelcomeEmail(email, name) {
        if (!this.isConfigured) {
            console.log(`📧 [MOCK] Welcome email for ${email}: ${name}`);
            return {
                success: true,
                mock: true,
                message: 'Email service not configured - token logged to console'
            };
        }

        const mailOptions = {
            from: this.config.from || `"Auth System" <${this.config.auth.user}>`,
            to: email,
            subject: 'Welcome to Our Platform!',
            html: this._getWelcomeTemplate(name)
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };
        } catch (error) {
            console.warn('⚠️ Failed to send welcome email:', error.message);
            console.log(`📧 [FALLBACK] Welcome email for ${email}: ${name}`);
            return {
                success: true,
                mock: true,
                error: error.message,
                message: 'Email failed - token logged to console'
            };
        }
    }

    // Email templates
    _getPasswordResetTemplate(resetLink, resetToken) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; 
                   color: white; text-decoration: none; border-radius: 4px; }
          .token { background-color: #f8f9fa; padding: 10px; border-radius: 4px; 
                  font-family: monospace; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <p><a href="${resetLink}" class="button">Reset Password</a></p>
          <p>Or copy and paste this token in the reset form:</p>
          <div class="token">${resetToken}</div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;
    }

    _getVerificationTemplate(verificationLink) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #28a745; 
                   color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <p><a href="${verificationLink}" class="button">Verify Email</a></p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;
    }

    _getWelcomeTemplate(name) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome aboard, ${name}!</h2>
          <p>Thank you for joining our platform. We're excited to have you with us.</p>
          <p>Get started by exploring all the features we offer.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Team</p>
        </div>
      </body>
      </html>
    `;
    }

    // Get email configuration status
    getStatus() {
        return {
            isConfigured: this.isConfigured,
            service: this.config.service,
            from: this.config.from || this.config.auth?.user
        };
    }

    // Close transporter connection
    async close() {
        if (this.transporter) {
            await this.transporter.close();
        }
    }
}

module.exports = EmailUtils;