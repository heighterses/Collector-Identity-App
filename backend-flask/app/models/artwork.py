from app import db
from datetime import datetime
import uuid

class Artwork(db.Model):
    __tablename__ = 'artworks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    artwork_type = db.Column(db.String(20), nullable=False, default='image')  # 'image' or 'text'
    image_url = db.Column(db.String(500), nullable=True)
    s3_object_key = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    reflection = db.relationship('Reflection', backref='artwork', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self, include_user=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'artwork_type': self.artwork_type,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_user and self.user:
            data['user'] = {
                'id': self.user.id,
                'name': self.user.name,
                'email': self.user.email
            }
            
        return data
    
    def __repr__(self):
        return f'<Artwork {self.title}>'