# ANDROID APP SPEC - WMN Notify

## 1. TỔNG QUAN

App Android đọc thông báo thanh toán từ các app ngân hàng (MBBank, Vietcombank, Techcombank...), tự động trích xuất dữ liệu và gửi về server webhook-my-notify.vercel.app.

**Package name:** `com.wmn.android`
**Min SDK:** 26 (Android 8.0)
**Target SDK:** 35
**Ngôn ngữ:** Kotlin
**UI:** Jetpack Compose + Material3

---

## 2. SUPABASE CONFIG

### Credentials (dùng trong app)

```
SUPABASE_URL = https://vrpfftbpfpmpedliqlyh.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycGZmdGJwZnBtZWRsaXFseWgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1NjIxNzM4NywiZXhwIjoyMDcxNzgzMzg3fQ.H3B2FxBnG8L9r0K7hP6g8V3kNw2XQm5dR1sT7yF4uJ8
```

### Database Tables

#### Table: `profiles`
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  is_admin boolean DEFAULT false,
  balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

#### Table: `api_keys`
```sql
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_hash text UNIQUE NOT NULL,
  key_prefix text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```
- `key_hash`: SHA-256 hash của raw API key
- `key_prefix`: 12 ký tự đầu + "..." để hiển thị
- Raw API key chỉ hiển thị 1 lần khi tạo, không lưu trong DB

#### Table: `notifications`
```sql
CREATE TABLE public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  application text,
  event_time timestamptz,
  money numeric,
  detail text,
  forwarded boolean DEFAULT false,
  forward_status_code int,
  created_at timestamptz DEFAULT now()
);
```

#### Table: `webhook_configs`
```sql
CREATE TABLE public.webhook_configs (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id),
  target_url text,
  is_enabled boolean DEFAULT false
);
```

---

## 3. API ENDPOINTS

### POST `/api/wmn_endpoint` — Gửi notification

**Headers:**
```
X-API-Key: wmn_live_xxxxxxxxxxxx
Content-Type: application/json
```

**Body:**
```json
{
  "application": "MBBank",
  "time": "2026-08-27T10:15:00+07:00",
  "money": 500000,
  "detail": "Chuyen tien tu Nguyen Van A"
}
```

**Fields:**
- `application` (string, required): Tên app ngân hàng
- `time` (string, required): ISO 8601 timestamp
- `money` (number, required): Số tiền (dương = nhận, âm = trừ)
- `detail` (string, required): Nội dung chuyển khoản

**Responses:**
- `202 Accepted` → `{"status": "accepted"}`
- `400 Bad Request` → Thiếu field bắt buộc
- `401 Unauthorized` → API key không hợp lệ hoặc inactive

### GET `/rest/v1/api_keys?select=key_prefix,is_active&is_active=eq.true&order=created_at.desc&limit=1`

**Headers:**
```
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {access_token}
```

Lấy API key prefix của user đang đăng nhập.

### Login — Supabase Auth REST API

**POST** `https://vrpfftbpfpmpedliqlyh.supabase.co/auth/v1/token?grant_type=password`

**Headers:**
```
apikey: {SUPABASE_ANON_KEY}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "mypass123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc...",
  "user": {
    "id": "uuid-here",
    "app_metadata": { "email": "user@example.com" },
    "user_metadata": { "full_name": "Nguyen Van A" }
  }
}
```

---

## 4. ANDROID ARCHITECTURE

### Cấu trúc package

```
com.wmn.android/
├── WMNApp.kt              — Application class
├── MainActivity.kt        — Entry point
├── data/
│   ├── Models.kt          — Data classes
│   └── PrefsManager.kt    — DataStore/SharedPreferences
├── network/
│   ├── ApiClient.kt       — HTTP calls (OkHttp)
│   └── BuildConfig.kt     — Supabase credentials
├── service/
│   ├── NotificationListenerServiceImpl.kt  — Đọc notification hệ thống
│   ├── NotificationParser.kt               — Parse money, time, detail
│   ├── BackgroundForegroundService.kt      — Chạy nền chống tắt
│   └── BootReceiver.kt                     — Tự start khi boot
└── ui/
    ├── Navigation.kt       — NavHost routes
    ├── LoginScreen.kt      — Đăng nhập
    ├── HomeScreen.kt       — Trang chính
    ├── SettingsScreen.kt   — Danh sách apps
    ├── AppConfigScreen.kt  — Cấu hình per notification
    ├── AppConfigData.kt    — Data class cho config
    └── theme/Theme.kt      — Material3 theme
```

### Dependencies (build.gradle.kts)

```kotlin
dependencies {
    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Activity & Lifecycle
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.8.5")

    // OkHttp (HTTP client)
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // DataStore (local storage)
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Kotlinx Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // Core
    implementation("androidx.core:core-ktx:1.15.0")
}
```

