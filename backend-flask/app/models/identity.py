from app import db
from datetime import datetime
import uuid


class IdentityTemplate(db.Model):
    """
    M2-01: Represents a user's current identity template
    generated from their reflections and artwork.

    Now supports versioning.
    """
    __tablename__ = 'identity_templates'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    artwork_id = db.Column(db.String(36), db.ForeignKey('artworks.id', ondelete='SET NULL'), nullable=True)

    # 🔥 EXISTING (DO NOT TOUCH)
    version = db.Column(db.Integer, default=1, nullable=False)

    # 🔥 NEW (ML BACKBONE — ONLY ADDITION)
    embedding = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships (UNCHANGED)
    traits = db.relationship(
        'IdentityTrait',
        backref='template',
        lazy=True,
        cascade='all, delete-orphan',
        order_by='IdentityTrait.position'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'artwork_id': self.artwork_id,
            'version': self.version,  # 🔥 KEEP
            'embedding': self.embedding,  # 🔥 NEW
            'traits': [t.to_dict() for t in self.traits],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<IdentityTemplate user={self.user_id} v={self.version}>'


class IdentityTrait(db.Model):
    """
    M2-01: Individual trait within an identity template.

    trait_type options:
      - 'slider' → numeric value 0-10
      - 'chip'   → boolean true/false
      - 'text'   → free text
    """
    __tablename__ = 'identity_traits'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    template_id = db.Column(
        db.String(36),
        db.ForeignKey('identity_templates.id', ondelete='CASCADE'),
        nullable=False
    )

    # 🔥 ALL ORIGINAL FIELDS PRESERVED
    label = db.Column(db.String(255), nullable=False)
    value = db.Column(db.String(500), nullable=True)
    trait_type = db.Column(db.String(10), nullable=False)

    position = db.Column(db.Integer, default=0, nullable=False)
    ai_generated = db.Column(db.Boolean, default=True, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'template_id': self.template_id,
            'label': self.label,
            'value': self.value,
            'trait_type': self.trait_type,
            'position': self.position,
            'ai_generated': self.ai_generated,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<IdentityTrait {self.label} ({self.trait_type})>'