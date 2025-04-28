// Sample Data (replace with real Sharqia data)
const healthData = {
    districts: ["Zagazig", "Belbeis", "Abu Hammad", "Al-Hussainya"],
    diabetesRates: [18, 22, 15, 20],  // %
    pollutionLevels: [65, 80, 50, 70], // µg/m³
    maternalMortality: [55, 60, 50, 58] // per 100k
  };
  
  // 1. Update Metrics Overview
  document.getElementById("diabetes-rate").textContent = `${healthData.diabetesRates[0]}%`;
  document.getElementById("pollution-level").textContent = `${healthData.pollutionLevels[0]} µg/m³`;
  document.getElementById("maternal-mortality").textContent = `${healthData.maternalMortality[0]} per 100k`;
  
  // 2. Create Interactive Chart
  const ctx = document.getElementById('healthChart').getContext('2d');
  const healthChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: healthData.districts,
      datasets: [
        {
          label: 'Diabetes Rate (%)',
          data: healthData.diabetesRates,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Air Pollution (PM2.5)',
          data: healthData.pollutionLevels,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
  
  // 3. Initialize Map (Leaflet)
  const map = L.map('map').setView([30.7, 31.6], 9);  // Sharqia coordinates
  
  // Add base map (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  
  // Add sample markers for districts
  healthData.districts.forEach((district, index) => {
    // Mock coordinates (replace with real Sharqia district coordinates)
    const lat = 30.7 + (Math.random() * 0.2 - 0.1);
    const lng = 31.6 + (Math.random() * 0.2 - 0.1);
    
    L.marker([lat, lng]).addTo(map)
      .bindPopup(`
        <b>${district}</b><br>
        Diabetes: ${healthData.diabetesRates[index]}%<br>
        Pollution: ${healthData.pollutionLevels[index]} µg/m³
      `);
  });