### Permissions (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

---

## 5. FLOW CHI TIẾT

### 5.1. Login Flow

```
1. User nhập email + password
2. Gọi POST /auth/v1/token?grant_type=password
3. Nhận access_token + refresh_token + user info
4. Lưu vào SharedPreferences:
   - session_access_token
   - session_refresh_token
   - user_id
   - user_email
   - user_full_name
   - is_logged_in = true
5. Gọi GET /rest/v1/api_keys để lấy key_prefix
6. Lưu api_key_prefix vào SharedPreferences
7. Chuyển sang HomeScreen
```

### 5.2. Notification Reading Flow

```
1. App đăng ký NotificationListenerService
2. User phải bật quyền "Đọc thông báo" trong Settings Android
3. Khi notification mới đến → onNotificationPosted()
4. Lấy extras: EXTRA_TITLE, EXTRA_TEXT, EXTRA_BIG_TEXT
5. Quét keyword bank: "chuyển tiền", "MBBank", "VND"...
6. Nếu là notification ngân hàng → processAndSend()
7. Parse: extractMoney(), extractTime(), extractDetail()
8. Gửi POST /api/wmn_endpoint với X-API-Key header
9. KHÔNG BAO GIỜ gửi toàn bộ nội dung notification
```

### 5.3. Background Service Flow

```
1. BackgroundForegroundService chạy foreground với notification
2. START_STICKY → tự restart khi bị kill
3. WakeLock → preventing CPU sleep
4. AlarmManager → schedule restart mỗi 5s nếu bị tắt
5. BootReceiver → tự start khi thiết bị khởi động lại
6. Monitor coroutine → kiểm tra NotificationListener mỗi 30s
```

---

## 6. MỖI SCREEN CHI TIẾT

### 6.1. LoginScreen

**UI:**
- Card ở giữa màn hình
- Title: "WMN Notify"
- Subtitle: "Đăng nhập để sử dụng"
- TextField: Email (icon envelope)
- TextField: Mật khẩu (icon lock, password mode)
- Button: "Đăng nhập"
- Text hint: "Sử dụng tài khoản đã đăng ký trên webhook-my-notify.vercel.app"

**Logic:**
- Kiểm tra SharedPreferences → nếu đã login →跳 HomeScreen
- Validate: email + password không được rỗng
- Gọi ApiClient.signIn()
- On success: save session → navigate Home
- On failure: hiện error trong Card màu đỏ

### 6.2. HomeScreen

**UI:**
- TopBar: "WMN Notify" + icon Settings + icon Logout
- Card: API Key info (hiển thị key_prefix)
- Card: Listener status (đang chạy/chưa cấp quyền)
  - Nếu chưa cấp quyền → hiện nút "Cấp quyền ngay" → mở Settings Android
- Card: User info (avatar circle + name + email)
- Header: "Ứng dụng đã thu thập" + count badge
- Danh sách Cards: mỗi card = 1 app
  - Tên app + count thông báo
  - Hiển thị 3 notification gần nhất (title + text preview)
  - Click → navigate AppConfigScreen

**Logic:**
- collectAsState() từ NotificationListenerServiceImpl.collectedApps
- isNotificationAccessEnabled() kiểm tra Settings.Secure
- Logout: clearSharedPreferences → navigate Login

### 6.3. SettingsScreen

**UI:**
- TopBar: "Cài đặt" + back arrow
- Card: Service status (đang chạy/dừng)
- Card: Hướng dẫn (4 bước)
- Header: "Ứng dụng (count)"
- Danh sách Cards: mỗi card = 1 app
  - Tên app + package name + count
  - Icon Settings bên phải
  - Click → navigate AppConfigScreen

### 6.4. AppConfigScreen

**UI:**
- TopBar: tên app + back arrow + icon Save
- Card info: hướng dẫn
- Danh sách notifications:
  - Mỗi notification = 1 Card:
    - Title (bold, max 1 line)
    - Text preview (max 3 lines)
    - Row: "Gửi về server" + Switch toggle
    - Nếu toggle ON → hiện 4 OutlinedTextField:
      - `application` (tên app, default = tên app hiện tại)
      - `money` (số tiền, auto-fill từ notification)
      - `time` (thời gian, auto-fill từ notification)
      - `detail` (nội dung, auto-fill từ notification)
- Button: "Lưu cài đặt" ở cuối

**Logic:**
- Khi toggle ON → tự extract tiền + thời gian + nội dung từ text
- Khi Save → dialog xác nhận → lưu SharedPreferences
- Lưu theo format: `config_{app_name_hash}` → JSON string các configs

