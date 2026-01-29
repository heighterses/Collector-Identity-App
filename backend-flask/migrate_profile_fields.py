#!/usr/bin/env python3
"""
Migration script to add profile fields to User table
Run this once to update the database schema
"""

from app import create_app, db
from app.models.user import User
from sqlalchemy import text

def migrate_profile_fields():
    app = create_app()
    
    with app.app_context():
        try:
            # Add new columns to users table (SQLite requires separate ALTER statements)
            with db.engine.connect() as conn:
                # Add avatar_url column
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)"))
                    print("✅ Added avatar_url column")
                except Exception as e:
                    if "duplicate column name" in str(e).lower():
                        print("ℹ️  avatar_url column already exists")
                    else:
                        raise
                
                # Add language column
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en' NOT NULL"))
                    print("✅ Added language column")
                except Exception as e:
                    if "duplicate column name" in str(e).lower():
                        print("ℹ️  language column already exists")
                    else:
                        raise
                
                # Add timezone column
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL"))
                    print("✅ Added timezone column")
                except Exception as e:
                    if "duplicate column name" in str(e).lower():
                        print("ℹ️  timezone column already exists")
                    else:
                        raise
                
                conn.commit()
            
            print("✅ Successfully completed profile fields migration")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            raise

if __name__ == '__main__':
    migrate_profile_fields()