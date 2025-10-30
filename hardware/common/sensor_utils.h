#pragma once

#include <Arduino.h>

// Crude linear calibration helper for fluoride probes. Adjust the constants after
// performing a two-point calibration with reference solutions.
struct FluorideCalibration {
  float minPpm = 0.0f;  // mg/L at 0V analog input
  float maxPpm = 2.5f;  // mg/L at full-scale analog input
  uint16_t maxAdc = 4095;  // ADC resolution (1023 for ESP8266, 4095 for ESP32)
};

inline float convertAnalogToFluoride(uint16_t raw, const FluorideCalibration& calibration) {
  raw = constrain(raw, static_cast<uint16_t>(0), calibration.maxAdc);
  const float proportion = static_cast<float>(raw) / static_cast<float>(calibration.maxAdc);
  return calibration.minPpm + proportion * (calibration.maxPpm - calibration.minPpm);
}

inline float clampHumidity(float humidity) {
  if (isnan(humidity)) {
    return NAN;
  }
  return constrain(humidity, 0.0f, 100.0f);
}
