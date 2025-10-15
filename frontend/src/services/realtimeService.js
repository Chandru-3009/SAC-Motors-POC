/**
 * RealtimeService - Handles WebRTC connection with OpenAI Realtime API
 * Based on OpenAI's official WebRTC implementation
 */

export class RealtimeService {
  constructor(callbacks = {}) {
    this.pc = null; // RTCPeerConnection
    this.dataChannel = null;
    this.audioElement = null;
    this.mediaStream = null;
    this.callbacks = {
      onMessage: callbacks.onMessage || (() => {}),
      onConnected: callbacks.onConnected || (() => {}),
      onDisconnected: callbacks.onDisconnected || (() => {}),
      onAudioStart: callbacks.onAudioStart || (() => {}),
      onAudioEnd: callbacks.onAudioEnd || (() => {}),
      onFunctionCall: callbacks.onFunctionCall || (() => {}),
    };
    this.isConnected = false;
    this.isMuted = false;
    this.initialGreetingTriggered = false; // Track if we've triggered the initial AI greeting
    this.audioHealthCheckInterval = null; // For periodic audio health checks
    this.responseTimeout = null; // For handling response timeouts
    
    // Data collection system
    this.collectedData = {
      sessionId: null,
      startTime: null,
      endTime: null,
      language: 'en',
      conversation: {
        messages: [],
        functionCalls: [],
        userInputs: {},
        aiResponses: []
      },
      userProfile: {
        fullName: null,
        emailAddress: null,
        mobileNumber: null,
        preferredContactMethod: null
      },
      vehicleInfo: {
        make: null,
        model: null,
        year: null,
        registration: null
      },
      damageInfo: {
        description: null,
        location: null,
        isDriveable: null,
        needsTowVehicle: null,
        hasWarningLights: null,
        airbagsDeployed: null,
        insuranceClaim: null,
        imageUrl: null,
        imageFileName: null
      },
      serviceInfo: {
        preferredCity: null,
        preferredBranch: null,
        appointmentDate: null,
        appointmentTime: null,
        appointmentDay: null,
        estimatedCost: null,
        costBreakdown: null
      },
      systemInfo: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        audioEvents: [],
        connectionEvents: []
      }
    };
    
    // Conversation flow tracking
    this.conversationFlow = {
      currentStep: 0,
      steps: [
        'greeting',
        'service_type',
        'full_name',
        'email_address',
        'mobile_number',
        'vehicle_make',
        'vehicle_model',
        'vehicle_year',
        'warning_lights',
        'airbags_deployed',
        'insurance_claim',
        'damage_description',
        'image_upload',
        'cost_estimation',
        'driveability',
        'preferred_city',
        'appointment_slots',
        'contact_method',
        'completion'
      ],
      userResponses: {}
    };
    
