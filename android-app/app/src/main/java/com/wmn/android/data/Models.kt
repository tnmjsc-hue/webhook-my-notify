package com.wmn.android.data

import kotlinx.serialization.Serializable

@Serializable
data class NotifyPayload(
    val application: String,
    val time: String,
    val money: Double,
    val detail: String
)

data class AppNotification(
    val appName: String,
    val packageName: String,
    val notifications: List<NotificationItem>
)

data class NotificationItem(
    val title: String,
    val text: String,
    val timestamp: Long
)

data class AppNotificationConfig(
    val packageName: String,
    val appName: String,
    val isEnabled: Boolean = false,
    val timeRegex: String = "",
    val moneyRegex: String = "",
    val detailRegex: String = ""
)

data class UserProfile(
    val id: String,
    val email: String,
    val fullName: String,
    val apiKey: String = "",
    val apiKeyPrefix: String = "",
    val isActive: Boolean = false
)

data class AuthState(
    val isLoggedIn: Boolean = false,
    val isLoading: Boolean = true,
    val email: String = "",
    val error: String? = null
)
