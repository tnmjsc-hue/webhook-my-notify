package com.wmn.android.ui

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.wmn.android.service.NotificationListenerServiceImpl
import com.wmn.android.service.NotificationParser

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppConfigScreen(navController: NavHostController, packageName: String) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val collectedApps by NotificationListenerServiceImpl.collectedApps.collectAsState()
    val app = collectedApps[packageName]

    var showSaveDialog by remember { mutableStateOf(false) }

    val configs = remember { mutableStateMapOf<Int, AppConfigData>() }

    if (app == null) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Không tìm thấy ứng dụng", fontSize = 16.sp)
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(app.appName, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        showSaveDialog = true
                    }) {
                        Icon(Icons.Default.Check, contentDescription = "Lưu")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Info card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Info,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.tertiary,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            "Cấu hình dữ liệu gửi về server cho từng thông báo. " +
                            "Nhấn nút cài đặt bên cạnh mỗi dòng để thiết lập biến.",
                            fontSize = 12.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            itemsIndexed(app.notifications) { index, notification ->
                Card(
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        // Notification preview
                        Text(
                            notification.title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            maxLines = 1
                        )
                        Text(
                            notification.text.take(150),
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 3,
                            modifier = Modifier.padding(top = 4.dp)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Config toggle
                        val config = configs.getOrPut(index) {
                            AppConfigData(
                                application = app.appName,
                                time = java.text.SimpleDateFormat(
                                    "yyyy-MM-dd'T'HH:mm:ssXXX",
                                    java.util.Locale.getDefault()
                                ).format(java.util.Date(notification.timestamp)),
                                money = "",
                                detail = "",
                                isEnabled = false
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Gửi về server",
                                fontSize = 13.sp
                            )
                            Switch(
                                checked = config.isEnabled,
                                onCheckedChange = { enabled ->
                                    configs[index] = config.copy(isEnabled = enabled)
                                    if (enabled) {
                                        // Auto-fill money from notification
                                        val money = extractMoneyPreview(notification.text)
                                        val time = extractTimePreview(notification.text)
                                        val detail = extractDetailPreview(notification.text)
                                        configs[index] = config.copy(
                                            isEnabled = true,
                                            money = money ?: "",
                                            time = time ?: "",
                                            detail = detail
                                        )
                                    }
                                },
                                colors = SwitchDefaults.colors(
                                    checkedTrackColor = MaterialTheme.colorScheme.primary
                                )
                            )
                        }

                        // Config fields when enabled
                        if (config.isEnabled) {
                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedTextField(
                                value = config.application,
                                onValueChange = {
                                    configs[index] = config.copy(application = it)
                                },
                                label = { Text("application (tên app)") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedTextField(
                                value = config.money,
                                onValueChange = {
                                    configs[index] = config.copy(money = it)
                                },
                                label = { Text("money (số tiền)") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedTextField(
                                value = config.time,
                                onValueChange = {
                                    configs[index] = config.copy(time = it)
                                },
                                label = { Text("time (thời gian)") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedTextField(
                                value = config.detail,
                                onValueChange = {
                                    configs[index] = config.copy(detail = it)
                                },
                                label = { Text("detail (nội dung)") },
                                modifier = Modifier.fillMaxWidth(),
                                maxLines = 3,
                                shape = RoundedCornerShape(8.dp)
                            )
                        }
                    }
                }
            }

            // Save button at bottom
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = { showSaveDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Lưu cài đặt", fontSize = 16.sp)
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    if (showSaveDialog) {
        AlertDialog(
            onDismissRequest = { showSaveDialog = false },
            title = { Text("Lưu cài đặt") },
            text = {
                val enabledCount = configs.values.count { it.isEnabled }
                Text("Lưu cài đặt cho $enabledCount thông báo sẽ gửi về server?")
            },
            confirmButton = {
                TextButton(onClick = {
                    showSaveDialog = false
                    saveConfigs(context, app.appName, configs)
                    Toast.makeText(context, "Đã lưu cài đặt", Toast.LENGTH_SHORT).show()
                    navController.popBackStack()
                }) {
                    Text("Lưu")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSaveDialog = false }) {
                    Text("Hủy")
                }
            }
        )
    }
}

private fun saveConfigs(
    context: Context,
    appName: String,
    configs: Map<Int, AppConfigData>
) {
    val prefs = context.getSharedPreferences("app_configs", Context.MODE_PRIVATE)
    val editor = prefs.edit()
    val enabledConfigs = configs.values.filter { it.isEnabled }
    val jsonStr = enabledConfigs.joinToString(separator = "|||") { cfg ->
        "${cfg.application}|${cfg.time}|${cfg.money}|${cfg.detail}"
    }
    editor.putString("config_${appName.hashCode()}", jsonStr)
    editor.apply()
}

private fun extractMoneyPreview(text: String): String? {
    val result = NotificationParser.extractMoney(text)
    return result?.toString()
}

private fun extractTimePreview(text: String): String? {
    return NotificationParser.extractTime(text, System.currentTimeMillis())
}

private fun extractDetailPreview(text: String): String {
    return NotificationParser.extractDetail(text, "")
}
