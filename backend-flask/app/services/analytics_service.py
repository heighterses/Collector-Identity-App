from datetime import datetime, timedelta
from sqlalchemy import func
from app import db
from app.models.user import User
from app.models.artwork import Artwork


class AnalyticsService:
    """
    M3-10: Return-behavior insight — do users come back and add a second
    (and third) artwork? Per CLAUDE.md Section 8, this tracks insight quality
    ("repeat artwork additions"), not activity/vanity metrics.
    """

    RETURN_WINDOW_DAYS = 30

    def get_return_behavior_stats(self):
        """
        Share of users who added 2+ artworks within RETURN_WINDOW_DAYS of
        their own signup. Only counts users whose signup is already at least
        that many days old — a user who joined yesterday hasn't had a fair
        chance to hit the window yet, and including them would understate
        the metric.

        Entirely computed in SQL (COUNT/GROUP BY/HAVING) — no per-row
        artwork/user objects are loaded into Python memory.
        """
        cutoff = datetime.utcnow() - timedelta(days=self.RETURN_WINDOW_DAYS)

        eligible_users = db.session.query(func.count(User.id)).filter(
            User.created_at <= cutoff
        ).scalar() or 0

        if eligible_users == 0:
            return {
                'eligible_users': 0,
                'users_with_2plus_in_window': 0,
                'share_2plus_in_window': None,
                'window_days': self.RETURN_WINDOW_DAYS,
            }

        window_end = func.datetime(User.created_at, f'+{self.RETURN_WINDOW_DAYS} days')

        repeat_user_subquery = (
            db.session.query(Artwork.user_id)
            .join(User, User.id == Artwork.user_id)
            .filter(User.created_at <= cutoff)
            .filter(Artwork.created_at <= window_end)
            .group_by(Artwork.user_id)
            .having(func.count(Artwork.id) >= 2)
            .subquery()
        )
        users_with_2plus = db.session.query(
            func.count()
        ).select_from(repeat_user_subquery).scalar() or 0

        return {
            'eligible_users': eligible_users,
            'users_with_2plus_in_window': users_with_2plus,
            'share_2plus_in_window': round(users_with_2plus / eligible_users, 4),
            'window_days': self.RETURN_WINDOW_DAYS,
        }


analytics_service = AnalyticsService()
