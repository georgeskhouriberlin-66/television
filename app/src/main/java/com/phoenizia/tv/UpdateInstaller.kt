package com.phoenizia.tv

import android.app.Activity
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.widget.Toast

object UpdateInstaller {

    private var downloadId: Long = -1
    private var onComplete: (() -> Unit)? = null

    fun downloadAndInstall(activity: Activity, apkUrl: String, onComplete: () -> Unit) {
        this.onComplete = onComplete

        val fileName = "phoenicia-update.apk"
        val request = DownloadManager.Request(Uri.parse(apkUrl)).apply {
            setTitle("PhoeniciaTV Update")
            setDescription("Herunterladen...")
            setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            )
            setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            setAllowedOverMetered(true)
            setAllowedOverRoaming(true)
        }

        val dm = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        downloadId = dm.enqueue(request)

        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                if (id != downloadId) return

                ctx.unregisterReceiver(this)

                val query = DownloadManager.Query().setFilterById(downloadId)
                val cursor = dm.query(query)
                if (cursor == null || !cursor.moveToFirst()) {
                    Toast.makeText(ctx, "Download-Status unbekannt", Toast.LENGTH_SHORT).show()
                    return
                }
                val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                cursor.close()

                if (status != DownloadManager.STATUS_SUCCESSFUL) {
                    Toast.makeText(ctx, "Download fehlgeschlagen", Toast.LENGTH_SHORT).show()
                    return
                }

                val downloadedUri = dm.getUriForDownloadedFile(downloadId) ?: run {
                    Toast.makeText(ctx, "Download-Datei nicht gefunden", Toast.LENGTH_SHORT).show()
                    return
                }

                installApk(ctx, downloadedUri)
            }
        }

        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            activity.registerReceiver(receiver, filter)
        }

        Toast.makeText(activity, "Download gestartet...", Toast.LENGTH_SHORT).show()
    }

    private fun installApk(context: Context, apkUri: Uri) {
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        try {
            context.startActivity(installIntent)
            onComplete?.invoke()
        } catch (_: Exception) {
            Toast.makeText(context, "Installation nicht möglich. Bitte APK manuell installieren.", Toast.LENGTH_LONG).show()
        }
    }
}
