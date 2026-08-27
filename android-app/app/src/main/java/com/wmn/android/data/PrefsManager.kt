package com.wmn.android.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "wmn_prefs")

object PrefsKeys {
    val SESSION_ACCESS_TOKEN = stringPreferencesKey("session_access_token")
    val SESSION_REFRESH_TOKEN = stringPreferencesKey("session_refresh_token")
    val USER_ID = stringPreferencesKey("user_id")
    val USER_EMAIL = stringPreferencesKey("user_email")
    val USER_FULL_NAME = stringPreferencesKey("user_full_name")
    val API_KEY = stringPreferencesKey("api_key")
    val API_KEY_PREFIX = stringPreferencesKey("api_key_prefix")
    val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
    val SERVICE_RUNNING = booleanPreferencesKey("service_running")
}

class PrefsManager(private val context: Context) {

    suspend fun saveSession(
        accessToken: String,
        refreshToken: String,
        userId: String,
        email: String,
        fullName: String
    ) {
        context.dataStore.edit { prefs ->
            prefs[PrefsKeys.SESSION_ACCESS_TOKEN] = accessToken
            prefs[PrefsKeys.SESSION_REFRESH_TOKEN] = refreshToken
            prefs[PrefsKeys.USER_ID] = userId
            prefs[PrefsKeys.USER_EMAIL] = email
            prefs[PrefsKeys.USER_FULL_NAME] = fullName
            prefs[PrefsKeys.IS_LOGGED_IN] = true
        }
    }

    suspend fun saveApiKey(key: String, prefix: String) {
        context.dataStore.edit { prefs ->
            prefs[PrefsKeys.API_KEY] = key
            prefs[PrefsKeys.API_KEY_PREFIX] = prefix
        }
    }

    suspend fun getSession(): SessionData? {
        val prefs = context.dataStore.data.first()
        val isLoggedIn = prefs[PrefsKeys.IS_LOGGED_IN] ?: false
        if (!isLoggedIn) return null
        return SessionData(
            accessToken = prefs[PrefsKeys.SESSION_ACCESS_TOKEN] ?: "",
            refreshToken = prefs[PrefsKeys.SESSION_REFRESH_TOKEN] ?: "",
            userId = prefs[PrefsKeys.USER_ID] ?: "",
            email = prefs[PrefsKeys.USER_EMAIL] ?: "",
            fullName = prefs[PrefsKeys.USER_FULL_NAME] ?: "",
            apiKey = prefs[PrefsKeys.API_KEY] ?: "",
            apiKeyPrefix = prefs[PrefsKeys.API_KEY_PREFIX] ?: ""
        )
    }

    suspend fun clearSession() {
        context.dataStore.edit { it.clear() }
    }
}

data class SessionData(
    val accessToken: String,
    val refreshToken: String,
    val userId: String,
    val email: String,
    val fullName: String,
    val apiKey: String,
    val apiKeyPrefix: String
)
