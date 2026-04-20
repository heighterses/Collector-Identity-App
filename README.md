# Collector Identity

> A minimal, Pinterest-inspired web application for art collectors to upload artwork and create reflections.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0+-green.svg)

## ✨ Features

- **🎨 Minimal Design**: Clean, Pinterest-inspired interface with no visual clutter
- **📱 Responsive**: Mobile-first design that works on all devices  
- **🔄 Collapsible Sidebar**: Navigation that expands/collapses to maximize content space
- **🖼️ Artwork Upload**: Upload and manage your art collection
- **💭 Reflections**: Create thoughtful reflections on your artwork
- **🔐 Authentication**: Secure user accounts with JWT
- **☁️ Cloud Storage**: S3-compatible file storage with MinIO

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/collector-identity.git
   cd collector-identity
   ```

2. **Run setup script**
   ```bash
   python setup.py
   ```

3. **Start services**
   ```bash
   # Start MinIO (file storage)
   docker-compose up minio -d
   
   # Start Flask backend
   cd backend-flask
   python run.py
   
   # Start React frontend (new terminal)
   cd frontend
   npm install chart.js react-chartjs-2
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:3003
   - Backend API: http://localhost:3001
   - MinIO Console: http://localhost:9001

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Flask Backend │    │   MinIO Storage │
│   (Port 3003)   │◄──►│   (Port 3001)   │◄──►│   (Port 9000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **Frontend**: React with Vite, minimal design system
- **Backend**: Flask with SQLAlchemy, JWT authentication
- **Storage**: MinIO (S3-compatible) for artwork files
- **Database**: SQLite (development), easily configurable for production

## 🎨 Design System

### Visual Principles
- **Minimal**: Clean interface focused on content
- **Pinterest-like**: Generous white space and balanced proportions
- **Responsive**: Mobile-first approach with collapsible navigation
- **Accessible**: High contrast and readable typography

### Color Palette
- **Primary**: Clean grays and whites
- **Accent**: Subtle blue for interactive elements
- **Typography**: High contrast for optimal readability

## 📁 Project Structure

```
collector-identity/
├── backend-flask/           # Flask API backend
│   ├── app/                # Application modules
│   │   ├── models/         # Database models (User, Artwork, Reflection)
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (S3, Reflections)
│   │   └── middleware/     # Authentication middleware
│   ├── config.py          # Configuration management
│   └── run.py             # Application entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── styles.css     # Minimal design system
│   └── vite.config.js     # Build configuration
├── docker-compose.yml      # Docker services
└── setup.py               # Quick setup script
```

## 🔧 Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development instructions.


### Key Commands
```bash
# Setup project
python setup.py

# Backend development
cd backend-flask && python run.py

# Frontend development  
cd frontend && npm run dev

# Docker deployment
docker-compose up -d
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/signup` | User registration |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/artwork` | Upload artwork |
| `GET` | `/api/artwork/mine` | Get user's artwork |
| `POST` | `/api/reflection` | Create reflection |
| `GET` | `/api/reflection/mine` | Get user's reflection |

## 🚢 Deployment

### Docker (Recommended)
```bash
docker-compose up -d
```

### Manual Deployment
1. Set production environment variables
2. Build frontend: `cd frontend && npm run build`
3. Configure reverse proxy (nginx)
4. Start Flask with production WSGI server


   ## AI Setup
Install Ollama:
https://ollama.com

Pull model:
ollama pull gemma:2b


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `python -m pytest` (backend), `npm test` (frontend)
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Pinterest's clean, minimal design
- Built with Flask, React, and modern web technologies
- Uses MinIO for S3-compatible object storage

---

**Made with ❤️ for art collectors**
