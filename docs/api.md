# Hardware Integration REST API Reference

The serverless backend provides dedicated HTTPS API endpoints for hardware communication, device authentication, and real-time status monitoring.

---

## 1. POST /api/hardware/expense

Records a financial expense transaction triggered by an authenticated ESP32 physical push button.

### Request Headers
```http
POST /api/hardware/expense HTTP/1.1
Host: your-domain.vercel.app
Content-Type: application/json
Authorization: Bearer <DEVICE_TOKEN>
```

### Request Body Schema
```json
{
  "deviceId": "ESP32-001",
  "deviceSecret": "YOUR_DEVICE_TOKEN",
  "expenseType": "essential",
  "amount": 100,
  "timestamp": "2026-09-10T12:00:00Z",
  "requestId": "90015098-3cd2-4fb0-d696-3f7d28e17f72"
}
```

#### Field Descriptions
- `deviceId` (string, required): Registered unique device identifier.
- `deviceSecret` (string, optional): Secret key generated during device pairing (can be supplied in header or body).
- `expenseType` (string, required): High-level classification: `"essential"` or `"non-essential"`.
- `amount` (number, optional): Custom transaction amount. If omitted, the server automatically applies the device's configured default amount.
- `timestamp` (string, optional): ISO-8601 UTC timestamp.
- `requestId` (string, optional): UUID idempotency token to prevent duplicate entries caused by network retries.

### Example cURL Command
```bash
curl -X POST https://your-domain.vercel.app/api/hardware/expense \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer esp32_secret_token_12345" \
  -d '{
    "deviceId": "ESP32-001",
    "expenseType": "essential",
    "requestId": "req-987654321"
  }'
```

### Success Response (HTTP 201 Created)
```json
{
  "success": true,
  "message": "ESSENTIAL expense recorded successfully",
  "transaction": {
    "id": "tx-123456789",
    "deviceId": "ESP32-001",
    "expenseType": "essential",
    "amount": 100,
    "category": "Essential Hardware",
    "source": "hardware",
    "timestamp": "2026-09-10T12:00:00Z"
  }
}
```

### Error Responses
- **HTTP 400 Bad Request**: Missing required parameters (`deviceId`, `expenseType`).
- **HTTP 401 Unauthorized**: Invalid or rejected device secret token.
- **HTTP 404 Not Found**: Device ID is not registered in the database.

---

## 2. POST /api/hardware/heartbeat

Periodic ping sent by ESP32 microcontrollers to report Wi-Fi signal strength (RSSI) and maintain online status.

### Request Body Schema
```json
{
  "deviceId": "ESP32-001",
  "rssi": -65,
  "uptimeSeconds": 3600
}
```

### Success Response (HTTP 200 OK)
```json
{
  "success": true,
  "deviceId": "ESP32-001",
  "status": "online",
  "serverTimestamp": "2026-09-10T12:01:00Z"
}
```

---

## 3. GET /api/hardware/status

Query online status and stats for registered hardware devices.

### Request Query Parameters
`GET /api/hardware/status?deviceId=ESP32-001`

### Request Headers
```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

The response contains only devices owned by the authenticated user and never
includes `device_secret_hash`.

## 4. POST /api/hardware/register

Registers a new hardware device for the authenticated Supabase user. The
server generates both the unique device ID and device secret.

### Request Headers
```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "deviceName": "Office Desk Button Box"
}
```

`deviceName` is optional and defaults to `ESP32 Push Button Box`.

### Success Response
```json
{
  "success": true,
  "device": {
    "id": "device-row-uuid",
    "user_id": "user-uuid",
    "device_id": "ESP32-ABC123",
    "device_name": "Office Desk Button Box",
    "status": "offline",
    "default_essential_amount": 100,
    "default_non_essential_amount": 200,
    "last_seen": null,
    "created_at": "2026-11-12T00:00:00.000Z",
    "updated_at": "2026-11-12T00:00:00.000Z"
  },
  "deviceSecret": "plaintext-secret-shown-once",
  "warning": "Save this device secret now. It will not be shown again."
}
```

The plaintext `deviceSecret` is returned only by this registration response.
Only its SHA-256 hash is stored in `hardware_devices`; the service-role key
remains server-side.

### Success Response (HTTP 200 OK)
```json
{
  "devices": [
    {
      "id": "dev-001-uuid",
      "device_id": "ESP32-001",
      "device_name": "Desk Push Button Box",
      "status": "online",
      "default_essential_amount": 100,
      "default_non_essential_amount": 200,
      "last_seen": "2026-09-10T12:01:00Z"
    }
  ]
}
```
