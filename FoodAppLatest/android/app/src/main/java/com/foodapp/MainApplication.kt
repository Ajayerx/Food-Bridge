package com.foodapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import org.maplibre.android.MapLibre
import org.maplibre.reactnative.http.CustomHeadersInterceptor

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
            }
        override fun getJSMainModuleName(): String = "index"
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }

    // ── FIX: Set headers BEFORE getInstance so OkHttp interceptor
    // is wired into the client before any tile request fires.
    // Setting them after getInstance means the first batch of tile
    // requests goes out without the User-Agent and gets canceled by
    // CartoDB/OSM servers that require a valid UA string.
    CustomHeadersInterceptor.INSTANCE.addHeader(
      "User-Agent",
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    )
    CustomHeadersInterceptor.INSTANCE.addHeader(
      "Accept",
      "image/png,image/*;q=0.9,*/*;q=0.8"
    )
    CustomHeadersInterceptor.INSTANCE.addHeader(
      "Accept-Language",
      "en-US,en;q=0.9"
    )

    // ── Initialize MapLibre AFTER headers are registered ─────────────────
    MapLibre.getInstance(this)
  }
}