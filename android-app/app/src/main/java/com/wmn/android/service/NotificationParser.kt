package com.wmn.android.service

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.regex.Pattern

object NotificationParser {

    private val moneyPatterns = listOf(
        Pattern.compile("""[+-]?\s*[\d.,]+\s*(?:VNĐ|VND|đ)""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""(?:số tiền|tiền|amount|value|giaTri)[\s:]*[+-]?\s*[\d.,]+""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""[+-]?\s*\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?"""),
        Pattern.compile("""[+-]?\s*\d+(?:,\d{3})+(?:\.\d{1,2})?"""),
        Pattern.compile("""[+-]?\s*\d+(?:\.\d{1,2})?"""),
    )

    private val timePatterns = listOf(
        Pattern.compile("""\d{1,2}[:/]\d{2}(?:[:/]\d{2})?(?:\s*(?:AM|PM))?""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""\d{1,2}\s*(?:h|giờ|hour)""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""(?:ngày|date|time)[\s:]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})"""),
    )

    fun extractMoney(text: String): Double? {
        for (pattern in moneyPatterns) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                val raw = matcher.group()
                val cleaned = raw.replace(Regex("[^\\d.,+-]"), "")
                    .replace(",", "")
                    .replace(".", "")
                val numberStr = raw.replace(Regex("[^\\d.,+-]"), "")
                    .trim()

                val normalized = normalizeMoneyString(numberStr)
                val value = parseMoneyValue(normalized)
                if (value != null && value > 0) return value
            }
        }
        return null
    }

    private fun normalizeMoneyString(raw: String): String {
        val cleaned = raw.replace(",", ".").trim()
        val hasCommaThousands = raw.contains(",") && raw.contains(".")
        return if (hasCommaThousands) {
            cleaned.replace(",", "")
        } else {
            cleaned
        }
    }

    private fun parseMoneyValue(text: String): Double? {
        return try {
            text.toDoubleOrNull()
        } catch (_: Exception) {
            null
        }
    }

    fun extractTime(text: String, fallbackTimestamp: Long): String {
        for (pattern in timePatterns) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                val timeStr = matcher.group().trim()
                val parsed = parseTimeString(timeStr)
                if (parsed != null) return parsed
            }
        }
        return formatTimestamp(fallbackTimestamp)
    }

    private fun parseTimeString(timeStr: String): String? {
        try {
            val formats = listOf(
                "HH:mm", "HH:mm:ss", "h:mm a",
                "dd/MM/yyyy", "dd/MM/yy", "dd-MM-yyyy",
                "dd/MM/yyyy HH:mm", "dd/MM/yy HH:mm"
            )
            for (fmt in formats) {
                try {
                    val sdf = SimpleDateFormat(fmt, Locale.getDefault())
                    val date = sdf.parse(timeStr) ?: continue
                    val cal = Calendar.getInstance()
                    val now = Calendar.getInstance()
                    if (fmt.contains("yyyy") || fmt.contains("yy")) {
                        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.getDefault()).format(date)
                    } else {
                        cal.time = date
                        cal.set(Calendar.YEAR, now.get(Calendar.YEAR))
                        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.getDefault()).format(cal.time)
                    }
                } catch (_: Exception) { }
            }
        } catch (_: Exception) { }
        return null
    }

    fun extractDetail(text: String, title: String): String {
        val combined = "$title $text".trim()
        val detailPatterns = listOf(
            Pattern.compile("""(?:nội dung|nội dung CK|chuyển khoản|giao dịch|description|memo|detail|noidung)[\s:]+(.+)""", Pattern.CASE_INSENSITIVE),
            Pattern.compile("""(?:từ|from|sender|người gửi)[\s:]+(.+)""", Pattern.CASE_INSENSITIVE),
            Pattern.compile("""(?:đến|to|receiver|người nhận)[\s:]+(.+)""", Pattern.CASE_INSENSITIVE),
        )

        for (pattern in detailPatterns) {
            val matcher = pattern.matcher(combined)
            if (matcher.find()) {
                return matcher.group(1)?.trim()?.take(200) ?: ""
            }
        }

        val lines = combined.split("\n").map { it.trim() }.filter { it.isNotEmpty() }
        if (lines.isNotEmpty()) {
            return lines.last().take(200)
        }
        return combined.take(200)
    }

    private fun formatTimestamp(timestamp: Long): String {
        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.getDefault())
            .format(java.util.Date(timestamp))
    }

    fun isBankNotification(title: String, text: String): Boolean {
        val combined = "$title $text".lowercase()
        val bankKeywords = listOf(
            "chuyển tiền", "chuyen tien", "giao dịch", "giao dich",
            "nhận tiền", "nhan tien", "trừ tiền", "tru tien",
            "số dư", "so du", "tài khoản", "tai khoan",
            "transfer", "payment", "received", "debited", "credited",
            "VNĐ", "VND", "đồng", "dong", "tiền", "tien",
            "MBBank", "Vietcombank", "Techcombank", "BIDV", "VietinBank",
            "Agribank", "ACB", "Sacombank", "TPBank", "VIB",
            "MSB", "HDBank", "SHB", "VPBank", "OCB"
        )
        return bankKeywords.any { combined.contains(it) }
    }
}
