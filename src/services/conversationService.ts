export class ConversationService {
  private static instance: ConversationService;
  
  static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }

  getGreeting(languageCode: string): string {
    const greetings: Record<string, string> = {
      'en': "Hello! I'm your AI conversation partner. How are you doing today?",
      'es': "¡Hola! Soy tu compañero de conversación de IA. ¿Cómo estás hoy?",
      'fr': "Bonjour ! Je suis votre partenaire de conversation IA. Comment allez-vous aujourd'hui ?",
      'de': "Hallo! Ich bin Ihr KI-Gesprächspartner. Wie geht es Ihnen heute?",
      'it': "Ciao! Sono il tuo partner di conversazione AI. Come stai oggi?",
      'pt': "Olá! Sou seu parceiro de conversa de IA. Como você está hoje?",
      'ja': "こんにちは！私はあなたのAI会話パートナーです。今日はいかがですか？",
      'ko': "안녕하세요! 저는 당신의 AI 대화 파트너입니다. 오늘 어떻게 지내세요?",
      'zh': "你好！我是你的AI对话伙伴。你今天怎么样？",
      'ru': "Привет! Я ваш собеседник с искусственным интеллектом. Как дела сегодня?",
      'hi': "नमस्ते! मैं आपका AI बातचीत साथी हूँ। आज आप कैसे हैं?",
      'ar': "مرحبا! أنا شريك المحادثة الذكي الخاص بك. كيف حالك اليوم؟",
      'nl': "Hallo! Ik ben je AI-gesprekspartner. Hoe gaat het vandaag met je?",
      'sv': "Hej! Jag är din AI-samtalspartner. Hur mår du idag?",
      'da': "Hej! Jeg er din AI-samtale partner. Hvordan har du det i dag?",
      'no': "Hei! Jeg er din AI-samtale partner. Hvordan har du det i dag?",
      'fi': "Hei! Olen tekoäly-keskustelukumppanisi. Miten voit tänään?",
      'pl': "Cześć! Jestem twoim partnerem do rozmów AI. Jak się masz dzisiaj?",
      'cs': "Ahoj! Jsem váš AI konverzační partner. Jak se dnes máte?",
      'hu': "Szia! Én vagyok az AI beszélgetőpartner. Hogy vagy ma?",
      'ro': "Salut! Sunt partenerul tău de conversație AI. Cum te simți astăzi?",
      'bg': "Здравей! Аз съм твоят AI събеседник. Как си днес?",
      'hr': "Bok! Ja sam tvoj AI partner za razgovor. Kako si danas?",
      'sk': "Ahoj! Som váš AI konverzačný partner. Ako sa dnes máte?",
      'el': "Γεια σας! Είμαι ο συνομιλητής σας με τεχνητή νοημοσύνη. Πώς είστε σήμερα;",
      'tr': "Merhaba! Ben sizin AI sohbet ortağınızım. Bugün nasılsınız?",
      'uk': "Привіт! Я ваш співрозмовник зі штучним інтелектом. Як справи сьогодні?",
      'vi': "Xin chào! Tôi là đối tác trò chuyện AI của bạn. Hôm nay bạn thế nào?",
      'th': "สวัสดี! ฉันเป็นพาร์ทเนอร์สนทนา AI ของคุณ วันนี้คุณเป็นอย่างไรบ้าง?",
      'id': "Halo! Saya adalah mitra percakapan AI Anda. Bagaimana kabar Anda hari ini?",
      'ms': "Hello! Saya adalah rakan perbualan AI anda. Apa khabar hari ini?",
      'fil': "Kumusta! Ako ang inyong AI conversation partner. Kumusta kayo ngayon?",
      'ta': "வணக்கம்! நான் உங்கள் AI உரையாடல் பங்காளி. இன்று எப்படி இருக்கிறீர்கள்?"
    };

    return greetings[languageCode] || greetings['en'];
  }

  async getResponse(userMessage: string, languageCode: string): Promise<string> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simple conversation responses based on language
    const responses = this.getResponseTemplates(languageCode);
    
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (this.containsGreeting(lowerMessage, languageCode)) {
      return this.getRandomResponse(responses.greetings);
    }
    
    // Check for questions about well-being
    if (this.containsWellBeingQuestion(lowerMessage, languageCode)) {
      return this.getRandomResponse(responses.wellBeing);
    }
    
    // Check for questions
    if (lowerMessage.includes('?') || this.containsQuestionWords(lowerMessage, languageCode)) {
      return this.getRandomResponse(responses.questions);
    }
    
    // Check for positive sentiment
    if (this.containsPositiveWords(lowerMessage, languageCode)) {
      return this.getRandomResponse(responses.positive);
    }
    
    // Check for negative sentiment
    if (this.containsNegativeWords(lowerMessage, languageCode)) {
      return this.getRandomResponse(responses.negative);
    }
    
    // Default responses
    return this.getRandomResponse(responses.general);
  }

  private getResponseTemplates(languageCode: string) {
    const templates: Record<string, any> = {
      'en': {
        greetings: [
          "Hello there! It's great to meet you. What would you like to talk about?",
          "Hi! I'm excited to have this conversation with you. How can I help?",
          "Hey! Thanks for chatting with me. What's on your mind today?"
        ],
        wellBeing: [
          "I'm doing wonderfully, thank you for asking! How about you?",
          "I'm great! I love having conversations. How are you feeling today?",
          "I'm doing fantastic! It's always a good day when I get to chat with someone new."
        ],
        questions: [
          "That's a great question! Let me think about that for a moment.",
          "Interesting question! I'd love to explore that topic with you.",
          "That's something I find fascinating. What made you curious about that?"
        ],
        positive: [
          "That's wonderful to hear! I'm so glad you're having a positive experience.",
          "That sounds amazing! Tell me more about what makes you feel that way.",
          "I love your positive energy! It's contagious."
        ],
        negative: [
          "I'm sorry to hear that. Would you like to talk about what's bothering you?",
          "That sounds challenging. I'm here to listen if you need someone to talk to.",
          "I understand that can be difficult. How can I help make things better?"
        ],
        general: [
          "That's really interesting! Can you tell me more about that?",
          "I see what you mean. What are your thoughts on that?",
          "That's a fascinating perspective. I'd love to hear more of your ideas.",
          "Thanks for sharing that with me. What else is on your mind?"
        ]
      }
    };

    // For non-English languages, provide basic responses
    const defaultTemplate = {
      greetings: [this.getGreeting(languageCode)],
      wellBeing: [this.getWellBeingResponse(languageCode)],
      questions: [this.getQuestionResponse(languageCode)],
      positive: [this.getPositiveResponse(languageCode)],
      negative: [this.getNegativeResponse(languageCode)],
      general: [this.getGeneralResponse(languageCode)]
    };

    return templates[languageCode] || defaultTemplate;
  }

  private getWellBeingResponse(languageCode: string): string {
    const responses: Record<string, string> = {
      'es': "¡Estoy muy bien, gracias por preguntar! ¿Cómo estás tú?",
      'fr': "Je vais très bien, merci de demander ! Comment allez-vous ?",
      'de': "Mir geht es sehr gut, danke der Nachfrage! Wie geht es Ihnen?",
      'it': "Sto molto bene, grazie per aver chiesto! Come stai?",
      'pt': "Estou muito bem, obrigado por perguntar! Como você está?",
      'ja': "とても元気です、聞いてくれてありがとう！あなたはいかがですか？",
      'ko': "저는 아주 잘 지내고 있어요, 물어봐 주셔서 감사해요! 당신은 어떠세요?",
      'zh': "我很好，谢谢你的关心！你怎么样？",
      'ru': "У меня все отлично, спасибо, что спросили! А как у вас дела?",
      'hi': "मैं बहुत अच्छा हूँ, पूछने के लिए धन्यवाद! आप कैसे हैं?"
    };
    return responses[languageCode] || "I'm doing great, thank you for asking! How are you?";
  }

  private getQuestionResponse(languageCode: string): string {
    const responses: Record<string, string> = {
      'es': "¡Esa es una gran pregunta! Me encanta explorar ese tema contigo.",
      'fr': "C'est une excellente question ! J'aimerais explorer ce sujet avec vous.",
      'de': "Das ist eine großartige Frage! Ich würde gerne dieses Thema mit Ihnen erkunden.",
      'it': "È una domanda fantastica! Mi piacerebbe esplorare questo argomento con te.",
      'pt': "Essa é uma ótima pergunta! Adoraria explorar esse tópico com você.",
      'ja': "それは素晴らしい質問ですね！あなたとそのトピックを探求したいです。",
      'ko': "정말 좋은 질문이네요! 당신과 그 주제를 탐구해보고 싶어요.",
      'zh': "这是个很好的问题！我很想和你一起探讨这个话题。",
      'ru': "Это отличный вопрос! Я бы хотел изучить эту тему вместе с вами.",
      'hi': "यह एक बेहतरीन सवाल है! मैं आपके साथ इस विषय पर चर्चा करना चाहूंगा।"
    };
    return responses[languageCode] || "That's a great question! I'd love to explore that topic with you.";
  }

  private getPositiveResponse(languageCode: string): string {
    const responses: Record<string, string> = {
      'es': "¡Eso es maravilloso! Me alegra mucho escuchar eso.",
      'fr': "C'est merveilleux ! Je suis si heureux d'entendre cela.",
      'de': "Das ist wunderbar! Ich freue mich so sehr, das zu hören.",
      'it': "È meraviglioso! Sono così felice di sentire questo.",
      'pt': "Isso é maravilhoso! Fico muito feliz em ouvir isso.",
      'ja': "それは素晴らしいです！それを聞けてとても嬉しいです。",
      'ko': "정말 멋지네요! 그런 말을 들으니 너무 기뻐요.",
      'zh': "太棒了！听到这个我很高兴。",
      'ru': "Это замечательно! Я так рад это слышать.",
      'hi': "यह बहुत अच्छी बात है! यह सुनकर मुझे बहुत खुशी हुई।"
    };
    return responses[languageCode] || "That's wonderful! I'm so glad to hear that.";
  }

  private getNegativeResponse(languageCode: string): string {
    const responses: Record<string, string> = {
      'es': "Lamento escuchar eso. ¿Te gustaría hablar sobre lo que te molesta?",
      'fr': "Je suis désolé d'entendre cela. Aimeriez-vous parler de ce qui vous dérange ?",
      'de': "Es tut mir leid, das zu hören. Möchten Sie über das sprechen, was Sie beschäftigt?",
      'it': "Mi dispiace sentire questo. Vorresti parlare di quello che ti preoccupa?",
      'pt': "Sinto muito ouvir isso. Gostaria de falar sobre o que está te incomodando?",
      'ja': "それを聞いて申し訳ありません。何が気になっているか話したいですか？",
      'ko': "그런 말을 들으니 안타깝네요. 무엇이 당신을 괴롭히는지 이야기하고 싶으세요?",
      'zh': "听到这个我很抱歉。你想谈谈是什么让你烦恼吗？",
      'ru': "Мне жаль это слышать. Хотели бы вы поговорить о том, что вас беспокоит?",
      'hi': "यह सुनकर मुझे खुशी नहीं हुई। क्या आप इस बारे में बात करना चाहेंगे कि आपको क्या परेशान कर रहा है?"
    };
    return responses[languageCode] || "I'm sorry to hear that. Would you like to talk about what's bothering you?";
  }

  private getGeneralResponse(languageCode: string): string {
    const responses: Record<string, string> = {
      'es': "Eso es realmente interesante. ¿Puedes contarme más sobre eso?",
      'fr': "C'est vraiment intéressant ! Pouvez-vous m'en dire plus à ce sujet ?",
      'de': "Das ist wirklich interessant! Können Sie mir mehr darüber erzählen?",
      'it': "È davvero interessante! Puoi dirmi di più a riguardo?",
      'pt': "Isso é realmente interessante! Você pode me contar mais sobre isso?",
      'ja': "それは本当に興味深いです！それについてもっと教えてもらえますか？",
      'ko': "정말 흥미롭네요! 그것에 대해 더 자세히 말해주실 수 있나요?",
      'zh': "这真的很有趣！你能告诉我更多关于这个的事情吗？",
      'ru': "Это действительно интересно! Можете ли вы рассказать мне больше об этом?",
      'hi': "यह वास्तव में दिलचस्प है! क्या आप मुझे इसके बारे में और बता सकते हैं?"
    };
    return responses[languageCode] || "That's really interesting! Can you tell me more about that?";
  }

  private containsGreeting(message: string, languageCode: string): boolean {
    const greetingWords: Record<string, string[]> = {
      'en': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      'es': ['hola', 'buenos días', 'buenas tardes', 'buenas noches'],
      'fr': ['bonjour', 'bonsoir', 'salut'],
      'de': ['hallo', 'guten morgen', 'guten tag', 'guten abend'],
      'it': ['ciao', 'buongiorno', 'buonasera'],
      'pt': ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite'],
      'ja': ['こんにちは', 'おはよう', 'こんばんは'],
      'ko': ['안녕', '안녕하세요', '좋은 아침'],
      'zh': ['你好', '早上好', '下午好', '晚上好'],
      'ru': ['привет', 'здравствуйте', 'доброе утро', 'добрый день', 'добрый вечер'],
      'hi': ['नमस्ते', 'हैलो', 'सुप्रभात']
    };

    const words = greetingWords[languageCode] || greetingWords['en'];
    return words.some(word => message.includes(word));
  }

  private containsWellBeingQuestion(message: string, languageCode: string): boolean {
    const wellBeingWords: Record<string, string[]> = {
      'en': ['how are you', 'how do you feel', 'are you okay', 'how are things'],
      'es': ['cómo estás', 'cómo te sientes', 'estás bien', 'qué tal'],
      'fr': ['comment allez-vous', 'comment vous sentez-vous', 'ça va'],
      'de': ['wie geht es ihnen', 'wie fühlen sie sich', 'geht es ihnen gut'],
      'it': ['come stai', 'come ti senti', 'stai bene'],
      'pt': ['como você está', 'como se sente', 'está bem'],
      'ja': ['元気ですか', 'どうですか', '調子はどう'],
      'ko': ['어떻게 지내세요', '괜찮으세요', '어떠세요'],
      'zh': ['你好吗', '你怎么样', '你还好吗'],
      'ru': ['как дела', 'как вы себя чувствуете', 'все хорошо'],
      'hi': ['आप कैसे हैं', 'कैसा लग रहा है', 'सब ठीक है']
    };

    const words = wellBeingWords[languageCode] || wellBeingWords['en'];
    return words.some(word => message.includes(word));
  }

  private containsQuestionWords(message: string, languageCode: string): boolean {
    const questionWords: Record<string, string[]> = {
      'en': ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'can you', 'do you', 'will you'],
      'es': ['qué', 'por qué', 'cómo', 'cuándo', 'dónde', 'quién', 'cuál', 'puedes', 'haces'],
      'fr': ['quoi', 'pourquoi', 'comment', 'quand', 'où', 'qui', 'quel', 'pouvez-vous'],
      'de': ['was', 'warum', 'wie', 'wann', 'wo', 'wer', 'welche', 'können sie'],
      'it': ['cosa', 'perché', 'come', 'quando', 'dove', 'chi', 'quale', 'puoi'],
      'pt': ['o que', 'por que', 'como', 'quando', 'onde', 'quem', 'qual', 'você pode'],
      'ja': ['何', 'なぜ', 'どう', 'いつ', 'どこ', '誰', 'どの'],
      'ko': ['무엇', '왜', '어떻게', '언제', '어디', '누구', '어느'],
      'zh': ['什么', '为什么', '怎么', '什么时候', '哪里', '谁', '哪个'],
      'ru': ['что', 'почему', 'как', 'когда', 'где', 'кто', 'какой'],
      'hi': ['क्या', 'क्यों', 'कैसे', 'कब', 'कहाँ', 'कौन', 'कौन सा']
    };

    const words = questionWords[languageCode] || questionWords['en'];
    return words.some(word => message.includes(word));
  }

  private containsPositiveWords(message: string, languageCode: string): boolean {
    const positiveWords: Record<string, string[]> = {
      'en': ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'happy', 'love', 'like'],
      'es': ['bueno', 'genial', 'excelente', 'increíble', 'maravilloso', 'fantástico', 'feliz', 'amor', 'me gusta'],
      'fr': ['bon', 'génial', 'excellent', 'incroyable', 'merveilleux', 'fantastique', 'heureux', 'amour', 'aime'],
      'de': ['gut', 'toll', 'ausgezeichnet', 'erstaunlich', 'wunderbar', 'fantastisch', 'glücklich', 'liebe', 'mag'],
      'it': ['buono', 'grande', 'eccellente', 'incredibile', 'meraviglioso', 'fantastico', 'felice', 'amore', 'piace'],
      'pt': ['bom', 'ótimo', 'excelente', 'incrível', 'maravilhoso', 'fantástico', 'feliz', 'amor', 'gosto'],
      'ja': ['良い', '素晴らしい', '優秀', '驚くべき', '素敵', '幸せ', '愛', '好き'],
      'ko': ['좋은', '훌륭한', '우수한', '놀라운', '멋진', '행복한', '사랑', '좋아'],
      'zh': ['好', '很棒', '优秀', '惊人', '美妙', '快乐', '爱', '喜欢'],
      'ru': ['хорошо', 'отлично', 'превосходно', 'удивительно', 'замечательно', 'счастливый', 'любовь', 'нравится'],
      'hi': ['अच्छा', 'बेहतरीन', 'उत्कृष्ट', 'अद्भुत', 'शानदार', 'खुश', 'प्यार', 'पसंद']
    };

    const words = positiveWords[languageCode] || positiveWords['en'];
    return words.some(word => message.includes(word));
  }

  private containsNegativeWords(message: string, languageCode: string): boolean {
    const negativeWords: Record<string, string[]> = {
      'en': ['bad', 'terrible', 'awful', 'sad', 'angry', 'frustrated', 'disappointed', 'worried', 'stressed', 'hate'],
      'es': ['malo', 'terrible', 'horrible', 'triste', 'enojado', 'frustrado', 'decepcionado', 'preocupado', 'estresado', 'odio'],
      'fr': ['mauvais', 'terrible', 'affreux', 'triste', 'en colère', 'frustré', 'déçu', 'inquiet', 'stressé', 'déteste'],
      'de': ['schlecht', 'schrecklich', 'furchtbar', 'traurig', 'wütend', 'frustriert', 'enttäuscht', 'besorgt', 'gestresst', 'hasse'],
      'it': ['cattivo', 'terribile', 'orribile', 'triste', 'arrabbiato', 'frustrato', 'deluso', 'preoccupato', 'stressato', 'odio'],
      'pt': ['ruim', 'terrível', 'horrível', 'triste', 'zangado', 'frustrado', 'decepcionado', 'preocupado', 'estressado', 'odeio'],
      'ja': ['悪い', 'ひどい', '悲しい', '怒っている', 'イライラ', 'がっかり', '心配', 'ストレス', '嫌い'],
      'ko': ['나쁜', '끔찍한', '슬픈', '화난', '좌절한', '실망한', '걱정', '스트레스', '싫어'],
      'zh': ['坏', '可怕', '糟糕', '悲伤', '生气', '沮丧', '失望', '担心', '压力', '讨厌'],
      'ru': ['плохо', 'ужасно', 'грустно', 'злой', 'расстроенный', 'разочарованный', 'обеспокоенный', 'напряженный', 'ненавижу'],
      'hi': ['बुरा', 'भयानक', 'दुखी', 'गुस्सा', 'निराश', 'चिंतित', 'तनाव', 'नफरत']
    };

    const words = negativeWords[languageCode] || negativeWords['en'];
    return words.some(word => message.includes(word));
  }

  private getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }
}