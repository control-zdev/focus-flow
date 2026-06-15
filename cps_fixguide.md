# Focus-Flow CSP (Content Security Policy) Fix

## ❌ The Problem

You were getting errors like:

```plaintext
Executing inline event handler violates the following Content Security Policy directive 'script-src 'self''
```

This happens because **Manifest V3 extensions have a strict Content Security Policy by default** that doesn't allow inline JavaScript event handlers (like `onclick="setConsent(true)"`).

---

## ✅ The Solution

All inline event handlers have been **removed** and replaced with **proper event listeners** in JavaScript.

### What Was Changed

#### ❌ BEFORE (popup.html - Not CSP Compliant)

```html
<button class="btn btn-primary" onclick="setConsent(true)">Help Improve</button>

<div class="toggle" id="consent-toggle" onclick="toggleConsent()">
  <div class="toggle-dot"></div>
</div>

<button class="retry-btn" onclick="retryConnection()">Retry Connection</button>
```

#### ✅ AFTER (popup.html - CSP Compliant)

```html
<button class="btn btn-primary" id="consent-yes-btn">Help Improve</button>

<div class="toggle" id="consent-toggle">
  <div class="toggle-dot"></div>
</div>

<button class="retry-btn" id="retry-btn">Retry Connection</button>
```

#### ✅ popup.js - Event Listeners Added

```javascript
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
```

---

## 📋 Updated Files

Three files have been fixed:

| File              | Changes                                                         |
| ----------------- | --------------------------------------------------------------- |
| **popup.html**    | Removed all `onclick` attributes, added `id` attributes instead |
| **popup.js**      | Added `setupEventListeners()` function, called on page load     |
| **manifest.json** | Added explicit `content_security_policy` configuration          |

---

## 🚀 How to Apply the Fix

### Option 1: Use Updated Files (Recommended)

Replace these three files in your `extension/` folder:

1. `popup.html` (updated)
2. `popup.js` (updated)
3. `manifest.json` (updated)

### Option 2: Manual Fix

If you prefer to fix manually, search for all `onclick=` in your HTML and:

1. Remove the `onclick` attribute
2. Add an `id` attribute
3. Add event listeners in JavaScript

---

## ✨ Why This Matters

**Manifest V3 Requirements:**

- No inline JavaScript event handlers
- No inline `<script>` tags
- No `eval()`
- All scripts must be external files

This is a security feature to prevent malicious code injection.

---

## 🧪 Testing the Fix

1. **Load the extension** in Chrome:

   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select your `extension/` folder

2. **Check DevTools** (F12 → Console):

   - You should see: `[Focus-Flow] Popup loaded ✓`
   - No red error messages about CSP violations

3. **Test buttons**:
   - Click "Help Improve" → Should toggle consent
   - Click "Keep Private" → Should toggle consent
   - Click "Retry Connection" → Should attempt reconnect
   - Click toggle switch → Should change state

---

## 🔒 Security Notes

Your CSP policy is now:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; connect-src 'self' http://localhost:5000 ws://localhost:5000 http://127.0.0.1:5000 ws://127.0.0.1:5000"
}
```

This means:

- ✅ Scripts can only come from extension files (`'self'`)
- ✅ Connections allowed to localhost:5000 (your agent)
- ❌ No inline scripts
- ❌ No external scripts
- ❌ No unsafe operations

---

## 🆘 If Issues Persist

**Error still shows in console?**

1. Hard reload extension: Click ⟲ on the extension card
2. Clear Chrome cache: Settings → Clear browsing data
3. Reload extension

**Buttons don't work?**

1. Check browser console (F12)
2. Look for JavaScript errors
3. Verify `popup.js` is being loaded
4. Check that element `id` attributes match in HTML and JS

**Still getting CSP errors?**

- Don't add `'unsafe-inline'` to CSP (defeats the purpose)
- Make sure all `onclick` attributes are removed
- Check for inline `<style>` attributes (CSS is OK, JS is not)

---

## 📚 Resources

- **Chrome Extension Security:** [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/csp/)
- **Event Listeners:** [Event Listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- **CSP Directives:** [CSP Directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## ✅ You're Done

All CSP violations are now fixed. Your extension is secure and compliant with Manifest V3 standards. 🎉
