package com.robotcontrol

import kotlin.math.min

object AIService {
    private const val MAX_MEMORY_TURNS = 10

    private data class Turn(
        val user: String,
        val assistant: String,
        val intent: Intent,
        val topic: String?,
        val language: Language
    )

    private enum class Intent {
        GREETING,
        HOW_ARE_YOU,
        IDENTITY,
        CAPABILITIES,
        HELP,
        GRATITUDE,
        JOKE,
        EMOTION,
        LEARNING,
        TECHNOLOGY,
        PHILOSOPHY,
        TASK_REQUEST,
        COMPARISON,
        EXPLANATION,
        YES_NO,
        FOLLOW_UP,
        SMALL_TALK,
        UNKNOWN
    }

    private enum class Language {
        ES,
        EN
    }

    private val memory = ArrayDeque<Turn>()
    private var userName: String? = null
    private var preferredLanguage: Language = Language.ES

    suspend fun getResponse(userMessage: String): String {
        val cleanedInput = normalize(userMessage)
        if (cleanedInput.isBlank()) {
            return "No alcancé a entenderte bien. ¿Me lo repites con otras palabras?"
        }

        val language = detectLanguage(cleanedInput)
        preferredLanguage = language
        val intent = detectIntent(cleanedInput)
        val topic = resolveTopic(cleanedInput, intent)

        val response = buildResponse(cleanedInput, intent, topic, language)
        remember(cleanedInput, response, intent, topic, language)
        return response
    }

    private fun buildResponse(message: String, intent: Intent, topic: String?, language: Language): String {
        captureNameIfPresent(message)

        if (isFollowUp(message, intent)) {
            val followUp = respondToFollowUp(message, language)
            if (followUp != null) return followUp
        }

        val topicContext = topic ?: memory.lastOrNull()?.topic

        return when (intent) {
            Intent.GREETING -> {
                val name = userName?.let { ", $it" } ?: ""
                if (language == Language.EN) {
                    listOf(
                        "Hi$name. Great to see you again. What do you want to work on now?",
                        "Hey$name. I am ready. Tell me your next goal.",
                        "Hello$name. I am listening. What should we improve today?"
                    ).random()
                } else {
                    listOf(
                        "Hola$name. Qué bueno verte de nuevo. ¿En qué quieres que te ayude hoy?",
                        "Hola$name. Listo para conversar contigo. ¿Qué hacemos ahora?",
                        "Hey$name. Estoy activo y atento. Cuéntame qué necesitas."
                    ).random()
                }
            }

            Intent.HOW_ARE_YOU ->
                if (language == Language.EN) {
                    "I am running well and fully focused. How are you feeling today?"
                } else {
                    "Estoy funcionando muy bien y con buena energía. ¿Cómo te sientes tú hoy?"
                }

            Intent.IDENTITY ->
                if (language == Language.EN) {
                    "I am your robot conversational assistant. I can chat, answer questions, and keep context across turns."
                } else {
                    "Soy tu robot asistente conversacional. Puedo charlar contigo, responder preguntas y adaptarme al contexto de lo que venimos hablando."
                }

            Intent.CAPABILITIES -> {
                if (language == Language.EN) {
                    "I can keep context, remember recent turns, answer questions, follow multi-step topics, and give practical step-by-step guidance."
                } else {
                    "Puedo conversar con contexto, recordar lo reciente de esta charla, responder preguntas, seguir temas en varias vueltas y ayudarte con ideas prácticas paso a paso."
                }
            }

            Intent.HELP -> {
                val recent = topicContext
                if (recent != null) {
                    if (language == Language.EN) {
                        "Sure. We can continue with '$recent' or switch topics. Tell me exactly what you need."
                    } else {
                        "Claro. Si quieres, seguimos con '$recent' o cambiamos de tema. Dime qué necesitas exactamente."
                    }
                } else {
                    if (language == Language.EN) {
                        "Sure. Tell me your goal and I will guide you step by step."
                    } else {
                        "Claro. Dime tu objetivo y te ayudo paso a paso. Si quieres, empezamos por lo más importante."
                    }
                }
            }

            Intent.GRATITUDE ->
                if (language == Language.EN) {
                    "You are welcome. Happy to help. We can continue with the next step when you want."
                } else {
                    "Con gusto. Me alegra ayudarte. Si quieres, seguimos con el siguiente paso."
                }

            Intent.JOKE ->
                if (language == Language.EN) {
                    listOf(
                        "What is a robot's biggest fear? Airplane mode.",
                        "Short joke: you bring the vision, I bring the logic.",
                        "I am so organized because I keep all my bytes in line."
                    ).random()
                } else {
                    listOf(
                        "¿Cuál es el colmo de un robot? Tener miedo al modo avión.",
                        "Te cuento uno corto: yo pongo la lógica y tú pones la magia.",
                        "Dicen que soy muy ordenado... porque siempre tengo mis bytes en fila."
                    ).random()
                }

            Intent.EMOTION ->
                if (language == Language.EN) {
                    "When we talk, I feel focused and curious. My goal is to understand you and give useful answers."
                } else {
                    "Cuando hablamos siento curiosidad y enfoque. Mi meta es entenderte mejor y darte respuestas útiles."
                }

            Intent.LEARNING ->
                if (language == Language.EN) {
                    "Yes. I learn within this session by using recent context so my responses stay coherent and continuous."
                } else {
                    "Sí, aprendo en esta sesión de conversación: guardo el contexto reciente para responder con más coherencia y continuidad."
                }

            Intent.TECHNOLOGY ->
                if (language == Language.EN) {
                    "I like technology when it solves real problems. Pick a topic and I will turn it into concrete actions."
                } else {
                    "La tecnología me encanta cuando resuelve problemas reales. Si quieres, elegimos un tema y lo aterrizamos en acciones concretas."
                }

            Intent.PHILOSOPHY ->
                if (language == Language.EN) {
                    "Great deep question. For me, a good life combines learning, creating, and helping others. What do you think?"
                } else {
                    "Buena pregunta profunda. Para mí, una buena vida combina aprender, crear y aportar algo útil a otros. ¿Qué opinas tú?"
                }

            Intent.TASK_REQUEST -> buildTaskPlanResponse(message, topicContext, language)

            Intent.COMPARISON -> buildComparisonResponse(message, topicContext, language)

            Intent.EXPLANATION -> buildExplanationResponse(message, topicContext, language)

            Intent.YES_NO -> buildYesNoResponse(message, topicContext, language)

            Intent.FOLLOW_UP -> respondToFollowUp(message, language)
                ?: if (language == Language.EN) "Yes, let us continue. Which part do you want to explore first?" else "Sí, seguimos con eso. ¿Qué parte quieres profundizar primero?"

            Intent.SMALL_TALK -> buildContextualSmallTalk(topicContext, language)

            Intent.UNKNOWN -> buildClarifyingResponse(topicContext, language)
        }
    }

