import os
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import pickle

class OAuth2EmailService:
    """OAuth2-based email service for Gmail"""
    
    SCOPES = ['https://www.googleapis.com/auth/gmail.send']
    
    def __init__(self):
        self.credentials_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json')
        self.token_file = os.getenv('GOOGLE_TOKEN_FILE', 'token.pickle')
        self.from_email = os.getenv('EMAIL_FROM', 'your-email@gmail.com')
        self.from_name = os.getenv('EMAIL_FROM_NAME', 'Collector Identity')
        self.service = None
        
    def is_configured(self):
        """Check if OAuth2 credentials are available"""
        return os.path.exists(self.credentials_file)
    
    def authenticate(self):
        """Authenticate with Google OAuth2"""
        creds = None
        
        # Load existing token
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                creds = pickle.load(token)
        
        # If there are no (valid) credentials available, let the user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    current_app.logger.error(f"Failed to refresh token: {e}")
                    creds = None
            
            if not creds:
                if not os.path.exists(self.credentials_file):
                    current_app.logger.error(f"Credentials file not found: {self.credentials_file}")
                    return False
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, self.SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open(self.token_file, 'wb') as token:
                pickle.dump(creds, token)
        
        try:
            self.service = build('gmail', 'v1', credentials=creds)
            return True
        except Exception as e:
            current_app.logger.error(f"Failed to build Gmail service: {e}")
            return False
    
    def create_message(self, to_email, subject, text_body, html_body=None):
        """Create a message for an email"""
        if html_body:
            message = MIMEMultipart('alternative')
            text_part = MIMEText(text_body, 'plain')
            html_part = MIMEText(html_body, 'html')
            message.attach(text_part)
            message.attach(html_part)
        else:
            message = MIMEText(text_body)
        
        message['to'] = to_email
        message['from'] = f"{self.from_name} <{self.from_email}>"
        message['subject'] = subject
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        return {'raw': raw_message}
    
    def send_email(self, to_email, subject, text_body, html_body=None):
        """Send an email using Gmail API"""
        if not self.service and not self.authenticate():
            current_app.logger.error("Failed to authenticate with Gmail")
            return False
        
        try:
            message = self.create_message(to_email, subject, text_body, html_body)
            result = self.service.users().messages().send(
                userId='me', body=message).execute()
            current_app.logger.info(f"Email sent successfully to {to_email}. Message ID: {result['id']}")
            return True
        except Exception as e:
            current_app.logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def send_password_reset_email(self, user_email, user_name, reset_token):
        """Send password reset email using OAuth2"""
        if not self.is_configured():
            # Log the reset link for development
            reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
            current_app.logger.info(f"Password reset link for {user_email}: {reset_url}")
            current_app.logger.info("OAuth2 email service not configured. Reset link logged above.")
            return True
        
        current_app.logger.info(f"📧 Sending OAuth2 email via Gmail API to {user_email}")
        
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
            
            return self.send_email(user_email, subject, text_body, html_body)
            
        except Exception as e:
            current_app.logger.error(f"Failed to send password reset email to {user_email}: {str(e)}")
            return False

# Create singleton instance
oauth2_email_service = OAuth2EmailService()