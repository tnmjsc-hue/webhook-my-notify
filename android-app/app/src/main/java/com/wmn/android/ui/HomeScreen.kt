package com.wmn.android.ui

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.wmn.android.Routes
import com.wmn.android.data.PrefsManager
import com.wmn.android.service.NotificationListenerServiceImpl
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(navController: NavHostController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val prefsManager = remember { PrefsManager(context) }
    val collectedApps by NotificationListenerServiceImpl.collectedApps.collectAsState()
    val isListenerRunning by NotificationListenerServiceImpl.isRunning.collectAsState()
    var session by remember { mutableStateOf<com.wmn.android.data.SessionData?>(null) }
    var isNotificationAccessEnabled by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        session = prefsManager.getSession()
        isNotificationAccessEnabled = isNotificationAccessEnabled()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("WMN Notify", fontWeight = FontWeight.Bold)
                },
                actions = {
                    IconButton(onClick = {
                        navController.navigate(Routes.SETTINGS)
                    }) {
                        Icon(Icons.Default.Settings, contentDescription = "Cài đặt")
                    }
                    IconButton(onClick = {
                        scope.launch {
                            prefsManager.clearSession()
                            navController.navigate(Routes.LOGIN) {
                                popUpTo(Routes.HOME) { inclusive = true }
                            }
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Đăng xuất")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // API Key info
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "API Key",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            session?.apiKeyPrefix?.let { "Key prefix: $it" } ?: "Chưa có API Key",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Tạo API Key tại: webhook-my-notify.vercel.app/dashboard/api-keys",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                        )
                    }
                }
            }

            // Listener status
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isListenerRunning && isNotificationAccessEnabled)
                            MaterialTheme.colorScheme.secondaryContainer
                        else
                            MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (isListenerRunning && isNotificationAccessEnabled)
                                Icons.Default.CheckCircle
                            else
                                Icons.Default.Warning,
                            contentDescription = null,
                            tint = if (isListenerRunning && isNotificationAccessEnabled)
                                MaterialTheme.colorScheme.secondary
                            else
                                MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                if (isListenerRunning && isNotificationAccessEnabled)
                                    "Đang đọc thông báo"
                                else
                                    "Chưa được cấp quyền",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            if (!isNotificationAccessEnabled) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Button(
                                    onClick = {
                                        context.startActivity(
                                            Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                                        )
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.error
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Cấp quyền ngay", fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }

            // User info
            item {
                Card(
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(
                                    MaterialTheme.colorScheme.primary,
                                    CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                session?.fullName?.take(1)?.uppercase() ?: "?",
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 20.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                session?.fullName ?: "User",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            Text(
                                session?.email ?: "",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Collected apps header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Ứng dụng đã thu thập",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                    Text(
                        "${collectedApps.size} app",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (collectedApps.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .padding(32.dp)
                                .fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.Notifications,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Chưa có thông báo nào",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                "Đợi thông báo từ ứng dụng thanh toán",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            items(collectedApps.values.toList()) { app ->
                Card(
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .animateContentSize(),
                    onClick = {
                        navController.navigate("app_config/${app.packageName}")
                    }
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                app.appName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                "${app.notifications.size} thông báo",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        app.notifications.take(3).forEach { notif ->
                            Card(
                                shape = RoundedCornerShape(8.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp)
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(
                                        notif.title,
                                        fontWeight = FontWeight.Medium,
                                        fontSize = 13.sp,
                                        maxLines = 1
                                    )
                                    Text(
                                        notif.text.take(100),
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2
                                    )
                                }
                            }
                        }

                        if (app.notifications.size > 3) {
                            Text(
                                "... và ${app.notifications.size - 3} thông báo khác",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

private suspend fun isNotificationAccessEnabled(): Boolean {
    return try {
        val cn = ComponentName("com.wmn.android", "com.wmn.android.service.NotificationListenerServiceImpl")
        val flat = Settings.Secure.getString(
            kotlinx.coroutines.Dispatchers.IO.let {
                android.app.ActivityThread.currentApplication()?.contentResolver
            },
            Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS.let {
                "enabled_notification_listeners"
            }
        )
        flat?.contains(cn.flattenToString()) == true
    } catch (_: Exception) {
        false
    }
}
