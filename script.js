// Initialize map
let map = L.map('map').setView([19.1197, 72.8468], 15); // Updated to Andheri Sainagar

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);


// Global variables
let vehicleCount = 0;
let violationCount = 0;
let vehicles = [];
let signals = [
  { id: 'signal-1', position: [28.6139, 77.2090], signal: null },
  { id: 'signal-2', position: [28.6145, 77.2100], signal: null },
  { id: 'signal-3', position: [28.6120, 77.2080], signal: null }
];

// Add these variables at the top with other global variables
let automaticMode = true;
let signalIntervals = [];
let manuallyControlledSignals = new Set();

// Add this function after the global variables
function updateSignalState(signal, color) {
  // Update map marker
  const fillColor = {
    'red': '#ff0000',
    'yellow': '#ffff00',
    'green': '#00ff00'
  }[color];
  
  signal.signal.setStyle({
    fillColor: fillColor,
    color: color
  });

  // Update signal box status
  const statusSpan = document.querySelector(`.signal-status[data-signal="${signal.id}"]`);
  if (statusSpan) {
    statusSpan.style.color = fillColor;
    statusSpan.textContent = `● ${color.charAt(0).toUpperCase() + color.slice(1)}`;
  }
}

// Initialize signals on map
function initializeSignals() {
  signals.forEach(signal => {
    const signalMarker = L.circleMarker(signal.position, {
      radius: 10,
      color: 'green',
      fillColor: 'lime',
      fillOpacity: 0.9
    }).addTo(map);

    signal.signal = signalMarker;

    const signalBox = document.createElement('div');
    signalBox.className = 'signal-box';
    signalBox.innerHTML = `
      <strong>${signal.id}</strong><br>
      <span class="signal-status" data-signal="${signal.id}">● Green</span>
    `;
    document.getElementById('signal-boxes').appendChild(signalBox);
  });
}

// Update the initializeVehicles function
function initializeVehicles() {
  const numVehicles = 10;
  vehicles = []; // Clear existing vehicles
  vehicleCount = numVehicles;
  document.getElementById('vehicle-count').textContent = vehicleCount;
  
  for (let i = 0; i < numVehicles; i++) {
    const pos = getRandomLatLng(map);
    const marker = L.circleMarker(pos, {
      radius: 6,
      color: 'green',
      fillColor: 'lime',
      fillOpacity: 0.9
    }).addTo(map);
    vehicles.push({ id: i + 1, marker: marker });
  }
}

// Helper function to get random coordinates
function getRandomLatLng(map) {
  const bounds = map.getBounds();
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  const lat = southWest.lat + Math.random() * (northEast.lat - southWest.lat);
  const lng = southWest.lng + Math.random() * (northEast.lng - southWest.lng);
  return [lat, lng];
}

// Update vehicle positions and detect violations
function updateVehicles() {
  vehicles.forEach(vehicle => {
    const newPos = getRandomLatLng(map);
    vehicle.marker.setLatLng(newPos);

    // Simulate traffic density
    const rand = Math.random();
    if (rand < 0.2) {
      vehicle.marker.setStyle({ color: 'red', fillColor: 'red' });
      detectViolation(vehicle);
    } else if (rand < 0.5) {
      vehicle.marker.setStyle({ color: 'orange', fillColor: 'orange' });
    } else {
      vehicle.marker.setStyle({ color: 'green', fillColor: 'lime' });
    }
  });
}

// Add this function after updateVehicles
function calculateTrafficDensity() {
  let heavyCount = 0;
  let mediumCount = 0;
  
  vehicles.forEach(vehicle => {
    const style = vehicle.marker.options;
    if (style.color === 'red') heavyCount++;
    if (style.color === 'orange') mediumCount++;
  });

  return {
    heavy: heavyCount / vehicles.length,
    medium: mediumCount / vehicles.length,
    light: 1 - (heavyCount + mediumCount) / vehicles.length
  };
}

// Violation detection and logging
function detectViolation(vehicle) {
  const violations = ['Speeding', 'Red Light', 'Wrong Lane', 'Illegal Parking'];
  const violation = violations[Math.floor(Math.random() * violations.length)];
  const time = new Date().toLocaleTimeString();
  
  const violationLog = document.getElementById('violation-log');
  const violationEntry = document.createElement('li');
  violationEntry.innerHTML = `Vehicle ${vehicle.id}: ${violation} violation at ${time}`;
  violationLog.insertBefore(violationEntry, violationLog.firstChild);
  
  violationCount++;
  document.getElementById('violation-count').textContent = violationCount;

  // Log violation to server
  logViolation(vehicle.id, violation, 'signal-1'); // Assuming signal-1 for now
}

