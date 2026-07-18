from app import db
from datetime import datetime
import uuid


class IdentityNote(db.Model):
    """
    M3-15: A short personal annotation attached to a saved identity version.

    Deliberately separate from IdentityTemplate/IdentityTrait — notes are
    metadata about a moment, never identity input. They are never read by
    identity_service, pattern_service, or any prompt-building code, and must
    stay that way: this is free-form text, and CLAUDE.md's edit discipline
    explicitly forbids free-form journaling as identity input. Create and
    delete only — no update/edit route exists on purpose.
    """
    __tablename__ = 'identity_notes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    identity_version_id = db.Column(
        db.String(36),
        db.ForeignKey('identity_versions.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    note_text = db.Column(db.String(280), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'identity_version_id': self.identity_version_id,
            'note_text': self.note_text,
            'created_at': self.created_at.isoformat() + "Z",
        }

    def __repr__(self):
        return f'<IdentityNote {self.id} on version={self.identity_version_id}>'
