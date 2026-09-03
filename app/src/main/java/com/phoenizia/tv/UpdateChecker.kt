package com.phoenizia.tv

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

object UpdateChecker {

    private const val REPO_OWNER = "georgeskhouriberlin-66"
    private const val REPO_NAME = "television"
    private const val API_URL =
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/latest"

    data class UpdateInfo(
        val versionName: String,
        val versionCode: Int,
        val apkDownloadUrl: String,
        val releaseNotes: String,
        val publishedAt: String
    )

    interface Callback {
        fun onUpdateAvailable(update: UpdateInfo)
        fun onNoUpdate()
        fun onError(message: String)
    }

    fun getCurrentVersionCode(context: Context): Int {
        return try {
            val pkgInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(
                    context.packageName,
                    PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(context.packageName, 0)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pkgInfo.longVersionCode.toInt()
            } else {
                @Suppress("DEPRECATION")
                pkgInfo.versionCode
            }
        } catch (_: Exception) {
            0
        }
    }

    fun checkForUpdate(context: Context, callback: Callback) {
        Thread {
            try {
                val connection = URL(API_URL).openConnection() as HttpURLConnection
                connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
                connection.connectTimeout = 10_000
                connection.readTimeout = 10_000

                if (connection.responseCode != 200) {
                    callback.onError("HTTP ${connection.responseCode}")
                    return@Thread
                }

                val body = BufferedReader(InputStreamReader(connection.inputStream))
                    .use { it.readText() }
                connection.disconnect()

                val json = JSONObject(body)
                val tagName = json.optString("tag_name", "")
                val publishedAt = json.optString("published_at", "")
                val releaseNotes = json.optString("body", "")

                val versionCode = parseVersionCode(tagName)
                val currentCode = getCurrentVersionCode(context)

                if (versionCode <= currentCode) {
                    callback.onNoUpdate()
                    return@Thread
                }

                val apkUrl = findApkAsset(json)
                if (apkUrl == null) {
                    callback.onError("No APK found in release")
                    return@Thread
                }

                callback.onUpdateAvailable(
                    UpdateInfo(
                        versionName = tagName.removePrefix("v"),
                        versionCode = versionCode,
                        apkDownloadUrl = apkUrl,
                        releaseNotes = releaseNotes,
                        publishedAt = publishedAt
                    )
                )
            } catch (e: Exception) {
                callback.onError(e.message ?: "Unknown error")
            }
        }.start()
    }

    private fun parseVersionCode(tag: String): Int {
        val clean = tag.removePrefix("v").split("-").first()
        val parts = clean.split(".")
        return try {
            when (parts.size) {
                3 -> parts[0].toInt() * 10000 + parts[1].toInt() * 100 + parts[2].toInt()
                2 -> parts[0].toInt() * 10000 + parts[1].toInt() * 100
                else -> parts[0].toInt() * 10000
            }
        } catch (_: Exception) {
            0
        }
    }

    private fun findApkAsset(releaseJson: JSONObject): String? {
        val assets = releaseJson.optJSONArray("assets") ?: return null
        for (i in 0 until assets.length()) {
            val asset = assets.getJSONObject(i)
            val name = asset.optString("name", "")
            if (name.endsWith(".apk")) {
                return asset.optString("browser_download_url")
            }
        }
        return null
    }
}
