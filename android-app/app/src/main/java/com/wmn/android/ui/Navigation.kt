package com.wmn.android.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

object Routes {
    const val LOGIN = "login"
    const val HOME = "home"
    const val SETTINGS = "settings"
    const val APP_CONFIG = "app_config/{packageName}"
}

@Composable
fun WMNNavHost() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = Routes.LOGIN) {
        composable(Routes.LOGIN) {
            LoginScreen(navController = navController)
        }
        composable(Routes.HOME) {
            HomeScreen(navController = navController)
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(navController = navController)
        }
        composable(Routes.APP_CONFIG) { backStackEntry ->
            val packageName = backStackEntry.arguments?.getString("packageName") ?: ""
            AppConfigScreen(
                navController = navController,
                packageName = packageName
            )
        }
    }
}
