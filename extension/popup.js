/**
 * Focus-Flow Popup Script
 * Handles UI state, metrics rendering, and user interactions
 */

// State
let currentState = "loading";
let lastMetrics = null;
let lastServices = [];
let userConsent = null;
let metricsBuffer = [];
let connectionRetries = 0;

/**
 * Initialize popup on open
 */
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  setupListeners();
  checkConnection();

  // Refresh metrics every 2 seconds
  setInterval(() => {
    if (currentState === "dashboard") {
      loadState();
    }
  }, 2000);
});

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

  // Update sparklines
  renderSparkline(
    "cpu-sparkline",
    metricsBuffer.map((m) => m.cpu),
    "#667eea"
  );
  renderSparkline(
    "memory-sparkline",
    metricsBuffer.map((m) => m.memory),
    "#764ba2"
  );

  // Update averages
  const cpuAvg = Math.round(
    metricsBuffer.reduce((sum, m) => sum + m.cpu, 0) / metricsBuffer.length
  );
  const memAvg = Math.round(
    metricsBuffer.reduce((sum, m) => sum + m.memory, 0) / metricsBuffer.length
  );

  document.getElementById("cpu-avg").textContent = `Avg: ${cpuAvg}%`;
  document.getElementById("memory-avg").textContent = `Avg: ${memAvg}%`;

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
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);
    return;
  }

  // Find min/max
  const min = Math.min(...data.filter((d) => d !== null));
  const max = Math.max(...data.filter((d) => d !== null));
  const range = max - min || 1;

  // Draw background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `${color}20`);
  gradient.addColorStop(1, `${color}05`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  data.forEach((value, index) => {
    if (value === null) return;
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw data points
  ctx.fillStyle = color;
  data.forEach((value, index) => {
    if (value === null) return;
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * height;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
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
    statusText.textContent = "Disconnected";
    return;
  }

  const hasAlert =
    metrics.cpu > 85 ||
    metrics.memory > 90 ||
    (metrics.temp && metrics.temp > 75);

  if (hasAlert) {
    statusDot.className = "status-dot alert";
    statusText.textContent = "⚠️ Alert";
  } else {
    statusDot.className = "status-dot";
    statusText.textContent = "✓ Connected";
  }
}

/**
 * Show specific UI state
 */
function showState(state) {
  currentState = state;

  const states = ["loading", "onboarding", "dashboard", "error"];
  states.forEach((s) => {
    const element =
      document.getElementById(s + "-state") ||
      document.querySelector(`.${s}-state`);
    if (element) {
      element.classList.remove("active");
    }
  });

  // Special handling for default states in HTML
  const loadingElem = document.querySelector(".loading-state");
  const onboardingElem = document.getElementById("onboarding");
  const dashboardElem = document.getElementById("dashboard");
  const errorElem = document.getElementById("error-state");

  loadingElem?.classList.remove("active");
  onboardingElem?.classList.remove("active");
  dashboardElem?.classList.remove("active");
  errorElem?.classList.remove("active");

  if (state === "loading") {
    loadingElem?.classList.add("active");
  } else if (state === "onboarding") {
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
 * Setup event listeners
 */
function setupListeners() {
  // Listen for metrics updates from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "metrics_update") {
      if (currentState === "dashboard") {
        renderMetrics();
      }
    }
  });
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
  showState("loading");
  checkConnection();

  setTimeout(() => {
    checkConnection();
    loadState();
  }, 1000);
}

/**
 * Open privacy policy
 */
function openPrivacyPolicy() {
  chrome.tabs.create({
    url: "https://github.com/control-zdevFocus-Flow/focus-flow/blob/main/PRIVACY_POLICY.md",
  });
}
