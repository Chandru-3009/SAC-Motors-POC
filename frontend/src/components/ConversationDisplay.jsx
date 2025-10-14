import { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';

export default function ConversationDisplay({ messages, isAISpeaking }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="card h-[500px] flex flex-col bg-gradient-chat">
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-sac-red">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sac-red to-red-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-sac-navy">Fahad - Service Engineer</h2>
            <p className="text-sm text-gray-600">Your friendly SAC Motors assistant</p>
          </div>
        </div>
        {isAISpeaking && (
          <div className="flex items-center space-x-2 text-sac-red">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-sac-red rounded-full audio-bar"></div>
              <div className="w-1 h-4 bg-sac-red rounded-full audio-bar"></div>
              <div className="w-1 h-4 bg-sac-red rounded-full audio-bar"></div>
            </div>
            <span className="text-sm font-semibold">Fahad is speaking...</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-sac-red to-red-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <p className="text-lg font-medium">Fahad is ready to help you!</p>
            <p className="text-sm mt-2">Click "Start Conversation" to begin your service consultation</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-gray-300'
                      : 'bg-sac-red shadow-lg'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                <div
                  className={`rounded-lg px-4 py-3 message-shadow message-bubble ${
                    message.role === 'user'
                      ? 'bg-white border border-gray-200 text-gray-900'
                      : 'bg-sac-navy text-white'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content.includes('**') || message.content.includes('•') ? (
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-sac-red font-semibold">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                            .replace(/•/g, '<span class="text-sac-red mr-2 font-bold">•</span>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Uploaded damage"
                      className="mt-2 rounded-lg max-w-xs border-2 border-sac-red"
                    />
                  )}
                  <span className="text-xs opacity-70 mt-2 block">
                    {message.timestamp?.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isAISpeaking && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-sac-red shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-sac-navy text-white rounded-lg px-4 py-3 message-shadow message-bubble">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

