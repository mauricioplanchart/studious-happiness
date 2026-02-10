package com.robotcontrol

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class RobotFaceActivity : AppCompatActivity() {
    
    private lateinit var ivLeftEye: ImageView
    private lateinit var ivRightEye: ImageView
    private lateinit var ivMouth: ImageView
    private lateinit var tvStatus: TextView
    private lateinit var viewFace: View
    private lateinit var btnHappy: Button
    private lateinit var btnExcited: Button
    private lateinit var btnSurprised: Button
    private lateinit var btnAngry: Button
    
    private var currentExpression = Expression.HAPPY
    private val handler = Handler(Looper.getMainLooper())
    private var blinkRunnable: Runnable? = null
    
    enum class Expression {
        HAPPY, SAD, SURPRISED, ANGRY, THINKING, SLEEPING, EXCITED
    }
    
    companion object {
        const val EXTRA_EXPRESSION = "expression"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_robot_face)
        
        // Keep screen on while face is displayed
        window.decorView.keepScreenOn = true
        
        initializeViews()
        setupClickListener()
        startBlinking()
        
        // Get initial expression from intent
        val expressionName = intent.getStringExtra(EXTRA_EXPRESSION) ?: "HAPPY"
        currentExpression = Expression.valueOf(expressionName)
        updateFace(currentExpression)
    }
    
    private fun initializeViews() {
        ivLeftEye = findViewById(R.id.ivLeftEye)
        ivRightEye = findViewById(R.id.ivRightEye)
        ivMouth = findViewById(R.id.ivMouth)
        tvStatus = findViewById(R.id.tvStatus)
        viewFace = findViewById(R.id.viewFace)
        btnHappy = findViewById(R.id.btnHappy)
        btnExcited = findViewById(R.id.btnExcited)
        btnSurprised = findViewById(R.id.btnSurprised)
        btnAngry = findViewById(R.id.btnAngry)
    }
    
    private fun setupClickListener() {
        // Tap to change expressions
        viewFace.setOnClickListener {
            cycleExpression()
        }
        
        // Long press to go back to controls
        
        // Expression buttons
        btnHappy.setOnClickListener {
            updateFace(Expression.HAPPY)
        }
        
        btnExcited.setOnClickListener {
            updateFace(Expression.EXCITED)
        }
        
        btnSurprised.setOnClickListener {
            updateFace(Expression.SURPRISED)
        }
        
        btnAngry.setOnClickListener {
            updateFace(Expression.ANGRY)
        }
        viewFace.setOnLongClickListener {
            finish()
            true
        }
    }
    
    private fun cycleExpression() {
        currentExpression = when (currentExpression) {
            Expression.HAPPY -> Expression.EXCITED
            Expression.EXCITED -> Expression.SURPRISED
            Expression.SURPRISED -> Expression.THINKING
            Expression.THINKING -> Expression.SAD
            Expression.SAD -> Expression.ANGRY
            Expression.ANGRY -> Expression.SLEEPING
            Expression.SLEEPING -> Expression.HAPPY
        }
        updateFace(currentExpression)
    }
    
    fun updateFace(expression: Expression) {
        currentExpression = expression
        
        when (expression) {
            Expression.HAPPY -> {
                tvStatus.text = "😊 Happy"
                // Will be replaced with custom drawable
                ivLeftEye.setBackgroundColor(getColor(R.color.textPrimary))
                ivRightEye.setBackgroundColor(getColor(R.color.textPrimary))
                ivMouth.setBackgroundColor(getColor(R.color.textPrimary))
            }
            Expression.EXCITED -> {
                tvStatus.text = "🤩 Excited"
                ivLeftEye.setBackgroundColor(getColor(R.color.buttonOrange))
                ivRightEye.setBackgroundColor(getColor(R.color.buttonOrange))
                ivMouth.setBackgroundColor(getColor(R.color.buttonOrange))
            }
            Expression.SURPRISED -> {
                tvStatus.text = "😮 Surprised"
                ivLeftEye.setBackgroundColor(getColor(R.color.buttonBlue))
                ivRightEye.setBackgroundColor(getColor(R.color.buttonBlue))
                ivMouth.setBackgroundColor(getColor(R.color.buttonBlue))
            }
            Expression.THINKING -> {
                tvStatus.text = "🤔 Thinking"
                ivLeftEye.setBackgroundColor(getColor(R.color.colorAccent))
                ivRightEye.setBackgroundColor(getColor(R.color.colorAccent))
                ivMouth.setBackgroundColor(getColor(R.color.colorAccent))
            }
            Expression.SAD -> {
                tvStatus.text = "😢 Sad"
                ivLeftEye.setBackgroundColor(getColor(R.color.buttonBlue))
                ivRightEye.setBackgroundColor(getColor(R.color.buttonBlue))
                ivMouth.setBackgroundColor(getColor(R.color.buttonBlue))
            }
            Expression.ANGRY -> {
                tvStatus.text = "😠 Angry"
                ivLeftEye.setBackgroundColor(getColor(R.color.buttonRed))
                ivRightEye.setBackgroundColor(getColor(R.color.buttonRed))
                ivMouth.setBackgroundColor(getColor(R.color.buttonRed))
            }
            Expression.SLEEPING -> {
                tvStatus.text = "😴 Sleeping"
                ivLeftEye.setBackgroundColor(getColor(R.color.textSecondary))
                ivRightEye.setBackgroundColor(getColor(R.color.textSecondary))
                ivMouth.setBackgroundColor(getColor(R.color.textSecondary))
            }
        }
    }
    
    private fun startBlinking() {
        blinkRunnable = object : Runnable {
            override fun run() {
                // Blink effect
                ivLeftEye.animate().scaleY(0.1f).setDuration(100).withEndAction {
                    ivLeftEye.animate().scaleY(1f).setDuration(100).start()
                }
                ivRightEye.animate().scaleY(0.1f).setDuration(100).withEndAction {
                    ivRightEye.animate().scaleY(1f).setDuration(100).start()
                }
                
                // Random blink interval (2-5 seconds)
                handler.postDelayed(this, (2000..5000).random().toLong())
            }
        }
        handler.postDelayed(blinkRunnable!!, 3000)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        blinkRunnable?.let { handler.removeCallbacks(it) }
    }
    
    override fun onBackPressed() {
        // Return to main activity
        super.onBackPressed()
    }
}
