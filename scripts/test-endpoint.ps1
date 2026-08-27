# WMN Notify Endpoint - Request Examples
# ============================================
# Endpoint: POST https://webhook-my-notify.vercel.app/api/wmn_endpoint
# Header:   X-API-Key: <your_api_key>
#
# QUAN TRỌNG: Bạn phải thay <YOUR_API_KEY> bằng API key THẬT
# của mình (tạo tại https://webhook-my-notify.vercel.app/dashboard/api-keys)
# Nếu dùng key không hợp lệ sẽ nhận HTTP 401.

$headers = @{
    "X-API-Key" = "wmn_live_AAAAAAAAAAAAAAAAAAAAAAAA"
    "Content-Type" = "application/json"
}

$body = @{
    application = "MBBank"
    time        = "2026-08-27T10:15:27+07:00"
    money       = -500000
    detail      = "Chuyen tien cho Nguyen Van A"
} | ConvertTo-Json

Write-Host "=== Request body ==="
Write-Host $body
Write-Host "`n=== Sending to endpoint ==="

try {
    $resp = Invoke-RestMethod -Uri "https://webhook-my-notify.vercel.app/api/wmn_endpoint" `
        -Method Post -Headers $headers -Body $body -TimeoutSec 30
    Write-Host "StatusCode: 202 Accepted"
    Write-Host "Response: $($resp | ConvertTo-Json -Compress)"
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $respBody = $_.ErrorDetails.Message
    Write-Host "Error StatusCode: $statusCode"
    Write-Host "Error Body: $respBody"
}
