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
    <div className="min-h-screen bg-sac-light">
      {/* Header */}
      <header className="bg-sac-navy shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://sac-motor.com/wp-content/uploads/2021/02/SacLogo-white.png" 
                alt="SAC Motors" 
                className="h-12 w-auto"
              />
              <div className="border-l border-gray-500 pl-4">
                <h1 className="text-xl font-bold text-white">AI Service Assistant</h1>
                <p className="text-sm text-gray-300">Powered by Fahad</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <>
                  <span className="flex items-center text-green-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Connected
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  className="btn-primary"
                >
                  Start Conversation
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="text-center py-16">
            <div className="card-dark max-w-4xl mx-auto">
              <div className="w-24 h-24 bg-sac-red rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Mic className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Specialized Collisions Repair
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Meet <span className="text-sac-red font-semibold">Fahad</span>, your personal AI service engineer. 
                Get instant vehicle assessment, accurate repair estimation, and hassle-free appointment booking 
                with voice and text support.
              </p>
              <button
                onClick={handleConnect}
                className="btn-primary text-lg px-10 py-4 mb-4"
              >
                Start Free Estimation
              </button>
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-600">
                <div className="text-center">
                  <p className="text-2xl font-bold text-sac-red mb-1">+966-118568745</p>
                  <p className="text-sm text-gray-400">Call Us</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-white mb-1">3 Locations</p>
                  <p className="text-sm text-gray-400">Riyadh, Jeddah, Dammam</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-white mb-1">All Days</p>
                  <p className="text-sm text-gray-400">8:00 AM - 6:00 PM</p>
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
                <div className="card">
                  <h3 className="text-lg font-bold mb-3 text-sac-navy border-b-2 border-sac-red pb-2">
                    Collected Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    {conversationData.fullName && (
                      <p><span className="font-semibold text-sac-navy">Name:</span> <span className="text-gray-700">{conversationData.fullName}</span></p>
                    )}
                    {conversationData.mobileNumber && (
                      <p><span className="font-semibold text-sac-navy">Mobile:</span> <span className="text-gray-700">{conversationData.mobileNumber}</span></p>
                    )}
                    {conversationData.emailAddress && (
                      <p><span className="font-semibold text-sac-navy">Email:</span> <span className="text-gray-700">{conversationData.emailAddress}</span></p>
                    )}
                    {conversationData.vehicleMake && (
                      <p><span className="font-semibold text-sac-navy">Vehicle:</span> <span className="text-gray-700">{conversationData.vehicleMake} {conversationData.vehicleModel} ({conversationData.vehicleYear})</span></p>
                    )}
                    {conversationData.preferredCity && (
                      <p><span className="font-semibold text-sac-navy">Location:</span> <span className="text-gray-700">{conversationData.preferredCity}</span></p>
                    )}
                    {conversationData.appointmentTime && (
                      <p><span className="font-semibold text-sac-navy">Appointment:</span> <span className="text-gray-700">{conversationData.appointmentTime}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="card-dark">
                <h3 className="text-lg font-bold mb-3 text-white border-b-2 border-sac-red pb-2">
                  Our Promise
                </h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>✓ Hassle Free Experience</li>
                  <li>✓ Quality Repairs</li>
                  <li>✓ 9 Day Service (vs. 21 industry avg.)</li>
                  <li>✓ SAC Motor Warranty</li>
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

