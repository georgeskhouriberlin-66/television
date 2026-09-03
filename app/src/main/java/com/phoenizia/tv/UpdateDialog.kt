package com.phoenizia.tv

import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

class UpdateDialog(
    context: Context,
    private val updateInfo: UpdateChecker.UpdateInfo,
    private val onUpdate: () -> Unit,
    private val onDismiss: () -> Unit
) : Dialog(context) {

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

        val buttonRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, (12 * dp).toInt(), 0, 0)
        }

        val btnUpdate = Button(context).apply {
            text = "Installieren"
            setTextColor(0xFFFFFFFF.toInt())
            setBackgroundColor(0xFF2196F3.toInt())
            layoutParams = LinearLayout.LayoutParams(0, (44 * dp).toInt(), 1f).apply {
                marginEnd = (8 * dp).toInt()
            }
            setOnClickListener {
                onUpdate()
                dismiss()
            }
            isFocusable = true
            isFocusableInTouchMode = true
        }
        buttonRow.addView(btnUpdate)

        val btnLater = Button(context).apply {
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
}
