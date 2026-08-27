from app import db
from datetime import datetime
import uuid


class ChatMessage(db.Model):
    """
    Persisted chat turns for the M3-03 chat feature.

    Scoped to (user_id, artwork_id): artwork_id is set when the message
    belongs to a conversation about a specific artwork, and NULL for the
    identity-level conversation (no artwork context). Each row is one turn
    (role='user' or role='assistant') so history can be replayed in order.
    """
    __tablename__ = 'chat_messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    artwork_id = db.Column(db.String(36), db.ForeignKey('artworks.id', ondelete='CASCADE'), nullable=True)
    role = db.Column(db.String(20), nullable=False)  # 'user' | 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.Index('ix_chat_messages_user_artwork_created', 'user_id', 'artwork_id', 'created_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'artwork_id': self.artwork_id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<ChatMessage {self.id} {self.role}>'
