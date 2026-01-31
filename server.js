const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3001;

// Increase payload limit for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Path to data file
const DATA_FILE = path.join(__dirname, 'site-data.json');
const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'serviceAccountKey.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kitkat09';

// Default configuration
let siteConfig = {
    title: "KitKat Universe",
    primaryColor: "#a855f7",
    secondaryColor: "#6366f1",
    textColor: "#ffffff",
    footerText: "✨",
    contactEmail: "",
    phoneNumber: "",
    links: [], // Links are cleared by default
    commissionsStatus: "Open"
};

// Load existing data from local file (Fallback if Firebase is not used)
if (fs.existsSync(DATA_FILE)) {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        siteConfig = { ...siteConfig, ...JSON.parse(data) };
    } catch (err) {
        console.error("Error loading local data file:", err);
    }
}

// Firebase Setup
let dbRef = null;

// Determine Service Account (Env Var or File)
let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("⚠️ Error parsing FIREBASE_SERVICE_ACCOUNT env var:", e.message);
    }
} else if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    serviceAccount = require(SERVICE_ACCOUNT_FILE);
}

if (serviceAccount) {
    try {
        // Initialize Firebase
        // IMPORTANT: Replace the databaseURL below with your actual Firebase Realtime Database URL
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DB_URL || "https://kitkatnonverse-default-rtdb.firebaseio.com" 
        });

        const db = admin.database();
        dbRef = db.ref('siteConfig');
        
        console.log("🔥 Firebase connected successfully!");

        // Load data from Firebase on start
        dbRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                siteConfig = data;
                if (!siteConfig.links) siteConfig.links = []; // Ensure links array exists
                console.log("Data synced from Firebase");
            } else {
                // If DB is empty, save our default (cleared) config
                saveConfig();
            }
        });

    } catch (error) {
        console.error("Firebase initialization error:", error);
    }
} else {
    console.log("⚠️ No Firebase credentials found (Env Var or File). Using local memory only.");
}

// Configure Git Identity for Render (if Env Vars provided)
if (process.env.GIT_USER_EMAIL) {
    const gitName = process.env.GIT_USER_NAME || "KitKat Admin";
    exec(`git config --global user.email "${process.env.GIT_USER_EMAIL}" && git config --global user.name "${gitName}"`, (err) => {
        if (err) console.error("⚠️ Failed to configure Git identity:", err.message);
        else console.log("✅ Git identity configured from Environment Variables");
    });
}

// Helper to clean nested git repositories
function cleanNestedGit() {
    const nestedGit = path.join(__dirname, 'kitkatnonverse', '.git');
    if (fs.existsSync(nestedGit)) {
        try {
            if (fs.rmSync) fs.rmSync(nestedGit, { recursive: true, force: true });
            else fs.rmdirSync(nestedGit, { recursive: true });
            console.log("🧹 Cleaned up nested git repository in 'kitkatnonverse'");
        } catch (e) {
            console.error("⚠️ Failed to clean nested git:", e.message);
        }
    }
    // Also remove .gitmodules if it exists
    const gitModules = path.join(__dirname, '.gitmodules');
    if (fs.existsSync(gitModules)) {
        try {
            fs.unlinkSync(gitModules);
            console.log("🧹 Removed .gitmodules file");
        } catch (e) {
            console.error("⚠️ Failed to remove .gitmodules:", e.message);
        }
    }
    // Force remove from git index to prevent "does not have a commit checked out" error
    try {
        // We use execSync to ensure this finishes before we try to add files
        execSync('git rm --cached kitkatnonverse -f -r', { stdio: 'ignore', cwd: __dirname });
    } catch (e) {
        // Ignore errors if it wasn't in the index
    }
}

// Save data helper
function saveConfig() {
    // 1. Always save to local file (so we have something to push to GitHub)
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(siteConfig, null, 2));
    } catch (err) {
        console.error("Error saving local file:", err);
    }

    // 2. Save to Firebase
    if (dbRef) {
        dbRef.set(siteConfig).catch(err => console.error("Firebase save error:", err));
    }

    // 3. Auto Push to GitHub
    cleanNestedGit();

    // Force branch to tob, add all files, commit, and push
    exec('git checkout -B tob && git add -A && (git commit -m "Auto-update from Admin Panel" || echo No changes to commit) && git push -u -f origin tob', (error, stdout, stderr) => {
        if (error) {
            // Ignore "nothing to commit" errors (this is normal if you click save twice)
            if (stdout.includes('nothing to commit') || stderr.includes('nothing to commit')) {
                console.log("ℹ️ No changes to push to GitHub.");
                return;
            }
            console.log("⚠️ Git push failed. Error details:");
            console.error(stderr || error.message);
            return;
        }
        console.log("✅ Automatically pushed to GitHub");
    });
}

// API Routes

// Get Configuration
app.get('/api/config', (req, res) => {
    res.json(siteConfig);
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    // Hardcoded password for simplicity - change as needed
    if (password && password.trim() === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// Update Configuration
app.post('/api/admin/update', (req, res) => {
    const { password, updates } = req.body;
    
    if (!password || password.trim() !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Merge updates
    siteConfig = { ...siteConfig, ...updates };
    saveConfig();
    
    res.json({ success: true, config: siteConfig });
});

// Manual Sync to GitHub
app.post('/api/admin/sync', (req, res) => {
    const { password } = req.body;
    
    if (!password || password.trim() !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    cleanNestedGit();

    // Force branch to tob, add all files, commit, and push
    exec('git checkout -B tob && git add -A && (git commit -m "Manual sync from Admin Panel" || echo No changes to commit) && git push -u -f origin tob', (error, stdout, stderr) => {
        if (error) {
            if (stdout.includes('nothing to commit') || stderr.includes('nothing to commit')) {
                return res.json({ success: true, message: "Nothing to commit (already up to date)." });
            }
            return res.json({ success: false, message: stderr || error.message });
        }
        res.json({ success: true, message: "Successfully pushed to GitHub!" });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
});