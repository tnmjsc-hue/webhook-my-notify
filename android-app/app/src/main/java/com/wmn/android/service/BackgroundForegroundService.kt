package com.wmn.android.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.wmn.android.MainActivity
import com.wmn.android.R
import com.wmn.android.WMNApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class BackgroundForegroundService : Service() {

    companion object {
        private const val TAG = "BackgroundService"
        private const val NOTIFICATION_ID = 9999
        private const val RESTART_CHECK_INTERVAL = 30_000L

        fun start(context: Context) {
            val intent = Intent(context, BackgroundForegroundService::class.java)
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, BackgroundForegroundService::class.java))
        }
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var wakeLock: PowerManager.WakeLock? = null
    private var monitorJob: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        acquireWakeLock()
        startForeground(NOTIFICATION_ID, createNotification())
        startMonitor()
        Log.d(TAG, "Background service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    private fun startMonitor() {
        monitorJob?.cancel()
        monitorJob = scope.launch {
            while (isActive) {
                delay(RESTART_CHECK_INTERVAL)
                ensureNotificationListenerRunning()
            }
        }
    }

    private fun ensureNotificationListenerRunning() {
        try {
            val nm = getSystemService(NotificationManager::class.java)
            val enabled = nm.isNotificationListenerAccessEnabled
            if (!enabled) {
                Log.w(TAG, "NotificationListener not enabled, attempting restart...")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking listener status", e)
        }
    }

    private fun acquireWakeLock() {
        try {
            val pm = getSystemService(PowerManager::class.java)
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "wmn::background_service"
            ).apply {
                acquire(60 * 60 * 1000L)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to acquire wake lock", e)
        }
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, WMNApp.CHANNEL_ID)
            .setContentTitle("WMN đang chạy")
            .setContentText("Đang đọc thông báo thanh toán...")
            .setSmallIcon(android.R.drawable.ic_popup_sync)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        monitorJob?.cancel()
        wakeLock?.let {
            if (it.isHeld) it.release()
        }
        scope.cancel()
        super.onDestroy()
        Log.d(TAG, "Background service destroyed, scheduling restart...")
        scheduleRestart()
    }

    private fun scheduleRestart() {
        try {
            val intent = Intent(applicationContext, BackgroundForegroundService::class.java)
            val pendingIntent = PendingIntent.getService(
                applicationContext, 1, intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            val alarmManager = getSystemService(android.app.AlarmManager::class.java)
            alarmManager?.setExactAndAllowWhileIdle(
                android.app.AlarmManager.ELAPSED_REALTIME_WAKEUP,
                System.currentTimeMillis() + 5000L,
                pendingIntent
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule restart", e)
        }
    }
}
