import os
from flask import current_app
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, To, Subject, PlainTextContent, HtmlContent
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class SendGridEmailService:
    """Production-grade email service using SendGrid"""
    
    def __init__(self):
        self.api_key = None
        self.from_email = None
        self.frontend_url = None
        self.client = None
        self._initialize()
    
    def _initialize(self):
        """Initialize SendGrid configuration"""
        self.api_key = os.getenv('SENDGRID_API_KEY')
        self.from_email = os.getenv('EMAIL_FROM', 'afnank070@gmail.com')
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        if self.api_key:
            try:
                self.client = SendGridAPIClient(api_key=self.api_key)
            except Exception as e:
                if hasattr(current_app, 'logger'):
                    current_app.logger.error(f"Failed to initialize SendGrid client: {e}")
                else:
                    print(f"Failed to initialize SendGrid client: {e}")
    
    def is_configured(self):
        """Check if SendGrid is properly configured"""
        if not self.api_key:
            self._initialize()  # Try to reinitialize
        return bool(self.api_key and self.client)
    
    def send_email(self, to_email, subject, text_content, html_content=None):
        """Send email via SendGrid"""
        if not self.is_configured():
            error_msg = f"SendGrid not configured - API Key: {'SET' if self.api_key else 'NOT SET'}"
            if hasattr(current_app, 'logger'):
                current_app.logger.error(error_msg)
            else:
                print(error_msg)
            return False
        
        try:
            # Create the email
            from_email = From(self.from_email, "Collector Identity")
            to_email_obj = To(to_email)
            subject_obj = Subject(subject)
            plain_text_content = PlainTextContent(text_content)
            
            # Create mail object
            if html_content:
                html_content_obj = HtmlContent(html_content)
                mail = Mail(from_email, to_email_obj, subject_obj, plain_text_content, html_content_obj)
            else:
                mail = Mail(from_email, to_email_obj, subject_obj, plain_text_content)
            
            # Send the email
            response = self.client.send(mail)
            
            # Log detailed response information
            log_msg = f"SendGrid Response - Status: {response.status_code}, Headers: {dict(response.headers)}"
            if hasattr(current_app, 'logger'):
                current_app.logger.info(log_msg)
            else:
                print(log_msg)
            
            if response.status_code in [200, 201, 202]:
                success_msg = f"Email sent successfully to {to_email} (Status: {response.status_code})"
                if hasattr(current_app, 'logger'):
                    current_app.logger.info(success_msg)
                else:
                    print(success_msg)
                return True
            else:
                error_msg = f"SendGrid API error: {response.status_code} - {response.body}"
                if hasattr(current_app, 'logger'):
                    current_app.logger.error(error_msg)
                else:
                    print(error_msg)
                return False
                
        except Exception as e:
            error_msg = f"Failed to send email via SendGrid: {str(e)}"
            if hasattr(current_app, 'logger'):
                current_app.logger.error(error_msg)
            else:
                print(error_msg)
            return False
    
    def send_password_reset_email(self, user_email, user_name, reset_token):
        """Send password reset email using SendGrid"""
        if not self.is_configured():
            current_app.logger.error("SendGrid not configured - cannot send password reset email")
            return False
        
        try:
            # Create reset URL
            reset_url = f"{self.frontend_url}/reset-password?token={reset_token}"
            
            # Email subject
            subject = "Reset Your Password - Collector Identity"
            
            # HTML email content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
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
                           style="background: #1c1917; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; border: none;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                        Or copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 14px; color: #3b82f6; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
                        {reset_url}
                    </p>
                    
                    <p style="font-size: 14px; color: #dc2626; margin-bottom: 20px; font-weight: 600;">
                        This link will expire in 30 minutes for security reasons.
                    </p>
                    
                    <p style="font-size: 14px; color: #6b7280;">
                        If you continue to have problems, please contact our support team.
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
            
            # Plain text version
            text_content = f"""
Reset Your Password - Collector Identity

Hi {user_name},

We received a request to reset your password for your Collector Identity account.
If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
{reset_url}

This link will expire in 30 minutes for security reasons.

If you continue to have problems, please contact our support team.

Best regards,
The Collector Identity Team

If you're having trouble with the link, copy and paste it into your web browser.
            """
            
            return self.send_email(user_email, subject, text_content, html_content)
            
        except Exception as e:
            current_app.logger.error(f"Failed to send password reset email to {user_email}: {str(e)}")
            return False

# Create singleton instance
sendgrid_email_service = SendGridEmailService()