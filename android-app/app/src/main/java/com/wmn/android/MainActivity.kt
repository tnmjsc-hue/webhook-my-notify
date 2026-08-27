package com.wmn.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.wmn.android.ui.WMNNavHost
import com.wmn.android.ui.theme.WMNTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            WMNTheme {
                WMNNavHost()
            }
        }
    }
}
