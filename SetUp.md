# Focus-Flow Chrome Extension - Complete Setup Guide

## ❌ Problem: Missing Icons & Files

Your extension is missing critical files that Chrome requires to load:

- `icons/icon-16.png` - Extension toolbar icon (16×16)
- `icons/icon-48.png` - Extensions management page icon (48×48)
- `icons/icon-128.png` - Chrome Web Store icon (128×128)
- `offscreen.html` - Required for Manifest V3 background tasks

---

## ✅ Solution: Generate Missing Files

### Step 1: Install Pillow (Python Image Library)

````bash
pip install Pillow
```plaintext

### Step 2: Generate Icons

I've created a Python script to generate the icons automatically. Place this in your project root:

**`generate_icons.py`** (already created for you)

Run it from your `extension/` directory:

```bash
cd extension/
python ../generate_icons.py
````

Expected output:

```plaintext
🎨 Generating Focus-Flow icons...
✓ Created icons/icon-16.png (16x16)
✓ Created icons/icon-48.png (48x48)
✓ Created icons/icon-128.png (128x128)

✨ All icons generated successfully!
```plaintext

### Step 3: Verify Directory Structure

After running the script, your extension folder should look like:

```plaintext

```

```
extension/
├── icons/
│   ├── icon-16.png       ← Generated
│   ├── icon-48.png       ← Generated
│   └── icon-128.png      ← Generated
├── background.js         ← Your file
├── manifest.json         ← Your file
├── offscreen.html        ← NEW (provided)
├── offscreen.js          ← NEW (provided)
├── popup.html            ← FIXED (malformed HTML corrected)
├── popup.js              ← Your file (works as-is)
└── README.md             ← Your documentation
```

---

## 🚀 Load Extension in Chrome

### Method 1: Developer Mode (Recommended for Testing)

1. Open Chrome and go to **`chrome://extensions/`**
2. Toggle **"Developer mode"** (top-right corner)
3. Click **"Load unpacked"**
4. Select your **`extension/`** folder
5. The Focus-Flow extension should appear! ✅

### Method 2: Check for Errors

If you get an error, check:

- ✅ Icons exist in `icons/` folder
- ✅ All icon filenames match manifest.json exactly
- ✅ PNG files are valid (not corrupted)
- ✅ `offscreen.html` exists in root of extension folder
- ✅ No malformed HTML in `popup.html`

If errors persist, check Chrome DevTools:

1. Click the extension
2. Right-click → **"Inspect"**
3. Check the **Console** tab for errors

---

## 🔧 What Was Fixed

### Files Provided

| File                | Status   | Notes                                     |
| ------------------- | -------- | ----------------------------------------- |
| `generate_icons.py` | ✨ NEW   | Generates PNG icons in all required sizes |
| `offscreen.html`    | ✨ NEW   | Required for Manifest V3 badge animations |
| `offscreen.js`      | ✨ NEW   | Handles background tasks                  |
| `popup.html`        | 🔧 FIXED | Corrected malformed HTML structure        |

### HTML Issues Fixed in popup.html

- ❌ Removed duplicate/broken code-block styling
- ❌ Fixed malformed `<code>` tags
- ❌ Corrected unclosed `error-state` div
- ❌ Fixed `last-sync` section structure
- ✅ Proper semantic HTML throughout

---

## 📋 Next Steps

1. **Generate icons:**

   ```bash
   python generate_icons.py
   ```

2. **Load in Chrome:**

   - Visit `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select your `extension/` folder

3. **Start the backend agent:**

   ```bash
   python agent.py
   ```

4. **Click the extension icon** in your Chrome toolbar to see the dashboard

---

## 🎨 Custom Icon Colors

If you want to customize the icon colors, edit `generate_icons.py`:

```python
# Line 37-39: Gradient colors (top to bottom)
r = int(102 + (118 - 102) * (y / size))  # Red channel
g = int(126 + (75 - 126) * (y / size))   # Green channel
b = int(234 + (162 - 234) * (y / size))  # Blue channel

# Line 51: Pulse symbol color
outline=(102, 126, 234, 255)  # Current: purple/blue
```

Change these RGB values and regenerate:

- `(255, 0, 0)` = Red
- `(0, 255, 0)` = Green
- `(0, 0, 255)` = Blue
- `(255, 165, 0)` = Orange

---

## 🔍 Troubleshooting

### "Could not load icon 'icons/icon-16.png'"

- Run `python generate_icons.py` again
- Ensure all 3 PNG files were created
- Check file permissions

### "Could not load manifest"

- Verify `manifest.json` is valid JSON (no trailing commas)
- Check all file paths are correct
- Ensure all referenced files exist

### Extension loads but shows blank popup

- Check browser console (F12 → Console tab)
- Verify `popup.js` can reach `http://localhost:5000/health`
- Start `agent.py` if not running

### Icons aren't showing

- Make sure Pillow is installed: `pip install Pillow`
- Delete and regenerate icons
- Clear Chrome cache (Settings → Clear browsing data)

---

## 📚 Resources

- **Chrome Extension Manifest V3 Docs:** [Chrome Extension Manifest V3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- **Icon Requirements:** [Icon Requirements](https://developer.chrome.com/docs/extensions/mv3/manifest/#icons)
- **WebSocket Troubleshooting:** Check browser DevTools → Network tab

---

## ✨ You're All Set

Your extension is now ready to monitor your system. Enjoy Focus-Flow! 🚀

Questions? Check the README.md or GitHub issues.
