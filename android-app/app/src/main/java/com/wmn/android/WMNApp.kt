package com.wmn.android

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest

class WMNApp : Application() {

    lateinit var supabase: SupabaseClient
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        supabase = createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Auth)
            install(Postgrest)
        }
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            val channel = NotificationChannel(
                CHANNEL_ID,
                "WMN Background Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps WMN notification reader running"
                setShowBadge(false)
            }
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID = "wmn_background"
        const val API_BASE_URL = "https://webhook-my-notify.vercel.app"
        lateinit var instance: WMNApp
            private set
    }
}
