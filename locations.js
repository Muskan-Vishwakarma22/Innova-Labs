/* =================================================================
   locations.js — Office data for the Global Offices section
================================================================= */

const OFFICES = [
  {
    id: 'mumbai',
    city: 'Mumbai',
    region: 'South Asia HQ',
    team: '90+ Engineers',
    lat:  19.0760,
    lon:  72.8777,
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    region: 'East Asia Operations',
    team: '70+ Engineers',
    lat:  35.6762,
    lon: 139.6503,
  },
  {
    id: 'delhi',
    city: 'Delhi',
    region: 'Innovation Center',
    team: '120+ Engineers',
    lat:  28.6139,
    lon:  77.2090,
  },
  {
    id: 'dubai',
    city: 'Dubai',
    region: 'MENA Headquarters',
    team: '30+ Engineers',
    lat:  25.2048,
    lon:  55.2708,
  },
  {
    id: 'singapore',
    city: 'Singapore',
    region: 'SEA Operations',
    team: '45+ Engineers',
    lat:   1.3521,
    lon: 103.8198,
  },
  {
    id: 'sydney',
    city: 'Sydney',
    region: 'ANZ Office',
    team: '25+ Engineers',
    lat: -33.8688,
    lon: 151.2093,
  },
];

const ARC_PAIRS = [
  ['mumbai',    'tokyo'],
  ['tokyo',     'dubai'],
  ['dubai',     'delhi'],
  ['delhi',     'singapore'],
  ['singapore', 'sydney'],
  ['sydney',    'mumbai'],
];
