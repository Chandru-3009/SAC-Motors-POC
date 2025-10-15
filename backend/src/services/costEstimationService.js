// Middle East realistic vehicle repair costs (in SAR)
const VEHICLE_COST_DATA = {
  "Toyota Camry 2021": {
    "bumper": {"part": 1200, "labor": 400},
    "front_left_fender": {"part": 950, "labor": 300},
    "front_right_fender": {"part": 950, "labor": 300},
    "rear_left_fender": {"part": 850, "labor": 280},
    "rear_right_fender": {"part": 850, "labor": 280},
    "hood": {"part": 1800, "labor": 500},
    "trunk_lid": {"part": 1500, "labor": 450},
    "headlight_left": {"part": 850, "labor": 200},
    "headlight_right": {"part": 850, "labor": 200},
    "taillight_left": {"part": 650, "labor": 150},
    "taillight_right": {"part": 650, "labor": 150},
    "front_door_left": {"part": 1200, "labor": 350},
    "front_door_right": {"part": 1200, "labor": 350},
    "rear_door_left": {"part": 1100, "labor": 320},
    "rear_door_right": {"part": 1100, "labor": 320},
    "side_mirror_left": {"part": 450, "labor": 100},
    "side_mirror_right": {"part": 450, "labor": 100},
    "windshield": {"part": 800, "labor": 200},
    "rear_window": {"part": 600, "labor": 150},
    "paint_per_panel": 300
  },
  "Honda Accord 2020": {
    "bumper": {"part": 1000, "labor": 350},
    "front_left_fender": {"part": 900, "labor": 280},
    "front_right_fender": {"part": 900, "labor": 280},
    "rear_left_fender": {"part": 800, "labor": 250},
    "rear_right_fender": {"part": 800, "labor": 250},
    "hood": {"part": 1700, "labor": 450},
    "trunk_lid": {"part": 1400, "labor": 400},
    "headlight_left": {"part": 800, "labor": 180},
    "headlight_right": {"part": 800, "labor": 180},
    "taillight_left": {"part": 600, "labor": 140},
    "taillight_right": {"part": 600, "labor": 140},
    "front_door_left": {"part": 1100, "labor": 320},
    "front_door_right": {"part": 1100, "labor": 320},
    "rear_door_left": {"part": 1000, "labor": 290},
    "rear_door_right": {"part": 1000, "labor": 290},
    "side_mirror_left": {"part": 420, "labor": 90},
    "side_mirror_right": {"part": 420, "labor": 90},
    "windshield": {"part": 750, "labor": 180},
    "rear_window": {"part": 550, "labor": 140},
    "paint_per_panel": 280
  },
  "BMW 3 Series 2022": {
    "bumper": {"part": 1800, "labor": 600},
    "front_left_fender": {"part": 1500, "labor": 450},
    "front_right_fender": {"part": 1500, "labor": 450},
    "rear_left_fender": {"part": 1400, "labor": 420},
    "rear_right_fender": {"part": 1400, "labor": 420},
    "hood": {"part": 2500, "labor": 700},
    "trunk_lid": {"part": 2200, "labor": 650},
    "headlight_left": {"part": 1200, "labor": 300},
    "headlight_right": {"part": 1200, "labor": 300},
    "taillight_left": {"part": 900, "labor": 200},
    "taillight_right": {"part": 900, "labor": 200},
    "front_door_left": {"part": 1800, "labor": 500},
    "front_door_right": {"part": 1800, "labor": 500},
    "rear_door_left": {"part": 1700, "labor": 480},
    "rear_door_right": {"part": 1700, "labor": 480},
    "side_mirror_left": {"part": 800, "labor": 150},
    "side_mirror_right": {"part": 800, "labor": 150},
    "windshield": {"part": 1200, "labor": 250},
    "rear_window": {"part": 900, "labor": 200},
    "paint_per_panel": 450
  },
  "Nissan Altima 2021": {
    "bumper": {"part": 1100, "labor": 380},
    "front_left_fender": {"part": 950, "labor": 290},
    "front_right_fender": {"part": 950, "labor": 290},
    "rear_left_fender": {"part": 850, "labor": 270},
    "rear_right_fender": {"part": 850, "labor": 270},
    "hood": {"part": 1600, "labor": 480},
    "trunk_lid": {"part": 1300, "labor": 420},
    "headlight_left": {"part": 750, "labor": 190},
    "headlight_right": {"part": 750, "labor": 190},
    "taillight_left": {"part": 580, "labor": 160},
    "taillight_right": {"part": 580, "labor": 160},
    "front_door_left": {"part": 1150, "labor": 340},
    "front_door_right": {"part": 1150, "labor": 340},
    "rear_door_left": {"part": 1050, "labor": 310},
    "rear_door_right": {"part": 1050, "labor": 310},
    "side_mirror_left": {"part": 400, "labor": 95},
    "side_mirror_right": {"part": 400, "labor": 95},
    "windshield": {"part": 700, "labor": 190},
    "rear_window": {"part": 500, "labor": 150},
    "paint_per_panel": 290
  }
};

/**
 * Generate cost estimation for vehicle repair
 */
export async function generateCostEstimation(args) {
  const { vehicleMake, vehicleModel, vehicleYear, damageDescription, imageUrl } = args;
  
  console.log('🔧 Generating cost estimation for:', { vehicleMake, vehicleModel, vehicleYear, damageDescription, imageUrl });
  
  // Create vehicle key for lookup
  const vehicleKey = `${vehicleMake} ${vehicleModel} ${vehicleYear}`;
  const vehicleCosts = VEHICLE_COST_DATA[vehicleKey];
  
  if (!vehicleCosts) {
    console.log('⚠️ Vehicle not found in cost data, using default Toyota Camry 2021');
    const defaultVehicle = VEHICLE_COST_DATA["Toyota Camry 2021"];
    return generateCostBreakdown(damageDescription, defaultVehicle, "Toyota Camry 2021", imageUrl);
  }
  
  return generateCostBreakdown(damageDescription, vehicleCosts, vehicleKey, imageUrl);
}