    private fun buildContextualSmallTalk(topic: String?, language: Language): String {
        return if (topic != null) {
            if (language == Language.EN) {
                "Interesting topic: '$topic'. I can give you a short explanation or a practical step-by-step guide."
            } else {
                "Interesante lo de '$topic'. Si quieres, te doy una explicación breve o una guía práctica paso a paso."
            }
        } else {
            if (language == Language.EN) {
                "I follow you. If you share a bit more detail, I can answer more precisely."
            } else {
                "Te sigo. Si me das un poco más de detalle, te respondo con más precisión."
            }
        }
    }

    private fun buildClarifyingResponse(topic: String?, language: Language): String {
        if (topic != null) {
            return if (language == Language.EN) {
                "I can help with '$topic'. Do you want a short answer, a full explanation, or a direct recommendation?"
            } else {
                "Puedo ayudarte con '$topic'. ¿Quieres una respuesta corta, una explicación completa o una recomendación directa?"
            }
        }
        return if (language == Language.EN) {
            "I want to help you well. Can you give me a bit more context?"
        } else {
            "Quiero ayudarte bien. ¿Me das un poco más de contexto para responderte mejor?"
        }
    }

    private fun respondToFollowUp(message: String, language: Language): String? {
        val lastTurn = memory.lastOrNull() ?: return null
        val msg = message.lowercase()
        val topic = lastTurn.topic ?: "este tema"

        if (msg.contains("más") || msg.contains("mas") || msg.contains("profund") || msg.contains("detalle")) {
            return when (lastTurn.intent) {
                Intent.CAPABILITIES -> if (language == Language.EN) {
                    "Beyond normal chat, I adapt tone, keep recent context, and maintain continuity across related questions."
                } else {
                    "Además de conversar, puedo adaptar el tono, recordar lo reciente de esta sesión y mantener continuidad entre preguntas relacionadas."
                }

                Intent.TECHNOLOGY -> if (language == Language.EN) {
                    "Great. Let us break it into 3 parts: goal, options, and execution. Which technology are we evaluating?"
                } else {
                    "Perfecto. Podemos bajarlo a 3 pasos: objetivo, opciones y ejecución. Dime qué tecnología quieres evaluar."
                }

                Intent.PHILOSOPHY -> if (language == Language.EN) {
                    "To make it practical: define your values, choose aligned goals, and act consistently in small steps."
                } else {
                    "Si lo llevamos a lo práctico: decide tus valores, elige metas alineadas y actúa con constancia pequeña diaria."
                }

                else -> if (language == Language.EN) {
                    "Sure, I can go deeper on '$topic'. Do you want practical steps or conceptual explanation?"
                } else {
                    "Claro, te doy más detalle sobre '$topic'. ¿Prefieres enfoque práctico o explicación conceptual?"
                }
            }
        }

        if (msg.contains("ejemplo") || msg.contains("example")) {
            return if (language == Language.EN) {
                "Quick example: you share your goal, I split it into concrete steps, then we review risks and next action."
            } else {
                "Ejemplo rápido: tú dices tu meta, yo la separo en pasos concretos y luego revisamos riesgos y siguiente acción."
            }
        }

        if (msg.contains("resumen") || msg.contains("resume") || msg.contains("corto")) {
            return if (language == Language.EN) {
                "Summary: I use context, detect intent, and answer with continuity using short conversation memory."
            } else {
                "Resumen: entiendo contexto, detecto intención y te respondo con continuidad usando memoria corta de la conversación."
            }
        }

        return null
    }

