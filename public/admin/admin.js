let adminPassword = null;
let currentConfig = {
    links: []
};

// Login
async function adminLogin() {
    const password = document.getElementById('passwordInput').value;
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
            adminPassword = password;
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('admin-dashboard').classList.remove('hidden');
            loadConfig();
        } else {
            document.getElementById('loginError').textContent = 'Invalid Password';
        }
    } catch (e) {
        console.error(e);
    }
}

// Allow pressing Enter to login
document.getElementById('passwordInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        adminLogin();
    }
});

// Load Config
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        currentConfig = await res.json();
        
        // Populate fields
        document.getElementById('siteTitle').value = currentConfig.title || 'KitKat Universe';
        document.getElementById('commissionsStatus').value = currentConfig.commissionsStatus || 'Open';
        
        const imgStatus = document.getElementById('currentHeaderImageStatus');
        if (currentConfig.headerImage) {
            imgStatus.textContent = "✅ Custom header image currently set";
        } else {
            imgStatus.textContent = "No custom header image set (using text)";
        }
        
        const startColor = currentConfig.primaryColor || '#a855f7';
        const endColor = currentConfig.secondaryColor || '#6366f1';
        
        document.getElementById('gradStartPicker').value = startColor;
        document.getElementById('gradStartText').value = startColor;
        document.getElementById('gradEndPicker').value = endColor;
        document.getElementById('gradEndText').value = endColor;
        
        document.getElementById('footerText').value = currentConfig.footerText || '✨';
        
        document.getElementById('contactEmail').value = currentConfig.contactEmail || '';
        document.getElementById('phoneNumber').value = currentConfig.phoneNumber || '';
        
        renderLinks();
        updatePreview();
    } catch (e) {
        console.error(e);
    }
}

// Sync Color Inputs
function syncColor(type, fromPicker) {
    const picker = document.getElementById(`grad${type.charAt(0).toUpperCase() + type.slice(1)}Picker`);
    const text = document.getElementById(`grad${type.charAt(0).toUpperCase() + type.slice(1)}Text`);
    
    if (fromPicker) {
        text.value = picker.value;
    } else {
        picker.value = text.value;
    }
    updatePreview();
}

// Update Preview Box
function updatePreview() {
    const title = document.getElementById('siteTitle').value;
    const start = document.getElementById('gradStartText').value;
    const end = document.getElementById('gradEndText').value;
    const footer = document.getElementById('footerText').value;
    
    const box = document.getElementById('previewBox');
    box.style.background = `linear-gradient(90deg, ${start}, ${end})`;
    
    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewFooter').textContent = footer;
}

// Links Management
function renderLinks() {
    const container = document.getElementById('linksList');
    container.innerHTML = '';
    
    (currentConfig.links || []).forEach((link, index) => {
        const div = document.createElement('div');
        div.className = 'link-item';
        div.innerHTML = `
            <img src="${link.icon}" class="link-icon-preview">
            <div>
                <strong>${link.name}</strong><br>
                <small>${link.url}</small>
            </div>
            <button onclick="deleteLink(${index})" class="btn-delete">Delete</button>
        `;
        container.appendChild(div);
    });
}

async function addNewLink() {
    const url = document.getElementById('newLinkUrl').value;
    const name = document.getElementById('newLinkName').value;
    const fileInput = document.getElementById('newLinkIcon');
    
    if (!name || !url || !fileInput.files[0]) {
        alert('Please provide Name, URL, and Icon');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const icon = e.target.result;
        if (!currentConfig.links) currentConfig.links = [];
        currentConfig.links.push({ name, url, icon });
        renderLinks();
        
        // Clear inputs
        document.getElementById('newLinkUrl').value = '';
        document.getElementById('newLinkName').value = '';
        document.getElementById('newLinkIcon').value = '';
    };
    reader.readAsDataURL(fileInput.files[0]);
}

function deleteLink(index) {
    if(confirm('Delete this link?')) {
        currentConfig.links.splice(index, 1);
        renderLinks();
    }
}

// Save Settings
async function saveSettings() {
    const headerImageInput = document.getElementById('headerImageInput');
    let headerImage = currentConfig.headerImage;

    if (headerImageInput && headerImageInput.files && headerImageInput.files[0]) {
        headerImage = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(headerImageInput.files[0]);
        });
    }

    const updates = {
        title: document.getElementById('siteTitle').value,
        headerImage: headerImage,
        commissionsStatus: document.getElementById('commissionsStatus').value,
        primaryColor: document.getElementById('gradStartText').value,
        secondaryColor: document.getElementById('gradEndText').value,
        footerText: document.getElementById('footerText').value,
        contactEmail: document.getElementById('contactEmail').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        links: currentConfig.links
    };
    
    try {
        const res = await fetch('/api/admin/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                password: adminPassword,
                updates: updates
            })
        });
        const data = await res.json();
        if (data.success) {
            alert('Settings Saved! 🍬');
        } else {
            alert('Error saving settings');
        }
    } catch (e) {
        console.error(e);
        alert('Error saving settings');
    }
}

// Force Sync to GitHub
async function forceSync() {
    const btn = document.querySelector('.sync-btn');
    const originalText = btn.textContent;
    btn.textContent = "Syncing... ⏳";
    btn.disabled = true;

    try {
        const res = await fetch('/api/admin/sync', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ password: adminPassword })
        });
        const data = await res.json();
        alert(data.success ? '✅ ' + data.message : '❌ Error: ' + data.message);
    } catch (e) {
        alert('❌ Connection error');
    }
    
    btn.textContent = originalText;
    btn.disabled = false;
}

// Bubble trail logic
let lastBubbleTime = 0;

function createBubble(x, y) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = Math.random() * 20 + 10; // 10-30px
    
    bubble.style.left = (x - size/2) + 'px';
    bubble.style.top = (y - size/2) + 'px';
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    
    document.getElementById('bubble-container').appendChild(bubble);
    
    setTimeout(() => bubble.remove(), 1000);
}

document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastBubbleTime > 30) {
        createBubble(e.clientX, e.clientY);
        lastBubbleTime = now;
    }
});

document.addEventListener('touchmove', (e) => {
    const now = Date.now();
    if (now - lastBubbleTime > 30) {
        const touch = e.touches[0];
        createBubble(touch.clientX, touch.clientY);
        lastBubbleTime = now;
    }
});
