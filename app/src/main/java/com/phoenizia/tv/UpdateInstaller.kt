package com.phoenizia.tv

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

object UpdateInstaller {

    private var downloadId: Long = -1
    private var receiver: BroadcastReceiver? = null

    fun downloadAndInstall(activity: android.app.Activity, apkUrl: String, onComplete: () -> Unit) {
        android.util.Log.i("PVTV", "Update: starting download from $apkUrl")
        activity.runOnUiThread {
            Toast.makeText(activity, "Download gestartet...", Toast.LENGTH_SHORT).show()
        }

        val dm = activity.getSystemService(android.app.DownloadManager::class.java)
        if (dm != null) {
            android.util.Log.i("PVTV", "Update: using DownloadManager")
            downloadViaManager(activity, apkUrl, dm, onComplete)
        } else {
            android.util.Log.w("PVTV", "Update: DownloadManager not available, falling back to HTTP")
            downloadViaHttp(activity, apkUrl, onComplete)
        }
    }

    // ── Tier 1: Android DownloadManager (handles redirects, SSL, notifications) ──

    private fun downloadViaManager(
        activity: android.app.Activity,
        apkUrl: String,
        dm: DownloadManager,
        onComplete: () -> Unit
    ) {
        val apkFile = File(activity.cacheDir, "phoenicia-update.apk")
        if (apkFile.exists()) apkFile.delete()

        val request = DownloadManager.Request(Uri.parse(apkUrl))
            .setTitle("PhoeniciaTV Update")
            .setDescription("APK wird heruntergeladen...")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationUri(Uri.fromFile(apkFile))
            .addRequestHeader("User-Agent", "PhoeniciaTV/2.4.3 (Android)")
            .addRequestHeader("Accept", "*/*")

        android.util.Log.i("PVTV", "Update: enqueueing DownloadManager request")
        downloadId = dm.enqueue(request)

        receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                if (id != downloadId) return

                android.util.Log.i("PVTV", "Update: DownloadManager broadcast received for id=$id")

                val query = DownloadManager.Query().setFilterById(downloadId)
                val cursor = dm.query(query)
                var status = -1
                if (cursor != null && cursor.moveToFirst()) {
                    status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                    cursor.close()
                }
                android.util.Log.i("PVTV", "Update: download status=$status")

                if (status == DownloadManager.STATUS_SUCCESSFUL) {
                    activity.runOnUiThread { installApk(activity, apkFile) }
                } else {
                    activity.runOnUiThread {
                        Toast.makeText(activity, "Download fehlgeschlagen", Toast.LENGTH_LONG).show()
                    }
                }

                try { activity.unregisterReceiver(this) } catch (_: Exception) {}
            }
        }

        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            activity.registerReceiver(receiver, filter)
        }
    }

    // ── Tier 2: Manual HTTP with explicit redirect handling (fallback) ──

    private fun downloadViaHttp(
        activity: android.app.Activity,
        apkUrl: String,
        onComplete: () -> Unit
    ) {
        Thread {
            try {
                val apkFile = File(activity.cacheDir, "phoenicia-update.apk")
                if (apkFile.exists()) apkFile.delete()

                downloadApkWithRedirects(apkUrl, apkFile)

                activity.runOnUiThread {
                    installApk(activity, apkFile)
                    onComplete()
                }
            } catch (e: Exception) {
                android.util.Log.e("PVTV", "Update download failed: ${e.message}", e)
                activity.runOnUiThread {
                    Toast.makeText(activity, "Download fehlgeschlagen: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    private fun downloadApkWithRedirects(urlStr: String, targetFile: File) {
        var currentUrl = urlStr
        val maxRedirects = 10

        for (redirectCount in 0..maxRedirects) {
            android.util.Log.i("PVTV", "Update HTTP: connecting to $currentUrl (redirect #$redirectCount)")

            val conn = URL(currentUrl).openConnection() as HttpURLConnection
            conn.connectTimeout = 30_000
            conn.readTimeout = 60_000
            conn.instanceFollowRedirects = false  // handle redirects manually
            conn.setRequestProperty("User-Agent", "PhoeniciaTV/2.4.3 (Android)")
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

            // Got 200 — download the file
            val total = conn.contentLength
            android.util.Log.i("PVTV", "Update HTTP: downloading ${total ?: "unknown"} bytes")

            conn.inputStream.use { input ->
                targetFile.outputStream().use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int
                    var totalRead = 0L
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        totalRead += bytesRead
                    }
                    android.util.Log.i("PVTV", "Update HTTP: downloaded $totalRead bytes to ${targetFile.absolutePath}")
                }
            }
            conn.disconnect()
            return
        }

        throw Exception("Too many redirects (>$maxRedirects)")
    }

    // ── Shared install logic ──

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
