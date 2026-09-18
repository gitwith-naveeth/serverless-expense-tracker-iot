# ESP32 Hardware Integration & Firmware Guide

This directory contains the physical firmware and circuit wiring documentation for integrating an ESP32 Wi-Fi microcontroller with two tactile push buttons directly to the **Serverless Expense Tracker** cloud backend.

---

## 1. Hardware Pinout & Wiring Diagram

```
                 ESP32 Dev Module (30-pin / 38-pin)
                 ┌────────────────────────────────┐
                 │                                │
        GND ─────┼─── GND Bus (Common Ground)     │
                 │                                │
    GPIO 18 ─────┼─── Button 1 (Essential) ───────┼─── GND
                 │    (Internal Pull-up Enabled)  │
                 │                                │
    GPIO 19 ─────┼─── Button 2 (Non-Essential) ───┼─── GND
                 │    (Internal Pull-up Enabled)  │
                 │                                │
     GPIO 2 ─────┼─── Onboard Status LED          │
                 │    (Wi-Fi & Transaction Blink) │
                 └────────────────────────────────┘
```

### Pin Assignments Table

| Component | ESP32 GPIO Pin | Mode | Description |
|---|---|---|---|
| **Button 1 (Essential)** | `GPIO 18` | `INPUT_PULLUP` | Pressing connects pin to GND to log an **Essential Expense** |
| **Button 2 (Non-Essential)** | `GPIO 19` | `INPUT_PULLUP` | Pressing connects pin to GND to log a **Non-Essential Expense** |
| **Status LED** | `GPIO 2` | `OUTPUT` | Onboard LED indicator for Wi-Fi status and request feedback |
| **Ground (GND)** | `GND` | Power | Common ground terminal for both buttons |

---

## 2. Bill of Materials (BOM)

| Item | Quantity | Estimated Cost | Notes |
|---|---|---|---|
| ESP32 Dev Board (ESP-WROOM-32) | 1 | ~$4 - $6 | Wi-Fi 802.11 b/g/n micro-controller |
| Tactile Push Buttons (12mm) | 2 | ~$0.50 | 1x Green (Essential), 1x Yellow/Orange (Non-Essential) |
| Breadboard or Custom PCB | 1 | ~$2.00 | Standard half-size breadboard |
| Jumper Wires (Male-to-Female / M-M) | 4 | ~$1.00 | Connecting buttons to GPIO pins |
| USB-C or Micro-USB Cable | 1 | ~$2.00 | Power supply & flashing interface |

---

## 3. How to Flash Firmware

### Method A: Arduino IDE
1. Install **Arduino IDE** (v2.0+ recommended).
2. Add ESP32 Board Manager URL in **Preferences**:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Install `esp32` by Espressif Systems under **Board Manager**.
4. Install `ArduinoJson` library by Benoit Blanchon under **Library Manager**.
5. Open `esp32_expense_tracker.ino`.
6. Update configuration constants at top of code:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_SSID";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* API_ENDPOINT  = "https://your-app.vercel.app/api/hardware/expense";
   const char* DEVICE_ID     = "ESP32-001";
   const char* DEVICE_TOKEN  = "your_device_secret_token";
   ```
7. Select Board **ESP32 Dev Module**, select COM Port, and click **Upload**.

### Method B: PlatformIO (VS Code / CLI)
1. Open this `hardware/esp32` folder in VS Code with PlatformIO extension installed.
2. Build & Upload:
   ```bash
   pio run --target upload
   ```

---

## 4. LED Status Feedback Legend

| LED Pattern | Meaning |
|---|---|
| **Rapid Blinking** | Wi-Fi connecting / attempting auto-reconnect |
| **Solid ON** | Wi-Fi connected & device online |
| **2 Short Blinks** | Transaction successfully posted to serverless API & Supabase |
| **4 Fast Blinks** | Server error or device token authentication rejected |
| **5 Fast Blinks** | HTTPS network request failed |