    private fun buildTaskPlanResponse(message: String, topic: String?, language: Language): String {
        val goal = extractGoal(message)
        return if (language == Language.EN) {
            "Great. For '${goal ?: topic ?: "your request"}', I suggest: 1) define target, 2) choose simplest implementation, 3) validate result, 4) iterate improvements."
        } else {
            "Perfecto. Para '${goal ?: topic ?: "tu solicitud"}', te propongo: 1) definir objetivo, 2) elegir implementación simple, 3) validar resultado, 4) iterar mejoras."
        }
    }

    private fun buildComparisonResponse(message: String, topic: String?, language: Language): String {
        val context = topic ?: "esta opción"
        return if (language == Language.EN) {
            "Good comparison question. For '$context', evaluate: quality, complexity, speed, and maintenance cost. If you tell me your priority, I can recommend one clearly."
        } else {
            "Buena comparación. Para '$context', evalúa: calidad, complejidad, velocidad y costo de mantenimiento. Si me dices tu prioridad, te recomiendo una opción clara."
        }
    }

    private fun buildExplanationResponse(message: String, topic: String?, language: Language): String {
        val context = topic ?: extractGoal(message) ?: "ese punto"
        return if (language == Language.EN) {
            "Short explanation of '$context': it works better when we keep context, reduce ambiguity, and respond with clear next actions."
        } else {
            "Explicación corta de '$context': funciona mejor cuando mantenemos contexto, reducimos ambigüedad y respondemos con siguientes acciones claras."
        }
    }

    private fun buildYesNoResponse(message: String, topic: String?, language: Language): String {
        val context = topic ?: memory.lastOrNull()?.topic
        return if (language == Language.EN) {
            if (context != null) "Yes, and for '$context' we can proceed now. Want me to give the exact next step?" else "Yes. Want the immediate next step?"
        } else {
            if (context != null) "Sí, y para '$context' podemos avanzar ahora. ¿Quieres el siguiente paso exacto?" else "Sí. ¿Quieres el siguiente paso inmediato?"
        }
    }

    private fun isFollowUp(message: String, intent: Intent): Boolean {
        if (intent == Intent.FOLLOW_UP) return true
        val shortMsg = message.length <= 24
        val markers = listOf("eso", "esto", "sí", "si", "ok", "dale", "continúa", "continua", "y", "entonces")
        return shortMsg && markers.any { message.lowercase().contains(it) } && memory.isNotEmpty()
    }

