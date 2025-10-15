import { useEffect, useRef, useState } from 'react';
import { RealtimeService } from '../services/realtimeService';

function Chat() {
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
    const [language, setLanguage] = useState(() => localStorage.getItem('sac_lang') || '');
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [pendingConnect, setPendingConnect] = useState(false);

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

    // No auto-open language modal on load; we open it when user clicks Start

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

        try {
            const apiUrl = '/api/session/cost-estimation';
            const fallbackUrl = 'http://localhost:3000/api/session/cost-estimation';

            let response;
            try {
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(args)
                });

                if (!response.ok) {
                    throw new Error('Proxy failed');
                }
            } catch (proxyError) {
                response = await fetch(fallbackUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(args)
                });
            }

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const { costEstimation } = await response.json();
            console.log('Generated cost estimation:', costEstimation);

            // Send the cost estimation back to AI so it can speak it
            const totalCost = costEstimation.cost_estimation.total_cost;
            const currency = costEstimation.cost_estimation.currency;

            // Send a structured response that the AI can speak naturally
            await realtimeServiceRef.current?.sendTextMessage(
                `FUNCTION_RESULT: Cost estimation completed successfully. Total cost: ${totalCost} ${currency}. Breakdown: Parts ${costEstimation.cost_estimation.parts_cost} ${currency}, Labor ${costEstimation.cost_estimation.labor_cost} ${currency}, Paint ${costEstimation.cost_estimation.paint_cost} ${currency}. Please present this cost estimation to the user in a friendly way and continue with the next question about driveability.`
            );
        } catch (error) {
            console.error('Error generating cost estimation:', error);

            // Fallback to a simple estimate
            await realtimeServiceRef.current?.sendTextMessage(
                `FUNCTION_RESULT: Cost estimation: Approximately 1,500-2,500 SAR based on damage description. Please present this to the user and continue with the next question about driveability.`
            );
        }
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
            // Decide solely based on persistent storage so clearing storage forces dialog
            const storedLang = localStorage.getItem('sac_lang');
            if (!storedLang) {
                setPendingConnect(true);
                setShowLanguageModal(true);
                return;
            }
            // Try proxy first, fallback to direct connection
            const apiUrl = '/api/session/create';
            const fallbackUrl = 'http://localhost:3000/api/session/create';

            let response;
            try {
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: storedLang || 'en' })
                });

                if (!response.ok) {
                    throw new Error('Proxy failed, trying direct connection');
                }
            } catch (proxyError) {
                console.log('Proxy connection failed, trying direct connection...');
                response = await fetch(fallbackUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: storedLang || 'en' })
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

            // Set language attribute but keep UI in LTR direction
            document.documentElement.lang = storedLang || 'en';

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

        // Reset language so user selects again on next start
        localStorage.removeItem('sac_lang');
        setLanguage('');
        setShowLanguageModal(false);
        setPendingConnect(false);
        document.documentElement.lang = 'en';
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

            const imageMessage = {
                role: 'user',
                content: `[Image uploaded: ${file.name}]`,
                imageUrl: `http://localhost:3000${imageUrl}`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, imageMessage]);

            // Collect image upload data
            if (realtimeServiceRef.current) {
                realtimeServiceRef.current.collectedData.damageInfo.imageUrl = `http://localhost:3000${imageUrl}`;
                realtimeServiceRef.current.collectedData.damageInfo.imageFileName = file.name;
                realtimeServiceRef.current.collectUserData(imageMessage, true);
            }

            setShowImageUploader(false);

            // Notify AI that image was uploaded
            await realtimeServiceRef.current?.sendTextMessage('I have uploaded the damage photo.');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleLocationSelect = async (city, branch) => {
        // Collect location selection data
        if (realtimeServiceRef.current) {
            realtimeServiceRef.current.collectedData.serviceInfo.preferredCity = city;
            realtimeServiceRef.current.collectedData.serviceInfo.preferredBranch = branch;
        }

        await realtimeServiceRef.current?.sendTextMessage(`I choose ${city} - ${branch}`);
        setShowLocationSelector(false);
    };

    const handleTimeSelect = async (timeSlot) => {
        // Collect time selection data
        if (realtimeServiceRef.current) {
            realtimeServiceRef.current.collectedData.serviceInfo.appointmentTime = timeSlot;
        }

        await realtimeServiceRef.current?.sendTextMessage(`I prefer ${timeSlot}`);
        setShowTimePicker(false);
    };

}

export default Chat;

