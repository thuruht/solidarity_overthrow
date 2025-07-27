// Additional cities to add to globalCities array for better global coverage
const additionalCities = [
  // Canada
  { name: "Toronto", country: "Canada", lat: 43.6532, lon: -79.3832, ipi: 75, propaganda: 70, solidarity: 25 },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lon: -123.1207, ipi: 72, propaganda: 68, solidarity: 30 },
  { name: "Montreal", country: "Canada", lat: 45.5017, lon: -73.5673, ipi: 70, propaganda: 65, solidarity: 35 },
  { name: "Calgary", country: "Canada", lat: 51.0447, lon: -114.0719, ipi: 73, propaganda: 69, solidarity: 28 },
  
  // Russia
  { name: "Moscow", country: "Russia", lat: 55.7558, lon: 37.6173, ipi: 85, propaganda: 90, solidarity: 15 },
  { name: "St. Petersburg", country: "Russia", lat: 59.9343, lon: 30.3351, ipi: 82, propaganda: 88, solidarity: 18 },
  { name: "Novosibirsk", country: "Russia", lat: 55.0084, lon: 82.9357, ipi: 80, propaganda: 85, solidarity: 20 },
  { name: "Yekaterinburg", country: "Russia", lat: 56.8389, lon: 60.6057, ipi: 78, propaganda: 83, solidarity: 22 },
  { name: "Vladivostok", country: "Russia", lat: 43.1332, lon: 131.9113, ipi: 75, propaganda: 80, solidarity: 25 },
  
  // Central Asia
  { name: "Almaty", country: "Kazakhstan", lat: 43.2220, lon: 76.8512, ipi: 78, propaganda: 80, solidarity: 22 },
  { name: "Astana", country: "Kazakhstan", lat: 51.1694, lon: 71.4491, ipi: 80, propaganda: 82, solidarity: 20 },
  { name: "Tashkent", country: "Uzbekistan", lat: 41.2995, lon: 69.2401, ipi: 82, propaganda: 85, solidarity: 18 },
  { name: "Bishkek", country: "Kyrgyzstan", lat: 42.8746, lon: 74.5698, ipi: 75, propaganda: 78, solidarity: 25 },
  { name: "Dushanbe", country: "Tajikistan", lat: 38.5598, lon: 68.7870, ipi: 79, propaganda: 82, solidarity: 21 },
  
  // Eastern Europe
  { name: "Warsaw", country: "Poland", lat: 52.2297, lon: 21.0122, ipi: 65, propaganda: 60, solidarity: 35 },
  { name: "Kyiv", country: "Ukraine", lat: 50.4501, lon: 30.5234, ipi: 70, propaganda: 65, solidarity: 30 },
  { name: "Bucharest", country: "Romania", lat: 44.4268, lon: 26.1025, ipi: 68, propaganda: 63, solidarity: 32 },
  { name: "Budapest", country: "Hungary", lat: 47.4979, lon: 19.0402, ipi: 67, propaganda: 62, solidarity: 33 },
  { name: "Minsk", country: "Belarus", lat: 53.9045, lon: 27.5615, ipi: 82, propaganda: 87, solidarity: 18 },
  
  // Turkey
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lon: 28.9784, ipi: 75, propaganda: 78, solidarity: 25 },
  { name: "Ankara", country: "Turkey", lat: 39.9334, lon: 32.8597, ipi: 78, propaganda: 80, solidarity: 22 },
  { name: "Izmir", country: "Turkey", lat: 38.4237, lon: 27.1428, ipi: 73, propaganda: 75, solidarity: 27 },
  
  // China
  { name: "Beijing", country: "China", lat: 39.9042, lon: 116.4074, ipi: 85, propaganda: 92, solidarity: 15 },
  { name: "Shanghai", country: "China", lat: 31.2304, lon: 121.4737, ipi: 83, propaganda: 90, solidarity: 17 },
  { name: "Guangzhou", country: "China", lat: 23.1291, lon: 113.2644, ipi: 80, propaganda: 88, solidarity: 20 },
  { name: "Chengdu", country: "China", lat: 30.5728, lon: 104.0668, ipi: 78, propaganda: 85, solidarity: 22 },
  { name: "Hong Kong", country: "China", lat: 22.3193, lon: 114.1694, ipi: 75, propaganda: 80, solidarity: 25 },
  { name: "Shenzhen", country: "China", lat: 22.5431, lon: 114.0579, ipi: 79, propaganda: 86, solidarity: 21 },
  { name: "Wuhan", country: "China", lat: 30.5928, lon: 114.3055, ipi: 81, propaganda: 87, solidarity: 19 },
  
  // India
  { name: "New Delhi", country: "India", lat: 28.6139, lon: 77.2090, ipi: 70, propaganda: 75, solidarity: 30 },
  { name: "Mumbai", country: "India", lat: 19.0760, lon: 72.8777, ipi: 72, propaganda: 77, solidarity: 28 },
  { name: "Bangalore", country: "India", lat: 12.9716, lon: 77.5946, ipi: 68, propaganda: 73, solidarity: 32 },
  { name: "Kolkata", country: "India", lat: 22.5726, lon: 88.3639, ipi: 71, propaganda: 76, solidarity: 29 },
  
  // Southeast Asia
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lon: 100.5018, ipi: 75, propaganda: 78, solidarity: 25 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lon: 106.8456, ipi: 73, propaganda: 76, solidarity: 27 },
  { name: "Manila", country: "Philippines", lat: 14.5995, lon: 120.9842, ipi: 74, propaganda: 77, solidarity: 26 },
  { name: "Ho Chi Minh City", country: "Vietnam", lat: 10.8231, lon: 106.6297, ipi: 80, propaganda: 85, solidarity: 20 },
  
  // Add more regions
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lon: 18.0686, ipi: 60, propaganda: 55, solidarity: 40 },
  { name: "Oslo", country: "Norway", lat: 59.9139, lon: 10.7522, ipi: 58, propaganda: 53, solidarity: 42 },
  { name: "Helsinki", country: "Finland", lat: 60.1699, lon: 24.9384, ipi: 59, propaganda: 54, solidarity: 41 },
  { name: "Tehran", country: "Iran", lat: 35.6892, lon: 51.3890, ipi: 80, propaganda: 85, solidarity: 20 },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lon: 46.6753, ipi: 85, propaganda: 88, solidarity: 15 }
];
