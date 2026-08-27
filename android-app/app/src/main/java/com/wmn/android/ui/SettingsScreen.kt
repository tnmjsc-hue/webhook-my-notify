package com.wmn.android.ui

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.wmn.android.service.NotificationListenerServiceImpl

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(navController: NavHostController) {
    val collectedApps by NotificationListenerServiceImpl.collectedApps.collectAsState()
    val isRunning by NotificationListenerServiceImpl.isRunning.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Cài đặt", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
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
            // Service status
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isRunning)
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
                            if (isRunning) Icons.Default.CheckCircle else Icons.Default.Info,
                            contentDescription = null,
                            tint = if (isRunning)
                                MaterialTheme.colorScheme.secondary
                            else
                                MaterialTheme.colorScheme.error,
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                if (isRunning) "Dịch vụ đang chạy" else "Dịch vụ đã dừng",
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                if (isRunning) "Đang đọc thông báo từ các ứng dụng"
                                    else "Bật để bắt đầu đọc thông báo",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Instructions
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Hướng dẫn",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "1. Nhấn vào ứng dụng bên dưới để cấu hình\n" +
                            "2. Chọn nút cài đặt bên cạnh mỗi dòng thông báo\n" +
                            "3. Đặt tên biến theo nội dung thông báo\n" +
                            "4. Lưu lại - ứng dụng sẽ tự động gửi dữ liệu",
                            fontSize = 12.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            // Section header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Ứng dụng (${collectedApps.size})",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }
            }

            if (collectedApps.isEmpty()) {
                item {
                    Card(shape = RoundedCornerShape(16.dp)) {
                        Column(
                            modifier = Modifier
                                .padding(32.dp)
                                .fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                "Chưa có dữ liệu",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                "Đợi thông báo từ ứng dụng thanh toán\nđể hiển thị danh sách ở đây",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            }

            items(collectedApps.values.toList()) { app ->
                Card(
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {
                        navController.navigate("app_config/${app.packageName}")
                    }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                app.appName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            Text(
                                app.packageName,
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                "${app.notifications.size} thông báo đã thu thập",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Icon(
                            Icons.Default.Settings,
                            contentDescription = "Cài đặt",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}
