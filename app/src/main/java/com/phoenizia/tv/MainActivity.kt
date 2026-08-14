package com.phoenizia.tv

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT
            )
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                allowFileAccess = true
                allowContentAccess = true
                loadWithOverviewMode = true
                useWideViewPort = true
                cacheMode = WebSettings.LOAD_DEFAULT
                @Suppress("DEPRECATION")
                setRenderPriority(WebSettings.RenderPriority.HIGH)
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
                    android.util.Log.e("PVTV", "onReceivedError $errorCode $description $failingUrl")
                    super.onReceivedError(view, errorCode, description, failingUrl)
                }
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(message: String, lineNumber: Int, sourceID: String?) {
                    android.util.Log.i("PVTV-JS", "console[$lineNumber] $message  <- $sourceID")
                    super.onConsoleMessage(message, lineNumber, sourceID)
                }
                override fun onConsoleMessage(message: android.webkit.ConsoleMessage): Boolean {
                    android.util.Log.i("PVTV-JS", "console[${message.messageLevel()}] ${message.message()}")
                    return super.onConsoleMessage(message)
                }
            }
            isFocusable = true
            isFocusableInTouchMode = true
            setBackgroundColor(android.graphics.Color.BLACK)
            addJavascriptInterface(KeyboardBridge(), "Android")
            // Try loading from external files dir first (allows hot-swap via ADB push)
            val extFile = java.io.File(filesDir, "index.html")
            if (extFile.exists()) {
                android.util.Log.i("PVTV", "Loading from filesDir: ${extFile.absolutePath}")
                loadUrl("file://" + extFile.absolutePath)
            } else {
                android.util.Log.i("PVTV", "Loading from assets (no override found)")
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

    inner class KeyboardBridge {
        @JavascriptInterface
        fun showKeyboard(show: Boolean) {
            runOnUiThread {
                val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                if (show) {
                    webView.requestFocus()
                    imm.showSoftInput(webView, InputMethodManager.SHOW_IMPLICIT)
                } else {
                    imm.hideSoftInputFromWindow(webView.windowToken, 0)
                }
            }
        }
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

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (!dpad("Escape", "Escape", 27)) {
            super.onBackPressed()
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_BACK -> return dpad("Escape", "Escape", 27)
            KeyEvent.KEYCODE_MENU -> return dpad("m", "m", 77)
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        }
    }
}
