# Hardware Guide

## Wiring Overview

| Sensor/Actuator | ESP8266 (NodeMCU) | ESP32 DevKit V1 | Notes |
| ---------------- | ----------------- | --------------- | ----- |
| DHT11/DHT22 Data | D4 (GPIO2)        | GPIO4           | Use 4.7kΩ pull-up to 3.3V |
| Fluoride Analog  | A0 (0-1V range)   | GPIO34 (ADC1)   | Add voltage divider for 0-1V scaling on ESP8266 |
| Relay/LED        | D1 (GPIO5)        | GPIO26          | Active-high by default; adjust `RELAY_ACTIVE_HIGH` if needed |

- Power sensors from the 3V3 rail and share ground.
- For ESP8266, ensure the fluoride probe output is scaled to 0-1V (use op-amp or resistor divider).

## Firmware Setup Steps

1. If you prefer keeping credentials in a header, duplicate `common/secrets.example.h` as `common/secrets.h` and include it from your sketch. The default sketches inline the constants, so you can also edit them directly at the top of `esp8266/arduinocode/arduinocode.ino` or `esp32/arduinocode/arduinocode.ino`.
2. Update `WIFI_SSID`, `WIFI_PASSWORD`, `API_BASE_URL` (use your deployed API such as `https://c2s-axo4.onrender.com/api`), `LOCATION_LABEL`, and `POLL_INTERVAL_SECONDS` per device as needed.
3. To refine fluoride readings, tweak `FluorideCalibration` parameters in `common/sensor_utils.h` after measuring against reference solutions.
4. Libraries to install via Arduino Library Manager:
   - **DHT sensor library** by Adafruit
   - **Adafruit Unified Sensor** (dependency for DHT library)
   - **ArduinoJson**
5. Build & flash using Arduino IDE (select board: *NodeMCU 1.0 (ESP-12E Module)* or *ESP32 Dev Module*). The ESP32 sketch uses `WiFiClientSecure` when available, so install the ESP32 board package v2.0.14+.
6. Use Serial Monitor at 115200 baud to observe connection logs and sensor payloads. When using HTTPS, the sketch trusts the remote certificate by calling `setInsecure()`. For production harden this by adding a certificate fingerprint or CA bundle.

## Troubleshooting

- **Wi-Fi loop**: check credentials or move closer to the router. The sketch auto-restarts after ~30s of failed attempts.
- **HTTP 500/400**: inspect Express logs (`backend` terminal) and review the serial monitor output. Non-2xx responses now include the response body to help diagnose validation issues.
- **Relay inversion**: set `RELAY_ACTIVE_HIGH` to `false` if your relay module activates on LOW.
- **No map marker**: add `metadata.coordinates = { lat, lng }` to the payload or configure fallback coordinates in the React dashboard.
