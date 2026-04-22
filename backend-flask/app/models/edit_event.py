from app import db
import uuid
from datetime import datetime

class EditEvent(db.Model):
    __tablename__ = "edit_events"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36))
    trait_label = db.Column(db.String(255))
    action = db.Column(db.String(50))  # accept / reject / modify
    created_at = db.Column(db.DateTime, default=datetime.utcnow)