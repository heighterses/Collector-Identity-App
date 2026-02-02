from app import db
from datetime import datetime, timedelta
import uuid
import secrets

class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = db.Column(db.String(255), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    user = db.relationship('User', backref='password_reset_tokens')
    
    @staticmethod
    def generate_token():
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def create_reset_token(user_id, expires_in_hours=1):
        """Create a new password reset token for a user"""
        # Invalidate any existing tokens for this user
        PasswordResetToken.query.filter_by(user_id=user_id, used=False).update({'used': True})
        
        # Create new token
        token = PasswordResetToken.generate_token()
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
        
        reset_token = PasswordResetToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        
        db.session.add(reset_token)
        db.session.commit()
        
        return token
    
    @staticmethod
    def validate_token(token):
        """Validate a reset token and return the associated user"""
        reset_token = PasswordResetToken.query.filter_by(
            token=token,
            used=False
        ).first()
        
        if not reset_token:
            return None
        
        # Check if token has expired
        if datetime.utcnow() > reset_token.expires_at:
            return None
        
        return reset_token
    
    def mark_as_used(self):
        """Mark token as used"""
        self.used = True
        db.session.commit()
    
    def __repr__(self):
        return f'<PasswordResetToken {self.id}>'