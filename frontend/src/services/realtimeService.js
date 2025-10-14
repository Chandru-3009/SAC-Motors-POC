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
  }

  /**
   * Connect to OpenAI Realtime API using WebRTC
   */
  async connect(ephemeralToken) {
    try {
      // Create RTCPeerConnection
      this.pc = new RTCPeerConnection();

      // Set up audio output element
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;
      document.body.appendChild(this.audioElement);
      
      this.pc.ontrack = async (e) => {
        console.log('🎵 Audio track received');
        this.audioElement.srcObject = e.streams[0];
        
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

        case 'response.audio_transcript.delta':
          // Partial transcript
          break;

        case 'response.audio_transcript.done':
          // Full transcript received
          if (event.transcript) {
            this.callbacks.onMessage({
              role: 'assistant',
              content: event.transcript,
              timestamp: new Date()
            });
          }
          break;

        case 'response.text.delta':
          // Streaming text response
          break;

        case 'response.text.done':
          // Complete text response
          if (event.text) {
            this.callbacks.onMessage({
              role: 'assistant',
              content: event.text,
              timestamp: new Date()
            });
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
          if (event.part?.type === 'input_text' && event.part.text) {
            this.callbacks.onMessage({
              role: 'assistant',
              content: event.part.text,
              timestamp: new Date()
            });
          }
          break;

        case 'response.created':
          // Response creation started
          console.log('🎤 AI response creation started');
          this.callbacks.onAudioStart();
          break;

        case 'response.function_call_arguments.done':
          // Function call completed
          if (event.name && event.arguments) {
            const args = JSON.parse(event.arguments);
            this.callbacks.onFunctionCall(event.name, args);
          }
          break;

        case 'conversation.item.created':
          // New conversation item
          if (event.item?.type === 'message' && event.item.role === 'assistant') {
            this.callbacks.onAudioStart();
          }
          break;

        case 'session.created':
          // Session created - initialize conversation state
          console.log('🎯 Session created - initializing conversation state...');
          this.initializeConversationState();
          break;

        case 'response.done':
          // Response completed
          console.log('✅ Response completed');
          break;

        case 'error':
          console.error('❌ Error from API:', event.error);
          break;

        default:
          // Log other event types for debugging
          console.log('Event:', event.type, event);
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
   * Disconnect from the session
   */
  disconnect() {
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

    this.isConnected = false;
    this.initialGreetingTriggered = false; // Reset for next connection
    this.callbacks.onDisconnected();
    console.log('👋 Disconnected from OpenAI Realtime API');
  }
}

