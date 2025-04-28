let datasets = {};
let map;
let charts = {};

// Load all necessary data files
async function loadData() {
  try {
    console.log("Starting data loading...");
    
    // Update these paths to match your file structure
    const sharqiaResponse = await fetch('./data/sharqia_data.json');
    const egyptResponse = await fetch('./data/egypt_data.json');
    const worldResponse = await fetch('./data/world_data.json');
    const districtsGeoResponse = await fetch('./data/districts.geo.json');
    
    if (!sharqiaResponse.ok || !egyptResponse.ok || !worldResponse.ok || !districtsGeoResponse.ok) {
      throw new Error("One or more data files could not be loaded");
    }
    
    const sharqiaData = await sharqiaResponse.json();
    const egyptData = await egyptResponse.json();
    const worldData = await worldResponse.json();
    const districtsGeo = await districtsGeoResponse.json();
    
    console.log("Data loaded successfully");
    
    // Store data in the datasets object
    datasets = {
      sharqia: sharqiaData,
      egypt: egyptData,
      world: worldData,
      districtsGeo: districtsGeo
    };
    
    console.log("Datasets prepared:", datasets);
    
    // Initialize map
    initMap();
    
    // Initial render - will show the default selection
    const defaultMode = document.getElementById("comparisonMode").value;
    console.log("Initial render with mode:", defaultMode);
    handleComparisonChange();
    
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById("comparisonCards").innerHTML = 
      `<p>Error loading data: ${error.message}. Please check console for details.</p>`;
  }
}

// Initialize the map
function initMap() {
  console.log("Initializing map...");
  try {
    // Create map if it doesn't exist
    if (!map) {
      // Check if map container exists
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error("Map container not found in the DOM");
        return;
      }
      
      console.log("Creating new map");
      map = L.map('map').setView([30.55, 31.5], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      console.log("Map created successfully");
    }
  } catch (error) {
    console.error("Error initializing map:", error);
  }
}

// Handle comparison dropdown change
function handleComparisonChange() {
  const mode = document.getElementById("comparisonMode").value;
  console.log("Comparison mode changed to:", mode);
  
  // Clear previous charts
  if (charts.indicatorChart) {
    console.log("Destroying previous indicator chart");
    charts.indicatorChart.destroy();
  }
  
  if (charts.trendChart) {
    console.log("Destroying previous trend chart");
    charts.trendChart.destroy();
  }
  
  // Clear map layers except base layer
  if (map) {
    console.log("Clearing map layers");
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer === false) {
        map.removeLayer(layer);
      }
    });
  }
  
  console.log("Rendering content for mode:", mode);
  switch (mode) {
    case "local":
      renderDistrictComparison();
      break;
    case "national":
      renderNationalComparison();
      break;
    case "global":
      renderGlobalComparison();
      break;
  }
}

// Render district comparison (local mode)
function renderDistrictComparison() {
  console.log("Rendering district comparison...");
  console.log("Datasets available:", datasets);
  
  if (!datasets.sharqia || !datasets.sharqia.districts) {
    console.error("Sharqia district data not available");
    document.getElementById("comparisonCards").innerHTML = "<p>District data is not available</p>";
    return;
  }
  
  // Render comparison cards
  console.log("Rendering district comparison cards");
  const cardsHtml = datasets.sharqia.districts.map((district, index) => {
    const diabetesValue = datasets.sharqia.indicators.diabetes.values[index];
    const egyptAvg = datasets.sharqia.indicators.diabetes.egyptAvg;
    const percentOfAvg = (diabetesValue / egyptAvg * 100).toFixed(1);
    const colorClass = diabetesValue > egyptAvg ? 'warning' : 'good';
    
    return `
      <div class="card ${colorClass}">
        <h3>${district}</h3>
        <p>Diabetes: ${diabetesValue}%</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${Math.min(diabetesValue * 5, 100)}%"></div>
        </div>
        <small>${percentOfAvg}% of Egypt average</small>
      </div>
    `;
  }).join('');
  
  document.getElementById("comparisonCards").innerHTML = cardsHtml;
  console.log("District comparison cards rendered");
  
  // Render district map
  console.log("Rendering district map");
  renderDistrictMap();
  
  // Render indicator chart
  console.log("Rendering indicator chart");
  renderIndicatorChart(datasets.sharqia.districts, 
    datasets.sharqia.indicators.diabetes.values, 'Diabetes Prevalence by District');
    
  // Render trend chart
  console.log("Rendering trend chart");
  renderTrendChart('diabetes', 'Diabetes Trends');
}

