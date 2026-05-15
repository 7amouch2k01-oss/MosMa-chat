# MosMA Chat - How to Create and Run Local Server

## 🚀 Quick Start (Easiest Way)

### Option A: Double-Click to Run
1. Navigate to the chat application folder
2. **Double-click `START.bat`** - It's that simple!
3. Browser opens automatically at http://localhost:3000
4. Press Ctrl+C to stop when done

### Option B: Silent Launch
1. **Double-click `launch.vbs`** 
2. No console window appears
3. Browser opens automatically

---

## 📋 System Requirements

Before you can run the server, you need:

### 1. Node.js (Required)
- **Download:** https://nodejs.org/
- **Version:** Choose LTS (14.x or higher)
- **Installation:** Use default settings
- **Verify:** Open Command Prompt and type `node --version`

### 2. MongoDB (Optional but Recommended)
- **Download:** https://www.mongodb.com/try/download/community
- **OR** use a cloud MongoDB (Atlas)
- **OR** configure `.env` to use your database connection

---

## 🎯 Available Launchers

| File | Purpose | Best For | Double-Click? |
|------|---------|----------|---------------|
| **START.bat** | Colorful console launcher | Most users | ✅ Yes |
| **launch.vbs** | Silent launcher | Clean desktop | ✅ Yes |
| **RUN.bat** | Simple launcher | Testing | ✅ Yes |
| **start-server.bat** | Dev with full logs | Debugging | ✅ Yes |
| **start-production.bat** | Production build | Performance | ✅ Yes |

---

## 🛠️ How to Convert BAT to EXE (Create .exe File)

### Method 1: Free Online Converter (Easiest)
1. Visit: https://www.online-convert.com/
2. Upload `START.bat`
3. Download `.exe` file
4. Double-click to run

### Method 2: Free BAT to EXE Converter
1. Download: https://bat-to-exe-converter.en.softonic.com/
2. Open the program
3. Load `START.bat` file
4. Click "Convert"
5. Get `START.exe`

### Method 3: Professional with Icon/Installer
1. Download BAT2EXE: https://www.f2ko.de/en/b2e
2. Load `START.bat`
3. Set icon (optional)
4. Convert to EXE
5. Option to create installer

### Method 4: Using Command Line (Advanced)
```bash
# Install pkg globally
npm install -g pkg

# Convert to EXE
pkg start-app.js -o MosMA-Chat.exe --targets win

# Result: MosMA-Chat.exe is created
```

---

## 📝 Setup Instructions (First Time)

### Step 1: Install Node.js
- Download from https://nodejs.org/ (LTS version)
- Run installer with default settings
- Restart your computer (recommended)

### Step 2: Open Command Prompt
- Press `Win+R`
- Type `cmd` and press Enter

### Step 3: Navigate to Project
```batch
cd "C:\Users\YourName\OneDrive\Desktop\chat application"
```

### Step 4: Run the Launcher
```batch
START.bat
```

Or just double-click `START.bat` in Windows Explorer!

---

## 🎮 Running the Application

### Method 1: Simple (Recommended)
1. Double-click **`START.bat`**
2. Wait for browser to open
3. Application loads at http://localhost:3000

### Method 2: No Console Window
1. Double-click **`launch.vbs`**
2. Browser opens automatically
3. Server runs silently

### Method 3: Development Mode (Full Logs)
1. Double-click **`start-server.bat`**
2. See all debug information
3. Perfect for development

### Method 4: Production (Optimized)
1. Double-click **`start-production.bat`**
2. First run builds the app (2-5 minutes)
3. Fastest performance afterward

---

## 🌐 Accessing Your Application

Once running, access the app at:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Socket.io:** ws://localhost:5000

### In Browser
- Open any web browser
- Type: `http://localhost:3000`
- Press Enter

---

## ⚙️ Configuration (Optional)

Create or edit `.env` file in project root:

```env
# Server Settings
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mosma

# JWT Secret
JWT_SECRET=your-super-secret-key-change-this

# Frontend URL
VITE_API_URL=http://localhost:5000
```

---

## 🔧 Troubleshooting

### "Node.js not found"
**Solution:**
- Install Node.js from https://nodejs.org/
- Restart your computer
- Run launcher again

### "Port 3000 already in use"
**Solution:**
- Stop other applications using port 3000
- Or edit `package.json` to use different port
- Or close and reopen launcher

### "Cannot connect to MongoDB"
**Solution:**
- Install MongoDB locally, OR
- Update `.env` with correct connection string, OR
- Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### "npm ERR! cannot find module"
**Solution:**
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run launcher again

### "Permission denied"
**Solution (Windows):**
- Right-click `START.bat`
- Select "Run as Administrator"

---

## 📋 What Each Launcher Does

### START.bat (Recommended)
```
✓ Checks for Node.js
✓ Installs dependencies
✓ Shows colored output
✓ Auto-opens browser
✓ Shows server logs
✓ Easy to use
```

### launch.vbs
```
✓ No console window
✓ Silent operation
✓ Auto-opens browser
✓ Professional look
✗ Harder to troubleshoot
```

### start-production.bat
```
✓ Optimized performance
✓ Production build
✓ Single port
✗ First run slower
✗ No hot reload
```

---

## 🎯 Creating a Shortcut on Desktop

### For .bat file:
1. Right-click `START.bat`
2. Select "Send to" > "Desktop (create shortcut)"
3. Now you can launch from desktop

### For .exe file:
1. Right-click `.exe` file
2. Select "Create shortcut"
3. Move to desktop

### For Quick Launch:
1. Add to Windows Start Menu
2. Pin to Taskbar
3. Create Windows Shortcut

---

## 📚 Project Structure

```
chat-application/
├── server.js              # Backend server
├── package.json           # Node dependencies
├── START.bat              # ← Run this!
├── launch.vbs             # ← Or this!
├── client/                # Frontend React app
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── .env                   # Configuration
```

---

## 🛑 Stopping the Server

To stop the application:

**If console visible:** Press `Ctrl+C` in the console window

**If using .vbs:** 
- Open Task Manager (Ctrl+Shift+Esc)
- Find "node.exe"
- Right-click and "End task"

---

## ✅ Verification Checklist

- [ ] Node.js installed (`node --version` works)
- [ ] npm available (`npm --version` works)
- [ ] Project folder accessible
- [ ] `.env` file configured (optional)
- [ ] Port 3000 not in use
- [ ] Port 5000 not in use
- [ ] MongoDB running or configured (if needed)

---

## 🚀 Pro Tips

1. **Auto-start on Windows boot:**
   - Create shortcut in `shell:startup` folder
   - App launches when you login

2. **Create desktop icon:**
   - Right-click `START.bat`
   - "Create shortcut"
   - Move to desktop

3. **Change to different port:**
   - Edit `START.bat`
   - Change `3000` to your desired port

4. **Access from other computers:**
   - Get your IP: `ipconfig` in Command Prompt
   - Use: `http://YOUR_IP:3000`
   - Make sure firewall allows connection

5. **Keep logs:**
   - Server logs go to `server.log` file
   - Check for errors there

---

## 📞 Support

If you encounter issues:

1. Check the console output for error messages
2. Verify Node.js is installed
3. Check `.env` configuration
4. Make sure ports aren't blocked
5. Review the README.md file

---

## 🎉 You're All Set!

The fastest way to run your application:
```
Double-click START.bat
```

That's it! 🚀

---

**Version:** 1.0.0  
**App:** MosMA Chat Application  
**Last Updated:** 2026-05-13  
**Difficulty:** ⭐ Easy
