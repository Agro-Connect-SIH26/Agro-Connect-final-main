// Test the safety gate logic
const testSafetyGate = (crop, state) => {
  const filters = {
    crop: crop,
    state: state,
  };

  if (!filters.crop && !filters.state) {
    return {
      source: 'none',
      is_live: false,
      count: 0,
      note: 'Crop and state filters are required. Please select both from the dropdowns.',
      unit: 'INR/kg',
      fetched_at: new Date().toISOString(),
      results: [],
    };
  }

  return { allowed: true };
};

// Test cases
console.log('Testing safety gate:');
console.log('1. No crop, no state:', testSafetyGate(null, null));
console.log('2. Crop only, no state:', testSafetyGate('tomato', null));
console.log('3. No crop, state only:', testSafetyGate(null, 'maharashtra'));
console.log('4. Both crop and state:', testSafetyGate('tomato', 'maharashtra'));