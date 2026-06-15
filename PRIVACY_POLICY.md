# Privacy Policy for Focus-Flow

**Last Updated:** May 2, 2026  
**Version:** 1.0.0

---

## 1. Overview

Focus-Flow is a **privacy-first**, **local system monitor** for Chrome. We believe you should have full control over your data.

### **Our Core Commitment:**

- 🔒 **All monitoring is local by default**
- 🚫 **No data collection without your explicit consent**
- 👁️ **Complete transparency about what we collect**
- 🛡️ **Zero tracking, no profiling, no fingerprinting**

---

## 2. What Data We Collect

### A. Data That Stays Local (Always)

The following data is collected **only on your machine** and never transmitted:

- **System Metrics**: CPU usage (%), Memory usage (%), CPU temperature (°C), Disk usage (%)
- **Service Detection**: Names of running services (e.g., Docker, Redis, PostgreSQL, Node.js)
- **Port Activity**: Open ports detected for development services
- **Historical Metrics**: Up to 1 hour of metric snapshots stored in Chrome's local storage

#### **How It's Stored:**

- Encrypted in Chrome's `storage.local` (built-in browser encryption)
- Deleted automatically when you uninstall the extension
- Only accessible by the extension itself
- Never visible to websites or other extensions

### B. Data Collection With Your Consent (Optional)

**Only if you opt-in** during setup or in settings, we collect the following aggregated data every 4 hours:

| **Data Type**                 | **Details**                                     | **Purpose**                      |
| ----------------------------- | ----------------------------------------------- | -------------------------------- |
| **CPU Average**               | Mean CPU % over 4-hour period                   | Track typical hardware load      |
| **Memory Average**            | Mean Memory % over 4-hour period                | Identify memory-intensive tasks  |
| **Temperature Average**       | Mean temperature over 4-hour period             | Benchmark thermal efficiency     |
| **Active Services (Generic)** | List like "Docker running", "Node.js detected"  | Understand developer tech stacks |
| **Device Type**               | "MacBook", "Windows PC", "Linux PC"             | Platform-specific insights       |
| **Timezone**                  | From browser settings                           | Market trend analysis            |
| **Language**                  | From browser settings                           | Regional insights                |
| **Anonymous Machine ID**      | Randomly generated UUID (stays on your machine) | Prevent duplicate uploads        |

#### **What We DO NOT Collect:**

- ❌ Your name, email, or any personal information
- ❌ IP addresses or network information
- ❌ Project names, file paths, or code
- ❌ Credentials, passwords, or authentication tokens
- ❌ Browser history, cookies, or tracking data
- ❌ Details about specific services running (e.g., "Django project on localhost:8000" - just "Django detected")
- ❌ Which websites you visit

---

## 3. How We Use Aggregate Data

If you consent to data sharing, we use aggregated metrics only for:

### Legitimate Business Purposes

1. **Market Insights**: Understand trends in developer environments (e.g., "Adoption of Docker among developers")
2. **Product Improvement**: Identify which services are most commonly used
3. **Benchmarking**: Compare hardware performance across device types
4. **Anonymized Research**: Published reports like "Average thermal load on MacBook M1 Pro" (no individual data)

#### **What We Do NOT Do:**

- ❌ Sell raw data to third parties
- ❌ Create user profiles or behavioral tracking
- ❌ Use data for targeted advertising
- ❌ Share data with external companies
- ❌ Combine data across users

---

## 4. How We Store & Protect Data

### Local Storage Security

- Your local metrics are encrypted by Chrome's storage system
- Data never leaves your machine unless you explicitly opt-in
- Only visible to Focus-Flow extension

### Cloud Storage (If You Opt-In)

- Aggregate data stored on **[TODO: Backend infrastructure to be specified]**
- HTTPS encryption in transit
- Server-side encryption at rest
- Automated deletion after 12 months
- Anonymous identifiers (no personal information)

### Data Breach Response

In case of unauthorized access, we will:

- Notify affected users within 72 hours
- Publish a transparency report
- File required regulatory notices (GDPR, CCPA, etc.)

---

## 5. User Rights & Controls

### Your Rights

- ✅ **Access**: See all data we've collected about you
- ✅ **Export**: Download your metrics history anytime
- ✅ **Delete**: Remove all data from our servers with one click
- ✅ **Opt-Out**: Disable data sharing at any time (settings toggle)
- ✅ **Portability**: Get your data in standard JSON format

### How to Exercise Your Rights

#### **To Export Your Data:**

```javascript
// Open extension popup DevTools → Console
chrome.storage.local.get(null, (data) => {
  console.log(JSON.stringify(data, null, 2));
});
```

---

## 6. Changes to This Policy

We may update this privacy policy as Focus-Flow evolves. We will notify you of significant changes via the extension popup. Continued use of Focus-Flow after changes means you accept the updated policy.

---

## 7. Contact & Support

**Questions about your privacy?**

- 📧 Email: [privacy@focus-flow.dev](brevin5ive@gmail.com) (when available)
- 🐙 GitHub Issues: [control-zdevFocus-Flow/focus-flow](https://github.com/control-zdevFocus-Flow/focus-flow)
- 📖 Documentation: [focus-flow.dev](https://focus-flow.dev) (when available)

---

## 8. Legal Compliance

Focus-Flow complies with:

- ✅ **GDPR**: No personal data collection by default; opt-in for aggregates
- ✅ **CCPA**: All data collection is transparent and user-controlled
- ✅ **FTC Act Section 5**: No unfair or deceptive practices
- ✅ **Chrome Web Store Policies**: User privacy and data security standards

---

## 9. Summary

**TL;DR:**

- Your system monitoring data stays on your machine by default
- All data is optional, user-controlled, and can be disabled anytime
- We never collect personal information
- Focus-Flow is free, open-source, and privacy-first
- You can trust us ✨

---

**Thank you for using Focus-Flow!**

_Built with ❤️ for developers who care about privacy._
