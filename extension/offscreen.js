/**
 * Focus-Flow Offscreen Document
 * Handles badge animations and background tasks for Manifest V3
 */

// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "pulse_badge") {
    pulseBadge();
  }
});

/**
 * Animate badge pulsing for critical alerts
 */
function pulseBadge() {
  let opacity = 1;
  let increasing = false;

  const interval = setInterval(() => {
    if (increasing) {
      opacity += 0.1;
      if (opacity >= 1) increasing = false;
    } else {
      opacity -= 0.1;
      if (opacity <= 0.3) increasing = true;
    }

    // Update badge opacity via background script
    chrome.runtime.sendMessage({
      type: "update_badge_opacity",
      opacity: opacity,
    });
  }, 100);

  // Stop after 5 seconds
  setTimeout(() => clearInterval(interval), 5000);
}

console.log("[Focus-Flow] Offscreen document ready");
