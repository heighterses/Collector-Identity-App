import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

class EmailService:
    """Email service for sending password reset emails"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('EMAIL_FROM', 'noreply@collector-identity.com')
        self.from_name = os.getenv('EMAIL_FROM_NAME', 'Collector Identity')
        
    def is_configured(self):
        """Check if email service is properly configured"""
        return bool(self.smtp_server)
    
    def is_development_mode(self):
        """Check if using MailHog (development mode)"""
        return self.smtp_server == 'localhost' and self.smtp_port == 1025
    
    def send_password_reset_email(self, user_email, user_name, reset_token):
        """Send password reset email"""
        if not self.is_configured():
            # Log the reset link for development
            reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
            current_app.logger.info(f"Password reset link for {user_email}: {reset_url}")
            current_app.logger.info("Email service not configured. Reset link logged above.")
            return True
        
        # Log email mode
        if self.is_development_mode():
            current_app.logger.info(f"📧 Sending email via MailHog (development mode) to {user_email}")
        else:
            current_app.logger.info(f"📧 Sending REAL email via {self.smtp_server} to {user_email}")
        
        try:
            # Create reset URL
            reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
            
            # Create email content
            subject = "Reset Your Password - Collector Identity"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                    <h1 style="color: #1c1917; margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">Reset Your Password</h1>
                    <p style="color: #6b7280; margin: 0; font-size: 16px;">Collector Identity</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hi {user_name},</p>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        We received a request to reset your password for your Collector Identity account. 
                        If you didn't make this request, you can safely ignore this email.
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 30px;">
                        To reset your password, click the button below:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" 
                           style="background: #1c1917; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                        Or copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 14px; color: #3b82f6; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
                        {reset_url}
                    </p>
                    
                    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                        This link will expire in 1 hour for security reasons.
                    </p>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280;">
                    <p>Best regards,<br>The Collector Identity Team</p>
                    <p style="margin-top: 20px; font-size: 12px;">
                        If you're having trouble clicking the button, copy and paste the URL above into your web browser.
                    </p>
                </div>
            </body>
            </html>
            """
            
            text_body = f"""
            Reset Your Password - Collector Identity
            
            Hi {user_name},
            
            We received a request to reset your password for your Collector Identity account.
            If you didn't make this request, you can safely ignore this email.
            
            To reset your password, visit this link:
            {reset_url}
            
            This link will expire in 1 hour for security reasons.
            
            Best regards,
            The Collector Identity Team
            """
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = user_email
            
            # Add text and HTML parts
            text_part = MIMEText(text_body, 'plain')
            html_part = MIMEText(html_body, 'html')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if os.getenv('SMTP_USE_TLS', 'true').lower() == 'true':
                    server.starttls()
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            current_app.logger.info(f"Password reset email sent successfully to {user_email}")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Failed to send password reset email to {user_email}: {str(e)}")
            return False

# Create singleton instance
email_service = EmailService()