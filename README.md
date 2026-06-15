# Focus-Flow: Quick Start Guide

Focus-Flow is a minimalist, privacy-first hardware monitor for your Chrome browser. Monitor CPU, RAM, temperature, and services—all locally.

---

## 🎯 Features

- ✅ **Real-time monitoring**: CPU, Memory, Temperature, Disk
- ✅ **Service detection**: Automatically identifies Docker, Redis, PostgreSQL, Node.js, etc.
- ✅ **1-hour trends**: Canvas-rendered sparklines for performance visualization
- ✅ **Smart alerts**: Red badge when CPU > 85%, Temp > 75°C, Memory > 90%
- ✅ **100% local**: All data stays on your machine by default
- ✅ **Optional insights**: Help improve Focus-Flow with anonymous aggregates (opt-in)
- ✅ **Free forever**: No premium features, no paywalls, no cloud required

---

## 🚀 Installation

### Prerequisites

- **Python 3.8+** (for the local agent)
- **Chrome/Chromium** (for the extension)
- **pip** (Python package manager)

### Step 1: Clone the Repository

````bash
git clone https://github.com/control-zdev/focus-flow.git
cd focus-flow
```plaintext

### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
````

### Step 3: Start the Local Agent

````bash
python agent.py
```plaintext

**Expected output:**

```plaintext
INFO:     Started server process
INFO:     Application startup complete [press ENTER to quit]
🔒 100% Free & Privacy-First
📊 Available at: http://localhost:5000
🔌 WebSocket: ws://localhost:5000/ws
📈 Metrics: http://localhost:5000/metrics
✅ Health: http://localhost:5000/health
🎯 Aggregate (opt-in): http://localhost:5000/aggregate-metrics
````

### Step 4: Install the Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `extension/` folder from the cloned repo

Done! ✨

---

## 📖 Usage

### First Time Setup

1. Click the Focus-Flow icon in your toolbar.
2. You'll see the onboarding screen:

- **Help Improve Focus-Flow**: Share anonymous usage insights (opt-in)

- **Keep My Data Private**: No data sharing (all features work)

1. Choose your preference and continue.

The dashboard will load with live metrics.

### Dashboard Overview

```plaintext
┌─────────────────────────────────────┐
│  💻 MacBook             Status: ✓ OK │
├─────────────────────────────────────┤
│  CPU: 45%  │  Memory: 62%  │ Temp: 52°C │
├─────────────────────────────────────┤
│  CPU Trend (1 Hour)    Avg: 42%    │
│  [████░░░░░░░░░░░░░░░░] sparkline  │
├─────────────────────────────────────┤
│  Memory Trend (1 Hour) Avg: 58%    │
│  [██████░░░░░░░░░░░░░░] sparkline  │
├─────────────────────────────────────┤
│  🔌 Active Services                 │
│  ✓ Docker    Port 2375             │
│  ✓ Redis     Port 6379             │
│  ✓ Node.js   Running                │
├─────────────────────────────────────┤
│  ⚙️ Settings                         │
│  ☑ Share anonymous insights         │
│  Last synced: Never                 │
└─────────────────────────────────────┘
```

### Color Coding

- 🟢 Green: Everything normal (< 70%)
- 🟡 Yellow: Elevated (70-85%)
- 🟠 Orange: High (85-90%)
- 🔴 Red: Critical (> 90% or > 75°C)

---

## 🔌 API Endpoints

The local agent runs on `http://localhost:5000` with the following endpoints:

### Health Check

```bash
GET http://localhost:5000/health
```

**Response:**

```json
{
  "status": "ok",
  "service": "Focus-Flow Agent",
  "version": "1.0.0"
}
```

### Current Metrics

```bash
GET http://localhost:5000/metrics
```

**Response:**

```json
{
  "metrics": {
    "timestamp": 1714734600,
    "cpu_percent": 45.2,
    "memory_percent": 62.1,
    "memory_available_mb": 4096.5,
    "cpu_temp": 52.3,
    "disk_percent": 73.4,
    "uptime_seconds": 86400
  },
  "services": [
    { "name": "Docker", "running": true, "port": 2375 },
    { "name": "Redis", "running": true, "port": 6379 }
  ],
  "alerts": {
    "active": false,
    "messages": [],
    "severity": "info"
  },
  "timestamp": "2026-05-02T15:30:00.000Z"
}
```

### WebSocket Stream

```bash
ws://localhost:5000/ws
```

Real-time metrics stream (sends update every 2 seconds).

### Aggregate Metrics (Opt-in)

```bash
GET http://localhost:5000/aggregate-metrics
```

Returns anonymized aggregate data (if user consented).

---

## 🔒 Privacy

### What Stays Local

- All monitoring data (CPU, memory, temperature)
- Service and port information
- Historical metrics for trend analysis

### What's Optional

If you opt-in, we collect every 4 hours:

- Aggregate CPU/Memory averages
- Active service names (generic: "Docker running")
- Device type ("MacBook", "Windows PC", "Linux")
- Timezone and language
- Anonymous machine ID (generated locally)

### What We Never Collect

- ❌ Personal information
- ❌ IP addresses or credentials
- ❌ Project names or file paths
- ❌ Browser history
- ❌ Any identifying information

📖 **Full Privacy Policy**: See `PRIVACY_POLICY.md`