---

## 7. NOTIFICATION PARSER

### extractMoney(text) → Double?

```kotlin
// Các pattern regex theo thứ tự ưu tiên:
1. /[+-]?\s*[\d.,]+\s*(?:VNĐ|VND|đ)/gi
   → VD: "-500,000 VND", "+2,000,000 VNĐ"

2. /[+-]?\s*\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?/
   → VD: "-500.000", "2.000.000,50"

3. /[+-]?\s*\d+(?:,\d{3})+(?:\.\d{1,2})?/
   → VD: "-500,000", "2,000,000"
```

**Xử lý:**
- Loại bỏ ký tự không phải số/dấu
- Thay "," bằng "." nếu cần
- Parse thành Double
- Trả về null nếu không tìm thấy

### extractTime(text, fallbackTimestamp) → String

```kotlin
// Các pattern:
1. /\d{1,2}:\d{2}(?::\d{2})?/
   → VD: "10:15:27"

2. /luc\s+(\d{1,2}:\d{2}:\d{2})/i
   → VD: "luc 10:15:27"

3. /(\d{1,2}:\d{2})\s+ngay/i
   → VD: "10:15 ngay 27/08/2026"

4. /(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/
   → VD: "27/08/2026"
```

**Trả về:** ISO 8601 string, ví dụ `"2026-08-27T10:15:00+07:00"`
**Fallback:** Dùng postTime (thời gian nhận notification)

### extractDetail(text, title) → String

```kotlin
// Các pattern ưu tiên:
1. /(?:nội dung|nội dung CK|chuyển khoản|giao dịch|description)[\s:]+(.+)/i
2. /(?:từ|from|sender|người gửi)[\s:]+(.+)/i
3. /(?:đến|to|receiver|người nhận)[\s:]+(.+)/i

// Fallback: lấy dòng cuối cùng của text
// Giới hạn: max 200 ký tự
```

### isBankNotification(title, text) → Boolean

```kotlin
// Kiểm tra keyword trong title + text (lowercase):
val bankKeywords = listOf(
    "chuyển tiền", "chuyen tien", "giao dịch", "giao dich",
    "nhận tiền", "nhan tien", "trừ tiền", "tru tien",
    "số dư", "so du", "tài khoản", "tai khoan",
    "transfer", "payment", "received", "debited", "credited",
    "VNĐ", "VND", "đồng", "dong",
    "MBBank", "Vietcombank", "Techcombank", "BIDV", "VietinBank",
    "Agribank", "ACB", "Sacombank", "TPBank", "VIB",
    "MSB", "HDBank", "SHB", "VPBank", "OCB"
)
return bankKeywords.any { combined.contains(it) }
```

---

## 8. DATA STORAGE (SharedPreferences)

### Keys và format

```kotlin
// Session
"session_access_token" → String (JWT)
"session_refresh_token" → String
"user_id" → String (UUID)
"user_email" → String
"user_full_name" → String
"is_logged_in" → Boolean

// API Key
"api_key" → String (raw key, nếu cần)
"api_key_prefix" → String (ví dụ: "wmn_live_a1b2...")

// App Configs
"config_{hashCode}" → String (JSON format: "app|time|money|detail|||app|time|money|detail")
```

---

## 9. LƯU Ý QUAN TRỌNG

### Google Play Policy
- **KHÔNG** gửi toàn bộ nội dung notification → vi phạm policy, bị ban
- Chỉ gửi 4 trường: application, time, money, detail
- NotificationListenerService cần có purpose string rõ ràng

### Android Background Limits
- Android 8+限制后台服务
- Dùng foreground service với notification
- START_STICKY để tự restart
- WakeLock để prevent CPU sleep

### Notification Access
- User phải manually vào Settings > Notification access > bật cho app
- Không thể tự động cấp quyền

---

## 10. SAMPLE DATA CHO TEST

### MBBank notification text:
```
TK 0123456789 -500,000 VND luc 10:15:27 ngay 27/08/2026. So du: 1,234,567 VND. Noi dung: Chuyen tien cho Nguyen Van A
```

### Vietcombank notification text:
```
So du tai khoan 1234xxx da thay doi +3,500,000 VND. Thoi gian: 11:20:33 27/08/2026. Noi dung: Chuyen khoan tu Le Van C
```

### Techcombank notification text:
```
Giao dich thanh cong -850,000 VND luc 16:45:22 ngay 27/08/2026. So du kha dung: 2,150,000 VND. Nhan gui: Hoang Van E
```

### Expected output (POST body):
```json
{
  "application": "MBBank",
  "time": "2026-08-27T10:15:27+07:00",
  "money": -500000,
  "detail": "Chuyen tien cho Nguyen Van A"
}
```
