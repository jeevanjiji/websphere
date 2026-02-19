# WebSphere Development Scripts

## Quick Start Commands

### Start Development Environment
```bash
# Double-click or run:
start-dev.bat
```

This will:
- Kill any existing Node.js processes
- Start the backend server (`cd backend; npm start`)
- Start the frontend dev server (`cd frontend; npm run dev`)
- Open both in separate terminal windows

### Stop Development Environment
```bash
# Double-click or run:
stop-dev.bat
```

This will stop all Node.js processes.

## Manual Commands (if needed)

### Backend
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm run dev
# Development server runs on http://localhost:3000
```

## URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs (if Swagger is enabled)

## Notes
- The batch scripts work on Windows
- Both servers run in separate terminal windows so you can see their logs
- Use `stop-dev.bat` to cleanly shut down both servers