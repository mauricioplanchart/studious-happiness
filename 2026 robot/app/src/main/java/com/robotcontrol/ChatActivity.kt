package com.robotcontrol

import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import android.speech.tts.TextToSpeech
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.*
import java.util.*

class ChatActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    private lateinit var lvMessages: ListView
    private lateinit var etMessage: EditText
    private lateinit var btnSend: Button
    private lateinit var btnMicrophone: Button
    private lateinit var tvStatus: TextView
    private lateinit var messageAdapter: ArrayAdapter<String>
    private val messages = mutableListOf<String>()
    
    private var currentExpression = RobotFaceActivity.Expression.HAPPY
    private lateinit var textToSpeech: TextToSpeech
    private var isSpeaking = false
    
    companion object {
        private const val SPEECH_REQUEST_CODE = 100
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_chat)
        
        initializeViews()
        setupListeners()
        initTextToSpeech()
    }
    
    private fun initializeViews() {
        lvMessages = findViewById(R.id.lvMessages)
        etMessage = findViewById(R.id.etMessage)
        btnSend = findViewById(R.id.btnSend)
        btnMicrophone = findViewById(R.id.btnMicrophone)
        tvStatus = findViewById(R.id.tvStatus)
        
        messageAdapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, messages)
        lvMessages.adapter = messageAdapter
        
        messages.add("🤖 Robot: ¡Hola! Soy tu robot. ¿En qué puedo ayudarte?")
        messageAdapter.notifyDataSetChanged()
    }
    
    private fun initTextToSpeech() {
        textToSpeech = TextToSpeech(this, this)
    }
    
    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            // Set language to Spanish
            val result = textToSpeech.setLanguage(Locale("es", "ES"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Toast.makeText(this, "Idioma no soportado", Toast.LENGTH_SHORT).show()
            }
            tvStatus.text = "Robot conectado y listo"
        } else {
            Toast.makeText(this, "Error inicializando Text-to-Speech", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun setupListeners() {
        btnSend.setOnClickListener {
            val userMessage = etMessage.text.toString().trim()
            if (userMessage.isNotEmpty()) {
                sendMessage(userMessage)
                etMessage.setText("")
            }
        }
        
        btnMicrophone.setOnClickListener {
            startSpeechRecognition()
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
        // Add user message
        messages.add("Tú: $userMessage")
        messageAdapter.notifyDataSetChanged()
        lvMessages.setSelection(messages.size - 1)
        
        btnSend.isEnabled = false
        btnMicrophone.isEnabled = false
        tvStatus.text = "Pensando..."
        
        // Call AI in background
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val response = withContext(Dispatchers.Default) {
                    AIService.getResponse(userMessage)
                }
                
                // Add robot response
                messages.add("🤖 Robot: $response")
                messageAdapter.notifyDataSetChanged()
                lvMessages.setSelection(messages.size - 1)
                
                // Update robot expression based on sentiment
                updateRobotExpression(response)
                
                // Speak the response
                speakResponse(response)
                
                tvStatus.text = "Robot conectado"
            } catch (e: Exception) {
                messages.add("🤖 Robot: Perdón, algo salió mal. Intenta de nuevo.")
                messageAdapter.notifyDataSetChanged()
                tvStatus.text = "Error: ${e.message}"
            } finally {
                btnSend.isEnabled = true
                btnMicrophone.isEnabled = true
            }
        }
    }
    
    private fun speakResponse(response: String) {
        if (!isSpeaking) {
            // Remove emojis and clean text for speech
            val cleanText = response.replace(Regex("[^a-záéíóúñA-ZÁÉÍÓÚÑ\\s.,!?¿¡]"), "")
            
            if (cleanText.isNotEmpty()) {
                isSpeaking = true
                textToSpeech.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null)
            }
        }
    }
    
    private fun updateRobotExpression(response: String) {
        val lowerResponse = response.lowercase()
        
        currentExpression = when {
            lowerResponse.contains("feliz") || lowerResponse.contains("jeje") || 
            lowerResponse.contains("ja ja") || lowerResponse.contains("😊") -> 
                RobotFaceActivity.Expression.HAPPY
            
            lowerResponse.contains("sorprendido") || lowerResponse.contains("wow") || 
            lowerResponse.contains("😮") -> 
                RobotFaceActivity.Expression.SURPRISED
            
            lowerResponse.contains("pensando") || lowerResponse.contains("interesante") -> 
                RobotFaceActivity.Expression.THINKING
            
            lowerResponse.contains("triste") || lowerResponse.contains("malo") || 
            lowerResponse.contains("😢") -> 
                RobotFaceActivity.Expression.SAD
            
            lowerResponse.contains("enojado") || lowerResponse.contains("molesto") || 
            lowerResponse.contains("😠") -> 
                RobotFaceActivity.Expression.ANGRY
            
            lowerResponse.contains("😄") || lowerResponse.contains("excited") || 
            lowerResponse.contains("emocionado") -> 
                RobotFaceActivity.Expression.EXCITED
            
            else -> RobotFaceActivity.Expression.HAPPY
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        if (::textToSpeech.isInitialized) {
            textToSpeech.stop()
            textToSpeech.shutdown()
        }
    }
}
