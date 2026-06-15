/**
 * Focus-Flow Service Worker
 * Manages WebSocket connection, metrics buffering, consent, and batch uploads
 */

// Configuration
const CONFIG = {
  AGENT_URL: "ws://localhost:5000/ws",
  HEALTH_CHECK_URL: "http://localhost:5000/health",
  AGGREGATE_URL: "http://localhost:5000/aggregate-metrics",
  CLOUD_ENDPOINT: "https://api.focus-flow.dev/batch", // TODO: Update when deployed
  RECONNECT_DELAYS: [5000, 30000, 300000], // 5s, 30s, 5m
  BATCH_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours
  METRICS_BUFFER_SIZE: 1800, // 1 hour at 2-sec intervals
};

// State
let ws = null;
let reconnectAttempt = 0;
let isConnected = false;
let metricsBuffer = [];
let aggregateBuffer = [];
let lastBatchTime = 0;
let hasConsent = null; // null = unknown, true = yes, false = no

/**
 * Initialize the service worker
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    // First time install - show onboarding
    chrome.storage.local.set({
      focusflow_first_run: true,
      focusflow_consent: null,
    });
    chrome.action.setBadgeText({ text: "?" });
    chrome.action.setBadgeBackgroundColor({ color: "#FFA500" }); // Orange
  }

  // Initialize consent state
  const stored = await chrome.storage.local.get("focusflow_consent");
  hasConsent = stored.focusflow_consent;

  // Start monitoring
  connectWebSocket();
  scheduleHealthChecks();
  scheduleBatchUpload();
});

/**
 * Connect to WebSocket agent
 */
function connectWebSocket() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  console.log("[Focus-Flow] Connecting to agent...");

  ws = new WebSocket(CONFIG.AGENT_URL);

  ws.onopen = () => {
    console.log("[Focus-Flow] ✓ Connected to agent");
    isConnected = true;
    reconnectAttempt = 0;
    updateBadgeState("connected");
  };

  ws.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      await handleMetricsUpdate(data);
    } catch (err) {
      console.error("[Focus-Flow] Error parsing message:", err);
    }
  };

  ws.onerror = (err) => {
    console.error("[Focus-Flow] WebSocket error:", err);
    updateBadgeState("error");
  };

  ws.onclose = () => {
    console.log("[Focus-Flow] Disconnected from agent");
    isConnected = false;
    updateBadgeState("disconnected");
    scheduleReconnect();
  };
}

/**
 * Handle reconnection with exponential backoff
 */
function scheduleReconnect() {
  if (reconnectAttempt >= CONFIG.RECONNECT_DELAYS.length) {
    console.warn("[Focus-Flow] Max reconnection attempts reached");
    return;
  }

  const delay = CONFIG.RECONNECT_DELAYS[reconnectAttempt];
  console.log(`[Focus-Flow] Reconnecting in ${delay / 1000}s...`);

  setTimeout(() => {
    reconnectAttempt++;
    connectWebSocket();
  }, delay);
}

/**
 * Process incoming metrics
 */
async function handleMetricsUpdate(data) {
  if (!data.metrics) return;

  const metrics = data.metrics;
  const timestamp = Date.now();

  // Add to metrics buffer (for UI)
  metricsBuffer.push({
    timestamp,
    cpu: metrics.cpu_percent,
    memory: metrics.memory_percent,
    temp: metrics.cpu_temp,
    disk: metrics.disk_percent,
  });

  // Keep buffer at max size
  if (metricsBuffer.length > CONFIG.METRICS_BUFFER_SIZE) {
    metricsBuffer.shift();
  }

  // Add to aggregate buffer (for anonymized data)
  if (hasConsent) {
    aggregateBuffer.push({
      timestamp,
      cpu: metrics.cpu_percent,
      memory: metrics.memory_percent,
      temp: metrics.cpu_temp,
      services: data.services.map((s) => s.name),
      uptime: Math.floor((timestamp - lastBatchTime) / 1000),
    });

    // Keep aggregate buffer at max size (4 hours)
    if (aggregateBuffer.length > CONFIG.METRICS_BUFFER_SIZE * 8) {
      aggregateBuffer.shift();
    }
  }

  // Save to storage
  await chrome.storage.local.set({
    focusflow_metrics_buffer: metricsBuffer,
    focusflow_aggregate_buffer: hasConsent ? aggregateBuffer : [],
    focusflow_last_update: timestamp,
  });

  // Update badge and alert state
  updateBadgeState(data.alerts);

  // Notify popup (if open)
  chrome.runtime
    .sendMessage({
      type: "metrics_update",
      metrics: data.metrics,
      services: data.services,
      alerts: data.alerts,
    })
    .catch(() => {
      // Popup not open, ignore error
    });
}

/**
 * Update badge state based on alerts
 */
