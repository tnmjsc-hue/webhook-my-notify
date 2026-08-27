# WMN Notify Android App

Android app đọc thông báo thanh toán và gửi về webhook-my-notify.vercel.app

## Tính năng

- **Đăng nhập** bằng tài khoản Supabase đã có trên webhook-my-notify.vercel.app
- **Đọc thông báo** từ các ứng dụng thanh toán (MBBank, Vietcombank, Techcombank...)
- **Tự động gửi** dữ liệu về server qua API key
- **Chạy nền** liên tục, chống tắt app
- **Cấu hình** hiển thị thông báo và các biến gửi về

## Yêu cầu

- Android 8.0+ (API 26)
- Android Studio Hedgehog (2023.1.1) trở lên
- JDK 17

## Cài đặt

### 1. Mở project trong Android Studio

```
cd android-app
```

Mở thư mục `android-app` trong Android Studio.

### 2. Sync Gradle

Android Studio sẽ tự động sync. Nếu không, nhấn `File > Sync Project with Gradle Files`.

### 3. Chạy app

Kết nối thiết bị Android hoặc emulator, nhấn `Run`.

## Cách sử dụng

### Bước 1: Đăng nhập

- Nhập email và mật khẩu đã đăng ký trên webhook-my-notify.vercel.app
- Nhấn "Đăng nhập"

### Bước 2: Cấp quyền đọc thông báo

- Trên màn hình chính, nhấn "Cấp quyền ngay" hoặc vào:
  **Cài đặt > Ứng dụng > Trợ lý ảo > WMN Notify**
- Bật quyền "Đọc thông báo"

### Bước 3: Cấu hình API Key

- Đăng nhập vào webhook-my-notify.vercel.app/dashboard/api-keys
- Tạo API Key mới
- Copy API Key (hiển thị 1 lần)

### Bước 4: Cấu hình gửi dữ liệu

- Trên màn hình Settings, chọn ứng dụng cần cấu hình
- Nhấn nút cài đặt bên cạnh mỗi dòng thông báo
- Bật/tắt "Gửi về server"
- Kiểm tra các biến:
  - `application`: Tên ứng dụng
  - `time`: Thời gian
  - `money`: Số tiền
  - `detail`: Nội dung chuyển khoản
- Nhấn "Lưu cài đặt"

### Bước 5: App chạy nền

- App sẽ tự động chạy nền
- Khi có thông báo thanh toán, tự động gửi về server
- Không cần mở app

## Cấu trúc dữ liệu gửi về server

```json
{
    "application": "MBBank",
    "time": "2026-08-27T10:15:00+07:00",
    "money": 500000,
    "detail": "Chuyen tien tu Nguyen Van A"
}
```

## Quan trọng

- **KHÔNG** gửi toàn bộ nội dung thông báo - sẽ bị Google ban
- Chỉ gửi các trường: `application`, `time`, `money`, `detail`
- App cần được cấp quyền "Đọc thông báo" để hoạt động
- App cần được bật "Cho phép chạy nền" trên một số thiết bị

## Xây dựng APK

```
./gradlew assembleRelease
```

APK sẽ nằm trong `app/build/outputs/apk/release/`

## Gỡ lỗi

Xem log tại Android Studio Logcat với tag:
- `NotifListener`: NotificationListenerService
- `BackgroundService`: BackgroundForegroundService
- `ApiClient`: API calls
