#!/usr/bin/env python3
"""
Quick setup script for Collector Identity
"""

import os
import subprocess
import sys
import shutil

def run_command(command, description, path=None):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        if path:
            result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True, cwd=path)
        else:
            result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Error: {e.stderr}")
        return False

def main():
    print("🎨 Setting up Collector Identity")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists('backend-flask') or not os.path.exists('frontend'):
        print("❌ Please run this script from the project root directory.")
        sys.exit(1)
    
    # Setup backend environment
    env_file = 'backend-flask/.env'
    env_example = 'backend-flask/.env.example'
    
    if not os.path.exists(env_file) and os.path.exists(env_example):
        print("📋 Creating .env file from template...")
        shutil.copy(env_example, env_file)
        print("✅ .env file created. Please update with your settings.")
    
    # Install Python dependencies
    print("\n🐍 Setting up Flask backend...")
    if not run_command('pip install -r requirements.txt', 'Installing Python dependencies', 'backend-flask'):
        print("💡 Try using: python -m pip install -r requirements.txt")
        return False
    
    # Initialize database
    if not run_command('python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print(\'Database initialized\')"', 'Initializing database', 'backend-flask'):
        return False
    
    # Install Node.js dependencies
    print("\n⚛️ Setting up React frontend...")
    if not run_command('npm install', 'Installing Node.js dependencies', 'frontend'):
        return False
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Start MinIO: docker-compose up minio -d")
    print("2. Start Flask backend: cd backend-flask && python run.py")
    print("3. Start React frontend: cd frontend && npm run dev")
    print("\n🌐 Your app will be available at the frontend URL shown by Vite")

if __name__ == '__main__':
    main()