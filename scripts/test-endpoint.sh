# ============================================
# WMN Notify Endpoint - cURL example
# Dùng trong terminal (bash / Windows Terminal)
# ============================================

# 1) Gửi nhận tiền (dương)
curl -X POST https://webhook-my-notify.vercel.app/api/wmn_endpoint \
  -H "X-API-Key: wmn_live_AAAAAAAAAAAAAAAAAAAAAAAA" \
  -H "Content-Type: application/json" \
  -d '{
    "application": "MBBank",
    "time": "2026-08-27T14:20:00+07:00",
    "money": 2000000,
    "detail": "Luong thang 08"
  }'

# 2) Gửi chi tiền (âm)
curl -X POST https://webhook-my-notify.vercel.app/api/wmn_endpoint \
  -H "X-API-Key: wmn_live_AAAAAAAAAAAAAAAAAAAAAAAA" \
  -H "Content-Type: application/json" \
  -d '{
    "application": "Techcombank",
    "time": "2026-08-27T16:45:22+07:00",
    "money": -850000,
    "detail": "Thanh toan hoa don dien"
  }'