// Render indicator chart
function renderIndicatorChart(labels, values, title) {
  console.log("Rendering indicator chart with data:", {labels, values, title});
  
  const chartCanvas = document.getElementById('indicatorChart');
  if (!chartCanvas) {
    console.error("Chart canvas not found");
    return;
  }
  
  const ctx = chartCanvas.getContext('2d');
  
  charts.indicatorChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  console.log("Indicator chart rendered");
}

// Render trend chart
function renderTrendChart(indicator, title) {
  console.log("Rendering trend chart for indicator:", indicator);
  
  const chartCanvas = document.getElementById('trendChart');
  if (!chartCanvas) {
    console.error("Trend chart canvas not found");
    return;
  }
  
  const ctx = chartCanvas.getContext('2d');
  
  charts.trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: datasets.sharqia.years,
      datasets: [
        {
          label: 'Sharqia (Avg)',
          data: datasets.sharqia.indicators[indicator].values,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        },
        {
          label: 'Egypt Average',
          data: datasets.egypt.indicators[indicator].values,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
  
  console.log("Trend chart rendered");
}

// Render district map with health metrics visualization
function renderDistrictMap() {
  console.log("Rendering district map with health metrics");
  
  if (!datasets.districtsGeo) {
    console.error("District GeoJSON data not available");
    return;
  }
  
  // Clear existing layers and reset view
  map.setView([30.55, 31.5], 9);
  
  // Choose which health indicator to display
  const selectedIndicator = 'diabetes'; // Can be changed to any indicator
  const indicatorData = datasets.sharqia.indicators[selectedIndicator];
  
  // Create a color function based on the indicator values
  function getColor(value) {
    // Red gradient from light to dark based on severity
    return value > 18 ? '#800026' :
           value > 16 ? '#BD0026' :
           value > 14 ? '#E31A1C' :
           value > 12 ? '#FC4E2A' :
           value > 10 ? '#FD8D3C' :
           value > 8 ? '#FEB24C' :
                       '#FFEDA0';
  }
  
  // Add GeoJSON layer with district data
  console.log("Adding GeoJSON layer to map");
  const geoLayer = L.geoJSON(datasets.districtsGeo, {
    style: function(feature) {
      // Find the district index
      const districtIndex = datasets.sharqia.districts.indexOf(feature.properties.name);
      
      // Get value for this district
      const value = datasets.sharqia.indicators[selectedIndicator].values[districtIndex];
      
      return {
        fillColor: getColor(value),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
      };
    },
    onEachFeature: function(feature, layer) {
      const districtIndex = datasets.sharqia.districts.indexOf(feature.properties.name);
      const value = datasets.sharqia.indicators[selectedIndicator].values[districtIndex];
      
      // Create popup with comprehensive health data
      layer.bindPopup(`
        <div class="district-popup">
          <h3>${feature.properties.name}</h3>
          <p><strong>Population:</strong> ${feature.properties.population.toLocaleString()}</p>
          <p><strong>Diabetes Rate:</strong> ${datasets.sharqia.indicators.diabetes.values[districtIndex]}%</p>
          <p><strong>Infant Mortality:</strong> ${datasets.sharqia.indicators.infantMortality.values[districtIndex]} per 1,000</p>
          <p><strong>Life Expectancy:</strong> ${datasets.sharqia.indicators.lifeExpectancy.values[districtIndex]} years</p>
        </div>
      `);
      
      // Highlight district on hover
      layer.on({
        mouseover: function(e) {
          const layer = e.target;
          layer.setStyle({
            weight: 3,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.9
          });
          layer.bringToFront();
        },
        mouseout: function(e) {
          geoLayer.resetStyle(e.target);
        },
        click: function(e) {
          map.fitBounds(e.target.getBounds());
        }
      });
    }
  }).addTo(map);
  
  // Add a legend to the map
  console.log("Adding map legend");
  const legend = L.control({position: 'bottomright'});
  
  legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'info legend');
    const grades = [8, 10, 12, 14, 16, 18];
    const labels = [];
    
    // Add title to legend
    div.innerHTML = `<h4>${selectedIndicator.charAt(0).toUpperCase() + selectedIndicator.slice(1)} Rate (%)</h4>`;
    
    // Loop through density intervals and generate colored labels
    for (let i = 0; i < grades.length; i++) {
      div.innerHTML +=
        '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    
    return div;
  };
  
  legend.addTo(map);
  
  // Fit map to district boundaries
  map.fitBounds(geoLayer.getBounds());
  console.log("District map rendered");
}

// National comparison and global comparison functions would be similar...

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing dashboard");
  
  // Setup dropdown change listener
  const dropdown = document.getElementById("comparisonMode");
  if (dropdown) {
    console.log("Adding event listener to comparison dropdown");
    dropdown.addEventListener('change', handleComparisonChange);
  } else {
    console.error("Comparison dropdown not found");
  }
  
  // Check that all required containers exist
  const requiredElements = ['comparisonCards', 'indicatorChart', 'trendChart', 'map', 'dataTable'];
  requiredElements.forEach(id => {
    if (!document.getElementById(id)) {
      console.error(`Required element #${id} not found in the DOM`);
    }
  });
  
  // Load data and initialize dashboard
  console.log("Loading data...");
  loadData();
});
// Render national comparison (Sharqia vs Egypt)
function renderNationalComparison() {
    console.log("Rendering national comparison...");
    
    if (!datasets.egypt || !datasets.egypt.governorates) {
      console.error("Egypt data not available");
      document.getElementById("comparisonCards").innerHTML = "<p>National comparison data is not available</p>";
      return;
    }
    
    // Render comparison cards
    const cardsHtml = `
      <div class="card">
        <h3>Infant Mortality</h3>
        <p>Sharqia: ${datasets.sharqia.indicators.infantMortality.values[5]} per 1,000</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${datasets.sharqia.indicators.infantMortality.values[5] * 3}%"></div>
        </div>
        <small>Egypt average: ${datasets.egypt.indicators.infantMortality.values[5]} per 1,000</small>
      </div>
      <div class="card">
        <h3>Maternal Mortality</h3>
        <p>Sharqia: ${datasets.sharqia.indicators.maternalMortality.values[5]} per 100,000</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${datasets.sharqia.indicators.maternalMortality.values[5] / 2}%"></div>
        </div>
        <small>Egypt average: ${datasets.egypt.indicators.maternalMortality.values[5]} per 100,000</small>
      </div>
      <div class="card">
        <h3>Diabetes Prevalence</h3>
        <p>Sharqia: ${datasets.sharqia.indicators.diabetes.values[5]}%</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${datasets.sharqia.indicators.diabetes.values[5] * 3}%"></div>
        </div>
        <small>Egypt average: ${datasets.egypt.indicators.diabetes.values[5]}%</small>
      </div>
    `;
    
    document.getElementById("comparisonCards").innerHTML = cardsHtml;
    console.log("National comparison cards rendered");
    
    // Render national map
    renderNationalMap();
    
    // Render indicator comparison chart between governorates
    renderGovernorateChart();
    
    // Render trend chart comparing Sharqia to Egypt averages
    renderNationalTrendChart();
  }
  
  // Render global comparison (Egypt vs World)
  function renderGlobalComparison() {
    console.log("Rendering global comparison...");
    
    if (!datasets.world || !datasets.egypt) {
      console.error("Global or Egypt data not available");
      document.getElementById("comparisonCards").innerHTML = "<p>Global comparison data is not available</p>";
      return;
    }
    
    // Render comparison cards
    const cardsHtml = `
      <div class="card">
        <h3>Life Expectancy</h3>
        <p>Egypt: ${datasets.egypt.indicators.lifeExpectancy.values[5]} years</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${(datasets.egypt.indicators.lifeExpectancy.values[5] - 50) * 2}%"></div>
        </div>
        <small>World average: ${datasets.world.indicators.lifeExpectancy.values[5]} years</small>
      </div>
      <div class="card">
        <h3>Infant Mortality</h3>
        <p>Egypt: ${datasets.egypt.indicators.infantMortality.values[5]} per 1,000</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${datasets.egypt.indicators.infantMortality.values[5] * 3}%"></div>
        </div>
        <small>World average: ${datasets.world.indicators.infantMortality.values[5]} per 1,000</small>
      </div>
      <div class="card">
        <h3>Diabetes Prevalence</h3>
        <p>Egypt: ${datasets.egypt.indicators.diabetes.values[5]}%</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${datasets.egypt.indicators.diabetes.values[5] * 3}%"></div>
        </div>
        <small>World average: ${datasets.world.indicators.diabetes.values[5]}%</small>
      </div>
    `;
    
    document.getElementById("comparisonCards").innerHTML = cardsHtml;
    console.log("Global comparison cards rendered");
    
    // Render global map
    renderGlobalMap();
    
    // Render WHO regions chart
    renderWorldRegionsChart();
    
    // Render trend chart comparing Egypt to global averages
    renderGlobalTrendChart();
  }
  
  // Render governorate chart
  function renderGovernorateChart() {
    console.log("Rendering governorate chart");
    
    const chartCanvas = document.getElementById('indicatorChart');
    if (!chartCanvas) {
      console.error("Chart canvas not found");
      return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    
    // Extract governorate names and a health indicator
    const governorateNames = datasets.egypt.governorates.map(g => g.name);
    
    // Create simulated data for governorates
    const diabetesValues = [17.2, 16.8, 15.9, 16.5]; // Sample values for governorates
    
    charts.indicatorChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: governorateNames,
        datasets: [{
          label: 'Diabetes Prevalence by Governorate (%)',
          data: diabetesValues,
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
    
    console.log("Governorate chart rendered");
  }
  
  // Render national trend chart
  function renderNationalTrendChart() {
    console.log("Rendering national trend chart");
    
    const chartCanvas = document.getElementById('trendChart');
    if (!chartCanvas) {
      console.error("Trend chart canvas not found");
      return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    
    charts.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datasets.egypt.indicators.lifeExpectancy.years,
        datasets: [
          {
            label: 'Sharqia Life Expectancy',
            // Average the values across districts for each year
            data: [71.5, 71.8, 72.0, 72.2, 72.4, 72.6], // Example trend data
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1
          },
          {
            label: 'Egypt Average',
            data: datasets.egypt.indicators.lifeExpectancy.values,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
    
    console.log("National trend chart rendered");
  }
  
  // Render World Regions Chart
  function renderWorldRegionsChart() {
    console.log("Rendering world regions chart");
    
    const chartCanvas = document.getElementById('indicatorChart');
    if (!chartCanvas) {
      console.error("Chart canvas not found");
      return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    
    const regionNames = datasets.world.regions.map(r => r.name);
    const lifeExpValues = datasets.world.regions.map(r => r.avgLifeExpectancy);
    
    charts.indicatorChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: regionNames,
        datasets: [{
          label: 'Life Expectancy by WHO Region',
          data: lifeExpValues,
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            min: 60,
            max: 85
          }
        }
      }
    });
    
    console.log("World regions chart rendered");
  }
  
  // Render global trend chart
  function renderGlobalTrendChart() {
    console.log("Rendering global trend chart");
    
    const chartCanvas = document.getElementById('trendChart');
    if (!chartCanvas) {
      console.error("Trend chart canvas not found");
      return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    
    charts.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datasets.world.indicators.lifeExpectancy.years,
        datasets: [
          {
            label: 'Egypt',
            data: datasets.egypt.indicators.lifeExpectancy.values,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.1
          },
          {
            label: 'World Average',
            data: datasets.world.indicators.lifeExpectancy.values,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
    
    console.log("Global trend chart rendered");
  }
  
  // Render national map
  function renderNationalMap() {
    console.log("Rendering national map");
    
    // Set view to show all of Egypt
    map.setView([27, 30], 6);
    
    // Add markers for governorates with color based on health metrics
    datasets.egypt.governorates.forEach(governorate => {
      // Position markers based on approximate locations
      let lat, lng;
      switch(governorate.name) {
        case "Sharqia": lat = 30.6; lng = 31.5; break;
        case "Cairo": lat = 30.0; lng = 31.2; break;
        case "Alexandria": lat = 31.2; lng = 29.9; break;
        case "Giza": lat = 30.0; lng = 31.1; break;
        default: lat = 30.0; lng = 31.0;
      }
      
      // Create marker with size based on population
      const radius = Math.sqrt(governorate.pop / 1000000) * 10;
      
      // Add circle marker
      L.circleMarker([lat, lng], {
        radius: radius,
        fillColor: governorate.name === "Sharqia" ? "#ff4500" : "#3388ff",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      })
      .bindPopup(`
        <div class="governorate-popup">
          <h3>${governorate.name}</h3>
          <p><strong>Population:</strong> ${governorate.pop.toLocaleString()}</p>
        </div>
      `)
      .addTo(map);
    });
    
    // Add a simple legend
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = `
        <h4>Governorates</h4>
        <i style="background:#ff4500"></i> Sharqia<br>
        <i style="background:#3388ff"></i> Other Governorates
      `;
      return div;
    };
    legend.addTo(map);
    
    console.log("National map rendered");
  }
  
  // Render global map
  function renderGlobalMap() {
    console.log("Rendering global map");
    
    // Set view to show the world
    map.setView([20, 0], 2);
    
    // Add a marker for Egypt
    L.marker([26.8, 30.8])
      .bindPopup(`
        <div class="country-popup">
          <h3>Egypt</h3>
          <p><strong>Life Expectancy:</strong> ${datasets.egypt.indicators.lifeExpectancy.values[5]} years</p>
          <p><strong>Diabetes Rate:</strong> ${datasets.egypt.indicators.diabetes.values[5]}%</p>
          <p><strong>Infant Mortality:</strong> ${datasets.egypt.indicators.infantMortality.values[5]} per 1,000</p>
        </div>
      `)
      .addTo(map);
    
    // Add region markers based on WHO regions
    const regions = [
      {name: "Africa", lat: 0, lng: 20, le: 64.5},
      {name: "Americas", lat: 15, lng: -90, le: 77.2},
      {name: "Eastern Mediterranean", lat: 30, lng: 50, le: 70.1},
      {name: "Europe", lat: 50, lng: 10, le: 78.3},
      {name: "South-East Asia", lat: 20, lng: 90, le: 71.4},
      {name: "Western Pacific", lat: 30, lng: 120, le: 77.7}
    ];
    
    // Add circle for each WHO region
    regions.forEach(region => {
      // Color based on life expectancy
      const color = region.le > 75 ? "#1a9850" : 
                    region.le > 70 ? "#91cf60" :
                    region.le > 65 ? "#d9ef8b" : "#fee08b";
                    
      L.circle([region.lat, region.lng], {
        radius: 1500000,
        fillColor: color,
        color: "#000",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.5
      })
      .bindPopup(`
        <div class="region-popup">
          <h3>${region.name}</h3>
          <p><strong>Life Expectancy:</strong> ${region.le} years</p>
        </div>
      `)
      .addTo(map);
    });
    
    // Add a legend
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = `
        <h4>Life Expectancy</h4>
        <i style="background:#1a9850"></i> >75 years<br>
        <i style="background:#91cf60"></i> 70-75 years<br>
        <i style="background:#d9ef8b"></i> 65-70 years<br>
        <i style="background:#fee08b"></i> <65 years
      `;
      return div;
    };
    legend.addTo(map);
    
    console.log("Global map rendered");
  }
  // Fix the data file paths for GitHub Pages compatibility

// let datasets = {};
// let map;
// let charts = {};

// Load all necessary data files with GitHub Pages path compatibility
async function loadData() {
  try {
    console.log("Starting data loading...");
    
    // Get the repository base path for GitHub Pages compatibility
    const basePath = window.location.hostname.includes('github.io') ? 
      `/${window.location.pathname.split('/')[1]}` : '';
    
    console.log("Using base path:", basePath);
    
    // Use absolute paths from repo root with proper error handling
    try {
      const sharqiaResponse = await fetch(`${basePath}/data/sharqia_data.json`);
      const egyptResponse = await fetch(`${basePath}/data/egypt_data.json`);
      const worldResponse = await fetch(`${basePath}/data/world_data.json`);
      const districtsGeoResponse = await fetch(`${basePath}/data/districts.geo.json`);
      
      if (!sharqiaResponse.ok) throw new Error(`Failed to load sharqia_data.json: ${sharqiaResponse.status}`);
      if (!egyptResponse.ok) throw new Error(`Failed to load egypt_data.json: ${egyptResponse.status}`);
      if (!worldResponse.ok) throw new Error(`Failed to load world_data.json: ${worldResponse.status}`);
      if (!districtsGeoResponse.ok) throw new Error(`Failed to load districts.geo.json: ${districtsGeoResponse.status}`);
      
      const sharqiaData = await sharqiaResponse.json();
      const egyptData = await egyptResponse.json();
      const worldData = await worldResponse.json();
      const districtsGeo = await districtsGeoResponse.json();
      
      // Store data in the datasets object
      datasets = {
        sharqia: sharqiaData,
        egypt: egyptData,
        world: worldData,
        districtsGeo: districtsGeo
      };
      
      console.log("Data loaded successfully:", datasets);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      // Try with relative paths as fallback
      console.log("Trying with relative paths...");
      
      const sharqiaData = await fetch('./data/sharqia_data.json').then(res => res.json());
      const egyptData = await fetch('./data/egypt_data.json').then(res => res.json());
      const worldData = await fetch('./data/world_data.json').then(res => res.json());
      const districtsGeo = await fetch('./data/districts.geo.json').then(res => res.json());
      
      datasets = {
        sharqia: sharqiaData,
        egypt: egyptData,
        world: worldData,
        districtsGeo: districtsGeo
      };
      
      console.log("Data loaded successfully with relative paths");
    }
    
    // Initialize map
    initMap();
    
    // Initial render
    handleComparisonChange();
    
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById("comparisonCards").innerHTML = 
      `<p>Error loading data: ${error.message}. Please check console for details.</p>`;
  }
}

// Initialize the map with better error handling and alternative providers
function initMap() {
  console.log("Initializing map...");
  try {
    // Create map if it doesn't exist
    if (!map) {
      // Check if map container exists
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error("Map container not found in the DOM");
        return;
      }
      
      console.log("Creating new map");
      map = L.map('map').setView([30.55, 31.5], 9);
      
      // Try to use primary map tile provider
      try {
        // Ensure HTTPS for tile layers
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);
        console.log("Primary map tiles loaded");
      } catch (tileError) {
        // Fallback to alternative map provider if primary fails
        console.warn("Primary map tiles failed, using alternative:", tileError);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);
        console.log("Alternative map tiles loaded");
      }
      
      console.log("Map created successfully");
    } else {
      console.log("Map already exists, reusing");
    }
  } catch (error) {
    console.error("Error initializing map:", error);
    document.getElementById("map").innerHTML = 
      `<div style="padding: 20px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">
        <strong>Map Error:</strong> ${error.message}<br>Please check console for details.
      </div>`;
  }
}

// Handler for map load/error events
function setupMapEventListeners() {
  if (!map) return;
  
  map.on('load', function() {
    console.log("Map loaded successfully");
  });
  
  map.on('error', function(e) {
    console.error("Map error:", e.error);
  });
}

// Handle comparison dropdown change
function handleComparisonChange() {
  const mode = document.getElementById("comparisonMode").value;
  console.log("Comparison mode changed to:", mode);
  
  // Clear previous charts
  if (charts.indicatorChart) {
    console.log("Destroying previous indicator chart");
    charts.indicatorChart.destroy();
  }
  
  if (charts.trendChart) {
    console.log("Destroying previous trend chart");
    charts.trendChart.destroy();
  }
  
  // Clear map layers except base layer
  if (map) {
    console.log("Clearing map layers");
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer === false) {
        map.removeLayer(layer);
      }
    });
  }
  
  console.log("Rendering content for mode:", mode);
  switch (mode) {
    case "local":
      renderDistrictComparison();
      break;
    case "national":
      renderNationalComparison();
      break;
    case "global":
      renderGlobalComparison();
      break;
  }
}

// Initialize the dashboard when the DOM is loaded with extensive logging
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing dashboard");
  console.log("Current URL:", window.location.href);
  console.log("Pathname:", window.location.pathname);
  console.log("Hostname:", window.location.hostname);
  
  // Check for Leaflet and Chart.js
  if (typeof L === 'undefined') {
    console.error("Leaflet is not loaded! Map functionality will fail.");
  } else {
    console.log("Leaflet version:", L.version);
  }
  
  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded! Charts will fail.");
  } else {
    console.log("Chart.js version:", Chart.version);
  }
  
  // Check if all required elements exist in the DOM
  ['comparisonMode', 'comparisonCards', 'indicatorChart', 'trendChart', 'map'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`Found element #${id} - dimensions: ${element.offsetWidth}x${element.offsetHeight}`);
    } else {
      console.error(`Missing element: #${id}`);
    }
  });
  
  // Setup dropdown change listener
  const dropdown = document.getElementById("comparisonMode");
  if (dropdown) {
    dropdown.addEventListener('change', handleComparisonChange);
  }
  
  // Load data and initialize dashboard
  loadData();
});

// Ensure rest of the code functions are present here