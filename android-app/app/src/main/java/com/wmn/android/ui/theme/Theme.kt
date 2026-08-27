package com.wmn.android.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val LightColors = lightColorScheme(
    primary = Color(0xFF1B5E20),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFA5D6A7),
    onPrimaryContainer = Color(0xFF002204),
    secondary = Color(0xFF4CAF50),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFC8E6C9),
    onSecondaryContainer = Color(0xFF002204),
    surface = Color(0xFFFCFDF6),
    onSurface = Color(0xFF1A1C19),
    surfaceVariant = Color(0xFFE0E5DA),
    onSurfaceVariant = Color(0xFF43493E),
    error = Color(0xFFBA1A1A),
    background = Color(0xFFF8FAF0),
    onBackground = Color(0xFF1A1C19),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF8BC68F),
    onPrimary = Color(0xFF00390A),
    primaryContainer = Color(0xFF005314),
    onPrimaryContainer = Color(0xFFA5D6A7),
    secondary = Color(0xFFB1CCB4),
    onSecondary = Color(0xFF00390A),
    secondaryContainer = Color(0xFF1F5127),
    onSecondaryContainer = Color(0xFFC8E6C9),
    surface = Color(0xFF1A1C19),
    onSurface = Color(0xFFE2E3DD),
    surfaceVariant = Color(0xFF43493E),
    onSurfaceVariant = Color(0xFFC3C9BD),
    error = Color(0xFFFFB4AB),
    background = Color(0xFF1A1C19),
    onBackground = Color(0xFFE2E3DD),
)

@Composable
fun WMNTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColors
        else -> LightColors
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