    // Message counter for periodic logging
    this.messageCount = 0;
  }

  /**
   * Collect user data from messages and function calls
   */
  collectUserData(message, isUserMessage = false) {
    if (!message || !message.content) return;

    const content = message.content.toLowerCase();
    const timestamp = new Date().toISOString();

    // Track all messages
    this.collectedData.conversation.messages.push({
      role: message.role,
      content: message.content,
      timestamp: timestamp,
      isUserMessage: isUserMessage
    });
    
    // Increment message counter
    this.messageCount++;

    // Process user messages with conversation flow tracking
    if (isUserMessage) {
      this.processUserResponse(message.content);
    }

    // Process AI messages to track conversation flow
    if (!isUserMessage && message.role === 'assistant') {
      this.trackConversationFlow(message.content);
    }

    console.log('📊 Data collected:', JSON.stringify(this.collectedData, null, 2));
    
    // Periodic summary every 5 messages
    if (this.messageCount % 5 === 0) {
      console.log('📊 PERIODIC SUMMARY (Message #' + this.messageCount + '):');
      console.log('📊 User Profile:', JSON.stringify(this.collectedData.userProfile, null, 2));
      console.log('📊 Vehicle Info:', JSON.stringify(this.collectedData.vehicleInfo, null, 2));
      console.log('📊 Damage Info:', JSON.stringify(this.collectedData.damageInfo, null, 2));
      console.log('📊 Service Info:', JSON.stringify(this.collectedData.serviceInfo, null, 2));
      console.log('📊 Conversation Flow:', JSON.stringify(this.conversationFlow, null, 2));
    }
  }

  /**
   * Track conversation flow based on AI messages
   */
  trackConversationFlow(aiMessage) {
    const message = aiMessage.toLowerCase();
    
    // Map AI questions to conversation steps
    if (message.includes('full name') || message.includes('name')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('full_name');
    } else if (message.includes('email')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('email_address');
    } else if (message.includes('mobile number') || message.includes('phone')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('mobile_number');
    } else if (message.includes('which car') || message.includes('car do you drive')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('vehicle_make');
    } else if (message.includes('model')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('vehicle_model');
    } else if (message.includes('year')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('vehicle_year');
    } else if (message.includes('warning lights')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('warning_lights');
    } else if (message.includes('airbags')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('airbags_deployed');
    } else if (message.includes('insurance claim')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('insurance_claim');
    } else if (message.includes('damage on your car') || message.includes('where')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('damage_description');
    } else if (message.includes('upload a photo')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('image_upload');
    } else if (message.includes('drive it safely') || message.includes('tow vehicle')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('driveability');
    } else if (message.includes('riyadh') || message.includes('jeddah') || message.includes('dammam')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('preferred_city');
    } else if (message.includes('date and time') || message.includes('appointment')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('appointment_slots');
    } else if (message.includes('whatsapp') || message.includes('email')) {
      this.conversationFlow.currentStep = this.conversationFlow.steps.indexOf('contact_method');
    }

    console.log('🔄 Conversation step:', this.conversationFlow.steps[this.conversationFlow.currentStep], `(step ${this.conversationFlow.currentStep})`);
  }

  /**
   * Process user response based on current conversation step
   */
  processUserResponse(userMessage) {
    const step = this.conversationFlow.steps[this.conversationFlow.currentStep];
    const cleanMessage = userMessage.trim();
    
    // Skip if message is too generic or empty
    if (cleanMessage.length < 2 || 
        cleanMessage.includes('[Image uploaded') || 
        cleanMessage.includes('I have uploaded') ||
        cleanMessage.includes('I choose') ||
        cleanMessage.includes('I prefer')) {
      return;
    }

    // Store user response based on current step
    this.conversationFlow.userResponses[step] = cleanMessage;
    
    // Extract and store data based on step
    switch (step) {
      case 'full_name':
        this.collectedData.userProfile.fullName = cleanMessage;
        break;
        
      case 'email_address':
        this.collectedData.userProfile.emailAddress = cleanMessage;
        break;
        
      case 'mobile_number':
        this.collectedData.userProfile.mobileNumber = cleanMessage;
        break;
        
      case 'vehicle_make':
        this.collectedData.vehicleInfo.make = cleanMessage;
        break;
        
      case 'vehicle_model':
        this.collectedData.vehicleInfo.model = cleanMessage;
        break;
        
      case 'vehicle_year':
        this.collectedData.vehicleInfo.year = cleanMessage;
        break;
        
      case 'warning_lights':
        this.collectedData.damageInfo.hasWarningLights = this.parseBooleanResponse(cleanMessage);
        break;
        
      case 'airbags_deployed':
        this.collectedData.damageInfo.airbagsDeployed = this.parseBooleanResponse(cleanMessage);
        break;
        
      case 'insurance_claim':
        this.collectedData.damageInfo.insuranceClaim = this.parseBooleanResponse(cleanMessage);
        break;
        
      case 'damage_description':
        this.collectedData.damageInfo.description = cleanMessage;
        break;
        
      case 'driveability':
        this.collectedData.damageInfo.isDriveable = this.parseBooleanResponse(cleanMessage);
        this.collectedData.damageInfo.needsTowVehicle = !this.parseBooleanResponse(cleanMessage);
        break;
        
      case 'preferred_city':
        this.collectedData.serviceInfo.preferredCity = cleanMessage;
        break;
        
      case 'appointment_slots':
        this.collectedData.serviceInfo.appointmentTime = cleanMessage;
        break;
        
      case 'contact_method':
        this.collectedData.userProfile.preferredContactMethod = cleanMessage;
        break;
    }

    console.log(`📝 User response for ${step}:`, cleanMessage);
    console.log('📊 Updated collected data:', JSON.stringify(this.collectedData, null, 2));
    console.log('🔄 Conversation flow:', JSON.stringify(this.conversationFlow, null, 2));
  }

  /**
   * Parse boolean responses from user messages
   */
  parseBooleanResponse(message) {
    const positiveWords = ['yes', 'yep', 'yeah', 'sure', 'ok', 'okay', 'true', '1'];
    const negativeWords = ['no', 'nope', 'nah', 'false', '0'];
    
    const lowerMessage = message.toLowerCase();
    
    for (const word of positiveWords) {
      if (lowerMessage.includes(word)) return true;
    }
    
    for (const word of negativeWords) {
      if (lowerMessage.includes(word)) return false;
    }
    
    return null; // Unknown response
  }

  /**
   * Collect function call data
   */
  collectFunctionCallData(functionName, args) {
    const timestamp = new Date().toISOString();
    
    this.collectedData.conversation.functionCalls.push({
      functionName: functionName,
      arguments: args,
      timestamp: timestamp
    });

    // Extract specific data from function calls
    switch (functionName) {
      case 'save_customer_data':
        if (args.fullName) this.collectedData.userProfile.fullName = args.fullName;
        if (args.emailAddress) this.collectedData.userProfile.emailAddress = args.emailAddress;
        if (args.mobileNumber) this.collectedData.userProfile.mobileNumber = args.mobileNumber;
        if (args.vehicleMake) this.collectedData.vehicleInfo.make = args.vehicleMake;
        if (args.vehicleModel) this.collectedData.vehicleInfo.model = args.vehicleModel;
        if (args.vehicleYear) this.collectedData.vehicleInfo.year = args.vehicleYear;
        if (args.damageDescription) this.collectedData.damageInfo.description = args.damageDescription;
        if (args.isDriveable !== undefined) this.collectedData.damageInfo.isDriveable = args.isDriveable;
        if (args.hasWarningLights !== undefined) this.collectedData.damageInfo.hasWarningLights = args.hasWarningLights;
        if (args.airbagsDeployed !== undefined) this.collectedData.damageInfo.airbagsDeployed = args.airbagsDeployed;
        if (args.insuranceClaim !== undefined) this.collectedData.damageInfo.insuranceClaim = args.insuranceClaim;
        if (args.preferredCity) this.collectedData.serviceInfo.preferredCity = args.preferredCity;
        if (args.preferredBranch) this.collectedData.serviceInfo.preferredBranch = args.preferredBranch;
        if (args.appointmentTime) this.collectedData.serviceInfo.appointmentTime = args.appointmentTime;
        if (args.contactMethod) this.collectedData.userProfile.preferredContactMethod = args.contactMethod;
        break;

      case 'generate_cost_estimation':
        if (args.vehicleMake) this.collectedData.vehicleInfo.make = args.vehicleMake;
        if (args.vehicleModel) this.collectedData.vehicleInfo.model = args.vehicleModel;
        if (args.vehicleYear) this.collectedData.vehicleInfo.year = args.vehicleYear;
        if (args.damageDescription) this.collectedData.damageInfo.description = args.damageDescription;
        if (args.imageUrl) this.collectedData.damageInfo.imageUrl = args.imageUrl;
        break;

      case 'check_appointment_availability':
        if (args.date) this.collectedData.serviceInfo.appointmentDate = args.date;
        if (args.day) this.collectedData.serviceInfo.appointmentDay = args.day;
        if (args.timeSlot) this.collectedData.serviceInfo.appointmentTime = args.timeSlot;
        if (args.city) this.collectedData.serviceInfo.preferredCity = args.city;
        if (args.contactMethod) this.collectedData.userProfile.preferredContactMethod = args.contactMethod;
        break;
    }

    console.log('📊 Function call data collected:', { functionName, args, timestamp });
    console.log('📊 Updated collected data after function call:', JSON.stringify(this.collectedData, null, 2));
  }

  /**
   * Get collected data as JSON
   */
  getCollectedData() {
    return {
      ...this.collectedData,
      endTime: new Date().toISOString(),
      conversationFlow: this.conversationFlow,
      summary: this.generateDataSummary()
    };
  }

  /**
   * Generate a summary of collected data
   */
  generateDataSummary() {
    const data = this.collectedData;
    return {
      hasUserProfile: !!(data.userProfile.fullName || data.userProfile.emailAddress || data.userProfile.mobileNumber),
      hasVehicleInfo: !!(data.vehicleInfo.make || data.vehicleInfo.model || data.vehicleInfo.year),
      hasDamageInfo: !!(data.damageInfo.description || data.damageInfo.imageUrl),
      hasServiceInfo: !!(data.serviceInfo.preferredCity || data.serviceInfo.appointmentDate),
      totalMessages: data.conversation.messages.length,
      totalFunctionCalls: data.conversation.functionCalls.length,
      conversationDuration: data.startTime ? 
        Math.round((new Date() - new Date(data.startTime)) / 1000) : 0
    };
  }


  /**
   * Extract text content from various content formats
   */
  extractTextContent(content) {
    if (typeof content === 'string') {
      return content;
    }
    
    if (Array.isArray(content)) {
      return content.map(c => {
        if (typeof c === 'string') return c;
        if (c && typeof c === 'object' && c.text) return c.text;
        if (c && typeof c === 'object') return JSON.stringify(c);
        return String(c);
      }).join(' ');
    }
    
    if (content && typeof content === 'object') {
      // If it's an object with a text property
      if (content.text) return content.text;
      // If it's an object with content property
      if (content.content) return this.extractTextContent(content.content);
      // Otherwise, try to stringify it safely
      try {
        return JSON.stringify(content);
      } catch (e) {
        return String(content);
      }
    }
    
    return String(content);
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Log current collected data (can be called from console for debugging)
   */
  logCollectedData() {
    console.log('📊 CURRENT COLLECTED DATA:');
    console.log('📊 Full Data:', JSON.stringify(this.collectedData, null, 2));
    console.log('📊 Conversation Flow:', JSON.stringify(this.conversationFlow, null, 2));
    console.log('📊 Message Count:', this.messageCount);
    return this.collectedData;
  }

  /**
   * Connect to OpenAI Realtime API using WebRTC
   */
  async connect(ephemeralToken) {
    try {
      // Initialize data collection
      this.collectedData.sessionId = this.generateSessionId();
      this.collectedData.startTime = new Date().toISOString();
      this.collectedData.language = localStorage.getItem('sac_lang') || 'en';
      
      console.log('📊 Data collection initialized for session:', this.collectedData.sessionId);
      console.log('📊 Initial collected data structure:', JSON.stringify(this.collectedData, null, 2));
      
      // Make logging method available globally for debugging
      window.logSACData = () => this.logCollectedData();
      window.debugEvents = true; // Enable detailed event logging
      console.log('💡 Tip: Call logSACData() in console to see current collected data');
      console.log('💡 Debug mode enabled - all events will be logged');

      // Create RTCPeerConnection
      this.pc = new RTCPeerConnection();

      // Set up audio output element with better configuration
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;
      this.audioElement.preload = 'auto';
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.volume = 1.0;
      document.body.appendChild(this.audioElement);
      
      this.pc.ontrack = async (e) => {
        console.log('🎵 Audio track received');
        
        // Handle multiple audio tracks if present
        const audioStream = e.streams.find(stream => 
          stream.getAudioTracks().length > 0
        ) || e.streams[0];
        
        this.audioElement.srcObject = audioStream;
        
        // Add comprehensive event listeners for better audio management
        this.audioElement.addEventListener('play', () => {
          console.log('▶️ Audio element started playing');
          this.callbacks.onAudioStart();
        });
        
        this.audioElement.addEventListener('pause', () => {
          console.log('⏸️ Audio element paused');
        });
        
        this.audioElement.addEventListener('ended', () => {
          console.log('⏹️ Audio element ended');
          this.callbacks.onAudioEnd();
        });
        
        this.audioElement.addEventListener('error', (e) => {
          console.error('❌ Audio element error:', e);
        });
        
        this.audioElement.addEventListener('waiting', () => {
          console.log('⏳ Audio element waiting for data');
          // Try to recover when waiting
          setTimeout(() => this.recoverAudioPlayback(), 200);
        });
        this.audioElement.addEventListener('stalled', () => {
          console.log('🚫 Audio element stalled - attempting recovery');
          this.recoverAudioPlayback();
        });
        this.audioElement.addEventListener('suspend', () => {
          console.log('⏸️ Audio element suspended - attempting recovery');
          this.recoverAudioPlayback();
        });
        this.audioElement.addEventListener('abort', () => {
          console.log('🛑 Audio element aborted - attempting recovery');
          this.recoverAudioPlayback();
        });
        this.audioElement.addEventListener('canplay', () => console.log('✅ Audio element can play'));
        this.audioElement.addEventListener('canplaythrough', () => console.log('✅ Audio element can play through'));
        
        // Explicitly play the audio (required for some browsers)
        try {
          await this.audioElement.play();
          console.log('✅ Audio playback started');
        } catch (error) {
          console.warn('⚠️ Autoplay blocked. User interaction may be required:', error);
        }
      };

      // Add microphone input
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      this.mediaStream = ms;
      this.pc.addTrack(ms.getTracks()[0]);

      // Set up data channel for text and control messages
      this.dataChannel = this.pc.createDataChannel('oai-events');
      
      this.dataChannel.addEventListener('open', () => {
        console.log('📡 Data channel opened - ready for communication');
      });
      
      this.dataChannel.addEventListener('message', (e) => {
        this.handleDataChannelMessage(e.data);
      });

      // Create and set local offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Send offer to OpenAI and get answer
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';

      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp'
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };

      await this.pc.setRemoteDescription(answer);

      this.isConnected = true;
      this.callbacks.onConnected();

      // Start audio health checks
      this.startAudioHealthChecks();

      console.log('✅ Connected to OpenAI Realtime API via WebRTC');
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  /**
   * Handle incoming messages from data channel
   */
  handleDataChannelMessage(data) {
    try {
      const event = JSON.parse(data);
      console.log('📨 Received event:', event.type);

      switch (event.type) {
        case 'response.audio.delta':
          // Audio chunk received (handled by RTCPeerConnection automatically)
          break;

        case 'response.audio.done':
          this.callbacks.onAudioEnd();
          break;

        case 'output_audio_buffer.stopped':
          console.log('⚠️ Audio buffer stopped unexpectedly - attempting immediate recovery');
          // Immediate recovery attempt - don't wait
          this.recoverAudioPlayback();
          // Also try again after a short delay
          setTimeout(() => {
            this.recoverAudioPlayback();
          }, 200);
          // And once more after another delay
          setTimeout(() => {
            this.recoverAudioPlayback();
          }, 800);
          break;

        case 'output_audio_buffer.playing':
          console.log('🎵 Audio buffer playing');
          this.callbacks.onAudioStart();
          break;

        case 'response.audio_transcript.delta':
          // Partial transcript
          console.log('📝 Audio transcript delta:', event.transcript);
          break;

        case 'response.audio_transcript.done':
          // Full transcript received
          console.log('📝 Audio transcript done:', event.transcript);
          if (event.transcript) {
            const message = {
              role: 'assistant',
              content: event.transcript,
              timestamp: new Date()
            };
            this.callbacks.onMessage(message);
            this.collectUserData(message, false);
            console.log('✅ Audio transcript message sent to UI');
          }
          break;

        case 'response.text.delta':
          // Streaming text response
          console.log('📝 Text delta:', event.text);
          break;

        case 'response.text.done':
          // Complete text response
          console.log('📝 Text done:', event.text);
          if (event.text) {
            const message = {
              role: 'assistant',
              content: event.text,
              timestamp: new Date()
            };
            this.callbacks.onMessage(message);
            this.collectUserData(message, false);
            console.log('✅ Text message sent to UI');
          }
          break;

        case 'response.output_item.added':
          // New output item added to response
          if (event.item?.type === 'message' && event.item.role === 'assistant') {
            console.log('📝 AI message item added to response');
            this.callbacks.onAudioStart();
          }
          break;

        case 'response.content_part.added':
          // New content part added to response
          console.log('📝 Content part added:', event.part);
          if (event.part?.type === 'input_text' && event.part.text) {
            this.callbacks.onMessage({
              role: 'assistant',
              content: event.part.text,
              timestamp: new Date()
            });
            console.log('✅ Content part message sent to UI');
          } else if (event.part?.type === 'text' && event.part.text) {
            // Handle text content parts
            this.callbacks.onMessage({
              role: 'assistant',
              content: event.part.text,
              timestamp: new Date()
            });
            console.log('✅ Text content part message sent to UI');
          }
          break;

        case 'response.created':
          // Response creation started
          console.log('🎤 AI response creation started');
          this.callbacks.onAudioStart();
          
          // Set a timeout to ensure response gets processed
          if (this.responseTimeout) {
            clearTimeout(this.responseTimeout);
          }
          this.responseTimeout = setTimeout(() => {
            console.log('⏰ Response timeout - checking for missed messages');
            // This will be handled in response.done
          }, 10000); // 10 second timeout
          break;

        case 'response.function_call_arguments.done':
          // Function call completed
          if (event.name && event.arguments) {
            const args = JSON.parse(event.arguments);
            this.callbacks.onFunctionCall(event.name, args);
            this.collectFunctionCallData(event.name, args);
          }
          break;

        case 'conversation.item.created':
          // New conversation item
          console.log('📝 Conversation item created:', event.item);
          if (event.item?.type === 'message') {
            if (event.item.role === 'assistant') {
              this.callbacks.onAudioStart();
            } else if (event.item.role === 'user' && event.item.content) {
              // This is a user message - capture it
              console.log('👤 User message from conversation item:', event.item.content);
              const userMessage = {
                role: 'user',
                content: this.extractTextContent(event.item.content),
                timestamp: new Date()
              };
              this.callbacks.onMessage(userMessage);
              this.collectUserData(userMessage, true);
            }
          }
          break;

        case 'session.created':
          // Session created - initialize conversation state
          console.log('🎯 Session created - initializing conversation state...');
          this.initializeConversationState();
          this.conversationFlow.currentStep = 0; // Reset conversation flow
          break;

        case 'response.done':
          // Response completed
          console.log('✅ Response completed');
          console.log('📊 Response details:', {
            response_id: event.response_id,
            conversation_id: event.conversation_id,
            is_complete: event.is_complete,
            usage: event.usage
          });
          
          // Clear the response timeout
          if (this.responseTimeout) {
            clearTimeout(this.responseTimeout);
            this.responseTimeout = null;
          }
          
          // Check if we have any pending messages that weren't processed
          if (event.response && event.response.output_items) {
            console.log('📝 Checking for unprocessed output items:', event.response.output_items);
            event.response.output_items.forEach((item, index) => {
              if (item.type === 'message' && item.content) {
                console.log(`📝 Found unprocessed message ${index}:`, item);
                if (item.role === 'assistant') {
                  // Process AI messages
                  this.callbacks.onMessage({
                    role: 'assistant',
                    content: item.content[0]?.text || JSON.stringify(item.content),
                    timestamp: new Date()
                  });
                } else if (item.role === 'user') {
                  // Process user messages
                  console.log('👤 Found user message in response:', item.content);
                  const userMessage = {
                    role: 'user',
                    content: this.extractTextContent(item.content),
                    timestamp: new Date()
                  };
                  this.callbacks.onMessage(userMessage);
                  this.collectUserData(userMessage, true);
                }
              }
            });
          }
          
          // Final fallback: if no message was processed, try to extract from the response
          if (!event.response?.output_items || event.response.output_items.length === 0) {
            console.log('⚠️ No output items found - attempting fallback message extraction');
            // This is a last resort - we'll let the timeout handle it if needed
          }
          break;

        case 'conversation.item.input_audio_transcript.done':
          // User voice transcript completed
          console.log('🎤 User voice transcript:', event.transcript);
          if (event.transcript) {
            const userMessage = {
              role: 'user',
              content: event.transcript,
              timestamp: new Date()
            };
            this.callbacks.onMessage(userMessage);
            this.collectUserData(userMessage, true);
          }
          break;

        case 'conversation.item.input_audio_transcript.delta':
          // User voice transcript partial
          console.log('🎤 User voice transcript delta:', event.transcript);
          break;

        case 'input_audio_buffer.committed':
          // User audio input committed - this might contain transcript
          console.log('🎤 User audio buffer committed:', event);
          break;

        case 'error':
          console.error('❌ Error from API:', event.error);
          break;

        default:
          // Log other event types for debugging
          if (window.debugEvents) {
            console.log('📨 Received event:', event.type, event);
          }
          
          // Check for user input events that might not be handled
          if (event.type && event.type.includes('input')) {
            console.log('🎤 User input event detected:', event.type, event);
            if (event.transcript) {
              console.log('🎤 User transcript found:', event.transcript);
              const userMessage = {
                role: 'user',
                content: event.transcript,
                timestamp: new Date()
              };
              this.callbacks.onMessage(userMessage);
              this.collectUserData(userMessage, true);
            }
          }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Initialize conversation state when session is created
   */
  initializeConversationState() {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('Data channel not ready for conversation initialization');
      return;
    }

    console.log('🎯 Initializing conversation state...');
    
    // Mark conversation as started
    this.conversationStarted = true;
    
    // Ensure audio playback is ready
    if (this.audioElement) {
      this.audioElement.muted = false;
      console.log('🔊 Audio playback initialized');
    }
    
    // Enable microphone input for future use (but keep it muted initially)
    if (this.mediaStream) {
      // Keep microphone ready but muted until user explicitly activates it
      this.mediaStream.getTracks().forEach(track => {
        track.enabled = false;
      });
      console.log('🎤 Microphone ready for user input');
    }
    
    console.log('✅ Conversation state initialized - ready to receive AI messages');
    
    // Automatically trigger the AI's first message
    this.triggerInitialGreeting();
  }

  /**
   * Trigger the AI's initial greeting automatically
   */
  triggerInitialGreeting() {
    // Prevent triggering multiple times
    if (this.initialGreetingTriggered) {
      console.log('⚠️ Initial greeting already triggered, skipping...');
      return;
    }

    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('❌ Cannot trigger greeting - data channel not ready');
      return;
    }

    console.log('👋 Triggering AI\'s initial greeting...');
    this.initialGreetingTriggered = true;

    // Send a response.create event to trigger the AI's first message
    // The AI will use the instructions configured in the session to greet the user
    const event = {
      type: 'response.create',
      response: {
        modalities: ['text', 'audio']
      }
    };

    this.dataChannel.send(JSON.stringify(event));
    console.log('✅ Initial greeting request sent to AI');
  }

  /**
   * Send a text message to the AI
   */
  async sendTextMessage(text) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('Data channel not ready');
      return;
    }

    // Collect user message data
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    this.collectUserData(userMessage, true);

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    };

    this.dataChannel.send(JSON.stringify(event));

    // Trigger response generation
    this.dataChannel.send(JSON.stringify({
      type: 'response.create'
    }));
  }

  /**
   * Start recording (unmute microphone)
   */
  startRecording() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.enabled = true;
      });
      console.log('🎤 Microphone enabled');
    }
  }

  /**
   * Stop recording (mute microphone)
   */
  stopRecording() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.enabled = false;
      });
      console.log('🔇 Microphone disabled');
    }
  }

  /**
   * Toggle audio output mute
   */
  toggleMute() {
    if (this.audioElement) {
      this.audioElement.muted = !this.audioElement.muted;
      this.isMuted = this.audioElement.muted;
      console.log(this.isMuted ? '🔇 Audio muted' : '🔊 Audio unmuted');
    }
  }

  /**
   * Force audio playback recovery
   */
  async recoverAudioPlayback() {
    if (this.audioElement && !this.isMuted) {
      try {
        console.log('🔄 Attempting audio playback recovery...');
        
        // Check if audio is paused or stopped
        if (this.audioElement.paused) {
          await this.audioElement.play();
          console.log('✅ Audio playback recovered - was paused');
        } else if (this.audioElement.ended) {
          // If ended, try to restart
          this.audioElement.currentTime = 0;
          await this.audioElement.play();
          console.log('✅ Audio playback recovered - was ended');
        } else {
          // Force play even if not paused
          await this.audioElement.play();
          console.log('✅ Audio playback recovered - forced play');
        }
        return true;
      } catch (error) {
        console.warn('❌ Audio recovery failed:', error);
        // Try alternative recovery methods
        try {
          // First try: reload and play
          this.audioElement.load();
          await this.audioElement.play();
          console.log('✅ Audio recovery successful after load');
          return true;
        } catch (retryError) {
          console.warn('❌ Load recovery failed, trying stream restart...');
          // Second try: restart the audio stream
          try {
            if (this.audioElement.srcObject && this.audioElement.srcObject.getTracks) {
              this.audioElement.srcObject.getTracks().forEach(track => track.stop());
            }
            // Wait a moment then try again
            setTimeout(async () => {
              try {
                await this.audioElement.play();
                console.log('✅ Audio recovery successful after stream restart');
              } catch (finalError) {
                console.error('❌ Audio recovery completely failed:', finalError);
              }
            }, 100);
            return true;
          } catch (streamError) {
            console.error('❌ Audio recovery completely failed:', streamError);
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Check and ensure audio is playing
   */
  ensureAudioPlaying() {
    if (this.audioElement && !this.isMuted) {
      if (this.audioElement.paused) {
        console.log('🔄 Audio was paused, attempting to resume...');
        this.recoverAudioPlayback();
      }
    }
  }

  /**
   * Start periodic audio health checks
   */
  startAudioHealthChecks() {
    if (this.audioHealthCheckInterval) {
      clearInterval(this.audioHealthCheckInterval);
    }

    // Check audio health every 500ms for faster recovery
    this.audioHealthCheckInterval = setInterval(() => {
      if (this.isConnected && this.audioElement) {
        // Check if audio is stuck or paused unexpectedly
        if (!this.audioElement.paused && this.audioElement.currentTime > 0) {
          // Audio is playing normally
          return;
        }
        
        // Audio might be stuck - try to recover
        if (!this.isMuted && (this.audioElement.paused || this.audioElement.ended)) {
          console.log('🔍 Audio health check: Audio needs recovery');
          this.recoverAudioPlayback();
        }
      }
    }, 500);
  }

  /**
   * Stop audio health checks
   */
  stopAudioHealthChecks() {
    if (this.audioHealthCheckInterval) {
      clearInterval(this.audioHealthCheckInterval);
      this.audioHealthCheckInterval = null;
    }
  }

  /**
   * Disconnect from the session
   */
  disconnect() {
    // Stop audio health checks
    this.stopAudioHealthChecks();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    if (this.dataChannel) {
      this.dataChannel.close();
    }

    if (this.pc) {
      this.pc.close();
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement);
      }
      this.audioElement = null;
    }

    // Clear response timeout
    if (this.responseTimeout) {
      clearTimeout(this.responseTimeout);
      this.responseTimeout = null;
    }

    // Finalize data collection
    this.collectedData.endTime = new Date().toISOString();
    console.log('📊 Final collected data:', JSON.stringify(this.getCollectedData(), null, 2));

    this.isConnected = false;
    this.initialGreetingTriggered = false; // Reset for next connection
    this.callbacks.onDisconnected();
    console.log('👋 Disconnected from OpenAI Realtime API');
  }
}

