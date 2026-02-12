package com.robotcontrol

import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.os.Bundle as AndroidBundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognizerIntent
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.*
import java.util.*
import kotlin.math.roundToLong
import kotlin.math.sqrt

class RobotFaceActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    
    private lateinit var ivLeftEye: ImageView
    private lateinit var ivRightEye: ImageView
    private lateinit var ivMouth: ImageView
    private lateinit var viewLeftIris: View
    private lateinit var viewRightIris: View
    private lateinit var viewLeftPupil: View
    private lateinit var viewRightPupil: View
    private lateinit var viewLeftCatchlight: View
    private lateinit var viewRightCatchlight: View
    private lateinit var viewLeftEyebrow: View
    private lateinit var viewRightEyebrow: View
    private lateinit var viewLeftCheek: View
    private lateinit var viewRightCheek: View
    private lateinit var tvStatus: TextView
    private lateinit var tvRobotMessage: TextView
    private lateinit var etMessage: EditText
    private lateinit var btnSend: Button
    private lateinit var btnMicrophone: Button
    private lateinit var viewFace: View
    
    private var currentExpression = Expression.HAPPY
    private val handler = Handler(Looper.getMainLooper())
    private var blinkRunnable: Runnable? = null
    private var eyeMotionRunnable: Runnable? = null
    private var mouthAnimationRunnable: Runnable? = null
    private var currentSpeechText: String = ""
    private var speechHasRangeCallbacks = false
    private var speechHasAudioCallbacks = false
    private var currentMouthOpen = 0.25f
    private var currentMouthShape: MouthShape = MouthShape.CLOSED
    private var currentMouthBaseDrawable: Int = R.drawable.mouth_happy
    private val speechAudioLevels = ArrayDeque<Float>()
    
    private lateinit var textToSpeech: TextToSpeech
    private var isSpeaking = false
    private var isTtsReady = false
    
    enum class Expression {
        HAPPY, SAD, SURPRISED, ANGRY, THINKING, SLEEPING, EXCITED
    }

    private enum class MouthShape {
        CLOSED, MID, OPEN
    }
    
    companion object {
        const val EXTRA_EXPRESSION = "expression"
        private const val SPEECH_REQUEST_CODE = 100
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_robot_face)
        volumeControlStream = AudioManager.STREAM_MUSIC
        
        // Keep screen on while face is displayed
        window.decorView.keepScreenOn = true
        
        initializeViews()
        setupClickListener()
        initTextToSpeech()
        startBlinking()
        startEyeMicroMovements()
        
        // Get initial expression from intent
        val expressionName = intent.getStringExtra(EXTRA_EXPRESSION) ?: "HAPPY"
        currentExpression = Expression.valueOf(expressionName)
        updateFace(currentExpression)
    }
    
    private fun initializeViews() {
        ivLeftEye = findViewById(R.id.ivLeftEye)
        ivRightEye = findViewById(R.id.ivRightEye)
        ivMouth = findViewById(R.id.ivMouth)
        viewLeftIris = findViewById(R.id.viewLeftIris)
        viewRightIris = findViewById(R.id.viewRightIris)
        viewLeftPupil = findViewById(R.id.viewLeftPupil)
        viewRightPupil = findViewById(R.id.viewRightPupil)
        viewLeftCatchlight = findViewById(R.id.viewLeftCatchlight)
        viewRightCatchlight = findViewById(R.id.viewRightCatchlight)
        viewLeftEyebrow = findViewById(R.id.viewLeftEyebrow)
        viewRightEyebrow = findViewById(R.id.viewRightEyebrow)
        viewLeftCheek = findViewById(R.id.viewLeftCheek)
        viewRightCheek = findViewById(R.id.viewRightCheek)
        tvStatus = findViewById(R.id.tvStatus)
        tvRobotMessage = findViewById(R.id.tvRobotMessage)
        etMessage = findViewById(R.id.etMessage)
        btnSend = findViewById(R.id.btnSend)
        btnMicrophone = findViewById(R.id.btnMicrophone)
        viewFace = findViewById(R.id.viewFace)
    }
    
    private fun initTextToSpeech() {
        textToSpeech = TextToSpeech(this, this)
        textToSpeech.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                handler.post {
                    isSpeaking = true
                    speechHasRangeCallbacks = false
                    speechHasAudioCallbacks = false
                    synchronized(speechAudioLevels) { speechAudioLevels.clear() }
                    startMouthAnimation()
                }
            }

            override fun onDone(utteranceId: String?) {
                handler.post {
                    isSpeaking = false
                    stopMouthAnimation()
                    updateFaceOnSpeechEnd()
                }
            }

            override fun onError(utteranceId: String?) {
                handler.post {
                    isSpeaking = false
                    stopMouthAnimation()
                }
            }

            override fun onRangeStart(
                utteranceId: String?,
                start: Int,
                end: Int,
                frame: Int
            ) {
                handler.post {
                    if (!isSpeaking || currentSpeechText.isEmpty() || speechHasAudioCallbacks) return@post
                    speechHasRangeCallbacks = true
                    val safeStart = start.coerceIn(0, currentSpeechText.length)
                    val safeEnd = end.coerceIn(safeStart, currentSpeechText.length)
                    val chunk = currentSpeechText.substring(safeStart, safeEnd)
                    val openness = calculateMouthOpenness(chunk)
                    animateMouthTo(openness, 65L)
                }
            }

            override fun onAudioAvailable(utteranceId: String?, audio: ByteArray?) {
                val level = extractAudioLevel(audio)
                if (level <= 0f) return

                synchronized(speechAudioLevels) {
                    if (speechAudioLevels.size >= 10) {
                        speechAudioLevels.removeFirst()
                    }
                    speechAudioLevels.addLast(level)
                }

                handler.post {
                    if (isSpeaking) {
                        speechHasAudioCallbacks = true
                    }
                }
            }
        })
    }
    
    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )

            val esResult = textToSpeech.setLanguage(Locale("es", "ES"))
            if (esResult == TextToSpeech.LANG_MISSING_DATA || esResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                textToSpeech.setLanguage(Locale("es"))
            }
            textToSpeech.setSpeechRate(1.0f)
            textToSpeech.setPitch(1.0f)
            isTtsReady = true
        } else {
            isTtsReady = false
        }
    }
    
    private fun setupClickListener() {
        // Send button
        btnSend.setOnClickListener {
            val userMessage = etMessage.text.toString().trim()
            if (userMessage.isNotEmpty()) {
                sendMessage(userMessage)
                etMessage.setText("")
            }
        }
        
        // Microphone button
        btnMicrophone.setOnClickListener {
            startSpeechRecognition()
        }
        
        // Long press to go back
        viewFace.setOnLongClickListener {
            finish()
            true
        }
    }
    
    private fun startSpeechRecognition() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-ES")
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Di algo...")
        }
        
        try {
            startActivityForResult(intent, SPEECH_REQUEST_CODE)
        } catch (e: Exception) {
            Toast.makeText(this, "Micrófono no disponible", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == SPEECH_REQUEST_CODE && resultCode == RESULT_OK) {
            val results = data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            if (!results.isNullOrEmpty()) {
                val spokenText = results[0]
                etMessage.setText(spokenText)
                sendMessage(spokenText)
            }
        }
    }
    
    private fun sendMessage(userMessage: String) {
        btnSend.isEnabled = false
        btnMicrophone.isEnabled = false
        tvRobotMessage.text = "Pensando..."
        
        // Call AI in background
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val response = withContext(Dispatchers.Default) {
                    AIService.getResponse(userMessage)
                }
                
                // Update message display
                tvRobotMessage.text = removeEmoticons(response)
                
                // Update robot expression based on sentiment
                updateExpressionFromResponse(response)
                
                // Speak the response
                speakResponse(response)
                
            } catch (e: Exception) {
                tvRobotMessage.text = "Perdón, algo salió mal. Intenta de nuevo."
                updateFace(Expression.SAD)
            } finally {
                btnSend.isEnabled = true
                btnMicrophone.isEnabled = true
            }
        }
    }
    
    private fun speakResponse(response: String) {
        if (::textToSpeech.isInitialized && isTtsReady && !textToSpeech.isSpeaking) {
            // Remove emojis and clean text for speech
            val cleanText = response.replace(Regex("[^a-záéíóúñA-ZÁÉÍÓÚÑ\\s.,!?¿¡]"), "")
            
            if (cleanText.isNotEmpty()) {
                currentSpeechText = cleanText
                isSpeaking = true
                speechHasRangeCallbacks = false
                startMouthAnimation()
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    val params = AndroidBundle().apply {
                        putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
                    }
                    textToSpeech.speak(cleanText, TextToSpeech.QUEUE_FLUSH, params, "utterance1")
                } else {
                    val params = HashMap<String, String>()
                    params[TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID] = "utterance1"
                    textToSpeech.speak(cleanText, TextToSpeech.QUEUE_FLUSH, params)
                }
            }
        }
    }
    
    private fun startMouthAnimation() {
        stopMouthAnimation()
        mouthAnimationRunnable = object : Runnable {
            private var step = 0
            
            override fun run() {
                if (isSpeaking) {
                    if (speechHasAudioCallbacks) {
                        val level = pollAudioLevel()
                        if (level != null) {
                            val openness = smoothAudioMouthOpenness(level)
                            animateMouthTo(openness, 45L)
                        }
                    } else if (!speechHasRangeCallbacks) {
                        step++
                        val openness = fallbackMouthOpenness(step)
                        animateMouthTo(openness, 90L)
                    }

                    val nextTick = when {
                        speechHasAudioCallbacks -> 50L
                        speechHasRangeCallbacks -> 120L
                        else -> 110L
                    }
                    handler.postDelayed(this, nextTick)
                } else {
                    stopMouthAnimation()
                }
            }
        }
        handler.post(mouthAnimationRunnable!!)
    }
    
    private fun stopMouthAnimation() {
        mouthAnimationRunnable?.let { handler.removeCallbacks(it) }
        mouthAnimationRunnable = null
        speechHasRangeCallbacks = false
        speechHasAudioCallbacks = false
        synchronized(speechAudioLevels) { speechAudioLevels.clear() }
        currentSpeechText = ""
        currentMouthOpen = 0.25f
        currentMouthShape = MouthShape.CLOSED
        ivMouth.setImageResource(currentMouthBaseDrawable)
        
        // Reset mouth scale to normal
        ivMouth.animate().scaleY(1f).scaleX(1f).setDuration(100).start()
    }

    private fun extractAudioLevel(audio: ByteArray?): Float {
        if (audio == null || audio.size < 2) return 0f

        var sumSquares = 0.0
        var samples = 0
        var index = 0

        while (index + 1 < audio.size) {
            val low = audio[index].toInt() and 0xFF
            val high = audio[index + 1].toInt()
            val sample = (high shl 8) or low
            val signedSample = if (sample > 32767) sample - 65536 else sample
            val normalized = signedSample / 32768.0
            sumSquares += normalized * normalized
            samples++
            index += 2
        }

        if (samples == 0) return 0f
        val rms = sqrt(sumSquares / samples).toFloat()
        return (rms * 2.5f).coerceIn(0.08f, 1f)
    }

    private fun pollAudioLevel(): Float? {
        synchronized(speechAudioLevels) {
            if (speechAudioLevels.isEmpty()) return null
            return speechAudioLevels.removeFirst()
        }
    }

    private fun smoothAudioMouthOpenness(level: Float): Float {
        val target = (0.2f + (level * 0.95f)).coerceIn(0.18f, 0.98f)
        val smoothed = (currentMouthOpen * 0.2f) + (target * 0.8f)
        return (smoothed * 100f).roundToLong().toFloat() / 100f
    }

    private fun animateMouthTo(openness: Float, duration: Long) {
        currentMouthOpen = openness.coerceIn(0f, 1f)
        val scaleY = 0.75f + (currentMouthOpen * 1.2f)
        val scaleX = 1.0f + ((1f - currentMouthOpen) * 0.12f)

        val nextShape = when {
            currentMouthOpen < 0.38f -> MouthShape.CLOSED
            currentMouthOpen < 0.72f -> MouthShape.MID
            else -> MouthShape.OPEN
        }

        if (nextShape != currentMouthShape) {
            currentMouthShape = nextShape
            val talkDrawable = when (currentMouthShape) {
                MouthShape.CLOSED -> R.drawable.mouth_talk_closed
                MouthShape.MID -> R.drawable.mouth_talk_mid
                MouthShape.OPEN -> R.drawable.mouth_talk_open
            }
            ivMouth.setImageResource(talkDrawable)
        }

        ivMouth.animate()
            .scaleY(scaleY)
            .scaleX(scaleX)
            .setDuration(duration)
            .start()
    }

    private fun fallbackMouthOpenness(step: Int): Float {
        val cycle = step % 5
        return when (cycle) {
            0 -> 0.78f
            1 -> 0.48f
            2 -> 0.86f
            3 -> 0.34f
            else -> 0.6f
        }
    }

    private fun calculateMouthOpenness(chunk: String): Float {
        if (chunk.isBlank()) return 0.22f

        val vowels = chunk.count { it.lowercaseChar() in "aeiouáéíóú" }
        val punct = chunk.count { it in ".,;:!?¿¡" }
        val spaces = chunk.count { it.isWhitespace() }
        val length = chunk.length.coerceAtLeast(1)

        val vowelRatio = vowels.toFloat() / length.toFloat()
        val punctuationPenalty = if (punct > 0) 0.25f else 0f
        val pausePenalty = if (spaces == length) 0.3f else 0f

        val target = (0.3f + (vowelRatio * 0.9f) - punctuationPenalty - pausePenalty)
            .coerceIn(0.18f, 0.95f)

        val smoothed = (currentMouthOpen * 0.35f) + (target * 0.65f)
        return (smoothed * 100f).roundToLong().toFloat() / 100f
    }
    
    private fun updateFaceOnSpeechEnd() {
        // Just reset, the expression was already set before speaking
    }
    
    private fun updateExpressionFromResponse(response: String) {
        val lowerResponse = response.lowercase()
        
        val expression = when {
            lowerResponse.contains("feliz") || lowerResponse.contains("jeje") || 
            lowerResponse.contains("ja ja") || lowerResponse.contains("😊") -> 
                Expression.HAPPY
            
            lowerResponse.contains("sorprendido") || lowerResponse.contains("wow") || 
            lowerResponse.contains("😮") -> 
                Expression.SURPRISED
            
            lowerResponse.contains("pensando") || lowerResponse.contains("interesante") || 
            lowerResponse.contains("déjame") || lowerResponse.contains("considerar") -> 
                Expression.THINKING
            
            lowerResponse.contains("triste") || lowerResponse.contains("malo") || 
            lowerResponse.contains("😢") -> 
                Expression.SAD
            
            lowerResponse.contains("enojado") || lowerResponse.contains("molesto") || 
            lowerResponse.contains("😠") -> 
                Expression.ANGRY
            
            lowerResponse.contains("😄") || lowerResponse.contains("excited") || 
            lowerResponse.contains("emocionado") -> 
                Expression.EXCITED
            
            else -> Expression.HAPPY
        }
        
        updateFace(expression)
    }
    
    fun updateFace(expression: Expression) {
        currentExpression = expression
        val duration = 300L // Animación suave

        updateComplexFaceDetails(expression, duration)
        
        when (expression) {
            Expression.HAPPY -> {
                tvStatus.text = "Happy"
                animateEyeTransform(1f, 1f, 0f)
                animateColorChange(getColor(R.color.textPrimary))
                animateMouth(R.drawable.mouth_happy, getColor(R.color.textPrimary), duration)
            }
            Expression.EXCITED -> {
                tvStatus.text = "Excited"
                animateEyeTransform(1.4f, 1.4f, 0f)
                animateColorChange(getColor(R.color.buttonOrange))
                animateMouth(R.drawable.mouth_excited, getColor(R.color.buttonOrange), duration)
                // Efecto de rebote
                ivLeftEye.animate().scaleX(1.5f).scaleY(1.5f).setDuration(100)
                    .withEndAction {
                        ivLeftEye.animate().scaleX(1.4f).scaleY(1.4f).setDuration(100).start()
                    }
                ivRightEye.animate().scaleX(1.5f).scaleY(1.5f).setDuration(100)
                    .withEndAction {
                        ivRightEye.animate().scaleX(1.4f).scaleY(1.4f).setDuration(100).start()
                    }
            }
            Expression.SURPRISED -> {
                tvStatus.text = "Surprised"
                // Animación de sorpresa rápida
                animateEyeTransform(1.6f, 1.6f, 0f)
                animateColorChange(getColor(R.color.buttonBlue))
                animateMouth(R.drawable.mouth_surprised, getColor(R.color.buttonBlue), 150L)
            }
            Expression.THINKING -> {
                tvStatus.text = "Thinking"
                // Ojos asimétricos pensando
                ivLeftEye.animate()
                    .scaleX(0.9f).scaleY(0.7f).rotation(15f)
                    .setDuration(duration).start()
                ivRightEye.animate()
                    .scaleX(1.1f).scaleY(1f).rotation(-10f)
                    .setDuration(duration).start()
                animateColorChange(getColor(R.color.colorAccent))
                animateMouth(R.drawable.mouth_thinking, getColor(R.color.colorAccent), duration)
            }
            Expression.SAD -> {
                tvStatus.text = "Sad"
                // Ojos caídos
                ivLeftEye.animate()
                    .scaleX(1f).scaleY(0.8f).rotation(-20f)
                    .setDuration(duration).start()
                ivRightEye.animate()
                    .scaleX(1f).scaleY(0.8f).rotation(20f)
                    .setDuration(duration).start()
                animateColorChange(getColor(R.color.buttonBlue))
                animateMouth(R.drawable.mouth_sad, getColor(R.color.buttonBlue), duration)
            }
            Expression.ANGRY -> {
                tvStatus.text = "Angry"
                // Ojos enfadados estrechos
                ivLeftEye.animate()
                    .scaleX(0.8f).scaleY(0.5f).rotation(-25f)
                    .setDuration(200).start()
                ivRightEye.animate()
                    .scaleX(0.8f).scaleY(0.5f).rotation(25f)
                    .setDuration(200).start()
                animateColorChange(getColor(R.color.buttonRed))
                animateMouth(R.drawable.mouth_angry, getColor(R.color.buttonRed), 200L)
            }
            Expression.SLEEPING -> {
                tvStatus.text = "Sleeping"
                // Ojos cerrados suavemente
                ivLeftEye.animate()
                    .scaleX(1.1f).scaleY(0.15f).rotation(180f)
                    .setDuration(500).start()
                ivRightEye.animate()
                    .scaleX(1.1f).scaleY(0.15f).rotation(180f)
                    .setDuration(500).start()
                animateColorChange(getColor(R.color.textSecondary))
                animateMouth(R.drawable.mouth_sleeping, getColor(R.color.textSecondary), 500L)
            }
        }
    }

    private fun removeEmoticons(text: String): String {
        return text.replace(Regex("[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9\\s.,!?¿¡:;()\\-]"), "").trim()
    }
    
    private fun animateEyeTransform(scaleX: Float, scaleY: Float, rotation: Float) {
        val duration = 300L
        ivLeftEye.animate()
            .scaleX(scaleX).scaleY(scaleY).rotation(rotation)
            .setDuration(duration).start()
        ivRightEye.animate()
            .scaleX(scaleX).scaleY(scaleY).rotation(rotation)
            .setDuration(duration).start()
    }
    
    private fun animateColorChange(color: Int) {
        ivLeftEye.setColorFilter(color)
        ivRightEye.setColorFilter(color)
    }
    
    @Suppress("UNUSED_PARAMETER")
    private fun animateMouth(drawable: Int, color: Int, duration: Long) {
        currentMouthBaseDrawable = drawable
        ivMouth.alpha = 0f
        ivMouth.setImageResource(drawable)
        ivMouth.clearColorFilter()
        ivMouth.animate().alpha(1f).setDuration(duration).start()
    }
    
    private fun resetEyeTransforms() {
        ivLeftEye.scaleX = 1f
        ivLeftEye.scaleY = 1f
        ivLeftEye.rotation = 0f
        ivRightEye.scaleX = 1f
        ivRightEye.scaleY = 1f
        ivRightEye.rotation = 0f
    }
    
    private fun startBlinking() {
        blinkRunnable = object : Runnable {
            override fun run() {
                if (!isSpeaking && currentExpression != Expression.SLEEPING) {
                    // Doble parpadeo ocasional
                    val doubleBlinkChance = (1..10).random()
                    
                    performBlink()
                    
                    if (doubleBlinkChance > 8) {
                        // Doble parpadeo
                        handler.postDelayed({
                            if (!isSpeaking) performBlink()
                        }, 200)
                    }
                }
                
                // Random blink interval (2-6 seconds)
                handler.postDelayed(this, (2000..6000).random().toLong())
            }
        }
        handler.postDelayed(blinkRunnable!!, 3000)
    }
    
    private fun performBlink() {
        val currentScaleY = ivLeftEye.scaleY
        
        viewLeftPupil.animate().alpha(0.15f).setDuration(55).start()
        viewRightPupil.animate().alpha(0.15f).setDuration(55).start()
        viewLeftIris.animate().alpha(0.2f).setDuration(55).start()
        viewRightIris.animate().alpha(0.2f).setDuration(55).start()
        viewLeftCatchlight.animate().alpha(0f).setDuration(55).start()
        viewRightCatchlight.animate().alpha(0f).setDuration(55).start()
        
        // Blink más natural
        ivLeftEye.animate()
            .scaleY(0.08f)
            .setDuration(80)
            .withEndAction {
                ivLeftEye.animate().scaleY(currentScaleY).setDuration(80).start()
                viewLeftPupil.animate().alpha(1f).setDuration(75).start()
                viewLeftIris.animate().alpha(1f).setDuration(75).start()
                viewLeftCatchlight.animate().alpha(1f).setDuration(90).start()
            }
        
        ivRightEye.animate()
            .scaleY(0.08f)
            .setDuration(80)
            .withEndAction {
                ivRightEye.animate().scaleY(currentScaleY).setDuration(80).start()
                viewRightPupil.animate().alpha(1f).setDuration(75).start()
                viewRightIris.animate().alpha(1f).setDuration(75).start()
                viewRightCatchlight.animate().alpha(1f).setDuration(90).start()
            }
    }

    private fun updateComplexFaceDetails(expression: Expression, duration: Long) {
        when (expression) {
            Expression.HAPPY -> {
                animateEyebrows(10f, -10f, -8f, 8f, duration)
                animatePupils(0f, 0f, 0f, 0f, 1f, duration)
                animateCheeks(0.22f, duration)
            }
            Expression.EXCITED -> {
                animateEyebrows(14f, -14f, -14f, 14f, duration)
                animatePupils(0f, -4f, 0f, -4f, 1.15f, duration)
                animateCheeks(0.4f, duration)
            }
            Expression.SURPRISED -> {
                animateEyebrows(0f, 0f, -18f, -18f, duration)
                animatePupils(0f, -10f, 0f, -10f, 1.1f, duration)
                animateCheeks(0.12f, duration)
            }
            Expression.THINKING -> {
                animateEyebrows(-8f, 14f, 6f, -4f, duration)
                animatePupils(-8f, -2f, -8f, -2f, 0.95f, duration)
                animateCheeks(0.08f, duration)
            }
            Expression.SAD -> {
                animateEyebrows(-12f, 12f, 10f, 10f, duration)
                animatePupils(0f, 8f, 0f, 8f, 0.9f, duration)
                animateCheeks(0.06f, duration)
            }
            Expression.ANGRY -> {
                animateEyebrows(-20f, 20f, -8f, -8f, duration)
                animatePupils(0f, -2f, 0f, -2f, 0.95f, duration)
                animateCheeks(0.28f, duration)
            }
            Expression.SLEEPING -> {
                animateEyebrows(0f, 0f, 8f, 8f, duration)
                animatePupils(0f, 10f, 0f, 10f, 0.7f, duration)
                viewLeftPupil.animate().alpha(0f).setDuration(duration).start()
                viewRightPupil.animate().alpha(0f).setDuration(duration).start()
                viewLeftIris.animate().alpha(0f).setDuration(duration).start()
                viewRightIris.animate().alpha(0f).setDuration(duration).start()
                viewLeftCatchlight.animate().alpha(0f).setDuration(duration).start()
                viewRightCatchlight.animate().alpha(0f).setDuration(duration).start()
                animateCheeks(0.04f, duration)
            }
        }

        if (expression != Expression.SLEEPING) {
            viewLeftPupil.animate().alpha(1f).setDuration(duration).start()
            viewRightPupil.animate().alpha(1f).setDuration(duration).start()
            viewLeftIris.animate().alpha(1f).setDuration(duration).start()
            viewRightIris.animate().alpha(1f).setDuration(duration).start()
            viewLeftCatchlight.animate().alpha(1f).setDuration(duration).start()
            viewRightCatchlight.animate().alpha(1f).setDuration(duration).start()
        }
    }

    private fun animateEyebrows(
        leftRotation: Float,
        rightRotation: Float,
        leftY: Float,
        rightY: Float,
        duration: Long
    ) {
        viewLeftEyebrow.animate()
            .rotation(leftRotation)
            .translationY(leftY)
            .setDuration(duration)
            .start()
        viewRightEyebrow.animate()
            .rotation(rightRotation)
            .translationY(rightY)
            .setDuration(duration)
            .start()
    }

    private fun animatePupils(
        leftX: Float,
        leftY: Float,
        rightX: Float,
        rightY: Float,
        scale: Float,
        duration: Long
    ) {
        viewLeftPupil.animate()
            .translationX(leftX)
            .translationY(leftY)
            .scaleX(scale)
            .scaleY(scale)
            .setDuration(duration)
            .start()

        viewLeftIris.animate()
            .translationX(leftX * 0.7f)
            .translationY(leftY * 0.7f)
            .scaleX(0.92f + (scale * 0.08f))
            .scaleY(0.92f + (scale * 0.08f))
            .setDuration(duration)
            .start()

        viewLeftCatchlight.animate()
            .translationX((leftX * 0.55f) + 4f)
            .translationY((leftY * 0.55f) - 5f)
            .setDuration(duration)
            .start()

        viewRightPupil.animate()
            .translationX(rightX)
            .translationY(rightY)
            .scaleX(scale)
            .scaleY(scale)
            .setDuration(duration)
            .start()

        viewRightIris.animate()
            .translationX(rightX * 0.7f)
            .translationY(rightY * 0.7f)
            .scaleX(0.92f + (scale * 0.08f))
            .scaleY(0.92f + (scale * 0.08f))
            .setDuration(duration)
            .start()

        viewRightCatchlight.animate()
            .translationX((rightX * 0.55f) + 4f)
            .translationY((rightY * 0.55f) - 5f)
            .setDuration(duration)
            .start()
    }

    private fun animateCheeks(alpha: Float, duration: Long) {
        viewLeftCheek.animate().alpha(alpha).setDuration(duration).start()
        viewRightCheek.animate().alpha(alpha).setDuration(duration).start()
    }

    private fun startEyeMicroMovements() {
        eyeMotionRunnable = object : Runnable {
            override fun run() {
                if (!isSpeaking && currentExpression != Expression.SLEEPING) {
                    val offsetX = (-4..4).random().toFloat()
                    val offsetY = (-3..3).random().toFloat()
                    animatePupils(offsetX, offsetY, offsetX, offsetY, 1f, 420L)
                    if ((1..6).random() == 1) {
                        viewLeftCatchlight.animate().alpha(0.35f).setDuration(120)
                            .withEndAction {
                                viewLeftCatchlight.animate().alpha(1f).setDuration(180).start()
                            }.start()
                        viewRightCatchlight.animate().alpha(0.35f).setDuration(120)
                            .withEndAction {
                                viewRightCatchlight.animate().alpha(1f).setDuration(180).start()
                            }.start()
                    }
                }
                handler.postDelayed(this, (900..1700).random().toLong())
            }
        }
        handler.postDelayed(eyeMotionRunnable!!, 1200)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        blinkRunnable?.let { handler.removeCallbacks(it) }
        eyeMotionRunnable?.let { handler.removeCallbacks(it) }
        stopMouthAnimation()
        if (::textToSpeech.isInitialized) {
            textToSpeech.stop()
            textToSpeech.shutdown()
        }
    }
    
    override fun onBackPressed() {
        super.onBackPressed()
    }
}
