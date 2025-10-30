#include <Arduino.h>
// ESP8266 uses ESP8266WiFi.h, not just WiFi.h
#include <ESP8266WiFi.h>
// Use this specific library for HTTPS on ESP8266
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
// Note: ESP8266's analogRead is 10-bit (0-1023) by default.

// ------------------ USER SETTINGS ------------------
const char* WIFI_SSID = "Note";
const char* WIFI_PASSWORD = "qwertyasd";
const char* API_BASE_URL = "https://c2s-axo4.onrender.com/api";
const char* LOCATION_LABEL = "Prayagraj District";
const uint16_t POLL_INTERVAL_SECONDS = 10;
// const char* API_BEARER_TOKEN = "YOUR_TOKEN";

// ------------------ HARDWARE PINS ------------------
// Use D-pins for ESP8266 or GPIO numbers
constexpr uint8_t DHT_PIN = D2;        // Equivalent to GPIO4 (common)
constexpr uint8_t RELAY_PIN = D1;      // Equivalent to GPIO5 (common)
constexpr uint8_t FLUORIDE_PIN = A0;   // ESP8266 only has ONE analog pin, A0 (ADC0)
constexpr auto DHT_TYPE = DHT11;
constexpr bool RELAY_ACTIVE_HIGH = true;

// ------------------ CALIBRATION ------------------
struct FluorideCalibration {
  float minPpm = 0.0f;
  float maxPpm = 2.5f;
  // ESP8266 ADC resolution is 10-bit (0-1023) by default
  uint16_t maxAdc = 1023; 
};

FluorideCalibration fluorideCalibration;

float convertAnalogToFluoride(uint16_t raw) {
  raw = constrain(raw, static_cast<uint16_t>(0), fluorideCalibration.maxAdc);
  // ADC range for ESP8266 is typically 0-1023
  const float proportion = static_cast<float>(raw) / 1023.0f; 
  return fluorideCalibration.minPpm + proportion * (fluorideCalibration.maxPpm - fluorideCalibration.minPpm);
}

float clampHumidity(float humidity) {
  if (isnan(humidity)) {
    return NAN;
  }
  return constrain(humidity, 0.0f, 100.0f);
}

// ------------------ GLOBALS ------------------
DHT dht(DHT_PIN, DHT_TYPE);
// Use WiFiClientSecure for HTTPS on ESP8266
WiFiClientSecure wifiClient;
String deviceId;
unsigned long lastSync = 0;

// ------------------ HELPERS ------------------
float readFluorideMgL() {
  // Use A0 for analogRead on ESP8266
  const uint16_t raw = analogRead(FLUORIDE_PIN);
  return convertAnalogToFluoride(raw);
}

void applyRelayState(const String& state) {
  const bool relayOn = state.equalsIgnoreCase("on");
  const bool driveHigh = RELAY_ACTIVE_HIGH ? relayOn : !relayOn;
  digitalWrite(RELAY_PIN, driveHigh ? HIGH : LOW);
}

void syncRelayState() {
  HTTPClient http;
  const String url = String(API_BASE_URL) + "/devices/led/" + deviceId;
  
  // Begin must be passed the WiFiClientSecure object for HTTPS
  if (!http.begin(wifiClient, url)) {
    Serial.println(F("[relay] HTTP begin failed"));
    return;
  }

#ifdef API_BEARER_TOKEN
  http.addHeader("Authorization", String("Bearer ") + API_BEARER_TOKEN);
#endif

  const int status = http.GET();
  
  // Ensure http.end() is called before return
  if (status <= 0) {
    Serial.printf("[relay] HTTP error: %s\n", http.errorToString(status).c_str());
    http.end();
    return;
  }
  
  const String payload = http.getString();
  http.end();

  if (status < 200 || status >= 300) {
    Serial.printf("[relay] Status %d | response %s\n", status, payload.c_str());
    return;
  }

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, payload)) {
    Serial.println(F("[relay] JSON parse error"));
    return;
  }

  const char* relayState = doc["relay_state"] | "off";
  applyRelayState(relayState);
  Serial.printf("[relay] Relay => %s\n", relayState);
}

bool postSensorData(float humidity, float fluoride) {
  HTTPClient http;
  const String url = String(API_BASE_URL) + "/data";
  
  // Begin must be passed the WiFiClientSecure object for HTTPS
  if (!http.begin(wifiClient, url)) {
    Serial.println(F("[post] HTTP begin failed"));
    return false;
  }

  http.addHeader("Content-Type", "application/json");
#ifdef API_BEARER_TOKEN
  http.addHeader("Authorization", String("Bearer ") + API_BEARER_TOKEN);
#endif

  StaticJsonDocument<256> doc;
  doc["device_id"] = deviceId;
  doc["humidity"] = humidity;
  doc["fluoride"] = fluoride;
  doc["location"] = LOCATION_LABEL;

  String body;
  serializeJson(doc, body);

  const int status = http.POST(body);
  const String responseBody = http.getString();
  
  // Ensure http.end() is called before return
  if (status <= 0) {
    Serial.printf("[post] HTTP error: %s\n", http.errorToString(status).c_str());
    http.end();
    return false;
  }

  Serial.printf("[post] Status %d | payload %s\n", status, body.c_str());
  if (!responseBody.isEmpty()) {
    Serial.printf("[post] Response %s\n", responseBody.c_str());
  }

  http.end();
  return status >= 200 && status < 300;
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print(F("Connecting to Wi-Fi"));
  uint8_t retries = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
    if (++retries > 60) {
      Serial.println(F("\nRestarting (Wi-Fi timeout)"));
      ESP.restart();
    }
  }

  Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
  deviceId = WiFi.macAddress();
  Serial.printf("Device ID: %s\n", deviceId.c_str());

  // Allow for self-signed or unverified certificates (required for Render's default cert setup)
  wifiClient.setInsecure(); 
}

// ------------------ ARDUINO LIFECYCLE ------------------
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println(F("Smart Water Monitor (ESP8266)"));

  // Set the pin modes using the ESP8266-specific D-pin definitions
  pinMode(RELAY_PIN, OUTPUT);
  applyRelayState("off");

  // analogReadResolution is not available/necessary on ESP8266
  dht.begin();
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[wifi] Reconnecting..."));
    connectWiFi();
  }

  // Reading sensors and posting data... (same logic)
  const float humidity = clampHumidity(dht.readHumidity());
  const float fluoride = readFluorideMgL();

  if (isnan(humidity)) {
    Serial.println(F("[sensor] Humidity read failed"));
  } else {
    Serial.printf("[sensor] Humidity %.1f%% | Fluoride %.2f mg/L\n", humidity, fluoride);
    if (postSensorData(humidity, fluoride)) {
      Serial.println(F("[sensor] Posted successfully"));
    }
  }

  const unsigned long now = millis();
  if (now - lastSync > (POLL_INTERVAL_SECONDS * 1000UL) / 2) {
    lastSync = now;
    syncRelayState();
  }

  delay(POLL_INTERVAL_SECONDS * 1000UL);
}