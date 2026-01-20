# Development Guide

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <your-repo-url>
   cd collector-identity
   python setup.py
   ```

2. **Start Development Servers**
   ```bash
   # Terminal 1: Start MinIO
   docker-compose up minio -d
   
   # Terminal 2: Start Flask Backend
   cd backend-flask
   python run.py
   
   # Terminal 3: Start React Frontend
   cd frontend
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:3003 (or next available port)
   - Backend API: http://localhost:3001
   - MinIO Console: http://localhost:9001

## Project Structure

```
collector-identity/
├── backend-flask/           # Flask API backend
│   ├── app/                # Application modules
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth middleware
│   ├── config.py          # Configuration
│   ├── run.py             # Application entry point
│   └── requirements.txt   # Python dependencies
├── frontend/               # React frontend
│   ├── src/               # Source code
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   └── styles.css     # Global styles
│   ├── package.json       # Node.js dependencies
│   └── vite.config.js     # Vite configuration
├── docker-compose.yml      # Docker services
└── setup.py               # Quick setup script
```

## Development Workflow

### Backend Development
- Flask app with auto-reload enabled
- SQLite database (created automatically)
- API endpoints under `/api/`
- Logs in `backend-flask/logs/`

### Frontend Development
- React with Vite (fast HMR)
- Proxy setup for API calls
- Minimal design system
- Mobile-responsive layout

### Database Changes
- Models in `backend-flask/app/models/`
- Migrations handled by Flask-Migrate
- Reset database: delete `instance/dev.db` and restart

### Adding New Features
1. Backend: Add routes in `app/routes/`
2. Frontend: Add components in `src/components/` or `src/pages/`
3. Update API calls in `src/api.js`

## Environment Variables

Copy `.env.example` to `.env` in backend-flask/ and update:
- `JWT_SECRET`: Change for production
- `S3_*`: MinIO/S3 configuration
- `DATABASE_URL`: Database connection

## Deployment

### Docker
```bash
docker-compose up -d
```

### Manual
1. Set environment variables
2. Install dependencies
3. Initialize database
4. Build frontend: `npm run build`
5. Start services

## Troubleshooting

### Port Conflicts
- Frontend auto-selects next available port
- Backend uses port 3001 (configurable)
- MinIO uses ports 9000/9001

### Database Issues
- Delete `instance/dev.db` to reset
- Check logs in `backend-flask/logs/`

### File Upload Issues
- Ensure MinIO is running
- Check S3 configuration in `.env`