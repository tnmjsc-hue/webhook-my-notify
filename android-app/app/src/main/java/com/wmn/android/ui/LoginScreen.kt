package com.wmn.android.ui

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.wmn.android.Routes
import com.wmn.android.data.PrefsManager
import com.wmn.android.network.ApiClient
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(navController: NavHostController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val prefsManager = remember { PrefsManager(context) }

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var showPassword by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val session = prefsManager.getSession()
        if (session != null) {
            navController.navigate(Routes.HOME) {
                popUpTo(Routes.LOGIN) { inclusive = true }
            }
        }
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "WMN Notify",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Text(
                    text = "Đăng nhập để sử dụng",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    leadingIcon = {
                        Icon(Icons.Default.Email, contentDescription = null)
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Mật khẩu") },
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = null)
                    },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Text(
                                text = if (showPassword) "  " else "  ",
                                fontSize = 12.sp
                            )
                        }
                    },
                    singleLine = true,
                    visualTransformation = if (showPassword) VisualTransformation.None
                        else PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                AnimatedVisibility(visible = error != null) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = error ?: "",
                            modifier = Modifier.padding(12.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            fontSize = 13.sp
                        )
                    }
                }

                Button(
                    onClick = {
                        if (email.isBlank() || password.isBlank()) {
                            error = "Vui lòng nhập email và mật khẩu"
                            return@Button
                        }
                        isLoading = true
                        error = null
                        scope.launch {
                            val result = ApiClient.signIn(email.trim(), password)
                            result.fold(
                                onSuccess = { session ->
                                    val apiKeyResult = ApiClient.getApiKey(session.accessToken)
                                    val apiKeyPrefix = apiKeyResult.getOrElse { "" }

                                    prefsManager.saveSession(
                                        accessToken = session.accessToken,
                                        refreshToken = session.refreshToken,
                                        userId = session.userId,
                                        email = session.email.ifBlank { email },
                                        fullName = session.fullName.ifBlank { email }
                                    )
                                    prefsManager.saveApiKey("", apiKeyPrefix)

                                    isLoading = false
                                    navController.navigate(Routes.HOME) {
                                        popUpTo(Routes.LOGIN) { inclusive = true }
                                    }
                                },
                                onFailure = { e ->
                                    isLoading = false
                                    error = e.message ?: "Đăng nhập thất bại"
                                }
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Đăng nhập", fontSize = 16.sp)
                    }
                }

                Text(
                    text = "Sử dụng tài khoản đã đăng ký trên webhook-my-notify.vercel.app",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    lineHeight = 16.sp
                )
            }
        }
    }
}
