# 🏆 Goal Counter - Complete Setup Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Hardware Requirements](#hardware-requirements)
3. [Software Requirements](#software-requirements)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [ESP32 Arduino Setup](#esp32-arduino-setup)
7. [IR Sensor Wiring](#ir-sensor-wiring)
8. [Running the Project](#running-the-project)
9. [API Endpoints](#api-endpoints)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

This is a complete IoT goal counter system with:
- **ESP32** microcontroller with IR sensors detecting goals
- **Node.js/Express** backend API with MongoDB database
- **React** frontend UI showing live scores
- Real-time updates every 1 second

---

## 🔧 Hardware Requirements

### ESP32 Board
- ESP32 DevKit (any variant)
- USB cable for programming

### IR Sensors
- 2x IR Obstacle Avoidance Sensors
- Operating Voltage: 3.3V-5V
- Detection Range: 2-30cm

### Additional Components
- Jumper wires
- Breadboard (optional)
- Power supply for ESP32

---

## 💻 Software Requirements

### For Backend & Frontend
- **Node.js** v16+ ([Download](https://nodejs.org/))
- **MongoDB Atlas** account (free tier) or local MongoDB
- **VS Code** or any code editor

### For ESP32 Programming
- **Arduino IDE 2.x** ([Download](https://www.arduino.cc/en/software))
  OR
- **VS Code** with PlatformIO extension

---

## 🗄️ Backend Setup

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Configure MongoDB
The database is already configured in `server/config/db.js` with MongoDB Atlas.

If you want to use your own MongoDB:
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `server/config/db.js` with your connection string

### Step 3: Start Backend Server
```bash
cd server
npm start
```

You should see:
```
Server running on port 5001
✅ MongoDB Connected
```

### Step 4: Seed Database (First Time Only)
```bash
curl -X POST http://localhost:5001/api/goals
```

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies
```bash
cd client
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

You should see:
```
VITE ready in XX ms
➜  Local:   http://localhost:5173/
```

### Step 3: Open in Browser
Navigate to `http://localhost:5173` (or the port shown)

---

## 🤖 ESP32 Arduino Setup

### Option A: Using Arduino IDE 2.x

#### 1. Install Arduino IDE
Download from: https://www.arduino.cc/en/software

#### 2. Add ESP32 Board Support
1. Open Arduino IDE
2. Go to **File** → **Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**
5. Go to **Tools** → **Board** → **Boards Manager**
6. Search for "esp32"
7. Install **"esp32 by Espressif Systems"** (version 2.0.0 or higher)

#### 3. Select Your Board
1. Go to **Tools** → **Board** → **ESP32 Arduino**
2. Select your board (e.g., "ESP32 Dev Module" or "DOIT ESP32 DEVKIT V1")

#### 4. Install Required Libraries
No external libraries needed! `WiFi.h` and `HTTPClient.h` come with ESP32 board support.

#### 5. Configure the Sketch
1. Open `esp32_arduino/esp32_ir_sensor_post/esp32_ir_sensor_post.ino`
2. Update these lines:

```cpp
const char* ssid = "Redmi 12C";          // ✅ Your WiFi name
const char* password = "12345678a";      // ✅ Your WiFi password
const char* serverUrl = "http://172.21.197.123:5001/api/goals/update"; // ✅ Your server IP
```

**To find your server IP:**
```bash
# On Mac:
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows:
ipconfig

# On Linux:
ip addr show
```

Look for IP like `192.168.x.x` or `172.x.x.x`

#### 6. Upload to ESP32
1. Connect ESP32 via USB
2. Select the correct port: **Tools** → **Port** → (select your ESP32 port)
   - Mac: `/dev/cu.usbserial-*` or `/dev/cu.SLAB_USBtoUART`
   - Windows: `COM3`, `COM4`, etc.
3. Click **Upload** button (→)
4. Wait for "Done uploading"

#### 7. Monitor Serial Output
1. Click **Tools** → **Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   ```
   --- IR Sensor Goal Counter Started ---
   Connecting to WiFi: Redmi 12C
   WiFi Connected!
   ESP32 Local IP Address: 192.168.x.x
   Server Target URL: http://172.21.197.123:5001/api/goals/update
   ```

---

### Option B: Using VS Code with PlatformIO

#### 1. Install PlatformIO Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search "PlatformIO IDE"
4. Click Install

#### 2. Open Project
1. Click PlatformIO icon in sidebar
2. **Open** → **Add Existing**
3. Select `esp32_arduino/esp32_ir_sensor_post` folder

#### 3. Configure platformio.ini
Create `platformio.ini` in `esp32_ir_sensor_post/`:
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
```

#### 4. Build and Upload
1. Update WiFi and server URL in `.ino` file
2. Click **Upload** in PlatformIO toolbar
3. Click **Serial Monitor** to view output

---

## 🔌 IR Sensor Wiring

### IR Sensor Pinout
Each IR sensor has 3 pins:
- **VCC** → 5V or 3.3V
- **GND** → Ground
- **OUT** → Digital signal (HIGH when no obstacle, LOW when detected)

### Wiring Diagram

#### Team A Sensor (GPIO 25)
```
IR Sensor 1          ESP32
-----------          -----
VCC       →          5V (or 3.3V)
GND       →          GND
OUT       →          GPIO 25
```

#### Team B Sensor (GPIO 26)
```
IR Sensor 2          ESP32
-----------          -----
VCC       →          5V (or 3.3V)
GND       →          GND
OUT       →          GPIO 26
```

### Visual Wiring Guide
```
                    ESP32 DevKit
                    ┌─────────┐
                    │   USB   │
                    │ ┌─────┐ │
        3V3  ●──────┤ │     │ ├──────●  GND
        GND  ●──────┤ │     │ ├──────●  GPIO 23
 Team B OUT  ●──────┤ │ESP32│ ├──────●  GPIO 22
    (GPIO26) ●──────┤ │     │ ├──────●  TX
 Team A OUT  ●──────┤ │     │ ├──────●  RX
    (GPIO25) ●──────┤ └─────┘ ├──────●  GPIO 21
         5V  ●──────┤         ├──────●  GPIO 19
                    └─────────┘
```

### Important Notes
- **Do NOT connect sensor VCC to ESP32 3.3V pin if sensor requires 5V**
- Use external 5V power if needed
- Ensure common ground between ESP32 and sensors
- Adjust sensor sensitivity using the potentiometer on sensor board

---

## ▶️ Running the Project

### Complete Startup Sequence

#### 1. Start MongoDB
If using local MongoDB:
```bash
# Mac (Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

#### 2. Start Backend Server
```bash
cd server
npm start
```
✅ Server should run on `http://localhost:5001`

#### 3. Reset Database (First Time)
```bash
curl -X POST http://localhost:5001/api/goals/reset
```

#### 4. Start Frontend
Open new terminal:
```bash
cd client
npm run dev
```
✅ UI should open on `http://localhost:5173`

#### 5. Power On ESP32
1. Upload code to ESP32
2. Connect to power
3. Wait for WiFi connection
4. Test by blocking IR sensors

### Testing the System

1. **Check UI**: Open browser to frontend URL
2. **Click START GAME button**: Resets scores to 0-0
3. **Block Team A sensor** (GPIO 25): Should see "GOAL A COUNTED!" in Serial Monitor
4. **Check UI**: Team A score should increment to 1
5. **Block Team B sensor** (GPIO 26): Should see "GOAL B COUNTED!"
6. **Check UI**: Team B score should increment to 1

---

## 🌐 API Endpoints

### GET /api/scores
Get current scores for all teams.

**Response:**
```json
[
  {
    "_id": "66f0d111000000000000000a",
    "name": "Team A",
    "score": 5
  },
  {
    "_id": "66f0d111000000000000000b",
    "name": "Team B",
    "score": 3
  }
]
```

### POST /api/goals/update
ESP32 posts goal here (automatic).

**Request Body:**
```json
{
  "team": "A"
}
```

**Response:**
```json
{
  "message": "Team A score updated!",
  "score": 6
}
```

### POST /api/goals/reset
Reset all scores to 0.

**Response:**
```json
{
  "message": "All scores reset to 0! Game ready to start! 🎮",
  "goals": [...]
}
```

### POST /api/goals
Seed/recreate initial team documents.

**Response:**
```json
{
  "message": "Initial goals created/reset",
  "goals": [...]
}
```

---

## 🔧 Troubleshooting

### Backend Issues

#### MongoDB Connection Failed
```
Error: querySrv ENOTFOUND cluster0.epphg.mongodb.net
```
**Solution:**
- Check internet connection
- Verify MongoDB Atlas connection string
- Ensure IP whitelist includes your IP (MongoDB Atlas → Network Access)
- Try using local MongoDB instead

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5001
```
**Solution:**
```bash
# Mac/Linux
lsof -ti:5001 | xargs kill -9

# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### Frontend Issues

#### Can't Connect to Backend
**Solution:**
- Ensure backend is running on port 5001
- Check `client/src/services/apiService.js` has correct URL
- Disable browser CORS extensions

#### UI Shows "No scores yet"
**Solution:**
1. Seed database:
   ```bash
   curl -X POST http://localhost:5001/api/goals/reset
   ```
2. Refresh browser
3. Check browser console for errors

### ESP32 Issues

#### WiFi Connection Failed
```
WiFi Connection Failed! Check SSID/Password or WiFi range.
```
**Solution:**
- Verify WiFi name (SSID) is correct
- Verify password is correct
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router

#### HTTP Error Code -1 or -118
```
Error on HTTP request. Code: -118
```
**Solution:**
- Server not running → Start backend server
- Wrong server IP → Update `serverUrl` in sketch
- Firewall blocking → Disable firewall temporarily
- Wrong port → Ensure port 5001 in URL

#### Upload Failed
```
Failed to connect to ESP32: Timed out waiting for packet header
```
**Solution:**
- Hold BOOT button while uploading
- Try different USB cable
- Install CP210x or CH340 drivers
- Select correct board and port

#### IR Sensor Not Triggering
**Solution:**
- Check wiring connections
- Adjust sensor sensitivity potentiometer
- Test sensor: LED should turn ON when obstacle detected
- Verify GPIO pins (25 and 26)
- Check Serial Monitor for detection messages

---

## 🎮 How to Use

### Starting a Game

1. **Open UI** in browser (http://localhost:5173)
2. **Click "START NEW GAME / RESET"** button
3. **Both teams start at 0-0**
4. **Place IR sensors** at goal positions
5. **When ball passes sensor**, goal is counted automatically!

### During Game

- **Scores update automatically** every 1 second
- **10-second cooldown** between goals (prevents double-counting)
- **Serial Monitor shows** each goal detection
- **UI displays** current scores in real-time

### Ending Game

- Scores are saved in database
- Click **START NEW GAME** to reset for next match

---

## 📊 Project Structure

```
goal-counter-app/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx    # Header component
│   │   │   └── ScoreDisplay.jsx  # Score display with bold team names
│   │   ├── services/
│   │   │   └── apiService.js # API calls to backend
│   │   ├── App.jsx           # Main app with START button
│   │   └── index.jsx
│   └── package.json
│
├── server/                    # Node.js Backend
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   └── goalController.js # API logic with reset function
│   ├── models/
│   │   └── Goal.js           # MongoDB schema
│   ├── routes/
│   │   └── goalRoutes.js     # API routes
│   ├── server.js             # Express server
│   └── package.json
│
└── esp32_arduino/            # ESP32 Firmware
    └── esp32_ir_sensor_post/
        └── esp32_ir_sensor_post.ino  # ESP32 code with WiFi "Redmi 12C"
```

---

## 🚀 Quick Start Commands

```bash
# Terminal 1 - Backend
cd server
npm install
npm start

# Terminal 2 - Frontend
cd client
npm install
npm run dev

# Terminal 3 - Reset Game
curl -X POST http://localhost:5001/api/goals/reset
```

---

## 📝 Configuration Checklist

- [ ] MongoDB connection working
- [ ] Backend running on port 5001
- [ ] Frontend running (port 5173 or shown port)
- [ ] ESP32 WiFi SSID updated to "Redmi 12C"
- [ ] ESP32 WiFi password updated
- [ ] ESP32 server URL has correct IP address
- [ ] IR sensors wired to GPIO 25 and GPIO 26
- [ ] Serial Monitor shows WiFi connected
- [ ] UI displays scores
- [ ] START button resets scores
- [ ] Goal detection working

---

## 🎉 Congratulations!

Your goal counter system is complete! Enjoy tracking goals in real-time! ⚽🏆

---

## 📞 Support

If you encounter issues:
1. Check Serial Monitor output (ESP32)
2. Check browser console (Frontend)
3. Check terminal output (Backend)
4. Review troubleshooting section above

**Happy Goal Counting! 🎯**
