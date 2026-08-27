package com.wmn.android.ui

import kotlinx.serialization.Serializable

@Serializable
data class AppConfigData(
    val application: String,
    val time: String,
    val money: String,
    val detail: String,
    val isEnabled: Boolean
)
