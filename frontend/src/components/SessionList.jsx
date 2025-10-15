import React, { useState, useEffect } from 'react';

const SessionList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const apiUrl = '/api/session/list';
      const fallbackUrl = 'http://localhost:3000/api/session/list';
      
      let response;
      try {
        response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Proxy failed');
      } catch (proxyError) {
        response = await fetch(fallbackUrl);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert Map to array of {sessionId, sessionData} objects
      const sessionsArray = [];
      if (data.sessionList && data.sessionList instanceof Map) {
        for (const [sessionId, sessionData] of data.sessionList) {
          sessionsArray.push({
            sessionId,
            ...sessionData
          });
        }
      } else if (Array.isArray(data.sessionList)) {
        // Fallback for array format
        sessionsArray.push(...data.sessionList);
      }
      
      setSessions(sessionsArray);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getSessionStatus = (session) => {
    if (session.conversationData?.appointmentTime) return 'Completed';
    if (session.conversationData?.fullName) return 'In Progress';
    return 'New';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-semibold mb-2">Error Loading Sessions</div>
        <div className="text-red-500 text-sm">{error}</div>
        <button 
          onClick={fetchSessions}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Session List</h1>
        <p className="text-gray-600">Manage and view all customer sessions</p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-500 text-lg">No sessions found</div>
          <div className="text-gray-400 text-sm mt-2">Start a conversation to create your first session</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.map((session) => {
            const status = getSessionStatus(session);
            const conversationData = session.conversationData || {};
            
            return (
              <div 
                key={session.sessionId || session.id} 
                className="bg-white border-2 border-red-500 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              >
                {/* Minimalistic Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                      {conversationData.fullName || 'Anonymous'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {session.sessionId ? session.sessionId.slice(0, 8) : session.id?.slice(0, 8)}...
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>

                {/* Minimalistic Content */}
                <div className="space-y-1 mb-3">
                  <div className="text-xs text-gray-600">
                    📅 {formatDate(session.createdAt)}
                  </div>
                  
                  {conversationData.vehicleMake && (
                    <div className="text-xs text-gray-600">
                      🚗 {conversationData.vehicleMake} {conversationData.vehicleModel}
                    </div>
                  )}
                  
                  {conversationData.preferredCity && (
                    <div className="text-xs text-gray-600">
                      📍 {conversationData.preferredCity}
                    </div>
                  )}
                  
                  {conversationData.estimatedCost && (
                    <div className="text-xs font-semibold text-green-600">
                      💰 {conversationData.estimatedCost} SAR
                    </div>
                  )}
                </div>

                {/* Minimalistic Actions */}
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/api/session/${session.sessionId || session.id}`, '_blank');
                    }}
                    className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    View
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(session.sessionId || session.id);
                    }}
                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                    title="Copy Session ID"
                  >
                    📋
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button 
          onClick={fetchSessions}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Refresh Sessions
        </button>
      </div>
    </div>
  );
};

export default SessionList;