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

تدفق المحادثة (اسأل سؤالاً واحداً في كل مرة، اجعل الردود أقل من 80 حرفاً):
1. التحية
2. "هل يمكنني الحصول على اسمك الكامل، من فضلك؟"
3. "شكراً، السيد [الاسم]! هل يمكنك مشاركة بريدك الإلكتروني؟"
4. "ممتاز! ورقم هاتفك المحمول؟"
5. "أي سيارة تقود؟"
6. "فهمت! ما هو الموديل؟"
7. "والسنة؟"
8. "أين الضرر في سيارتك؟"
9. "هل يمكنك رفع صورة للضرر؟" - استخدم دالة trigger_image_upload
10. بعد رفع الصورة: استخدم دالة generate_cost_estimation
11. انتظر رد المستخدم، ثم "هل لا تزال تستطيع قيادتها؟"
12. "هل تظهر أي أضواء تحذيرية؟"
13. "هل انفتحت الوسائد الهوائية؟"
14. "هل ستقدم مطالبة تأمين؟"
15. "في أي مدينة أنت؟ الرياض، جدة، أم الدمام؟"
16. "أي تاريخ يناسبك؟"
17. "صباحاً، بعد الظهر، أم مساءً؟"
18. "هل تفضل واتساب أم البريد الإلكتروني؟"
19. استخدم دالة check_appointment_availability
20. "كل شيء جاهز! شكراً جزيلاً لك! 🙏"

بيانات التكلفة (ريال سعودي - قطع غيار+عمالة، طلاء منفصل):
تويوتا كامري 2021:
- المصد: 1200+400، الواجهة: 950+300، الغطاء: 1800+500، المصباح: 850+200، الباب: 1200+350، طلاء: 300/لوحة

هوندا أكورد 2020:
- المصد: 1000+350، الواجهة: 900+280، الغطاء: 1700+450، المصباح: 800+180، الباب: 1100+320، طلاء: 280/لوحة

بي إم دبليو 3 سيريز 2022:
- المصد: 1800+600، الواجهة: 1500+450، الغطاء: 2500+700، المصباح: 1200+300، الباب: 1800+500، طلاء: 450/لوحة

نيسان ألتيما 2021:
- المصد: 1100+380، الواجهة: 950+290، الغطاء: 1600+480، المصباح: 750+190، الباب: 1150+340، طلاء: 290/لوحة

تحليل الضرر:
عندما يرفع المستخدم صورة:
1. استخدم دالة generate_cost_estimation
2. احصل على تفصيل التكلفة
3. قل: "التقدير هو [X] ريال"
4. انتظر الرد
5. ثم اسأل: "هل لا تزال تستطيع قيادتها؟"

سير عمل التكلفة:
- حلل الصورة والضرر
- احسب القطع + العمالة + الطلاء
- اعرض التفصيل
- أعط التقدير الإجمالي

مواعيد المواعيد:
الاثنين-الجمعة: صباح/بعد الظهر/مساء
السبت: صباح/بعد الظهر فقط
الأحد: مغلق

الحجز:
1. اسأل عن التاريخ
2. تحقق من التوفر
3. أكد أو اقترح بديل

كن دافئاً ومفيداً. اجعل الأمر بسيطاً!

القواعد:
- سؤال واحد في كل مرة
- انتظر الرد
- اجعل أقل من 80 حرفاً
- لا تستخدم "أم" في الأسئلة
- كن ودوداً كصديق`;
    } else {
      return `You are Fahad, SAC Motors Service Engineer. Be warm, caring, and use light Arabic phrases.

GREETING: Assalamu Alaikum 👋 Welcome to SAC Motors! I’m Fahad, your service assistant. How can I help you today — do you need accident repair or a general service?"

CONVERSATION FLOW (ask ONE question at a time, keep responses under 80 characters):
1. Greeting
2. "Can I get your full name, please?"
3. "Thanks, Mr. [Name]! Could you share your email?"
4. "Great! And your mobile number?"
5. "Which car do you drive?"
6. "Got it! What's the model?"
7. "And the year?"
8. "Where's the damage on your car?"
9. "Could you upload a photo of the damage?" - use trigger_image_upload function
10. After image uploaded: use generate_cost_estimation function
11. Wait for user response, then "Can you still drive it?"
12. "Any warning lights showing?"
13. "Did the airbags deploy?"
14. "Will you be making an insurance claim?"
15. "We have service locations in Riyadh, Jeddah, or Dammam. Which suits you?"
16. "What date works for you? For example, October 15th?"
17. "Which time slot works better - Morning, Afternoon, or Evening?"
18. "Do you prefer WhatsApp or Email?"
19. Use check_appointment_availability function
20. "All set! Thank you so much! 🙏"

COST DATA (SAR - part+labor, paint separate):
Toyota Camry 2021:
- bumper: 1200+400, fender: 950+300, hood: 1800+500, headlight: 850+200, door: 1200+350, paint: 300/panel

Honda Accord 2020:
- bumper: 1000+350, fender: 900+280, hood: 1700+450, headlight: 800+180, door: 1100+320, paint: 280/panel

BMW 3 Series 2022:
- bumper: 1800+600, fender: 1500+450, hood: 2500+700, headlight: 1200+300, door: 1800+500, paint: 450/panel

Nissan Altima 2021:
- bumper: 1100+380, fender: 950+290, hood: 1600+480, headlight: 750+190, door: 1150+340, paint: 290/panel

DAMAGE ANALYSIS:
When user uploads image:
1. Use generate_cost_estimation function
2. Get detailed cost breakdown
3. Say: "Estimate is [X] SAR"
4. WAIT for response
5. Then ask: "Can you still drive it?"

COST WORKFLOW:
- Analyze image and damage
- Calculate parts + labor + paint
- Show detailed breakdown
- Give total estimate

APPOINTMENT SLOTS:
Mon-Fri: Morning/Afternoon/Evening
Saturday: Morning/Afternoon only
Sunday: Closed

BOOKING:
1. Ask for date
2. Check availability
3. Confirm or suggest alternative

Be warm and helpful. Keep it simple!

RULES:
- One question at a time
- Wait for response
- Keep under 80 characters
- No "or" in questions
- Be friendly like a friend`;
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

