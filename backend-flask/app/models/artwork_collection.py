from app import db
from datetime import datetime
import uuid

# Many-to-many link, no extra columns — an artwork can be in several
# collections and a collection holds several artworks. No sharing/social
# fields on purpose: collections are private, personal organization only.
artwork_collection_link = db.Table(
    'artwork_collection_link',
    db.Column('artwork_id', db.String(36), db.ForeignKey('artworks.id', ondelete='CASCADE'), primary_key=True),
    db.Column('collection_id', db.String(36), db.ForeignKey('artwork_collections.id', ondelete='CASCADE'), primary_key=True),
)


class ArtworkCollection(db.Model):
    """
    M3-16: A private grouping of the user's own artworks (e.g. "Bold
    colours", "Portraits"). Purely personal organization — no public/shared
    collections, no follower mechanics.
    """
    __tablename__ = 'artwork_collections'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    artworks = db.relationship(
        'Artwork',
        secondary=artwork_collection_link,
        backref=db.backref('collections', lazy=True),
        lazy=True,
    )

    def to_dict(self, include_artwork_ids=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() + "Z",
            'artwork_count': len(self.artworks),
        }
        if include_artwork_ids:
            data['artwork_ids'] = [a.id for a in self.artworks]
        return data

    def __repr__(self):
        return f'<ArtworkCollection {self.name}>'
