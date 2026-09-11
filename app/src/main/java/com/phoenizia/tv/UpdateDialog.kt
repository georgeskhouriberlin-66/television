package com.phoenizia.tv

import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView

class UpdateDialog(
    context: Context,
    private val updateInfo: UpdateChecker.UpdateInfo,
    private val onUpdate: (UpdateDialog) -> Unit,
    private val onDismiss: () -> Unit
) : Dialog(context) {

    private lateinit var statusText: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var percentText: TextView
    private lateinit var btnUpdate: Button
    private lateinit var btnLater: Button
    private lateinit var buttonRow: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val dp = context.resources.displayMetrics.density

        val container = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding((24 * dp).toInt(), (24 * dp).toInt(), (24 * dp).toInt(), (16 * dp).toInt())
            setBackgroundColor(0xFF1A1A2E.toInt())
        }

        val title = TextView(context).apply {
            text = "Update verfügbar"
            textSize = 20f
            setTextColor(0xFFFFFFFF.toInt())
            setPadding(0, 0, 0, (12 * dp).toInt())
        }
        container.addView(title)

        val versionText = TextView(context).apply {
            text = "Version ${updateInfo.versionName}"
            textSize = 14f
            setTextColor(0xFFCCCCCC.toInt())
            setPadding(0, 0, 0, (8 * dp).toInt())
        }
        container.addView(versionText)

        if (updateInfo.releaseNotes.isNotBlank()) {
            val scroll = ScrollView(context).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
                )
            }
            val notesText = TextView(context).apply {
                text = updateInfo.releaseNotes
                textSize = 13f
                setTextColor(0xFFBBBBBB.toInt())
                setPadding(0, 0, 0, (8 * dp).toInt())
            }
            scroll.addView(notesText)
            container.addView(scroll)
        }

        // Progress section (hidden initially)
        val progressSection = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, (8 * dp).toInt(), 0, (8 * dp).toInt())
            visibility = android.view.View.GONE
        }

        statusText = TextView(context).apply {
            text = "Wird heruntergeladen..."
            textSize = 13f
            setTextColor(0xFFCCCCCC.toInt())
            setPadding(0, 0, 0, (6 * dp).toInt())
        }
        progressSection.addView(statusText)

        val progressRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
        }

        progressBar = ProgressBar(context, null, android.R.attr.progressBarStyleHorizontal).apply {
            layoutParams = LinearLayout.LayoutParams(0, (8 * dp).toInt(), 1f).apply {
                marginEnd = (8 * dp).toInt()
            }
            max = 100
            progress = 0
        }
        progressRow.addView(progressBar)

        percentText = TextView(context).apply {
            text = "0%"
            textSize = 12f
            setTextColor(0xFFAAAAAA.toInt())
            minWidth = (40 * dp).toInt()
        }
        progressRow.addView(percentText)

        progressSection.addView(progressRow)
        container.addView(progressSection)

        buttonRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, (12 * dp).toInt(), 0, 0)
        }

        btnUpdate = Button(context).apply {
            text = "Installieren"
            setTextColor(0xFFFFFFFF.toInt())
            setBackgroundColor(0xFF2196F3.toInt())
            layoutParams = LinearLayout.LayoutParams(0, (44 * dp).toInt(), 1f).apply {
                marginEnd = (8 * dp).toInt()
            }
            setOnClickListener {
                onUpdate(this@UpdateDialog)
            }
            isFocusable = true
            isFocusableInTouchMode = true
        }
        buttonRow.addView(btnUpdate)

        btnLater = Button(context).apply {
            text = "Später"
            setTextColor(0xFFCCCCCC.toInt())
            setBackgroundColor(0xFF333333.toInt())
            layoutParams = LinearLayout.LayoutParams(0, (44 * dp).toInt(), 1f)
            setOnClickListener {
                onDismiss()
                dismiss()
            }
            isFocusable = true
            isFocusableInTouchMode = true
        }
        buttonRow.addView(btnLater)

        container.addView(buttonRow)

        setContentView(container)

        window?.apply {
            setBackgroundDrawableResource(android.R.color.transparent)
            val width = (400 * dp).toInt()
            val height = LinearLayout.LayoutParams.WRAP_CONTENT
            setLayout(width, height)
        }

        btnUpdate.requestFocus()
    }

    fun showProgress() {
        btnUpdate.isEnabled = false
        btnUpdate.text = "Wird heruntergeladen..."
        btnLater.isEnabled = false
        btnLater.alpha = 0.5f
        statusText.visibility = android.view.View.VISIBLE
        progressBar.visibility = android.view.View.VISIBLE
        percentText.visibility = android.view.View.VISIBLE
    }

    fun updateProgress(percent: Int) {
        progressBar.progress = percent
        percentText.text = "$percent%"
    }

    fun showInstallButton() {
        statusText.text = "Download abgeschlossen!"
        btnUpdate.isEnabled = true
        btnUpdate.text = "Jetzt installieren"
        btnUpdate.setBackgroundColor(0xFF4CAF50.toInt())
        btnUpdate.setOnClickListener {
            dismiss()
        }
        btnLater.isEnabled = true
        btnLater.alpha = 1f
    }

    fun showError(message: String) {
        statusText.text = "Fehler: $message"
        statusText.setTextColor(0xFFFF5252.toInt())
        progressBar.visibility = android.view.View.GONE
        percentText.visibility = android.view.View.GONE
        btnUpdate.isEnabled = true
        btnUpdate.text = "Erneut versuchen"
        btnUpdate.setBackgroundColor(0xFF2196F3.toInt())
        btnUpdate.setOnClickListener {
            onUpdate(this@UpdateDialog)
        }
        btnLater.isEnabled = true
        btnLater.alpha = 1f
    }
}
