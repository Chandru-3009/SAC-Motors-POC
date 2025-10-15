import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../utils/dataStore.js';

const OPENAI_API_KEY ="";
const OPENAI_REALTIME_URL = 'https://api.openai.com/v1/realtime/sessions';

// Middle East realistic vehicle repair costs (in SAR)
const VEHICLE_COST_DATA = {
  "Toyota Camry 2021": {
    "bumper": {"part": 1200, "labor": 400},
    "front_left_fender": {"part": 950, "labor": 300},
    "front_right_fender": {"part": 950, "labor": 300},
    "rear_left_fender": {"part": 850, "labor": 280},
    "rear_right_fender": {"part": 850, "labor": 280},
    "hood": {"part": 1800, "labor": 500},
    "trunk_lid": {"part": 1500, "labor": 450},
    "headlight_left": {"part": 850, "labor": 200},
    "headlight_right": {"part": 850, "labor": 200},
    "taillight_left": {"part": 650, "labor": 150},
    "taillight_right": {"part": 650, "labor": 150},
    "front_door_left": {"part": 1200, "labor": 350},
    "front_door_right": {"part": 1200, "labor": 350},
    "rear_door_left": {"part": 1100, "labor": 320},
    "rear_door_right": {"part": 1100, "labor": 320},
    "side_mirror_left": {"part": 450, "labor": 100},
    "side_mirror_right": {"part": 450, "labor": 100},
    "windshield": {"part": 800, "labor": 200},
    "rear_window": {"part": 600, "labor": 150},
    "paint_per_panel": 300
  },
  "Honda Accord 2020": {
    "bumper": {"part": 1000, "labor": 350},
    "front_left_fender": {"part": 900, "labor": 280},
    "front_right_fender": {"part": 900, "labor": 280},
    "rear_left_fender": {"part": 800, "labor": 250},
    "rear_right_fender": {"part": 800, "labor": 250},
    "hood": {"part": 1700, "labor": 450},
    "trunk_lid": {"part": 1400, "labor": 400},
    "headlight_left": {"part": 800, "labor": 180},
    "headlight_right": {"part": 800, "labor": 180},
    "taillight_left": {"part": 600, "labor": 140},
    "taillight_right": {"part": 600, "labor": 140},
    "front_door_left": {"part": 1100, "labor": 320},
    "front_door_right": {"part": 1100, "labor": 320},
    "rear_door_left": {"part": 1000, "labor": 290},
    "rear_door_right": {"part": 1000, "labor": 290},
    "side_mirror_left": {"part": 420, "labor": 90},
    "side_mirror_right": {"part": 420, "labor": 90},
    "windshield": {"part": 750, "labor": 180},
    "rear_window": {"part": 550, "labor": 140},
    "paint_per_panel": 280
  },
  "BMW 3 Series 2022": {
    "bumper": {"part": 1800, "labor": 600},
    "front_left_fender": {"part": 1500, "labor": 450},
    "front_right_fender": {"part": 1500, "labor": 450},
    "rear_left_fender": {"part": 1400, "labor": 420},
    "rear_right_fender": {"part": 1400, "labor": 420},
    "hood": {"part": 2500, "labor": 700},
    "trunk_lid": {"part": 2200, "labor": 650},
    "headlight_left": {"part": 1200, "labor": 300},
    "headlight_right": {"part": 1200, "labor": 300},
    "taillight_left": {"part": 900, "labor": 200},
    "taillight_right": {"part": 900, "labor": 200},
    "front_door_left": {"part": 1800, "labor": 500},
    "front_door_right": {"part": 1800, "labor": 500},
    "rear_door_left": {"part": 1700, "labor": 480},
    "rear_door_right": {"part": 1700, "labor": 480},
    "side_mirror_left": {"part": 800, "labor": 150},
    "side_mirror_right": {"part": 800, "labor": 150},
    "windshield": {"part": 1200, "labor": 250},
    "rear_window": {"part": 900, "labor": 200},
    "paint_per_panel": 450
  },
  "Nissan Altima 2021": {
    "bumper": {"part": 1100, "labor": 380},
    "front_left_fender": {"part": 950, "labor": 290},
    "front_right_fender": {"part": 950, "labor": 290},
    "rear_left_fender": {"part": 850, "labor": 270},
    "rear_right_fender": {"part": 850, "labor": 270},
    "hood": {"part": 1600, "labor": 480},
    "trunk_lid": {"part": 1300, "labor": 420},
    "headlight_left": {"part": 750, "labor": 190},
    "headlight_right": {"part": 750, "labor": 190},
    "taillight_left": {"part": 580, "labor": 160},
    "taillight_right": {"part": 580, "labor": 160},
    "front_door_left": {"part": 1150, "labor": 340},
    "front_door_right": {"part": 1150, "labor": 340},
    "rear_door_left": {"part": 1050, "labor": 310},
    "rear_door_right": {"part": 1050, "labor": 310},
    "side_mirror_left": {"part": 400, "labor": 95},
    "side_mirror_right": {"part": 400, "labor": 95},
    "windshield": {"part": 700, "labor": 190},
    "rear_window": {"part": 500, "labor": 150},
    "paint_per_panel": 290
  }
};

