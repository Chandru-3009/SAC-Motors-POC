import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export default function AudioControls({
  isRecording,
  isMuted,
  isConnected,
  onToggleRecording,
  onToggleMute,
  isAISpeaking
}) {
  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4 text-sac-navy border-b-2 border-sac-red pb-2">Audio Controls</h3>
      
      <div className="space-y-3">
        {/* Microphone Control */}
        <button
          onClick={onToggleRecording}
          disabled={!isConnected}
          className={`w-full flex items-center justify-between p-4 rounded-lg transition-all shadow-md ${
            isRecording
              ? 'bg-sac-red text-white border-2 border-sac-red-hover'
              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
          } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center space-x-3">
            {isRecording ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-sac-navy" />
            )}
            <div className="text-left">
              <p className={`font-semibold ${isRecording ? 'text-white' : 'text-sac-navy'}`}>Microphone</p>
              <p className={`text-xs ${isRecording ? 'text-white opacity-90' : 'text-gray-600'}`}>
                {isRecording ? 'Recording...' : 'Click to speak'}
              </p>
            </div>
          </div>
          {isRecording && (
            <div className="flex space-x-1">
              <div className="w-1 h-6 bg-white rounded-full audio-bar"></div>
              <div className="w-1 h-6 bg-white rounded-full audio-bar"></div>
              <div className="w-1 h-6 bg-white rounded-full audio-bar"></div>
            </div>
          )}
        </button>

        {/* Speaker Control */}
        <button
          onClick={onToggleMute}
          disabled={!isConnected}
          className={`w-full flex items-center justify-between p-4 rounded-lg transition-all shadow-md ${
            isMuted
              ? 'bg-orange-500 text-white border-2 border-orange-600'
              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
          } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center space-x-3">
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-sac-navy" />
            )}
            <div className="text-left">
              <p className={`font-semibold ${isMuted ? 'text-white' : 'text-sac-navy'}`}>Speaker</p>
              <p className={`text-xs ${isMuted ? 'text-white opacity-90' : 'text-gray-600'}`}>
                {isMuted ? 'Muted' : 'Playing'}
              </p>
            </div>
          </div>
          {isAISpeaking && !isMuted && (
            <div className="flex space-x-1">
              <div className="w-1 h-6 bg-sac-red rounded-full audio-bar"></div>
              <div className="w-1 h-6 bg-sac-red rounded-full audio-bar"></div>
              <div className="w-1 h-6 bg-sac-red rounded-full audio-bar"></div>
            </div>
          )}
        </button>

        {/* Status Info */}
        <div className="mt-4 p-4 bg-sac-navy rounded-lg">
          <p className="text-sm text-white">
            <span className="font-semibold text-sac-red">Status:</span>{' '}
            {!isConnected && 'Not connected'}
            {isConnected && !isRecording && !isAISpeaking && 'Ready to chat'}
            {isConnected && isRecording && '🎤 Listening...'}
            {isConnected && isAISpeaking && '🔊 Fahad is speaking...'}
          </p>
        </div>
      </div>
    </div>
  );
}

