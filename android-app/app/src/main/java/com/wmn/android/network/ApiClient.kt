package com.wmn.android.network

import android.util.Log
import com.wmn.android.WMNApp
import com.wmn.android.data.NotifyPayload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object ApiClient {
    private const val TAG = "ApiClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val json = Json { ignoreUnknownKeys = true }

    suspend fun signIn(email: String, password: String): Result<SessionResponse> =
        withContext(Dispatchers.IO) {
            try {
                val body = JSONObject().apply {
                    put("email", email)
                    put("password", password)
                }

                val request = Request.Builder()
                    .url("${WMNApp.API_BASE_URL}/api/auth/v1/token?grant_type=password")
                    .post(body.toString().toRequestBody("application/json".toMediaType()))
                    .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                    .addHeader("Content-Type", "application/json")
                    .build()

                val response = client.newCall(request).execute()
                val responseBody = response.body?.string() ?: ""

                if (response.isSuccessful) {
                    val jsonResp = JSONObject(responseBody)
                    Result.success(
                        SessionResponse(
                            accessToken = jsonResp.optString("access_token", ""),
                            refreshToken = jsonResp.optString("refresh_token", ""),
                            userId = jsonResp.getJSONObject("user").optString("id", ""),
                            email = jsonResp.getJSONObject("user").optJSONObject("app_metadata")
                                ?.optString("email", "") ?: "",
                            fullName = jsonResp.getJSONObject("user").optJSONObject("user_metadata")
                                ?.optString("full_name", "") ?: ""
                        )
                    )
                } else {
                    val errorMsg = try {
                        JSONObject(responseBody).optString("error_description", "Login failed")
                    } catch (_: Exception) {
                        "Login failed"
                    }
                    Result.failure(Exception(errorMsg))
                }
            } catch (e: Exception) {
                Log.e(TAG, "SignIn error", e)
                Result.failure(e)
            }
        }

    suspend fun getApiKey(accessToken: String): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val request = Request.Builder()
                    .url("${WMNApp.API_BASE_URL}/rest/v1/api_keys?select=key_prefix,is_active&is_active=eq.true&order=created_at.desc&limit=1")
                    .get()
                    .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                    .addHeader("Authorization", "Bearer $accessToken")
                    .build()

                val response = client.newCall(request).execute()
                val responseBody = response.body?.string() ?: "[]"

                if (response.isSuccessful) {
                    val arr = org.json.JSONArray(responseBody)
                    if (arr.length() > 0) {
                        val prefix = arr.getJSONObject(0).optString("key_prefix", "")
                        Result.success(prefix)
                    } else {
                        Result.success("")
                    }
                } else {
                    Result.success("")
                }
            } catch (e: Exception) {
                Log.e(TAG, "GetApiKey error", e)
                Result.failure(e)
            }
        }

    suspend fun sendNotification(
        apiKey: String,
        payload: NotifyPayload
        ): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val body = json.encodeToString(payload)

                val request = Request.Builder()
                    .url("${WMNApp.API_BASE_URL}/api/wmn_endpoint")
                    .post(body.toRequestBody("application/json".toMediaType()))
                    .addHeader("X-API-Key", apiKey)
                    .addHeader("Content-Type", "application/json")
                    .build()

                val response = client.newCall(request).execute()
                val code = response.code
                response.close()

                if (code == 200 || code == 202) {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception("HTTP $code"))
                }
            } catch (e: Exception) {
                Log.e(TAG, "SendNotification error", e)
                Result.failure(e)
            }
        }
}

data class SessionResponse(
    val accessToken: String,
    val refreshToken: String,
    val userId: String,
    val email: String,
    val fullName: String
)