function updateBadgeState(state) {
  if (state === "connected") {
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#22C55E" }); // Green
  } else if (state === "disconnected") {
    chrome.action.setBadgeText({ text: "⚠" });
    chrome.action.setBadgeBackgroundColor({ color: "#EAB308" }); // Yellow
  } else if (state === "error") {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#EF4444" }); // Red
  } else if (typeof state === "object" && state.active) {
    // Alert state
    if (state.severity === "critical") {
      chrome.action.setBadgeText({ text: "●" });
      chrome.action.setBadgeBackgroundColor({ color: "#DC2626" }); // Dark Red
      // TODO: Implement badge pulsing
    } else if (state.severity === "warning") {
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#EA580C" }); // Orange
    }
  } else {
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#22C55E" }); // Green
  }
}

/**
 * Schedule health checks (every 30 seconds)
 */
function scheduleHealthChecks() {
  setInterval(async () => {
    try {
      const response = await fetch(CONFIG.HEALTH_CHECK_URL);
      if (!response.ok) {
        console.warn("[Focus-Flow] Health check failed");
        if (isConnected) {
          connectWebSocket();
        }
      }
    } catch (err) {
      console.debug("[Focus-Flow] Health check error:", err.message);
      if (isConnected) {
        connectWebSocket();
      }
    }
  }, 30000);
}

/**
 * Schedule batch upload (every 4 hours)
 */
function scheduleBatchUpload() {
  // Check immediately on startup
  handleBatchUpload();

  // Then check every hour
  setInterval(handleBatchUpload, 60 * 60 * 1000);
}

/**
 * Handle batch upload (if opted in and 4 hours passed)
 */
async function handleBatchUpload() {
  if (!hasConsent || aggregateBuffer.length === 0) {
    return;
  }

  const now = Date.now();
  if (now - lastBatchTime < CONFIG.BATCH_INTERVAL) {
    return;
  }

  console.log("[Focus-Flow] Preparing batch upload...");

  try {
    // Calculate aggregates
    const aggregate = {
      machine_id: await getMachineId(),
      batch_start: lastBatchTime,
      batch_end: now,
      cpu_avg: average(aggregateBuffer.map((m) => m.cpu)),
      memory_avg: average(aggregateBuffer.map((m) => m.memory)),
      temp_avg: average(
        aggregateBuffer.map((m) => m.temp).filter((t) => t !== null)
      ),
      uptime_total: aggregateBuffer.reduce((sum, m) => sum + m.uptime, 0),
      services: getUniqueServices(aggregateBuffer),
      device_type: getDeviceType(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      timestamp: new Date().toISOString(),
    };

    // Remove any PII
    delete aggregate.hostname;
    delete aggregate.username;

    // Send to cloud endpoint
    console.log("[Focus-Flow] Uploading aggregate data...");

    const response = await fetch(CONFIG.CLOUD_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aggregate),
    });

    if (response.ok) {
      console.log("[Focus-Flow] ✓ Batch uploaded successfully");
      lastBatchTime = now;
      aggregateBuffer = [];

      await chrome.storage.local.set({
        focusflow_last_sync: now,
        focusflow_aggregate_buffer: [],
      });
    } else {
      console.warn("[Focus-Flow] Batch upload failed:", response.status);
    }
  } catch (err) {
    console.error("[Focus-Flow] Batch upload error:", err);
    // Don't clear buffer on error - retry next time
  }
}

/**
 * Utility: Get or create anonymous machine ID
 */
async function getMachineId() {
  let stored = await chrome.storage.local.get("focusflow_machine_id");
  if (stored.focusflow_machine_id) {
    return stored.focusflow_machine_id;
  }

  // Generate UUID v4
  const machineId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );

  await chrome.storage.local.set({ focusflow_machine_id: machineId });
  return machineId;
}

/**
 * Utility: Calculate average
 */
function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Utility: Get unique services from buffer
 */
function getUniqueServices(buffer) {
  const services = new Set();
  buffer.forEach((m) => {
    m.services.forEach((s) => services.add(s));
  });
  return Array.from(services);
}

/**
 * Utility: Detect device type
 */
function getDeviceType() {
  const ua = navigator.userAgent;
  if (ua.includes("Mac")) return "MacBook";
  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("X11")) return "Linux PC";
  if (ua.includes("Linux")) return "Linux PC";
  return "Unknown";
}

/**
 * Handle popup requests
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "get_metrics") {
    chrome.storage.local.get(
      [
        "focusflow_metrics_buffer",
        "focusflow_alert_state",
        "focusflow_consent",
      ],
      (result) => {
        sendResponse({
          metricsBuffer: result.focusflow_metrics_buffer || [],
          alertState: result.focusflow_alert_state || null,
          consent: result.focusflow_consent,
        });
      }
    );
    return true;
  } else if (request.type === "set_consent") {
    hasConsent = request.value;
    chrome.storage.local.set({ focusflow_consent: request.value });
    sendResponse({ success: true });
    return true;
  }
});

// Start the party
console.log("[Focus-Flow] Service Worker loaded ✓");
