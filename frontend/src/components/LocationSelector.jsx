import { useState } from 'react';
import { MapPin, X } from 'lucide-react';

const BRANCH_DATA = {
  Riyadh: [
    'Al Olaya Branch - King Fahd Road',
    'Al Malqa Branch - Northern Ring Road',
    'Exit 10 Branch - Eastern Ring Road'
  ],
  Jeddah: [
    'Al Hamra Branch - Madinah Road',
    'Al Rawdah Branch - King Abdul Aziz Road',
    'Obhur Branch - Coastal Road'
  ],
  Dammam: [
    'Al Faisaliyah Branch - King Fahd Road',
    'Al Shatea Branch - Corniche Road',
    'Dhahran Branch - Highway 605'
  ]
};

export default function LocationSelector({ cities, onSelect, onCancel }) {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSelectedBranch('');
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
  };

  const handleConfirm = () => {
    if (selectedCity && selectedBranch) {
      onSelect(selectedCity, selectedBranch);
    }
  };

  return (
    <div className="card border-2 border-sac-red shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-sac-red">
        <h3 className="text-lg font-bold text-sac-navy">Select Location</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-sac-red transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* City Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-sac-navy mb-3">
          Choose City
        </label>
        <div className="grid grid-cols-3 gap-3">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => handleCitySelect(city)}
              className={`p-4 rounded-lg border-2 transition-all shadow-md ${
                selectedCity === city
                  ? 'border-sac-red bg-red-50 text-sac-red'
                  : 'border-gray-300 hover:border-sac-red text-gray-700'
              }`}
            >
              <MapPin className="w-6 h-6 mx-auto mb-1" />
              <p className="text-sm font-semibold">{city}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Branch Selection */}
      {selectedCity && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-sac-navy mb-3">
            Choose Branch in {selectedCity}
          </label>
          <div className="space-y-2">
            {BRANCH_DATA[selectedCity]?.map((branch) => (
              <button
                key={branch}
                onClick={() => handleBranchSelect(branch)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all shadow-md ${
                  selectedBranch === branch
                    ? 'border-sac-red bg-red-50 text-sac-red'
                    : 'border-gray-300 hover:border-sac-red text-gray-700'
                }`}
              >
                <p className="text-sm font-semibold">{branch}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {selectedCity && selectedBranch && (
        <button
          onClick={handleConfirm}
          className="btn-primary w-full"
        >
          Confirm Location
        </button>
      )}
    </div>
  );
}