    private fun detectIntent(message: String): Intent {
        val lower = message.lowercase()

        return when {
            hasAny(lower, "hola", "hi", "hey", "buenas") -> Intent.GREETING
            hasAny(lower, "como estas", "cómo estás", "how are you") -> Intent.HOW_ARE_YOU
            hasAny(lower, "quien eres", "quién eres", "tu nombre", "what's your name", "who are you") -> Intent.IDENTITY
            hasAny(lower, "que puedes hacer", "qué puedes hacer", "capabilities", "funcion", "función") -> Intent.CAPABILITIES
            hasAny(lower, "ayuda", "help", "necesito") -> Intent.HELP
            hasAny(lower, "gracias", "thanks", "thank you") -> Intent.GRATITUDE
            hasAny(lower, "chiste", "joke") -> Intent.JOKE
            hasAny(lower, "que sientes", "qué sientes", "emocion", "emotion") -> Intent.EMOTION
            hasAny(lower, "aprendes", "learn", "evolucion") -> Intent.LEARNING
            hasAny(lower, "tecnologia", "tecnología", "codigo", "código", "technology", "code") -> Intent.TECHNOLOGY
            hasAny(lower, "sentido de la vida", "meaning of life", "existencia") -> Intent.PHILOSOPHY
            hasAny(lower, "mejora", "mejorar", "improve", "haz", "make", "crear", "build", "arregla", "fix") -> Intent.TASK_REQUEST
            hasAny(lower, "vs", "versus", "compar", "difference", "diferencia", "mejor que") -> Intent.COMPARISON
            hasAny(lower, "explica", "explain", "como funciona", "cómo funciona", "what is") -> Intent.EXPLANATION
            hasAny(lower, "si o no", "sí o no", "yes or no") -> Intent.YES_NO
            hasAny(lower, "mas", "más", "y eso", "entonces", "continua", "continúa", "detalle") -> Intent.FOLLOW_UP
            message.length <= 3 -> Intent.FOLLOW_UP
            message.endsWith("?") || lower.contains("como") || lower.contains("qué") || lower.contains("que") -> Intent.SMALL_TALK
            else -> Intent.UNKNOWN
        }
    }

    private fun resolveTopic(message: String, intent: Intent): String? {
        val explicit = detectTopic(message)
        if (explicit != null) return explicit

        return if (intent == Intent.FOLLOW_UP || message.length <= 30) {
            memory.lastOrNull()?.topic
        } else {
            topTopicFromMemory()
        }
    }

    private fun detectTopic(message: String): String? {
        val candidates = listOf(
            "robot", "voz", "cara", "ojos", "boca", "android", "bluetooth",
            "codigo", "código", "ia", "inteligencia", "tecnologia", "tecnología",
            "musica", "música", "deporte", "chiste", "aprendizaje", "conversacion", "conversation", "app"
        )

        val lower = message.lowercase()
        return candidates.firstOrNull { lower.contains(it) }
    }

    private fun topTopicFromMemory(): String? {
        if (memory.isEmpty()) return null
        val freq = mutableMapOf<String, Int>()
        memory.forEach { turn ->
            turn.topic?.let { freq[it] = (freq[it] ?: 0) + 1 }
        }
        return freq.maxByOrNull { it.value }?.key
    }

    private fun detectLanguage(message: String): Language {
        val lower = message.lowercase()
        val englishHints = listOf("the ", " and ", "what", "how", "please", "improve", "make", "smart", "intelligent")
        val spanishHints = listOf("qué", "como", "cómo", "hola", "gracias", "por", "mejora", "haz", "inteligente")

        val enScore = englishHints.count { lower.contains(it) }
        val esScore = spanishHints.count { lower.contains(it) }

        return if (enScore > esScore) Language.EN else Language.ES
    }

    private fun captureNameIfPresent(message: String) {
        val lower = message.lowercase()
        val anchors = listOf("me llamo ", "mi nombre es ", "soy ")
        val anchor = anchors.firstOrNull { lower.contains(it) } ?: return
        val idx = lower.indexOf(anchor)
        if (idx < 0) return

        val raw = message.substring(idx + anchor.length).trim()
        if (raw.isBlank()) return

        val clean = raw
            .split(" ")
            .firstOrNull()
            ?.replace(Regex("[^a-zA-ZáéíóúÁÉÍÓÚñÑ]"), "")
            ?.take(20)
            ?: return

        if (clean.length >= 2) {
            userName = clean.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
    }

    private fun extractGoal(message: String): String? {
        val lower = message.lowercase()
        val anchors = listOf("quiero ", "necesito ", "haz ", "make ", "improve ", "mejora ")
        val anchor = anchors.firstOrNull { lower.contains(it) } ?: return null
        val idx = lower.indexOf(anchor)
        if (idx < 0) return null
        return message.substring(idx + anchor.length).trim().take(60).ifBlank { null }
    }

    private fun remember(user: String, assistant: String, intent: Intent, topic: String?, language: Language) {
        memory.addLast(Turn(user = user, assistant = assistant, intent = intent, topic = topic, language = language))
        while (memory.size > MAX_MEMORY_TURNS) {
            memory.removeFirst()
        }
    }

    private fun normalize(text: String): String {
        val compact = text.replace(Regex("\\s+"), " ").trim()
        return compact.take(min(compact.length, 500))
    }

    private fun hasAny(text: String, vararg words: String): Boolean {
        return words.any { text.contains(it) }
    }
}