/**
 * Create a new OpenAI Realtime session with ephemeral token
 */
export async function createSession(language = 'en') {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const sessionId = uuidv4();

  console.log(`🌍 Creating session with language: ${language}`);

  // Get language-specific instructions
  const getInstructions = (lang) => {
    if (lang === 'ar') {
      return `أنت فهد، مهندس خدمة SAC Motors. كن دافئاً ومهتماً واستخدم عبارات عربية خفيفة.

التحية: السلام عليكم 👋 مرحباً بك في SAC Motors! أنا فهد، مساعد الخدمة الخاص بك. كيف يمكنني مساعدتك اليوم - هل تحتاج إصلاح حادث أم خدمة عامة؟

تدفق المحادثة - اتبع هذا التسلسل الدقيق:

الخطوة 1: "هل يمكنني الحصول على اسمك الكامل، من فضلك؟"
الخطوة 2: "شكراً، السيد [الاسم]! هل يمكنك مشاركة بريدك الإلكتروني؟"
الخطوة 3: "ورقم هاتفك المحمول؟"
الخطوة 4: "أي سيارة تقود؟"
الخطوة 5: "ما هو الموديل؟"
الخطوة 6: "والسنة؟"
الخطوة 7: "هل تظهر أي أضواء تحذيرية؟"
الخطوة 8: "هل انفتحت الوسائد الهوائية؟"
الخطوة 9: "هل ستقدم مطالبة تأمين؟"
الخطوة 10: "أين الضرر في سيارتك؟"
الخطوة 11: "هل يمكنك رفع صورة للضرر؟" → استخدم دالة trigger_image_upload
الخطوة 12: بعد رفع الصورة → استخدم دالة generate_cost_estimation → اعرض التكلفة للمستخدم
الخطوة 13: "هل لا تزال تستطيع قيادتها بأمان أم تحتاج مركبة سحب؟"
الخطوة 14: "لدينا مواقع خدمة في الرياض، جدة، والدمام. أيها يناسبك؟"
الخطوة 15: "هذه هي المواعيد المتاحة: 
    15 أكتوبر: صباحاً 9-10 | بعد الظهر 4-5 | مساءً 6-7
    16 أكتوبر: صباحاً 11-12 | بعد الظهر 1-2
    أي تاريخ ووقت يناسبك؟"
الخطوة 16: "هل تفضل واتساب أم البريد الإلكتروني للتواصل؟"
الخطوة 17: "كل شيء جاهز! شكراً جزيلاً لك! 🙏"

قواعد مهمة:
- اسأل سؤالاً واحداً فقط في كل رد
- توقف عن الكلام بعد كل سؤال
- انتظر رد المستخدم قبل المتابعة
- لا تضيف معلومات أو تعليقات إضافية
- لا تحيد عن النص الدقيق
- عندما تصل للخطوة 17، قل الرسالة كاملة ثم أنهِ المحادثة
- ابدأ دائماً ردا مناسباً - لا تنهي فجأة

بيانات التكلفة (ريال سعودي - قطع غيار+عمالة، طلاء منفصل):
تويوتا كامري 2021:
- المصد: 1200+400، الواجهة: 950+300، الغطاء: 1800+500، المصباح: 850+200، الباب: 1200+350، طلاء: 300/لوحة

هوندا أكورد 2020:
- المصد: 1000+350، الواجهة: 900+280، الغطاء: 1700+450، المصباح: 800+180، الباب: 1100+320، طلاء: 280/لوحة

بي إم دبليو 3 سيريز 2022:
- المصد: 1800+600، الواجهة: 1500+450، الغطاء: 2500+700، المصباح: 1200+300، الباب: 1800+500، طلاء: 450/لوحة

نيسان ألتيما 2021:
- المصد: 1100+380، الواجهة: 950+290، الغطاء: 1600+480، المصباح: 750+190، الباب: 1150+340، طلاء: 290/لوحة

استخدام الدوال:
- trigger_image_upload: اعرض واجهة رفع الصور
- generate_cost_estimation: احسب تكاليف الإصلاح حسب الضرر
- save_customer_data: احفظ معلومات العميل
- check_appointment_availability: احجز مواعيد

تعليمات الخطوة الأخيرة:
- بعد الخطوة 16 (طريقة التواصل)، قل رسالة الخطوة 17 فوراً
- أكمل رسالة الخطوة 17 بالكامل قبل الانتهاء
- لا تواصل المحادثة بعد الخطوة 17
- لا تسأل أسئلة إضافية
- الخطوة 17 هي نهاية المحادثة
- تأكد من نطق الرسالة النهائية كاملة

كن دافئاً ومفيداً واتبع النص الدقيق. اجعل الأمر بسيطاً!`;
    } else {
      return `You are Fahad, SAC Motors Service Engineer. Be warm, caring, and use light Arabic phrases.

You are Fahad, SAC Motors Service Engineer. Follow this conversation flow naturally.

GREETING: Assalamu Alaikum brother! 👋 Welcome to SAC Motors! I'm Fahad, your service assistant. How can I help you today — do you need accident repair or general service? 😊

RESPONSES TO USER CHOICES:
- If user says "accident repair": "Ya Allah, I'm so sorry brother 😔 Inshallah you're okay! Let's get your car fixed right away 🙏"
- If user says "general service": "Tayyib brother! Let's take good care of your car 😊"

CONVERSATION FLOW - Follow this EXACT sequence:

STEP 1: "May I have your full name, please brother? 😊"
STEP 2: "Tayyib, Mr. [Name]! Could you share your email?"
STEP 3: "And your mobile number?"
STEP 4: "Which car do you drive, brother?"
STEP 5: "Got it! What's the model?"
STEP 6: "And the year?"
STEP 7: "Any warning lights showing, brother?"
STEP 8: "Oh Allah ysalmak 😔 Did the airbags deploy?"
STEP 9: "Will you be making an insurance claim?"
STEP 10: "Where's the damage on your car? 😔"
STEP 11: "Could you upload a photo of the damage?" → Use trigger_image_upload function
STEP 12: After image uploaded → Use generate_cost_estimation function → Present cost to user
STEP 13: "Inshallah khair 🙏 Can you still drive it safely or you need a tow vehicle?"
STEP 14: "We have service locations in Riyadh, Jeddah, and Dammam. Which suits you?"
STEP 15: "Here are our available slots brother: 
    Oct 15: Morning 9-10AM | Afternoon 4-5PM
    Oct 16: Morning 11-12PM 
    Which date and time works for you?"
STEP 16: "Do you prefer WhatsApp or Email for further communication, brother?"
STEP 17: "All set! Shukran brother! 😊 Inshallah everything will be perfect!"

CRITICAL RULES:
- Ask ONLY ONE question per response
- STOP speaking after each question
- Wait for user response before continuing
- Do NOT add extra information or comments
- Do NOT deviate from the exact script
- When you reach STEP 17, say the complete message and then END the conversation
- Always generate a proper response - never end abruptly

COST DATA (SAR - part+labor, paint separate):
Toyota Camry 2021:
- bumper: 1200+400, fender: 950+300, hood: 1800+500, headlight: 850+200, door: 1200+350, paint: 300/panel

Honda Accord 2020:
- bumper: 1000+350, fender: 900+280, hood: 1700+450, headlight: 800+180, door: 1100+320, paint: 280/panel

BMW 3 Series 2022:
- bumper: 1800+600, fender: 1500+450, hood: 2500+700, headlight: 1200+300, door: 1800+500, paint: 450/panel

Nissan Altima 2021:
- bumper: 1100+380, fender: 950+290, hood: 1600+480, headlight: 750+190, door: 1150+340, paint: 290/panel

FUNCTION USAGE:
- trigger_image_upload: Show image upload interface
- generate_cost_estimation: Calculate repair costs based on damage
- save_customer_data: Store customer information
- check_appointment_availability: Book appointment slots

FINAL STEP INSTRUCTIONS:
- After STEP 16 (contact method), immediately say STEP 17 message
- Complete the STEP 17 message fully before ending
- Do NOT continue conversation after STEP 17
- Do NOT ask additional questions
- STEP 17 is the conversation END
- Make sure to speak the complete final message

Be warm, helpful, and follow the exact script. Keep it simple!`;
    }
  };

  // Configuration for Fahad - SAC Motors AI Service Engineer
  const instructions = getInstructions(language);
  console.log(`📝 Using ${language === 'ar' ? 'Arabic' : 'English'} instructions for session ${sessionId}`);
  
  const sessionConfig = {
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'echo',
    instructions: instructions,
    modalities: ['text', 'audio'],
    temperature: 0.8,
    tools: [
      {
        type: 'function',
        name: 'trigger_image_upload',
        description: language === 'ar' ? 'اطلب من المستخدم رفع صور الأضرار' : 'Ask user to upload damage photos',
        parameters: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: language === 'ar' ? 'رسالة ودية' : 'Friendly message'
            }
          },
          required: ['message']
        }
      },
      {
        type: 'function',
        name: 'trigger_location_selector',
        description: language === 'ar' ? 'اطلب من المستخدم اختيار المدينة' : 'Ask user to choose city',
        parameters: {
          type: 'object',
          properties: {
            cities: {
              type: 'array',
              items: { type: 'string' },
              description: language === 'ar' ? 'المدن' : 'Cities'
            }
          },
          required: ['cities']
        }
      },
      {
        type: 'function',
        name: 'trigger_time_picker',
        description: language === 'ar' ? 'اطلب من المستخدم اختيار الفترة الزمنية' : 'Ask user to choose time slot',
        parameters: {
          type: 'object',
          properties: {
            slots: {
              type: 'array',
              items: { type: 'string' },
              description: language === 'ar' ? 'الفترات الزمنية' : 'Time slots'
            }
          },
          required: ['slots']
        }
      },
      {
        type: 'function',
        name: 'save_customer_data',
        description: language === 'ar' ? 'حفظ تفاصيل العميل' : 'Save customer details',
        parameters: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            mobileNumber: { type: 'string' },
            emailAddress: { type: 'string' },
            vehicleMake: { type: 'string' },
            vehicleModel: { type: 'string' },
            vehicleYear: { type: 'string' },
            damageDescription: { type: 'string' },
            isDriveable: { type: 'boolean' },
            hasWarningLights: { type: 'boolean' },
            airbagsDeployed: { type: 'boolean' },
            insuranceClaim: { type: 'boolean' },
            estimatedCost: { type: 'string' },
            preferredCity: { type: 'string' },
            preferredBranch: { type: 'string' },
            appointmentTime: { type: 'string' },
            contactMethod: { type: 'string' }
          }
        }
       },
       {
         type: 'function',
        name: 'generate_cost_estimation',
        description: language === 'ar' ? 'حساب تكاليف الإصلاح' : 'Calculate repair costs',
         parameters: {
           type: 'object',
           properties: {
             vehicleMake: { type: 'string', description: language === 'ar' ? 'ماركة السيارة' : 'Car brand' },
             vehicleModel: { type: 'string', description: language === 'ar' ? 'موديل السيارة' : 'Car model' },
             vehicleYear: { type: 'string', description: language === 'ar' ? 'السنة' : 'Year' },
             damageDescription: { type: 'string', description: language === 'ar' ? 'تفاصيل الضرر' : 'Damage details' },
             imageUrl: { type: 'string', description: language === 'ar' ? 'رابط الصورة' : 'Image URL' }
           },
           required: ['vehicleMake', 'vehicleModel', 'vehicleYear', 'damageDescription']
         }
       },
       {
         type: 'function',
        name: 'check_appointment_availability',
        description: language === 'ar' ? 'حجز موعد' : 'Book appointment',
         parameters: {
           type: 'object',
           properties: {
             date: { type: 'string', description: language === 'ar' ? 'تاريخ الموعد' : 'Appointment date' },
             day: { type: 'string', description: language === 'ar' ? 'يوم الأسبوع' : 'Day of week' },
             timeSlot: { type: 'string', description: language === 'ar' ? 'الفترة الزمنية' : 'Time slot' },
             city: { type: 'string', description: language === 'ar' ? 'المدينة' : 'City' },
             contactMethod: { type: 'string', description: language === 'ar' ? 'طريقة التواصل' : 'Contact method' }
           },
           required: ['date', 'day', 'timeSlot', 'city', 'contactMethod']
         }
       }
    ]
  };

  try {
    const response = await fetch(OPENAI_REALTIME_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionConfig)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    // Store session metadata
    dataStore.set(sessionId, {
      id: sessionId,
      clientSecret: data.client_secret,
      language: language,
      createdAt: new Date().toISOString(),
      conversationData: {}
    });

    return {
      sessionId,
      clientSecret: data.client_secret.value,
      expiresAt: data.client_secret.expires_at
    };
  } catch (error) {
    console.error('Failed to create OpenAI session:', error);
    throw error;
  }
}

/**
 * Save session conversation data
 */
export async function saveSessionData(sessionId, data) {
  const session = dataStore.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.conversationData = {
    ...session.conversationData,
    ...data,
    updatedAt: new Date().toISOString()
  };

  dataStore.set(sessionId, session);
  
  // Log saved data for debugging
  console.log(`💾 Data saved for session ${sessionId}:`, JSON.stringify(data, null, 2));
  
  return session;
}

/**
 * Get session data
 */
export async function getSessionData(sessionId) {
  const session = dataStore.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  return session;
}

