#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

// ------------------ USER SETTINGS ------------------
const char* WIFI_SSID = "Note";
const char* WIFI_PASSWORD = "qwertyasd";
const char* API_BASE_URL = "http://10.166.202.228:3000/api";
const char* LOCATION_LABEL = "Prayagraj District";
const uint16_t POLL_INTERVAL_SECONDS = 10;
// const char* API_BEARER_TOKEN = "YOUR_TOKEN";

// ------------------ HARDWARE PINS ------------------
constexpr gpio_num_t DHT_PIN = GPIO_NUM_4;
constexpr gpio_num_t RELAY_PIN = GPIO_NUM_26;
constexpr uint8_t FLUORIDE_PIN = 34;  // ADC1_CH6
constexpr auto DHT_TYPE = DHT11;
constexpr bool RELAY_ACTIVE_HIGH = true;

// ------------------ CALIBRATION ------------------
struct FluorideCalibration {
  float minPpm = 0.0f;
  float maxPpm = 2.5f;
  uint16_t maxAdc = 4095;  // ESP32 ADC resolution
};

FluorideCalibration fluorideCalibration;

float convertAnalogToFluoride(uint16_t raw) {
  raw = constrain(raw, static_cast<uint16_t>(0), fluorideCalibration.maxAdc);
  const float proportion = static_cast<float>(raw) / fluorideCalibration.maxAdc;
  return fluorideCalibration.minPpm + proportion * (fluorideCalibration.maxPpm - fluorideCalibration.minPpm);
}

float clampHumidity(float humidity) {
  if (isnan(humidity)) {
    return NAN;
  }
  return constrain(humidity, 0.0f, 100.0f);
}

// ------------------ GLOBALS ------------------
DHT dht(static_cast<uint8_t>(DHT_PIN), DHT_TYPE);
WiFiClient wifiClient;
String deviceId;
unsigned long lastSync = 0;

// ------------------ HELPERS ------------------
float readFluorideMgL() {
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
  if (!http.begin(wifiClient, url)) {
    Serial.println(F("[relay] HTTP begin failed"));
    return;
  }

#ifdef API_BEARER_TOKEN
  http.addHeader("Authorization", String("Bearer ") + API_BEARER_TOKEN);
#endif

  const int status = http.GET();
  if (status <= 0) {
    Serial.printf("[relay] HTTP error: %s\n", http.errorToString(status).c_str());
    http.end();
    return;
  }

  const String payload = http.getString();
  http.end();

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
  if (status <= 0) {
    Serial.printf("[post] HTTP error: %s\n", http.errorToString(status).c_str());
    http.end();
    return false;
  }

  Serial.printf("[post] Status %d | payload %s\n", status, body.c_str());
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
}

// ------------------ ARDUINO LIFECYCLE ------------------
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println(F("Smart Water Monitor (ESP32)"));

  pinMode(RELAY_PIN, OUTPUT);
  applyRelayState("off");

  analogReadResolution(12);
  dht.begin();
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[wifi] Reconnecting..."));
    connectWiFi();
  }

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
