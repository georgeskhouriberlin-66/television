package com.phoenizia.tv

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

object UpdateInstaller {

    interface ProgressCallback {
        fun onProgress(percent: Int)
        fun onComplete(file: File)
        fun onError(message: String)
    }

    fun downloadAndInstall(activity: Activity, apkUrl: String, callback: ProgressCallback) {
        android.util.Log.i("PVTV", "Update: starting download from $apkUrl")
        activity.runOnUiThread {
            Toast.makeText(activity, "Download gestartet...", Toast.LENGTH_SHORT).show()
        }

        Thread {
            try {
                val apkFile = File(activity.cacheDir, "phoenicia-update.apk")
                if (apkFile.exists()) apkFile.delete()

                android.util.Log.i("PVTV", "Update: downloading to ${apkFile.absolutePath}")
                downloadWithProgress(apkUrl, apkFile, callback)
                android.util.Log.i("PVTV", "Update: download complete, size=${apkFile.length()}")

                activity.runOnUiThread {
                    try {
                        callback.onComplete(apkFile)
                        installApk(activity, apkFile)
                    } catch (e: Exception) {
                        android.util.Log.e("PVTV", "Update install UI failed: ${e.message}", e)
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("PVTV", "Update download failed: ${e.message}", e)
                activity.runOnUiThread {
                    try {
                        callback.onError(e.message ?: "Unbekannter Fehler")
                    } catch (_: Exception) {}
                }
            }
        }.start()
    }

    private fun downloadWithProgress(urlStr: String, targetFile: File, callback: ProgressCallback) {
        var currentUrl = urlStr
        val maxRedirects = 10

        for (redirectCount in 0..maxRedirects) {
            android.util.Log.i("PVTV", "Update HTTP: connecting to $currentUrl (redirect #$redirectCount)")

            val conn = URL(currentUrl).openConnection() as HttpURLConnection
            conn.connectTimeout = 30_000
            conn.readTimeout = 60_000
            conn.instanceFollowRedirects = false
            conn.setRequestProperty("User-Agent", "PhoeniciaTV/Android")
            conn.setRequestProperty("Accept", "*/*")
            conn.connect()

            val code = conn.responseCode
            android.util.Log.i("PVTV", "Update HTTP: response code=$code for $currentUrl")

            if (code in 301..308) {
                val location = conn.getHeaderField("Location")
                conn.disconnect()
                if (location == null) throw Exception("Redirect $code without Location header")
                currentUrl = if (location.startsWith("http")) location
                             else URL(URL(currentUrl), location).toExternalForm()
                android.util.Log.i("PVTV", "Update HTTP: redirecting to $currentUrl")
                continue
            }

            if (code != 200) {
                conn.disconnect()
                throw Exception("HTTP $code from $currentUrl")
            }

            val total = conn.contentLength.toLong()
            android.util.Log.i("PVTV", "Update HTTP: downloading $total bytes")

            conn.inputStream.use { input ->
                targetFile.outputStream().use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int
                    var totalRead = 0L
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        totalRead += bytesRead
                        if (total > 0) {
                            val percent = ((totalRead * 100) / total).toInt()
                            callback.onProgress(percent.coerceAtMost(99))
                        }
                    }
                    android.util.Log.i("PVTV", "Update HTTP: downloaded $totalRead bytes to ${targetFile.absolutePath}")
                    callback.onProgress(100)
                }
            }
            conn.disconnect()
            return
        }

        throw Exception("Too many redirects (>$maxRedirects)")
    }

    private fun installApk(context: Context, apkFile: File) {
        if (!apkFile.exists() || apkFile.length() == 0L) {
            android.util.Log.e("PVTV", "Update: APK file missing or empty: ${apkFile.absolutePath}")
            Toast.makeText(context, "APK-Datei ungültig", Toast.LENGTH_LONG).show()
            return
        }

        android.util.Log.i("PVTV", "Update: installing APK (${apkFile.length()} bytes)")

        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            apkFile
        )

        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        try {
            context.startActivity(installIntent)
        } catch (e: Exception) {
            android.util.Log.e("PVTV", "Install failed: ${e.message}")
            Toast.makeText(context, "Installation nicht möglich. Bitte APK manuell installieren.", Toast.LENGTH_LONG).show()
        }
    }
}
