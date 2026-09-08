package com.phoenizia.tv

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

object UpdateInstaller {

    private var downloadId: Long = -1
    private var receiver: BroadcastReceiver? = null

    fun downloadAndInstall(activity: android.app.Activity, apkUrl: String, onComplete: () -> Unit) {
        Toast.makeText(activity, "Download gestartet...", Toast.LENGTH_SHORT).show()

        Thread {
            try {
                val apkFile = File(activity.cacheDir, "phoenicia-update.apk")
                downloadApk(apkUrl, apkFile)

                activity.runOnUiThread {
                    installApk(activity, apkFile)
                    onComplete()
                }
            } catch (e: Exception) {
                android.util.Log.e("PVTV", "Update download failed: ${e.message}")
                activity.runOnUiThread {
                    Toast.makeText(activity, "Download fehlgeschlagen: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    private fun downloadApk(urlStr: String, targetFile: File) {
        val conn = URL(urlStr).openConnection() as HttpURLConnection
        conn.connectTimeout = 30_000
        conn.readTimeout = 60_000
        conn.connect()

        if (conn.responseCode != 200) {
            conn.disconnect()
            throw Exception("HTTP ${conn.responseCode}")
        }

        val total = conn.contentLength
        android.util.Log.i("PVTV", "Downloading APK: ${total} bytes from $urlStr")

        conn.inputStream.use { input ->
            targetFile.outputStream().use { output ->
                val buffer = ByteArray(8192)
                var bytesRead: Int
                var totalRead = 0
                while (input.read(buffer).also { bytesRead = it } != -1) {
                    output.write(buffer, 0, bytesRead)
                    totalRead += bytesRead
                }
                android.util.Log.i("PVTV", "APK downloaded: ${totalRead} bytes to ${targetFile.absolutePath}")
            }
        }
        conn.disconnect()
    }

    private fun installApk(context: Context, apkFile: File) {
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