/**
 * Generate detailed cost breakdown based on damage description
 */
function generateCostBreakdown(damageDescription, vehicleCosts, vehicleKey, imageUrl = null) {
  const damageDesc = damageDescription.toLowerCase();
  const damagedParts = [];
  let totalPartsCost = 0;
  let totalLaborCost = 0;
  let totalPaintCost = 0;

  // Analyze damage description to identify damaged parts
  const damagePatterns = {
    'bumper': ['bumper', 'front bumper', 'rear bumper'],
    'front_left_fender': ['front left fender', 'left front fender', 'front left wing'],
    'front_right_fender': ['front right fender', 'right front fender', 'front right wing'],
    'rear_left_fender': ['rear left fender', 'left rear fender', 'rear left wing'],
    'rear_right_fender': ['rear right fender', 'right rear fender', 'rear right wing'],
    'hood': ['hood', 'bonnet', 'front hood'],
    'trunk_lid': ['trunk', 'boot', 'rear trunk', 'trunk lid'],
    'headlight_left': ['left headlight', 'front left light', 'left front light'],
    'headlight_right': ['right headlight', 'front right light', 'right front light'],
    'taillight_left': ['left taillight', 'rear left light', 'left rear light'],
    'taillight_right': ['right taillight', 'rear right light', 'right rear light'],
    'front_door_left': ['front left door', 'left front door', 'driver door'],
    'front_door_right': ['front right door', 'right front door', 'passenger door'],
    'rear_door_left': ['rear left door', 'left rear door'],
    'rear_door_right': ['rear right door', 'right rear door'],
    'side_mirror_left': ['left mirror', 'left side mirror', 'driver mirror'],
    'side_mirror_right': ['right mirror', 'right side mirror', 'passenger mirror'],
    'windshield': ['windshield', 'front window', 'windscreen'],
    'rear_window': ['rear window', 'back window', 'rear windscreen']
  };

  // Check for each damage pattern
  for (const [partKey, patterns] of Object.entries(damagePatterns)) {
    const hasDamage = patterns.some(pattern => damageDesc.includes(pattern));
    
    if (hasDamage && vehicleCosts[partKey]) {
      const part = vehicleCosts[partKey];
      const paintCost = vehicleCosts.paint_per_panel || 0;
      
      damagedParts.push({
        part_name: partKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        parts_cost: part.part,
        labor_cost: part.labor,
        paint_cost: paintCost,
        total: part.part + part.labor + paintCost
      });
      
      totalPartsCost += part.part;
      totalLaborCost += part.labor;
      totalPaintCost += paintCost;
    }
  }

  // If no specific parts identified, provide general estimate based on damage severity
  if (damagedParts.length === 0) {
    const severity = assessDamageSeverity(damageDescription);
    const baseCost = severity === 'minor' ? 800 : severity === 'moderate' ? 1500 : 2500;
    
    damagedParts.push({
      part_name: 'General Repair (Estimated)',
      parts_cost: baseCost,
      labor_cost: baseCost * 0.4,
      paint_cost: baseCost * 0.2,
      total: baseCost * 1.6
    });
    
    totalPartsCost = baseCost;
    totalLaborCost = baseCost * 0.4;
    totalPaintCost = baseCost * 0.2;
  }

  const totalCost = totalPartsCost + totalLaborCost + totalPaintCost;

  // Create structured cost estimation
  const costEstimation = {
    vehicle: {
      brand: vehicleKey.split(' ')[0],
      model: vehicleKey.split(' ').slice(1, -1).join(' '),
      year: vehicleKey.split(' ').pop(),
      registration: "Not provided"
    },
    damage_description: damageDescription,
    image_url: imageUrl || null,
    cost_estimation: {
      parts_cost: totalPartsCost,
      labor_cost: totalLaborCost,
      paint_cost: totalPaintCost,
      other_charges: 0,
      total_cost: totalCost,
      currency: "SAR"
    },
    detailed_breakdown: damagedParts,
    notes: [
      "Prices include VAT",
      "Estimated repair time: 3-7 business days",
      "Final cost may vary based on actual damage assessment",
      "All repairs come with SAC Motors warranty"
    ]
  };

  console.log('✅ Cost estimation generated:', costEstimation);
  return costEstimation;
}

/**
 * Assess damage severity based on description
 */
function assessDamageSeverity(description) {
  const minorKeywords = ['scratch', 'small dent', 'minor', 'light', 'surface'];
  const majorKeywords = ['major', 'severe', 'extensive', 'heavy', 'crash', 'accident'];
  
  const desc = description.toLowerCase();
  
  if (majorKeywords.some(keyword => desc.includes(keyword))) {
    return 'major';
  } else if (minorKeywords.some(keyword => desc.includes(keyword))) {
    return 'minor';
  }
  
  return 'moderate';
}

/**
 * Get available vehicle models for cost estimation
 */
export function getAvailableVehicles() {
  return Object.keys(VEHICLE_COST_DATA).map(key => {
    const parts = key.split(' ');
    return {
      brand: parts[0],
      model: parts.slice(1, -1).join(' '),
      year: parts[parts.length - 1],
      key: key
    };
  });
}
