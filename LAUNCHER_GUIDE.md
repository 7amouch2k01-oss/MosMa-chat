# MosMA Chat - Local Server Launcher Guide

## Quick Start

### Option 1: Simple BAT File (Recommended for Quick Testing)
**File:** `RUN.bat`
- Double-click to run
- Automatically opens browser at http://localhost:3000
- Shows console with server logs
- Press Ctrl+C to stop

### Option 2: VBS Launcher (Hidden Console)
**File:** `launch.vbs`
- Double-click to run
- No console window visible
- Automatically opens browser
- Runs silently in background

### Option 3: Development Mode (Full Logs)
**File:** `start-server.bat`
- Shows full development logs
- Hot reload enabled for code changes
- Better for debugging

### Option 4: Production Mode (Optimized)
**File:** `start-production.bat`
- Builds optimized production version
- Better performance
- First run takes longer (builds the app)
- Subsequent runs are instant

## System Requirements

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Choose "LTS" version
   - Install with default settings

2. **MongoDB** (local instance for full functionality)
   - Download from: https://www.mongodb.com/try/download/community
   - Or use the `.env` file to connect to remote database

## How to Convert BAT to EXE

### Method 1: Using Bat to Exe Converter (Easy, Free)
1. Download: https://bat-to-exe-converter.en.softonic.com/
2. Open the BAT file with the converter
3. Click "Convert" button
4. Set icon if desired
5. Save as EXE

### Method 2: Using `pkg` (Advanced, Professional)
```bash
npm install -g pkg
pkg RUN.bat -o MosMA-Chat.exe
```

### Method 3: Using NSIS (Create Professional Installer)
1. Download NSIS: https://nsis.sourceforge.io/
2. Create setup script
3. Build installer

## What Each Launcher Does

### 1. **RUN.bat** (Recommended)
```
✓ Easy to use - just double-click
✓ Auto-installs dependencies
✓ Opens browser automatically
✓ Shows helpful console output
✓ Good for testing
✗ Console window stays visible
```

### 2. **launch.vbs** (Silent)
```
✓ No console window
✓ Professional appearance
✓ Auto-opens browser
✓ Quiet operation
✗ Less feedback during startup
✗ Harder to diagnose issues
```

### 3. **start-server.bat** (Development)
```
✓ Full debug information
✓ Shows server logs
✓ Useful for development
✗ Verbose output
```

### 4. **start-production.bat** (Deployment)
```
✓ Optimized performance
✓ Production build
✓ Single port (no dev server)
✗ First run slower (builds frontend)
```

## Default Ports

- **Frontend (React Dev):** http://localhost:3000
- **Frontend (Production):** http://localhost:5000
- **Backend API:** http://localhost:5000 (production) or dynamic (dev)
- **Socket.io:** Same as backend

## Troubleshooting

### "Node.js not found"
- Install Node.js from https://nodejs.org/
- Restart the launcher

### "Port 3000 already in use"
- Stop other applications using port 3000
- Or modify `start-server.bat` to use different port

### "MongoDB connection error"
- Install MongoDB or update `.env` with correct connection string
- Check the `.env.example` file for configuration

### "npm ERR! cannot find module"
- Delete `node_modules` and `package-lock.json`
- Run launcher again to reinstall

### "Cannot open browser"
- Manually open http://localhost:3000 in your browser
- Check firewall settings

## File Descriptions

| File | Purpose | Use Case |
|------|---------|----------|
| `RUN.bat` | Quick start | Daily use, testing |
| `launch.vbs` | Silent launcher | Professional, clean |
| `start-server.bat` | Dev server | Development |
| `start-production.bat` | Production server | Deployment |

## Environment Variables

The app uses a `.env` file for configuration. Create one based on `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mosma
NODE_ENV=development
```

## Security Notes

- Don't share your `.env` file (contains secrets)
- Don't commit `.env` to version control
- Use environment variables for sensitive data
- Change default secrets in production

## Advanced Usage

### Running on Different Port
Edit the BAT file and change:
```batch
set "PORT=3000"
```

### Disable Browser Auto-Open
Comment out or remove this line:
```batch
start http://localhost:3000
```

### Add to Windows Startup
1. Press `Win+R`
2. Type: `shell:startup`
3. Create shortcut to `RUN.bat` or `launch.vbs`
4. Place in Startup folder

## Support

For issues or questions:
1. Check the console output for error messages
2. Review the `.env` configuration
3. Verify Node.js installation
4. Check that ports aren't in use

---

## Quick Reference

```
Run Development: Double-click RUN.bat
Run Silent:      Double-click launch.vbs
Run Production:  Double-click start-production.bat
Stop Server:     Press Ctrl+C in console
Access App:      Open http://localhost:3000
```

---
**Version:** 1.0.0
**Last Updated:** 2026-05-13
**App:** MosMA Chat Application
