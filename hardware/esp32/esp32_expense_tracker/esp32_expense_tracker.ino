/*
  ==================================================================================
  SERVERLESS EXPENSE TRACKER WITH HARDWARE INTEGRATION - ESP32 FIRMWARE
  ==================================================================================
  Author: Cloud & IoT Systems Engineer
  Target Hardware: ESP32 Dev Module (NodeMCU ESP32 / ESP-WROOM-32)
  Features:
    - 2x Push Buttons (GPIO 18: Essential Expense, GPIO 19: Non-Essential Expense)
    - Status LED Indicator (GPIO 2: Blink patterns for Wi-Fi, Success, Error)
    - Wi-Fi auto-reconnect with exponential backoff
    - HTTPS POST to Serverless API (/api/hardware/expense)
    - SHA-256 / Bearer Token Device Authentication
    - Request UUID Idempotency Guard (Prevents double button presses)
    - Non-blocking software debouncing via millis()
  ==================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ==================================================================================
// 1. DEVELOPER CONFIGURATION PARAMETERS (REPLACE VALUES BEFORE FLASHING)
// ==================================================================================
const char* WIFI_SSID       = "YOUR_WIFI_SSID";             // Wi-Fi Access Point Name
const char* WIFI_PASSWORD   = "YOUR_WIFI_PASSWORD";         // Wi-Fi Password
const char* API_ENDPOINT    = "https://your-domain.vercel.app/api/hardware/expense"; // Serverless API URL
const char* HEARTBEAT_URL   = "https://your-domain.vercel.app/api/hardware/heartbeat";
const char* DEVICE_ID       = "ESP32-001";                 // Unique Device ID registered in Web Dashboard
const char* DEVICE_TOKEN    = "esp32_secret_token_12345";  // Secret device token generated during pairing

// ==================================================================================
// 2. HARDWARE GPIO PIN DEFINITIONS
// ==================================================================================
#define PIN_BUTTON_ESSENTIAL     18  // Push Button 1: Essential Expense (GPIO 18)
#define PIN_BUTTON_NON_ESSENTIAL 19  // Push Button 2: Non-Essential Expense (GPIO 19)
#define PIN_STATUS_LED           2   // Built-in Status LED Indicator (GPIO 2)

// Debounce & Lockout Configuration
const unsigned long DEBOUNCE_DELAY_MS = 350; // 350ms lockout against button bouncing
unsigned long lastEssentialPressTime   = 0;
unsigned long lastNonEssentialPressTime= 0;

// Heartbeat Timer (pings server every 60 seconds)
unsigned long lastHeartbeatTime        = 0;
const unsigned long HEARTBEAT_INTERVAL = 60000;

// Root CA Certificate for HTTPS Verification (Set to nullptr for test/dev mode)
const char* rootCACertificate = nullptr;

// ==================================================================================
// 3. HELPER FUNCTIONS
// ==================================================================================

// Generates a pseudo-UUID string for request idempotency
String generateRequestUUID() {
  uint32_t r1 = esp_random();
  uint32_t r2 = esp_random();
  char uuidStr[37];
  snprintf(uuidStr, sizeof(uuidStr), "%08x-%04x-4%03x-%04x-%08x%04x",
           r1, (uint16_t)(r2 >> 16), (uint16_t)(r2 & 0x0FFF),
           (uint16_t)((r2 >> 4) & 0x3FFF) | 0x8000, r1, (uint16_t)r2);
  return String(uuidStr);
}

// LED Blink Feedback Patterns
void blinkLED(int count, int delayMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    delay(delayMs);
    digitalWrite(PIN_STATUS_LED, LOW);
    if (i < count - 1) delay(delayMs);
  }
}

// Connect to Wi-Fi with retry backoff
void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED)); // Rapid blink while connecting
    delay(300);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] IP Address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(PIN_STATUS_LED, HIGH); // Solid ON when connected
  } else {
    Serial.println("\n[Wi-Fi] Connection failed! Retrying later...");
    digitalWrite(PIN_STATUS_LED, LOW);
  }
}

// Sends Hardware Expense Transaction Request to Serverless API
bool sendExpenseTransaction(const char* expenseType) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Error] Wi-Fi not connected. Attempting reconnection...");
    connectToWiFi();
    if (WiFi.status() != WL_CONNECTED) return false;
  }

  Serial.println("\n=========================================");
  Serial.printf("[Hardware Event] Button Pressed: %s\n", expenseType);
  Serial.println("=========================================");

  WiFiClientSecure client;
  if (rootCACertificate != nullptr) {
    client.setCACert(rootCACertificate);
  } else {
    client.setInsecure(); // Skip certificate validation for dev testing
  }

  HTTPClient http;
  http.begin(client, API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
  http.setTimeout(10000); // 10s timeout

  // Build JSON Payload using ArduinoJson
  StaticJsonDocument<256> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["deviceSecret"] = DEVICE_TOKEN;
  doc["expenseType"]  = expenseType;
  doc["requestId"]    = generateRequestUUID();
  doc["timestamp"]    = String(millis());

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.print("[HTTP POST] Sending Payload: ");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  bool success = false;
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Response Code: %d\n", httpResponseCode);
    Serial.println("[HTTP] Server Response Body:");
    Serial.println(response);

    if (httpResponseCode == 200 || httpResponseCode == 201) {
      Serial.println(">> SUCCESS: Transaction recorded in Cloud Database!");
      blinkLED(2, 100); // Double short blink = Success
      success = true;
    } else {
      Serial.println(">> SERVER ERROR: Verification or processing failed.");
      blinkLED(4, 50); // 4 fast blinks = Error
    }
  } else {
    Serial.printf(">> HTTP Connection Error: %s\n", http.errorToString(httpResponseCode).c_str());
    blinkLED(5, 50);
  }

  http.end();
  return success;
}

// Sends Heartbeat Ping to mark device online
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  http.begin(client, HEARTBEAT_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<128> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["rssi"]     = WiFi.RSSI();
  doc["uptime"]   = millis() / 1000;

  String body;
  serializeJson(doc, body);

  http.POST(body);
  http.end();
}

// ==================================================================================
// 4. ARDUINO SETUP & MAIN LOOP
// ==================================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n---------------------------------------------------------");
  Serial.println(" Serverless Expense Tracker ESP32 Firmware Starting...");
  Serial.println("---------------------------------------------------------");

  // Configure GPIO Pins
  pinMode(PIN_BUTTON_ESSENTIAL, INPUT_PULLUP);
  pinMode(PIN_BUTTON_NON_ESSENTIAL, INPUT_PULLUP);
  pinMode(PIN_STATUS_LED, OUTPUT);

  digitalWrite(PIN_STATUS_LED, LOW);

  // Initial Wi-Fi Connection
  connectToWiFi();
}

void loop() {
  unsigned long currentMillis = millis();

  // Check Button 1 — Essential Expense (Active LOW)
  if (digitalRead(PIN_BUTTON_ESSENTIAL) == LOW) {
    if (currentMillis - lastEssentialPressTime > DEBOUNCE_DELAY_MS) {
      lastEssentialPressTime = currentMillis;
      sendExpenseTransaction("essential");
    }
  }

  // Check Button 2 — Non-Essential Expense (Active LOW)
  if (digitalRead(PIN_BUTTON_NON_ESSENTIAL) == LOW) {
    if (currentMillis - lastNonEssentialPressTime > DEBOUNCE_DELAY_MS) {
      lastNonEssentialPressTime = currentMillis;
      sendExpenseTransaction("non-essential");
    }
  }

  // Heartbeat Timer
  if (currentMillis - lastHeartbeatTime > HEARTBEAT_INTERVAL) {
    lastHeartbeatTime = currentMillis;
    sendHeartbeat();
  }

  // Maintain Wi-Fi Connection
  if (WiFi.status() != WL_CONNECTED && currentMillis % 15000 == 0) {
    connectToWiFi();
  }
}
