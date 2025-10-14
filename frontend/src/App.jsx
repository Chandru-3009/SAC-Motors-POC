import { useState, useEffect, useRef } from 'react';
import AudioControls from './components/AudioControls';
import ConversationDisplay from './components/ConversationDisplay';
import ImageUploader from './components/ImageUploader';
import LocationSelector from './components/LocationSelector';
import TimeSlotPicker from './components/TimeSlotPicker';
import { RealtimeService } from './services/realtimeService';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [conversationData, setConversationData] = useState({});

  const realtimeServiceRef = useRef(null);

  useEffect(() => {
    // Initialize the realtime service
    const service = new RealtimeService({
      onMessage: handleNewMessage,
      onConnected: () => setIsConnected(true),
      onDisconnected: () => setIsConnected(false),
      onAudioStart: () => setIsAISpeaking(true),
      onAudioEnd: () => setIsAISpeaking(false),
      onFunctionCall: handleFunctionCall,
    });

    realtimeServiceRef.current = service;

    return () => {
      service.disconnect();
    };
  }, []);

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleFunctionCall = (functionName, args) => {
    console.log('Function called:', functionName, args);

    switch (functionName) {
      case 'trigger_image_upload':
        setShowImageUploader(true);
        break;
      case 'trigger_location_selector':
        setLocationData({ cities: args.cities || ['Riyadh', 'Jeddah', 'Dammam'] });
        setShowLocationSelector(true);
        break;
      case 'trigger_time_picker':
        setTimeSlots(args.slots || ['Morning (8AM-12PM)', 'Afternoon (12PM-4PM)', 'Evening (4PM-8PM)']);
        setShowTimePicker(true);
        break;
      case 'save_customer_data':
        setConversationData(args);
        saveDataToBackend(args);
        break;
      case 'generate_cost_estimation':
        handleCostEstimation(args);
        break;
      case 'check_appointment_availability':
        handleAppointmentBooking(args);
        break;
      default:
        console.log('Unknown function:', functionName);
    }
  };

  const saveDataToBackend = async (data) => {
    if (!sessionId) return;

    try {
      const apiUrl = '/api/session/save';
      const fallbackUrl = 'http://localhost:3000/api/session/save';
      
      try {
        await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, data })
        });
      } catch (proxyError) {
        await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, data })
        });
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleCostEstimation = async (args) => {
    console.log('Generating cost estimation:', args);
    
    const { vehicleMake, vehicleModel, vehicleYear, damageDescription, imageUrl } = args;
    
    // Sample cost data for calculations
    const costData = {
      "Toyota Camry 2021": {
        "bumper": {"part": 1200, "labor": 400, "paint": 300},
        "fender": {"part": 950, "labor": 300, "paint": 300},
        "hood": {"part": 1800, "labor": 500, "paint": 300},
        "headlight": {"part": 850, "labor": 200, "paint": 0},
        "door": {"part": 1200, "labor": 350, "paint": 300}
      },
      "Honda Accord 2020": {
        "bumper": {"part": 1000, "labor": 350, "paint": 280},
        "fender": {"part": 900, "labor": 280, "paint": 280},
        "hood": {"part": 1700, "labor": 450, "paint": 280},
        "headlight": {"part": 800, "labor": 180, "paint": 0},
        "door": {"part": 1100, "labor": 320, "paint": 280}
      },
      "BMW 3 Series 2022": {
        "bumper": {"part": 1800, "labor": 600, "paint": 450},
        "fender": {"part": 1500, "labor": 450, "paint": 450},
        "hood": {"part": 2500, "labor": 700, "paint": 450},
        "headlight": {"part": 1200, "labor": 300, "paint": 0},
        "door": {"part": 1800, "labor": 500, "paint": 450}
      },
      "Nissan Altima 2021": {
        "bumper": {"part": 1100, "labor": 380, "paint": 290},
        "fender": {"part": 950, "labor": 290, "paint": 290},
        "hood": {"part": 1600, "labor": 480, "paint": 290},
        "headlight": {"part": 750, "labor": 190, "paint": 0},
        "door": {"part": 1150, "labor": 340, "paint": 290}
      }
    };

    const vehicleKey = `${vehicleMake} ${vehicleModel} ${vehicleYear}`;
    const vehicleCosts = costData[vehicleKey] || costData["Toyota Camry 2021"];
    
    // Analyze damage description to identify damaged parts
    const damageDesc = damageDescription.toLowerCase();
    const damagedParts = [];
    let totalPartsCost = 0;
    let totalLaborCost = 0;
    let totalPaintCost = 0;

    // Identify damaged parts based on description
    if (damageDesc.includes('bumper')) {
      const part = vehicleCosts.bumper;
      damagedParts.push({
        part_name: 'Bumper',
        parts_cost: part.part,
        labor_cost: part.labor,
        paint_cost: part.paint,
        total: part.part + part.labor + part.paint
      });
      totalPartsCost += part.part;
      totalLaborCost += part.labor;
      totalPaintCost += part.paint;
    }

    if (damageDesc.includes('fender')) {
      const part = vehicleCosts.fender;
      damagedParts.push({
        part_name: 'Fender',
        parts_cost: part.part,
        labor_cost: part.labor,
        paint_cost: part.paint,
        total: part.part + part.labor + part.paint
      });
      totalPartsCost += part.part;
      totalLaborCost += part.labor;
      totalPaintCost += part.paint;
    }

    if (damageDesc.includes('hood')) {
      const part = vehicleCosts.hood;
      damagedParts.push({
        part_name: 'Hood',
        parts_cost: part.part,
        labor_cost: part.labor,
        paint_cost: part.paint,
        total: part.part + part.labor + part.paint
      });
      totalPartsCost += part.part;
      totalLaborCost += part.labor;
      totalPaintCost += part.paint;
    }

    if (damageDesc.includes('headlight') || damageDesc.includes('light')) {
      const part = vehicleCosts.headlight;
      damagedParts.push({
        part_name: 'Headlight',
        parts_cost: part.part,
        labor_cost: part.labor,
        paint_cost: part.paint,
        total: part.part + part.labor + part.paint
      });
      totalPartsCost += part.part;
      totalLaborCost += part.labor;
      totalPaintCost += part.paint;
    }

    if (damageDesc.includes('door')) {
      const part = vehicleCosts.door;
      damagedParts.push({
        part_name: 'Door',
        parts_cost: part.part,
        labor_cost: part.labor,
        paint_cost: part.paint,
        total: part.part + part.labor + part.paint
      });
      totalPartsCost += part.part;
      totalLaborCost += part.labor;
      totalPaintCost += part.paint;
    }

    // If no specific parts identified, provide general estimate
    if (damagedParts.length === 0) {
      damagedParts.push({
        part_name: 'General Repair',
        parts_cost: 800,
        labor_cost: 400,
        paint_cost: 300,
        total: 1500
      });
      totalPartsCost = 800;
      totalLaborCost = 400;
      totalPaintCost = 300;
    }

    const totalCost = totalPartsCost + totalLaborCost + totalPaintCost;

    // Create structured cost estimation
    const costEstimation = {
      vehicle: {
        brand: vehicleMake,
        model: vehicleModel,
        year: vehicleYear,
        registration: "Not provided"
      },
      damage_description: damageDescription,
      cost_estimation: {
        parts_cost: totalPartsCost,
        labor_cost: totalLaborCost,
        paint_cost: totalPaintCost,
        other_charges: 0,
        total_cost: totalCost,
        currency: "SAR"
      },
      detailed_breakdown: damagedParts
    };

    console.log('Generated cost estimation:', costEstimation);

    // Send the structured cost estimation back to AI
    await realtimeServiceRef.current?.sendTextMessage(
      `Cost estimation generated: ${JSON.stringify(costEstimation, null, 2)}`
    );
  };

  const handleAppointmentBooking = async (args) => {
    const { date, day, timeSlot, city, contactMethod } = args;
    
    // Sample time slot data for validation
    const availabilityData = {
      'Monday': ['Morning', 'Afternoon', 'Evening'],
      'Tuesday': ['Morning', 'Afternoon', 'Evening'],
      'Wednesday': ['Morning', 'Afternoon', 'Evening'],
      'Thursday': ['Morning', 'Afternoon', 'Evening'],
      'Friday': ['Morning', 'Afternoon', 'Evening'],
      'Saturday': ['Morning', 'Afternoon'], // No Evening slots
      'Sunday': [] // Closed
    };

    const availableCities = ['Riyadh', 'Jeddah', 'Dammam'];
    const availableTimeSlots = ['Morning', 'Afternoon', 'Evening'];
    const availableContactMethods = ['WhatsApp', 'Email'];

    // Validate the appointment request
    let responseMessage = '';
    let isAvailable = true;

    // Check if day is valid and available
    if (!availabilityData[day]) {
      isAvailable = false;
      responseMessage = `Sorry, "${day}" is not a valid day. We're open Monday through Saturday. Please provide a different date.`;
    } else if (availabilityData[day].length === 0) {
      isAvailable = false;
      responseMessage = `Sorry, we're closed on ${day}. We're open Monday through Saturday. Please choose a different date.`;
    } else if (!availabilityData[day].includes(timeSlot)) {
      isAvailable = false;
      const availableSlots = availabilityData[day].join(' or ');
      responseMessage = `Sorry, ${timeSlot} slots aren't available on ${day}. We have ${availableSlots} available on ${date}. Which would you prefer?`;
    } else if (!availableCities.includes(city)) {
      isAvailable = false;
      responseMessage = `Sorry, we don't have a branch in ${city}. We have branches in Riyadh, Jeddah, and Dammam. Which city works for you?`;
    } else if (!availableContactMethods.includes(contactMethod)) {
      isAvailable = false;
      responseMessage = `Sorry, ${contactMethod} isn't available. We can contact you via WhatsApp or Email. Which would you prefer?`;
    }

    if (isAvailable) {
      // Appointment is available - confirm it with full date
      const timeSlotDetails = {
        'Morning': '8:00 AM - 12:00 PM',
        'Afternoon': '12:00 PM - 4:00 PM',
        'Evening': '4:00 PM - 8:00 PM'
      };

      responseMessage = `Perfect! I've booked your appointment for ${date}, ${timeSlot} (${timeSlotDetails[timeSlot]}) at our ${city} branch. We'll contact you via ${contactMethod} with the confirmation details. Shukran for choosing SAC Motors!`;
      
      // Save the appointment data
      const appointmentData = {
        appointmentDate: date,
        appointmentDay: day,
        appointmentTime: `${timeSlot} (${timeSlotDetails[timeSlot]})`,
        city: city,
        contactMethod: contactMethod
      };
      
      setConversationData(prev => ({ ...prev, ...appointmentData }));
      await saveDataToBackend(appointmentData);
    }

    // Send the response back to the AI
    await realtimeServiceRef.current?.sendTextMessage(responseMessage);
  };

  const handleConnect = async () => {
    try {
      // Try proxy first, fallback to direct connection
      const apiUrl = '/api/session/create';
      const fallbackUrl = 'http://localhost:3000/api/session/create';
      
      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error('Proxy failed, trying direct connection');
        }
      } catch (proxyError) {
        console.log('Proxy connection failed, trying direct connection...');
        response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const { sessionId: newSessionId, clientSecret } = await response.json();
      setSessionId(newSessionId);

      // Clear previous conversation messages for fresh start
      setMessages([]);
      setConversationData({});
      setShowImageUploader(false);
      setShowLocationSelector(false);
      setShowTimePicker(false);
      setLocationData(null);
      setTimeSlots([]);

      await realtimeServiceRef.current.connect(clientSecret);
      setIsConnected(true);

      // AI will automatically greet and start the conversation via voice and text
      console.log('🤖 Connected - AI will greet automatically...');
    } catch (error) {
      console.error('Connection error:', error);
      let errorMessage = 'Failed to connect. ';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage += 'Please ensure the backend server is running on http://localhost:3000\n\n';
        errorMessage += 'Run: cd backend && npm run dev';
      } else if (error.message.includes('OPENAI_API_KEY')) {
        errorMessage += 'Please check your OpenAI API key in backend/.env file';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleDisconnect = () => {
    realtimeServiceRef.current?.disconnect();
    setIsConnected(false);
    setIsRecording(false);
    
    // Clear all conversation state on disconnect
    setMessages([]);
    setConversationData({});
    setShowImageUploader(false);
    setShowLocationSelector(false);
    setShowTimePicker(false);
    setLocationData(null);
    setTimeSlots([]);
  };

  const toggleRecording = () => {
    if (isRecording) {
      realtimeServiceRef.current?.stopRecording();
    } else {
      realtimeServiceRef.current?.startRecording();
    }
    setIsRecording(!isRecording);
  };

  const toggleMute = () => {
    realtimeServiceRef.current?.toggleMute();
    setIsMuted(!isMuted);
  };


  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const apiUrl = '/api/upload/damage-image';
      const fallbackUrl = 'http://localhost:3000/api/upload/damage-image';
      
      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Proxy failed');
        }
      } catch (proxyError) {
        response = await fetch(fallbackUrl, {
          method: 'POST',
          body: formData
        });
      }

      const { imageUrl } = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'user',
        content: `[Image uploaded: ${file.name}]`,
        imageUrl: `http://localhost:3000${imageUrl}`,
        timestamp: new Date()
      }]);

      setShowImageUploader(false);
      
      // Notify AI that image was uploaded
      await realtimeServiceRef.current?.sendTextMessage('I have uploaded the damage photo.');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleLocationSelect = async (city, branch) => {
    await realtimeServiceRef.current?.sendTextMessage(`I choose ${city} - ${branch}`);
    setShowLocationSelector(false);
  };

  const handleTimeSelect = async (timeSlot) => {
    await realtimeServiceRef.current?.sendTextMessage(`I prefer ${timeSlot}`);
    setShowTimePicker(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 backdrop-blur-sm border-b border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://sac-motor.com/wp-content/uploads/2021/02/SacLogo-white.png" 
                alt="SAC Motors" 
                className="h-10 w-auto"
              />
              <div className="border-l border-gray-500 pl-4">
                <h1 className="text-lg font-bold text-white tracking-tight">AI Service Assistant</h1>
                <p className="text-sm text-gray-300">Powered by Fahad</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <>
                  <span className="flex items-center text-emerald-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                    Connected
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-md"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  className="bg-gradient-to-r from-sac-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 transform hover:-translate-y-0.5"
                >
                  Start Conversation
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isConnected ? (
          <div className="text-center py-20">
            {/* Hero Section */}
            <div className="max-w-5xl mx-auto">
              {/* Floating Microphone Icon */}
              <div className="relative mb-12">
                <div className="w-32 h-32 bg-gradient-to-br from-sac-red to-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-red-500/30 transform hover:scale-105 transition-all duration-300 hover:shadow-red-500/40">
                  <Mic className="w-16 h-16 text-white" />
                </div>
                <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-sac-red/20 to-red-600/20 rounded-full mx-auto animate-pulse"></div>
              </div>

              {/* Main Content Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/50 p-12 mb-12">
                <h2 className="text-5xl font-bold text-gray-800 mb-6 tracking-tight">
                  Specialized Collisions Repair
                </h2>
                <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                  Meet <span className="text-sac-red font-bold">Fahad</span>, your personal AI service engineer. 
                  Get instant vehicle assessment, accurate repair estimation, and hassle-free appointment booking 
                  with voice and text support.
                </p>
                
                {/* CTA Button */}
                <button
                  onClick={handleConnect}
                  className="bg-gradient-to-r from-sac-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg px-12 py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-red-500/25 transform hover:-translate-y-1 mb-8"
                >
                  Start Free Estimation
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg shadow-gray-200/30 border border-gray-100/50 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-sac-red mb-2">+966-118568745</p>
                  <p className="text-sm text-gray-500 font-medium">Call Us</p>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg shadow-gray-200/30 border border-gray-100/50 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-gray-800 mb-2">3 Locations</p>
                  <p className="text-sm text-gray-500 font-medium">Riyadh, Jeddah, Dammam</p>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg shadow-gray-200/30 border border-gray-100/50 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-gray-800 mb-2">All Days</p>
                  <p className="text-sm text-gray-500 font-medium">8:00 AM - 6:00 PM</p>
                </div>
              </div>

              {/* Gradient Separator */}
              <div className="mt-16 mb-8">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              {/* Trust Indicators */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Our Promise</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Hassle Free Experience</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Quality Repairs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">9 Day Service</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">SAC Motor Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chat Area */}
            <div className="lg:col-span-2 space-y-4">
              <ConversationDisplay 
                messages={messages} 
                isAISpeaking={isAISpeaking}
              />
              
              {/* Dynamic UI Components */}
              {showImageUploader && (
                <ImageUploader
                  onUpload={handleImageUpload}
                  onCancel={() => setShowImageUploader(false)}
                />
              )}
              
              {showLocationSelector && locationData && (
                <LocationSelector
                  cities={locationData.cities}
                  onSelect={handleLocationSelect}
                  onCancel={() => setShowLocationSelector(false)}
                />
              )}
              
              {showTimePicker && (
                <TimeSlotPicker
                  slots={timeSlots}
                  onSelect={handleTimeSelect}
                  onCancel={() => setShowTimePicker(false)}
                />
              )}

            </div>

            {/* Sidebar - Audio Controls & Info */}
            <div className="space-y-4">
              <AudioControls
                isRecording={isRecording}
                isMuted={isMuted}
                isConnected={isConnected}
                onToggleRecording={toggleRecording}
                onToggleMute={toggleMute}
                isAISpeaking={isAISpeaking}
              />

              {/* Conversation Data Summary */}
              {Object.keys(conversationData).length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-200/30 border border-gray-100/50 p-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 border-b border-gray-200 pb-3">
                    Collected Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    {conversationData.fullName && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-600">Name:</span> 
                        <span className="text-gray-800 font-medium">{conversationData.fullName}</span>
                      </div>
                    )}
                    {conversationData.mobileNumber && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-600">Mobile:</span> 
                        <span className="text-gray-800 font-medium">{conversationData.mobileNumber}</span>
                      </div>
                    )}
                    {conversationData.emailAddress && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-600">Email:</span> 
                        <span className="text-gray-800 font-medium">{conversationData.emailAddress}</span>
                      </div>
                    )}
                    {conversationData.vehicleMake && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-600">Vehicle:</span> 
                        <span className="text-gray-800 font-medium">{conversationData.vehicleMake} {conversationData.vehicleModel} ({conversationData.vehicleYear})</span>
                      </div>
                    )}
                    {conversationData.preferredCity && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-600">Location:</span> 
                        <span className="text-gray-800 font-medium">{conversationData.preferredCity}</span>
                      </div>
                    )}
                    {conversationData.appointmentTime && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-600">Appointment:</span> 
                        <span className="text-gray-800 font-medium">{conversationData.appointmentTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl shadow-gray-900/20 border border-gray-700/50 p-6">
                <h3 className="text-lg font-bold mb-4 text-white border-b border-gray-600 pb-3">
                  Our Promise
                </h3>
                <ul className="text-sm text-gray-300 space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>Hassle Free Experience</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>Quality Repairs</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>9 Day Service (vs. 21 industry avg.)</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>SAC Motor Warranty</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

