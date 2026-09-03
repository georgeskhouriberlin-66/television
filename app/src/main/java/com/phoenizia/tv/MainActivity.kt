package com.phoenizia.tv

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.inputmethod.InputMethodManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                dpad("Escape", "Escape", 27)
            }
        })

        webView = WebView(this).apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT
            )
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                allowFileAccess = true
                allowContentAccess = true
                loadWithOverviewMode = true
                useWideViewPort = true
                cacheMode = WebSettings.LOAD_DEFAULT
                setOffscreenPreRaster(true)
            }
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                    return false
                }
                @Suppress("DEPRECATION")
                override fun onReceivedError(
                    view: WebView?, errorCode: Int, description: String?, failingUrl: String?
                ) {
                    if (BuildConfig.DEBUG) {
                        android.util.Log.e("PVTV", "onReceivedError $errorCode $description $failingUrl")
                    }
                    super.onReceivedError(view, errorCode, description, failingUrl)
                }
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                }
            }
            webChromeClient = object : WebChromeClient() {
                @Suppress("DEPRECATION")
                override fun onConsoleMessage(message: String, lineNumber: Int, sourceID: String?) {
                    if (BuildConfig.DEBUG) {
                        android.util.Log.i("PVTV-JS", "console[$lineNumber] $message  <- $sourceID")
                    }
                    super.onConsoleMessage(message, lineNumber, sourceID)
                }
                override fun onConsoleMessage(message: android.webkit.ConsoleMessage): Boolean {
                    if (BuildConfig.DEBUG) {
                        android.util.Log.i("PVTV-JS", "console[${message.messageLevel()}] ${message.message()}")
                    }
                    return super.onConsoleMessage(message)
                }
            }
            isFocusable = true
            isFocusableInTouchMode = true
            setBackgroundColor(android.graphics.Color.BLACK)
            addJavascriptInterface(KeyboardBridge(this@MainActivity), "Android")
            val extFile = java.io.File(filesDir, "index.html")
            if (extFile.exists()) {
                if (BuildConfig.DEBUG) android.util.Log.i("PVTV", "Loading from filesDir")
                loadUrl("file://" + extFile.absolutePath)
            } else {
                if (BuildConfig.DEBUG) android.util.Log.i("PVTV", "Loading from assets")
                loadUrl("file:///android_asset/index.html")
            }
        }

        setContentView(webView)
        webView.requestFocus()
    }

    private fun dpad(key: String, code: String, keyCode: Int): Boolean {
        if (::webView.isInitialized) {
            webView.evaluateJavascript(
                "window.__dpad && window.__dpad('$key','$code',$keyCode);",
                null
            )
        }
        return true
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            when (event.keyCode) {
                KeyEvent.KEYCODE_DPAD_UP -> return dpad("ArrowUp", "ArrowUp", 38)
                KeyEvent.KEYCODE_DPAD_DOWN -> return dpad("ArrowDown", "ArrowDown", 40)
                KeyEvent.KEYCODE_DPAD_LEFT -> return dpad("ArrowLeft", "ArrowLeft", 37)
                KeyEvent.KEYCODE_DPAD_RIGHT -> return dpad("ArrowRight", "ArrowRight", 39)
                KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER ->
                    return dpad("Enter", "Enter", 13)
                KeyEvent.KEYCODE_BACK -> return dpad("Escape", "Escape", 27)
                KeyEvent.KEYCODE_MENU -> return dpad("m", "m", 77)
                KeyEvent.KEYCODE_PAGE_UP -> return dpad("PageUp", "PageUp", 33)
                KeyEvent.KEYCODE_PAGE_DOWN -> return dpad("PageDown", "PageDown", 34)
                KeyEvent.KEYCODE_DEL -> return dpad("Backspace", "Backspace", 8)
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_MEDIA_PLAY, KeyEvent.KEYCODE_MEDIA_PAUSE ->
                    return dpad("MediaPlayPause", "MediaPlayPause", 85)
            }
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.let { controller ->
                    controller.hide(WindowInsets.Type.systemBars())
                    controller.systemBarsBehavior =
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        or android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
                        or android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        or android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized) {
            webView.onResume()
        }
    }

    override fun onPause() {
        if (::webView.isInitialized) {
            webView.onPause()
        }
        super.onPause()
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.stopLoading()
            webView.removeJavascriptInterface("Android")
            webView.removeAllViews()
            webView.destroy()
        }
        super.onDestroy()
    }

    class KeyboardBridge(private val activity: MainActivity) {
        @JavascriptInterface
        fun showKeyboard(show: Boolean) {
            activity.runOnUiThread {
                val imm = activity.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                if (show) {
                    activity.webView.requestFocus()
                    imm.showSoftInput(activity.webView, InputMethodManager.SHOW_IMPLICIT)
                } else {
                    imm.hideSoftInputFromWindow(activity.webView.windowToken, 0)
                }
            }
        }

        @JavascriptInterface
        fun checkForUpdate() {
            activity.runOnUiThread {
                Toast.makeText(activity, "Prüfe auf Updates...", Toast.LENGTH_SHORT).show()
            }
            UpdateChecker.checkForUpdate(activity, object : UpdateChecker.Callback {
                override fun onUpdateAvailable(update: UpdateChecker.UpdateInfo) {
                    activity.runOnUiThread {
                        UpdateDialog(
                            activity,
                            update,
                            onUpdate = {
                                UpdateInstaller.downloadAndInstall(
                                    activity,
                                    update.apkDownloadUrl,
                                    onComplete = { }
                                )
                            },
                            onDismiss = { }
                        ).show()
                    }
                }

                override fun onNoUpdate() {
                    activity.runOnUiThread {
                        Toast.makeText(activity, "Kein Update verfügbar", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onError(message: String) {
                    activity.runOnUiThread {
                        Toast.makeText(activity, "Update-Prüfung fehlgeschlagen: $message", Toast.LENGTH_SHORT).show()
                    }
                }
            })
        }
    }
}
