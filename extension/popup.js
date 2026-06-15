/**
 * Focus-Flow Popup Script (Cyan Theme)
 * Dark Slate + Cyan professional theme
 * CSP-compliant: All event listeners attached via JavaScript
 */

// State
let currentState = "onboarding";
let lastMetrics = null;
let lastServices = [];
let userConsent = null;
let metricsBuffer = [];
let connectionRetries = 0;

/**
 * Initialize popup on open
 */
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadState();
  checkConnection();

  // Refresh metrics every 2 seconds
  setInterval(() => {
    if (currentState === "dashboard") {
      loadState();
    }
  }, 2000);
});

/**
 * Setup all event listeners (CSP-compliant)
 */
function setupEventListeners() {
  // Onboarding buttons
  const consentYesBtn = document.getElementById("consent-yes-btn");
  const consentNoBtn = document.getElementById("consent-no-btn");
  const retryBtn = document.getElementById("retry-btn");
  const consentToggle = document.getElementById("consent-toggle");

  if (consentYesBtn) {
    consentYesBtn.addEventListener("click", () => setConsent(true));
  }

  if (consentNoBtn) {
    consentNoBtn.addEventListener("click", () => setConsent(false));
  }

  if (retryBtn) {
    retryBtn.addEventListener("click", retryConnection);
  }

  if (consentToggle) {
    consentToggle.addEventListener("click", toggleConsent);
  }
}

/**
 * Load current state from background service worker
 */
function loadState() {
  chrome.runtime.sendMessage({ type: "get_metrics" }, (response) => {
    if (chrome.runtime.lastError) {
      showState("error");
      return;
    }

    if (!response) {
      showState("error");
      return;
    }

    // Check if first run or no consent set
    if (response.consent === null || response.consent === undefined) {
      showState("onboarding");
      return;
    }

    // Store consent preference
    userConsent = response.consent;
    updateConsentToggle(userConsent);

    // Load metrics
    metricsBuffer = response.metricsBuffer || [];

    if (metricsBuffer.length > 0) {
      showState("dashboard");
      renderMetrics();
    } else {
      showState("dashboard");
    }
  });
}

/**
 * Render metrics on dashboard
 */
function renderMetrics() {
  if (metricsBuffer.length === 0) return;

  const latest = metricsBuffer[metricsBuffer.length - 1];

  // Update metric cards
  setMetricValue("cpu-value", latest.cpu, 85);
  setMetricValue("memory-value", latest.memory, 90);
  setMetricValue("temp-value", latest.temp || "--", 75);

  // Update sparklines with cyan colors
  renderSparkline(
    "cpu-sparkline",
    metricsBuffer.map((m) => m.cpu),
    "#0f8b8d" // Teal
  );
  renderSparkline(
    "memory-sparkline",
    metricsBuffer.map((m) => m.memory),
    "#00d4ff" // Bright Cyan
  );

  // Update averages
  const cpuAvg = Math.round(
    metricsBuffer.reduce((sum, m) => sum + m.cpu, 0) / metricsBuffer.length
  );
  const memAvg = Math.round(
    metricsBuffer.reduce((sum, m) => sum + m.memory, 0) / metricsBuffer.length
  );

  document.getElementById("cpu-avg").textContent = `${cpuAvg}%`;
  document.getElementById("memory-avg").textContent = `${memAvg}%`;

  // Update status
  updateStatus(latest);
}

/**
 * Set metric value with color coding
 */
function setMetricValue(elementId, value, threshold) {
  const element = document.getElementById(elementId);
  if (value === null || value === undefined || value === "--") {
    element.textContent = "--";
    element.className = "metric-value";
    return;
  }

  const numValue = parseFloat(value);
  element.textContent = Math.round(numValue);

  if (numValue > threshold) {
    element.className = "metric-value critical";
  } else if (numValue > threshold * 0.8) {
    element.className = "metric-value warning";
  } else {
    element.className = "metric-value";
  }
}

/**
 * Render sparkline chart
 */
