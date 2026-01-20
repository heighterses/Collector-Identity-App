from app import db
from datetime import datetime
import uuid

class Reflection(db.Model):
    __tablename__ = 'reflections'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    artwork_id = db.Column(db.String(36), db.ForeignKey('artworks.id', ondelete='CASCADE'), nullable=False, unique=True)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(100), default='initial_interpretation', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self, include_artwork=False):
        data = {
            'id': self.id,
            'content': self.content,
            'type': self.type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_artwork and self.artwork:
            data['artwork'] = self.artwork.to_dict(include_user=True)
            
        return data
    
    def __repr__(self):
        return f'<Reflection {self.id}>'