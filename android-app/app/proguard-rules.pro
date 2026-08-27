-dontwarn org.jetbrains.annotations.**
-keep class kotlinx.serialization.** { *; }
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}
-keep class io.github.jan.supabase.** { *; }