function renderSparkline(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  // Set canvas resolution
  canvas.width = width;
  canvas.height = height;

  if (data.length === 0) {
    ctx.fillStyle = "#0f1a2e";
    ctx.fillRect(0, 0, width, height);
    return;
  }

  // Find min/max
  const validData = data.filter((d) => d !== null && !isNaN(d));
  if (validData.length === 0) return;

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1;

  // Draw background gradient (dark to darker)
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `${color}25`);
  gradient.addColorStop(1, `${color}05`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  let hasMovedTo = false;

  data.forEach((value, index) => {
    if (value === null || isNaN(value)) return;
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * height;

    if (!hasMovedTo) {
      ctx.moveTo(x, y);
      hasMovedTo = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw data points
  ctx.fillStyle = color;
  data.forEach((value, index) => {
    if (value === null || isNaN(value)) return;
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * height;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Update connection status
 */
function updateStatus(metrics) {
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");

  if (!metrics) {
    statusDot.className = "status-dot";
    statusText.textContent = "Offline";
    return;
  }

  const hasAlert =
    metrics.cpu > 85 ||
    metrics.memory > 90 ||
    (metrics.temp && metrics.temp > 75);

  if (hasAlert) {
    statusDot.className = "status-dot alert";
    statusText.textContent = "Alert";
  } else {
    statusDot.className = "status-dot";
    statusText.textContent = "Connected";
  }
}

/**
 * Render services list
 */
function renderServices(services) {
  const servicesList = document.getElementById("services-list");
  if (!servicesList) return;

  lastServices = services;

  if (!services || services.length === 0) {
    servicesList.innerHTML = `
      <div class="service-item">
        <div class="service-indicator"></div>
        <div class="service-name">No active services</div>
      </div>
    `;
    return;
  }

  servicesList.innerHTML = services
    .slice(0, 6)
    .map(
      (service) => `
    <div class="service-item">
      <div class="service-indicator"></div>
      <div class="service-name">${service.name}</div>
      ${
        service.port ? `<div class="service-detail">#${service.port}</div>` : ""
      }
    </div>
  `
    )
    .join("");
}

/**
 * Show specific UI state
 */
function showState(state) {
  currentState = state;

  const onboardingElem = document.getElementById("onboarding");
  const dashboardElem = document.getElementById("dashboard");
  const errorElem = document.getElementById("error-state");

  // Hide all states
  onboardingElem?.classList.remove("active");
  dashboardElem?.classList.remove("active");
  errorElem?.classList.remove("active");

  // Show requested state
  if (state === "onboarding") {
    onboardingElem?.classList.add("active");
  } else if (state === "dashboard") {
    dashboardElem?.classList.add("active");
  } else if (state === "error") {
    errorElem?.classList.add("active");
  }
}

/**
 * Set user consent preference
 */
function setConsent(value) {
  chrome.runtime.sendMessage({ type: "set_consent", value }, (response) => {
    if (response?.success) {
      userConsent = value;
      updateConsentToggle(value);
      loadState();
    }
  });
}

/**
 * Toggle consent
 */
function toggleConsent() {
  const newValue = !userConsent;
  setConsent(newValue);
}

/**
 * Update consent toggle UI
 */
function updateConsentToggle(value) {
  const toggle = document.getElementById("consent-toggle");
  if (toggle) {
    if (value) {
      toggle.classList.add("on");
    } else {
      toggle.classList.remove("on");
    }
  }
}

/**
 * Check agent connection
 */
function checkConnection() {
  fetch("http://localhost:5000/health")
    .then((response) => {
      if (response.ok) {
        connectionRetries = 0;
        if (currentState === "error") {
          loadState();
        }
      }
    })
    .catch(() => {
      if (currentState !== "onboarding") {
        showState("error");
      }
    });
}

/**
 * Retry connection
 */
function retryConnection() {
  connectionRetries = 0;
  checkConnection();

  setTimeout(() => {
    checkConnection();
    loadState();
  }, 1000);
}

/**
 * Listen for metrics updates from background service worker
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "metrics_update") {
    if (currentState === "dashboard") {
      // Update metrics
      if (request.metrics) {
        const timestamp = Date.now();
        metricsBuffer.push({
          timestamp,
          cpu: request.metrics.cpu_percent,
          memory: request.metrics.memory_percent,
          temp: request.metrics.cpu_temp,
          disk: request.metrics.disk_percent,
        });

        // Keep buffer at reasonable size
        if (metricsBuffer.length > 1800) {
          metricsBuffer.shift();
        }

        renderMetrics();
      }

      // Update services
      if (request.services) {
        renderServices(request.services);
      }
    }
  }
});

console.log("[Focus-Flow] Popup loaded ✓");
