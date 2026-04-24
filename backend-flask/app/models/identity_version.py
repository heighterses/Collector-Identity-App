from app import db
from datetime import datetime
import uuid


class IdentityVersion(db.Model):
    """
    M2-03: Stores full snapshots of identity traits at a point in time.
    Each version is immutable - never overwritten.
    """
    __tablename__ = 'identity_versions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = db.Column(
        db.String(36),
        db.ForeignKey('identity_templates.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    version_number = db.Column(db.Integer, nullable=False)
    snapshot_json = db.Column(db.JSON, nullable=False)  # full trait snapshot
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'template_id': self.template_id,
            'version_number': self.version_number,
            'snapshot_json': self.snapshot_json,
            'created_at': self.created_at.isoformat() + "Z"
        }

    def __repr__(self):
        return f'<IdentityVersion template={self.template_id} v={self.version_number}>'