// Add this function after detectViolation
function logViolation(vehicleId, violationType, signalId) {
    const data = {
        vehicle_id: vehicleId,
        violation_type: violationType,
        signal_id: signalId
    };

    fetch('log_violation.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

// Traffic prediction
function updatePredictions() {
  const predictionBox = document.getElementById('prediction-box');
  const density = calculateTrafficDensity();
  const timeFrames = [
    { time: 'Current Traffic', factor: 1 },
    { time: 'Next 30 mins', factor: 1.2 },
    { time: 'Next 1 hour', factor: 1.5 }
  ];
  
  predictionBox.innerHTML = '';
  timeFrames.forEach(({time, factor}) => {
    let prediction;
    let color;
    
    const heavyProb = Math.min(density.heavy * factor, 1);
    const mediumProb = Math.min(density.medium * factor, 1);
    
    if (heavyProb > 0.3) {
      prediction = 'Heavy Traffic Expected';
      color = 'red';
    } else if (mediumProb > 0.3) {
      prediction = 'Moderate Traffic Expected';
      color = 'orange';
    } else {
      prediction = 'Low Traffic Expected';
      color = 'lime';
    }
    
    const predictionItem = document.createElement('div');
    predictionItem.className = 'prediction-item';
    predictionItem.innerHTML = `
      <strong>${time}:</strong> 
      <span style="color: ${color}">${prediction}</span>
    `;
    predictionBox.appendChild(predictionItem);

    // Log prediction to the backend
    const data = {
      prediction: prediction,
      time_frame: time,
      confidence_level: heavyProb > 0.3 ? heavyProb : mediumProb
    };

    fetch('log_violation.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(response => response.text())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
  });
}

// Update notifications
function updateNotifications() {
  const notifications = document.getElementById('real-time-notifications');
  const events = [
    'Heavy traffic detected on Main Street',
    'Accident reported at Junction A',
    'Road work ahead on Highway 1',
    'Weather alert: Poor visibility'
  ];
  
  if (Math.random() > 0.7) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <p>🚨 ${events[Math.floor(Math.random() * events.length)]}</p>
    `;
    notifications.insertBefore(notification, notifications.firstChild);
    
    // Remove old notifications
    if (notifications.children.length > 5) {
      notifications.removeChild(notifications.lastChild);
    }
  }
}

// Function to clear violation log
function clearViolations() {
  document.getElementById('violation-log').innerHTML = '';
  violationCount = 0;
  document.getElementById('violation-count').textContent = '0';
}

// Add this new function for automatic signal cycling
function startAutomaticSignal(signal) {
  if (manuallyControlledSignals.has(signal.id)) return;
  
  const colors = ['red', 'green', 'yellow'];
  let colorIndex = 0;
  
  const interval = setInterval(() => {
    if (manuallyControlledSignals.has(signal.id)) {
      clearInterval(interval);
      return;
    }
    
    updateSignalState(signal, colors[colorIndex]);
    colorIndex = (colorIndex + 1) % colors.length;
  }, 5000); // Change color every 5 seconds
  
  signalIntervals.push(interval);
}

// Add this function to start automatic mode for all signals
function initializeAutomaticMode() {
  signalIntervals.forEach(interval => clearInterval(interval));
  signalIntervals = [];
  manuallyControlledSignals.clear();
  
  signals.forEach(signal => {
    startAutomaticSignal(signal);
  });
  
  document.getElementById('signal-health').textContent = 'Automatic Mode';
}

// Replace the existing setSignalColor function with this updated version
function setSignalColor(color) {
  const signalSelector = document.getElementById('signal-selector');
  const selectedSignal = signalSelector.value;
  
  if (selectedSignal === 'all') {
    // Update all signals
    manuallyControlledSignals.clear();
    signals.forEach(signal => {
      manuallyControlledSignals.add(signal.id);
      updateSignalState(signal, color);

      // Log signal change to the backend
      const data = {
        changed_signal: signal.id,
        changed_to: color,
        changed_by: 'admin'
      };

      fetch('log_violation.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    });
    document.getElementById('signal-health').textContent = 
      `All signals manually set to ${color}`;
  } else {
    // Update specific signal
    const signal = signals.find(s => s.id === selectedSignal);
    if (signal) {
      manuallyControlledSignals.add(signal.id);
      updateSignalState(signal, color);

      // Log signal change to the backend
      const data = {
        changed_signal: signal.id,
        changed_to: color,
        changed_by: 'admin'
      };

      fetch('log_violation.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));

      document.getElementById('signal-health').textContent = 
        `${signal.id} manually set to ${color}`;
    }
  }
}

// Add this function to return a signal to automatic mode
function setAutomatic() {
  const signalSelector = document.getElementById('signal-selector');
  const selectedSignal = signalSelector.value;
  
  if (selectedSignal === 'all') {
    initializeAutomaticMode();
  } else {
    const signal = signals.find(s => s.id === selectedSignal);
    if (signal) {
      manuallyControlledSignals.delete(signal.id);
      startAutomaticSignal(signal);
      document.getElementById('signal-health').textContent = 
        `${signal.id} set to automatic`;
    }
  }
}

// Update the window.onload function
window.onload = function() {
  map.whenReady(() => {
    initializeSignals();
    initializeVehicles();
    initializeAutomaticMode(); // Start automatic mode
    
    // Start periodic updates
    setInterval(updateVehicles, 3000);
    setInterval(updatePredictions, 10000);
    setInterval(updateNotifications, 5000);
  });
};
