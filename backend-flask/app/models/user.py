from app import db
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    auth_provider = db.Column(db.String(50), default='email', nullable=False)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    onboarding_completed = db.Column(db.Boolean, default=False, nullable=False)
    
    # Profile fields
    avatar_url = db.Column(db.String(500), nullable=True)
    language = db.Column(db.String(10), default='en', nullable=False)
    timezone = db.Column(db.String(50), default='UTC', nullable=False)
    
    # Settings/Preferences fields
    privacy_settings = db.Column(db.JSON, default=lambda: {
        'profile_visibility': 'private',
        'data_sharing': False,
        'analytics': True
    }, nullable=False)
    notification_settings = db.Column(db.JSON, default=lambda: {
        'email_notifications': True,
        'push_notifications': False,
        'marketing_emails': False
    }, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    artworks = db.relationship('Artwork', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_sensitive=False):
        # Normalize avatar_url: always return a /api/images/ proxy path
        # so the frontend never needs to hit MinIO directly
        raw_avatar = self.avatar_url
        if raw_avatar:
            if raw_avatar.startswith('/api/images/'):
                avatar_url_out = raw_avatar
            elif raw_avatar.startswith('http://') or raw_avatar.startswith('https://'):
                # Legacy raw MinIO URL — extract the object key after the bucket name
                # e.g. http://localhost:9002/artworks/avatars/user-x/123.jpg
                # → /api/images/avatars/user-x/123.jpg
                try:
                    # Split on bucket name 'artworks/'
                    parts = raw_avatar.split('/artworks/', 1)
                    if len(parts) == 2:
                        avatar_url_out = f'/api/images/{parts[1]}'
                    else:
                        avatar_url_out = raw_avatar
                except Exception:
                    avatar_url_out = raw_avatar
            else:
                avatar_url_out = raw_avatar
        else:
            avatar_url_out = None

        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'auth_provider': self.auth_provider,
            'onboarding_completed': self.onboarding_completed,
            'avatar_url': avatar_url_out,
            'language': self.language,
            'timezone': self.timezone,
            'privacy_settings': self.privacy_settings,
            'notification_settings': self.notification_settings,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_sensitive:
            data['google_id'] = self.google_id
            
        return data
    
    def __repr__(self):
        return f'<User {self.email}>'