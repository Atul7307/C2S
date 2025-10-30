# Smart Water Quality & Environment Monitoring System

An end-to-end IoT platform that collects humidity and fluoride readings from ESP8266/ESP32 field nodes, stores the data in MongoDB, and visualises the fleet in a modern React dashboard. Each device is identified by its MAC address so you can monitor location, last-seen status, and remotely toggle a relay/LED.

## 🏗️ Architecture at a Glance

- **Hardware** – NodeMCU (ESP8266) and ESP32 sketches read DHT humidity and analog fluoride sensors, push data to the API every 10 seconds, and poll for relay commands.
- **Backend** – Node.js + Express service backed by MongoDB. Provides REST endpoints for ingesting sensor data, listing devices, querying historical readings, and controlling relays.
- **Frontend** – Vite + React + Tailwind dashboard that surfaces real-time charts, device table, alerting, and a map view (Leaflet) for quick spatial insights.

```
[ESP32 / ESP8266] --HTTP--> [Express API + MongoDB] --REST--> [React Dashboard]
         ^                                                           |
         |--------------------- Relay commands ----------------------|
```

## 📁 Repository Layout

```
project/
├── backend/        # Express application, MongoDB models, Jest tests
├── frontend/       # Vite + React dashboard with Tailwind UI
├── hardware/       # Arduino sketches + shared headers for ESP8266/ESP32
└── README.md       # You are here
```

## ✅ Prerequisites

- Node.js 18+ and npm 9+
- MongoDB (local instance or Atlas connection string)
- Arduino IDE (2.x recommended) or PlatformIO
- Required Arduino libraries: **ESP8266WiFi** (ESP8266 core), **WiFi** (ESP32 core), **HTTPClient**, **DHT sensor library by Adafruit**, **ArduinoJson**

## 🚀 Getting Started

### 1. Backend (Express + MongoDB)

```powershell
cd backend
npm install
copy .env.example .env  # update values as needed
npm run dev              # start API at http://localhost:3000
```

Key scripts:
- `npm test` – runs the Jest route tests (uses mongodb-memory-server).
- `npm run lint` – applies ESLint/Prettier rules.

Environment variables (`backend/.env.example`):
- `MONGODB_URI` – Mongo connection string
- `PORT` – API port (default `3000`)
- `ALLOWED_ORIGINS` – comma-separated list for CORS (React dev server by default)

### 2. Frontend (React + Vite + Tailwind)

```powershell
cd frontend
npm install
copy .env.example .env  # set VITE_API_BASE_URL if backend is remote
npm run dev              # dashboard at http://localhost:5173
```

Build for production:

```powershell
npm run build
npm run preview
```

### 3. Firmware (ESP8266 & ESP32)

1. Copy `hardware/common/secrets.example.h` to `hardware/common/secrets.h` and update:
   - `WIFI_SSID` / `WIFI_PASSWORD`
   - `API_BASE_URL` (e.g. `http://192.168.1.10:3000/api`)
   - `POLL_INTERVAL_SECONDS` (default `10`)
2. Open the desired sketch:
   - ESP8266: `hardware/esp8266/smart_water_esp8266.ino`
   - ESP32: `hardware/esp32/smart_water_esp32.ino`
3. Install the required libraries via Arduino Library Manager (search for *DHT sensor library* and *ArduinoJson*).
4. Adjust pin assignments if your wiring differs (DHT on GPIO4, relay on GPIO5/26 by default).
5. Flash and monitor the serial output at 115200 baud to confirm readings/posts.

## 🧠 Backend API Reference

| Method | Endpoint                          | Description                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| POST   | `/api/data`                       | Ingest humidity & fluoride payload           |
| GET    | `/api/devices`                    | List registered devices and latest readings  |
| GET    | `/api/data/:device_id`            | Fetch recent readings (default 20)           |
| GET    | `/api/devices/led/:device_id`     | Retrieve current relay/LED state             |
| PUT    | `/api/devices/led/:device_id`     | Update relay/LED state (`on` / `off`)        |

Sample payload for `POST /api/data`:

```json
{
  "device_id": "8C:4F:00:E0:97:B7",
  "humidity": 65.2,
  "fluoride": 1.8,
  "location": "Gorakhpur District",
  "metadata": {
    "coordinates": { "lat": 26.76, "lng": 83.37 }
  }
}
```

## 🗃️ MongoDB Collections

### `sensor_readings`

```json
{
  "_id": ObjectId,
  "device_id": "84:F3:EB:AA:9B:21",
  "humidity": 67.3,
  "fluoride": 1.5,
  "location": "Gorakhpur District",
  "timestamp": ISODate("2025-10-29T10:21:00Z")
}
```

### `devices`

```json
{
  "_id": ObjectId,
  "device_id": "84:F3:EB:AA:9B:21",
  "location": "Gorakhpur District",
  "relay_state": "off",
  "last_seen": ISODate("2025-10-29T10:21:00Z"),
  "metadata": { "coordinates": { "lat": 26.76, "lng": 83.37 } }
}
```

Indexes:
- `sensor_readings`: compound index on `{ device_id: 1, timestamp: -1 }`
- `devices`: unique index on `device_id`

## 📊 Dashboard Highlights

- **Device Table** – sortable list with MAC IDs, health status, live relay toggles, and last update timestamps.
- **Trend Charts** – Recharts line graphs for humidity and fluoride, auto-refreshing with each poll.
- **Alerts Banner** – Flags fluoride above 1.5 mg/L or humidity outside 30–70% range.
- **Map View** – Leaflet map pinning devices when coordinates are supplied (falls back to known city centroids).
- **Control Panel** – Select any node and toggle its relay/LED remotely.

## 🧪 Quality Gates

Latest verification runs:
- `backend`: `npm test` ✅ (Jest API tests)
- `frontend`: `npm run build` ✅ (Vite production build)

## 🔧 Calibration & Extensions

- **Fluoride calibration** – Update `FluorideCalibration` limits in `hardware/common/sensor_utils.h` after two-point calibration with reference solutions.
- **Secure API** – Add an auth middleware in Express and populate `API_BEARER_TOKEN` in firmware for protected deployments.
- **MQTT / WebSockets** – Swap REST polling for MQTT or Socket.IO if you need lower latency control loops.
- **Deployment** – Containerise backend + frontend bundles for services like Render, Railway, or AWS (ECS/EC2). MongoDB Atlas is recommended for managed storage.

## 📬 Support & Next Steps

- Add data retention policies (e.g., TTL index on `sensor_readings`).
- Layer in notifications (email/SMS) when alert thresholds breach.
- Integrate GPS or LoRa modules for remote deployments.

Happy building! 🌊
