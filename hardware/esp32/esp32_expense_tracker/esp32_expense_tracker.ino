/*
  ESP32 Expense Tracker
  Single touch on GPIO 18: essential expense.
  Double touch within 500 ms: non-essential expense.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// Configure these values before flashing. Do not commit real credentials.
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_ENDPOINT = "https://your-domain.vercel.app/api/hardware/expense";
const char* HEARTBEAT_URL = "https://your-domain.vercel.app/api/hardware/heartbeat";
const char* DEVICE_ID = "YOUR_REGISTERED_DEVICE_ID";
const char* DEVICE_SECRET = "YOUR_DEVICE_SECRET";

// Paste the deployed backend's trusted root CA certificate here.
// The firmware refuses to make HTTPS requests until this is configured.
const char* ROOT_CA_CERTIFICATE = "";

const uint8_t TOUCH_PIN = 18;
const uint8_t TOUCH_ACTIVE_LEVEL = HIGH;
const uint8_t STATUS_LED_PIN = 2;
const unsigned long TOUCH_DEBOUNCE_MS = 80;
const unsigned long DOUBLE_TAP_WINDOW_MS = 500;
const unsigned long HEARTBEAT_INTERVAL_MS = 60000;
const uint8_t HTTP_RETRY_COUNT = 2;

unsigned long lastTouchStart = 0;
unsigned long firstTapTime = 0;
unsigned long lastHeartbeatTime = 0;
bool touchActive = false;
bool tapPending = false;
bool suppressRelease = false;
bool requestInProgress = false;

String generateRequestId() {
  uint32_t first = esp_random();
  uint32_t second = esp_random();
  char requestId[37];
  snprintf(
    requestId,
    sizeof(requestId),
    "%08lx-%04x-4%03x-%04x-%08lx%04x",
    static_cast<unsigned long>(first),
    static_cast<unsigned int>(second >> 16),
    static_cast<unsigned int>(second & 0x0FFF),
    static_cast<unsigned int>(((second >> 4) & 0x3FFF) | 0x8000),
    static_cast<unsigned long>(first),
    static_cast<unsigned int>(second)
  );
  return String(requestId);
}

bool tlsConfigured() {
  return ROOT_CA_CERTIFICATE != nullptr && strlen(ROOT_CA_CERTIFICATE) > 0;
}

bool prepareSecureClient(WiFiClientSecure& client) {
  if (!tlsConfigured()) {
    Serial.println("[TLS] Root CA certificate is not configured.");
    return false;
  }
  client.setCACert(ROOT_CA_CERTIFICATE);
  return true;
}

void blinkLED(uint8_t count, uint16_t delayMs) {
  for (uint8_t index = 0; index < count; index++) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(STATUS_LED_PIN, LOW);
    if (index + 1 < count) {
      delay(delayMs);
    }
  }
}

void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.print("[Wi-Fi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  for (uint8_t attempt = 0; attempt < 20 && WiFi.status() != WL_CONNECTED; attempt++) {
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    Serial.print("[Wi-Fi] Connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(STATUS_LED_PIN, LOW);
    Serial.println("[Wi-Fi] Connection failed; will retry.");
  }
}

bool sendExpenseTransaction(const char* expenseType, const String& requestId) {
  if (requestInProgress) {
    Serial.println("[Expense] Request already in progress; ignoring gesture.");
    return false;
  }

  requestInProgress = true;
  bool success = false;

  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  if (WiFi.status() != WL_CONNECTED || !tlsConfigured()) {
    Serial.println("[Expense] Cannot send: Wi-Fi or TLS is not ready.");
    requestInProgress = false;
    return false;
  }

  for (uint8_t attempt = 1; attempt <= HTTP_RETRY_COUNT && !success; attempt++) {
    WiFiClientSecure client;
    if (!prepareSecureClient(client)) {
      break;
    }

    HTTPClient http;
    if (!http.begin(client, API_ENDPOINT)) {
      Serial.println("[Expense] Failed to initialize HTTPS request.");
      break;
    }

    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + DEVICE_SECRET);
    http.setTimeout(10000);

    StaticJsonDocument<256> payload;
    payload["deviceId"] = DEVICE_ID;
    payload["deviceSecret"] = DEVICE_SECRET;
    payload["expenseType"] = expenseType;
    payload["requestId"] = requestId;

    String body;
    serializeJson(payload, body);
    int responseCode = http.POST(body);

    if (responseCode == 200 || responseCode == 201) {
      Serial.printf("[Expense] %s expense succeeded (HTTP %d).\n", expenseType, responseCode);
      blinkLED(2, 100);
      success = true;
    } else if (responseCode > 0) {
      Serial.printf("[Expense] %s expense failed (HTTP %d, attempt %u).\n", expenseType, responseCode, attempt);
      blinkLED(4, 50);
    } else {
      Serial.printf("[Expense] HTTPS failure on attempt %u: %s\n", attempt, http.errorToString(responseCode).c_str());
      blinkLED(5, 50);
    }

    http.end();
    if (!success && attempt < HTTP_RETRY_COUNT) {
      delay(500);
    }
  }

  requestInProgress = false;
  return success;
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  if (!tlsConfigured()) {
    Serial.println("[Heartbeat] Skipped: TLS certificate is not configured.");
    return;
  }

  WiFiClientSecure client;
  if (!prepareSecureClient(client)) {
    return;
  }

  HTTPClient http;
  if (!http.begin(client, HEARTBEAT_URL)) {
    Serial.println("[Heartbeat] Failed to initialize HTTPS request.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  StaticJsonDocument<192> payload;
  payload["deviceId"] = DEVICE_ID;
  payload["deviceSecret"] = DEVICE_SECRET;
  payload["rssi"] = WiFi.RSSI();
  payload["uptimeSeconds"] = millis() / 1000;

  String body;
  serializeJson(payload, body);
  int responseCode = http.POST(body);

  if (responseCode == 200) {
    Serial.println("[Heartbeat] Succeeded.");
  } else if (responseCode > 0) {
    Serial.printf("[Heartbeat] Failed (HTTP %d).\n", responseCode);
  } else {
    Serial.printf("[Heartbeat] HTTPS failure: %s\n", http.errorToString(responseCode).c_str());
  }

  http.end();
}

void handleTouchGesture() {
  unsigned long now = millis();
  bool touched = digitalRead(TOUCH_PIN) == TOUCH_ACTIVE_LEVEL;

  if (touched && !touchActive && now - lastTouchStart >= TOUCH_DEBOUNCE_MS) {
    touchActive = true;
    lastTouchStart = now;

    if (tapPending && now - firstTapTime <= DOUBLE_TAP_WINDOW_MS) {
      tapPending = false;
      suppressRelease = true;
      Serial.println("[Touch] Double tap recognized: non-essential expense.");
      sendExpenseTransaction("non-essential", generateRequestId());
    }
  } else if (!touched && touchActive) {
    touchActive = false;
    if (suppressRelease) {
      suppressRelease = false;
    } else if (!tapPending) {
      tapPending = true;
      firstTapTime = now;
    }
  }

  if (tapPending && now - firstTapTime > DOUBLE_TAP_WINDOW_MS) {
    tapPending = false;
    Serial.println("[Touch] Single tap recognized: essential expense.");
    sendExpenseTransaction("essential", generateRequestId());
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  Serial.println("\n[Device] Initializing ESP32 Expense Tracker.");
  Serial.println("[Device] HW-763 digital input: GPIO 18.");
  pinMode(TOUCH_PIN, INPUT);
  Serial.print("[Touch] Startup reading: ");
  Serial.println(digitalRead(TOUCH_PIN));
  connectToWiFi();
}

void loop() {
  unsigned long now = millis();
  handleTouchGesture();

  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = now;
    sendHeartbeat();
  }

  if (WiFi.status() != WL_CONNECTED && now % 15000 < 50) {
    connectToWiFi();
  }

  delay(10);
}
