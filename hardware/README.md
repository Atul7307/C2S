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

1. Duplicate `common/secrets.example.h` as `common/secrets.h` and update Wi-Fi + API details.
2. Adjust `LOCATION_LABEL` in each sketch if you want per-device location labels baked into payloads.
3. To refine fluoride readings, tweak `FluorideCalibration` parameters in `common/sensor_utils.h` after measuring against reference solutions.
4. Libraries to install via Arduino Library Manager:
   - **DHT sensor library** by Adafruit
   - **Adafruit Unified Sensor** (dependency for DHT library)
   - **ArduinoJson**
5. Build & flash using Arduino IDE (select board: *NodeMCU 1.0 (ESP-12E Module)* or *ESP32 Dev Module*).
6. Use Serial Monitor at 115200 baud to observe connection logs and sensor payloads.

## Troubleshooting

- **Wi-Fi loop**: check credentials or move closer to the router. The sketch auto-restarts after ~30s of failed attempts.
- **HTTP 500/400**: inspect Express logs (`backend` terminal). Enable verbose logging by setting `NODE_ENV=development`.
- **Relay inversion**: set `RELAY_ACTIVE_HIGH` to `false` if your relay module activates on LOW.
- **No map marker**: add `metadata.coordinates = { lat, lng }` to the payload or configure fallback coordinates in the React dashboard.
