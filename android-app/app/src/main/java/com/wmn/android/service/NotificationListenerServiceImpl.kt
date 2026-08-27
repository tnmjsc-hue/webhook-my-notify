package com.wmn.android.service

import android.app.Notification
import android.app.NotificationManager
import android.content.Intent
import android.os.IBinder
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.wmn.android.data.AppNotification
import com.wmn.android.data.NotifyPayload
import com.wmn.android.data.NotificationItem
import com.wmn.android.data.PrefsManager
import com.wmn.android.network.ApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap

class NotificationListenerServiceImpl : NotificationListenerService() {

    companion object {
        private const val TAG = "NotifListener"
        private const val MAX_NOTIFICATIONS_PER_APP = 10

        private val _collectedApps = MutableStateFlow<Map<String, AppNotification>>(emptyMap())
        val collectedApps: StateFlow<Map<String, AppNotification>> = _collectedApps

        private val _isRunning = MutableStateFlow(false)
        val isRunning: StateFlow<Boolean> = _isRunning

        private val appNotifications = ConcurrentHashMap<String, MutableList<NotificationItem>>()
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var prefsManager: PrefsManager? = null

    override fun onCreate() {
        super.onCreate()
        prefsManager = PrefsManager(applicationContext)
        _isRunning.value = true
        Log.d(TAG, "NotificationListenerService created")
    }

    override fun onBind(intent: Intent?): IBinder? {
        _isRunning.value = true
        return super.onBind(intent)
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return
        if (sbn.packageName == packageName) return

        val notification = sbn.notification ?: return
        val extras = notification.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()
        val contentText = bigText ?: text

        if (contentText.isBlank()) return

        val appName = getAppNameFromPackage(sbn.packageName)
        val item = NotificationItem(
            title = title,
            text = contentText,
            timestamp = sbn.postTime
        )

        synchronized(appNotifications) {
            val list = appNotifications.getOrPut(sbn.packageName) { mutableListOf() }
            list.add(0, item)
            if (list.size > MAX_NOTIFICATIONS_PER_APP) {
                list.removeAt(list.lastIndex)
            }
        }

        val snapshot = appNotifications.mapValues { (pkg, items) ->
            AppNotification(
                appName = getAppNameFromPackage(pkg),
                packageName = pkg,
                notifications = items.toList()
            )
        }
        _collectedApps.value = snapshot

        if (NotificationParser.isBankNotification(title, contentText)) {
            processAndSend(title, contentText, sbn.postTime, appName)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Keep collected notifications even after removal
    }

    private fun processAndSend(title: String, text: String, postTime: Long, appName: String) {
        scope.launch {
            try {
                val session = prefsManager?.getSession() ?: return@launch
                val apiKey = session.apiKey
                if (apiKey.isBlank()) return@launch

                val money = NotificationParser.extractMoney(text)
                val detail = NotificationParser.extractDetail(text, title)
                val time = NotificationParser.extractTime(text, postTime)

                if (money == null) {
                    Log.d(TAG, "No money found in notification from $appName, skipping")
                    return@launch
                }

                val notifyPayload = NotifyPayload(
                    application = appName,
                    time = time,
                    money = money,
                    detail = detail
                )

                val result = ApiClient.sendNotification(apiKey, notifyPayload)
                if (result.isSuccess) {
                    Log.d(TAG, "Notification sent: $appName - $money VND")
                } else {
                    Log.e(TAG, "Failed to send: ${result.exceptionOrNull()?.message}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing notification", e)
            }
        }
    }

    private fun getAppNameFromPackage(packageName: String): String {
        return try {
            val pm = packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (_: Exception) {
            packageName
        }
    }

    override fun onDestroy() {
        _isRunning.value = false
        scope.cancel()
        super.onDestroy()
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        _isRunning.value = true
        Log.d(TAG, "NotificationListener connected")
    }

    override fun onListenerDisconnected() {
        _isRunning.value = false
        Log.d(TAG, "NotificationListener disconnected")
    }
}
