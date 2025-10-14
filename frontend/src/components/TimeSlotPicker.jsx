import { useState } from 'react';
import { Clock, X, Calendar } from 'lucide-react';

export default function TimeSlotPicker({ slots, onSelect, onCancel }) {
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Get next 7 days for date selection
  const getNextSevenDays = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    return dates;
  };

  const availableDates = getNextSevenDays();

  const handleConfirm = () => {
    if (selectedSlot && selectedDate) {
      const dateLabel = availableDates.find(d => d.value === selectedDate)?.label;
      onSelect(`${dateLabel} - ${selectedSlot}`);
    }
  };

  const getSlotIcon = (slot) => {
    if (slot.toLowerCase().includes('morning')) return '🌅';
    if (slot.toLowerCase().includes('afternoon')) return '☀️';
    if (slot.toLowerCase().includes('evening')) return '🌆';
    return '🕐';
  };

  return (
    <div className="card border-2 border-sac-red shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-sac-red">
        <h3 className="text-lg font-bold text-sac-navy">Select Appointment Time</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-sac-red transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-sac-navy mb-3">
          <Calendar className="w-4 h-4 inline mr-1" />
          Choose Date
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableDates.map((date) => (
            <button
              key={date.value}
              onClick={() => setSelectedDate(date.value)}
              className={`p-3 rounded-lg border-2 transition-all text-sm shadow-md ${
                selectedDate === date.value
                  ? 'border-sac-red bg-red-50 text-sac-red font-semibold'
                  : 'border-gray-300 hover:border-sac-red text-gray-700'
              }`}
            >
              {date.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-sac-navy mb-3">
            <Clock className="w-4 h-4 inline mr-1" />
            Choose Time Slot
          </label>
          <div className="space-y-2">
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all shadow-md ${
                  selectedSlot === slot
                    ? 'border-sac-red bg-red-50 text-sac-red'
                    : 'border-gray-300 hover:border-sac-red text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getSlotIcon(slot)}</span>
                  <div>
                    <p className="font-semibold">{slot}</p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {selectedSlot && selectedDate && (
        <button
          onClick={handleConfirm}
          className="btn-primary w-full"
        >
          Confirm Appointment
        </button>
      )}
    </div>
  );
}

