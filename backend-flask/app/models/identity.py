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

    # 🔥 ADD THIS (fixes your earlier crash)
    version = db.Column(db.Integer, default=1, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
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
            'version': self.version,  # 🔥 include version
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


class EditEvent(db.Model):
    """
    M2-04: Tracks committed changes to identity traits.
    Logs create, update, and delete actions only.
    """
    __tablename__ = 'edit_events'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = db.Column(
        db.String(36),
        db.ForeignKey('identity_templates.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    trait_id = db.Column(
        db.String(36),
        db.ForeignKey('identity_traits.id', ondelete='SET NULL'),
        nullable=True,
        index=True
    )
    user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    event_type = db.Column(db.String(20), nullable=False)  # create_trait | update_value | delete_trait
    old_value = db.Column(db.Text, nullable=True)
    new_value = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.CheckConstraint(
            "event_type IN ('create_trait', 'update_value', 'delete_trait')",
            name='valid_event_type'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'template_id': self.template_id,
            'trait_id': self.trait_id,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<EditEvent {self.event_type} trait={self.trait_id}>'


def log_edit_event(db_session, template_id, user_id, event_type, trait_id=None, old_value=None, new_value=None):
    """
    Helper to log a committed edit event.
    Call this from route/service logic after a change is persisted.
    Do NOT call db.session.commit() here - caller is responsible for committing.

    Args:
        db_session: SQLAlchemy db.session
        template_id: ID of the IdentityTemplate
        user_id: ID of the user making the change
        event_type: 'create_trait' | 'update_value' | 'delete_trait'
        trait_id: ID of the affected IdentityTrait
        old_value: Previous value as string (nullable)
        new_value: New value as string (nullable)

    Returns:
        EditEvent instance or None if event was skipped
    """
    # Normalize values to strings for comparison
    old_str = str(old_value) if old_value is not None else None
    new_str = str(new_value) if new_value is not None else None

    # Skip useless events where nothing changed
    if event_type == 'update_value' and old_str == new_str:
        return None

    # update_value must always have a trait_id
    if event_type == 'update_value' and not trait_id:
        raise ValueError("update_value events must have a trait_id")

    event = EditEvent(
        template_id=template_id,
        trait_id=trait_id,
        user_id=user_id,
        event_type=event_type,
        old_value=old_str,
        new_value=new_str
    )
    db_session.add(event)
    return event
