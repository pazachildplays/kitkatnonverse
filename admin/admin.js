let adminPassword = null;
let currentConfig = {};

// Login functionality
function handleLoginKeyPress(event) {
    if (event.key === 'Enter') {
        adminLogin();
    }
}

async function adminLogin() {
    const password = document.getElementById('passwordInput').value;
    const loginError = document.getElementById('loginError');

    if (!password) {
        loginError.textContent = 'Please enter a password';
        return;
    }

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();
        console.log('Login response:', data, 'Status:', response.status);

        if (data.success && response.status === 200) {
            adminPassword = password;
            loginError.textContent = '';
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('admin-dashboard').classList.remove('hidden');
            loadDashboardData();
        } else {
            loginError.textContent = data.message || 'Invalid password';
            console.error('Login failed:', data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Connection error - check console';
    }
}

function adminLogout() {
    adminPassword = null;
    document.getElementById('passwordInput').value = '';
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/config');
        currentConfig = await response.json();
        
        // Update dashboard
        document.getElementById('commissionDisplay').textContent = currentConfig.commissionsStatus || 'Open';
        document.getElementById('linkCount').textContent = (currentConfig.links || []).length;
        
        // Update links tab
        displayLinks();
        
        // Update contacts tab
        displayContacts();
        
        // Update settings tab
        document.getElementById('settingTitle').value = currentConfig.title || '';
        document.getElementById('commissionStatus').value = currentConfig.commissionsStatus || 'Open';
        document.getElementById('bgGradient').value = currentConfig.bgGradient || '';
        
        // Set color inputs and pickers
        document.getElementById('primaryColor').value = currentConfig.primaryColor || '#7c3aed';
        document.getElementById('primaryColorPicker').value = currentConfig.primaryColor || '#7c3aed';
        
        document.getElementById('secondaryColor').value = currentConfig.secondaryColor || '#d946ef';
        document.getElementById('secondaryColorPicker').value = currentConfig.secondaryColor || '#d946ef';
        
        document.getElementById('footerColor').value = currentConfig.footerColor || '#1a1a1a';
        document.getElementById('footerColorPicker').value = currentConfig.footerColor || '#1a1a1a';
        
        document.getElementById('textColor').value = currentConfig.textColor || '#ffffff';
        document.getElementById('textColorPicker').value = currentConfig.textColor || '#ffffff';
        
        // Add event listeners for color sync
        setupColorSync();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Sync color inputs and pickers
function setupColorSync() {
    const colorFields = [
        { text: 'primaryColor', picker: 'primaryColorPicker' },
        { text: 'secondaryColor', picker: 'secondaryColorPicker' },
        { text: 'footerColor', picker: 'footerColorPicker' },
        { text: 'textColor', picker: 'textColorPicker' }
    ];
    
    colorFields.forEach(field => {
        const textInput = document.getElementById(field.text);
        const pickerInput = document.getElementById(field.picker);
        
        // Text input updates picker
        if (textInput) {
            textInput.addEventListener('change', () => {
                if (isValidHexColor(textInput.value)) {
                    pickerInput.value = textInput.value;
                }
            });
        }
        
        // Picker updates text input
        if (pickerInput) {
            pickerInput.addEventListener('input', () => {
                textInput.value = pickerInput.value;
            });
        }
    });
}

// Display links
function displayLinks() {
    const linksList = document.getElementById('links-list');
    linksList.innerHTML = '';
    
    if (currentConfig.links && currentConfig.links.length > 0) {
        currentConfig.links.forEach(link => {
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item';
            
            // Always expect image format for icons
            const iconHTML = link.icon && link.icon.startsWith('data:image')
                ? `<img src="${link.icon}" alt="icon" style="width:40px;height:40px;object-fit:contain;">`
                : `<div style="width:40px;height:40px;background:#ccc;display:flex;align-items:center;justify-content:center;">No Icon</div>`;
            
            linkItem.innerHTML = `
                <div class="link-info">
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${iconHTML}
                        <div>
                            <div class="link-name">${link.name}</div>
                            <div class="link-url">${link.url}</div>
                        </div>
                    </div>
                </div>
                <div class="link-actions">
                    <button class="btn-primary btn-edit" onclick="showEditLinkForm(${link.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteLink(${link.id})">Delete</button>
                </div>
            `;
            linksList.appendChild(linkItem);
        });
    }
}

// Add link form
function showAddLinkForm() {
    document.getElementById('add-link-form').classList.remove('hidden');
}

function cancelAddLink() {
    const addLinkForm = document.getElementById('add-link-form');
    if (addLinkForm) {
        addLinkForm.classList.add('hidden');
    }
    
    const linkNameEl = document.getElementById('linkName');
    if (linkNameEl) linkNameEl.value = '';
    
    const linkUrlEl = document.getElementById('linkUrl');
    if (linkUrlEl) linkUrlEl.value = '';
    
    const linkIconFileEl = document.getElementById('linkIconFile');
    if (linkIconFileEl) linkIconFileEl.value = '';
    
    const iconPreview = document.getElementById('iconPreview');
    if (iconPreview) {
        iconPreview.innerHTML = 'No image selected';
        iconPreview.style.display = 'flex';
    }
}

// Handle icon file upload preview
document.addEventListener('DOMContentLoaded', function() {
    const iconFileInput = document.getElementById('linkIconFile');
    const iconPreview = document.getElementById('iconPreview');
    
    const editIconFileInput = document.getElementById('editLinkIconFile');
    const editIconPreview = document.getElementById('editIconPreview');
    
    if (iconFileInput) {
        iconFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    iconPreview.innerHTML = `<img src="${event.target.result}" alt="icon preview" style="width:100%;height:100%;object-fit:contain;">`;
                    iconPreview.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            } else {
                iconPreview.innerHTML = 'No image selected';
                iconPreview.style.display = 'flex';
            }
        });
    }
    
    if (editIconFileInput) {
        editIconFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    editIconPreview.innerHTML = `<img src="${event.target.result}" alt="icon preview" style="width:100%;height:100%;object-fit:contain;">`;
                    editIconPreview.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            } else {
                editIconPreview.innerHTML = 'No image selected';
                editIconPreview.style.display = 'flex';
            }
        });
    }
});

async function saveNewLink() {
    console.log('=== SAVE NEW LINK CALLED ===');
    console.log('adminPassword:', adminPassword);
    
    // Ensure form elements exist
    const nameInput = document.getElementById('linkName');
    const urlInput = document.getElementById('linkUrl');
    const iconFileInput = document.getElementById('linkIconFile');
    
    if (!nameInput) {
        alert('❌ Form not loaded yet. Please try again.');
        console.error('linkName element not found');
        return;
    }
    
    const name = nameInput.value || '';
    const url = urlInput ? urlInput.value : '';
    
    console.log('Form values - Name:', name, 'URL:', url, 'File:', iconFileInput?.files?.length);

    if (!name || !url) {
        alert('❌ Please fill in all fields (name and URL)');
        return;
    }

    if (!iconFileInput || !iconFileInput.files || iconFileInput.files.length === 0) {
        alert('❌ Please upload an icon image');
        return;
    }

    if (!adminPassword) {
        alert('❌ You must be logged in to save links');
        return;
    }

    try {
        console.log('Converting file to base64...');
        // Convert file to base64
        const file = iconFileInput.files[0];
        console.log('File:', file.name, file.size, file.type);
        
        const icon = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => {
                console.error('FileReader error:', e);
                resolve(null);
            };
            reader.readAsDataURL(file);
        });

        if (!icon) {
            alert('❌ Failed to read icon file');
            return;
        }

        const newLink = {
            id: Date.now(),
            name,
            url,
            icon
        };

        currentConfig.links = currentConfig.links || [];
        currentConfig.links.push(newLink);

        console.log('Sending to API:', {
            password: adminPassword,
            linksCount: currentConfig.links.length
        });

        const response = await fetch('/api/admin/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: adminPassword,
                links: currentConfig.links
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            alert('✅ Link saved successfully!');
            cancelAddLink();
            displayLinks();
            document.getElementById('linkCount').textContent = currentConfig.links.length;
        } else {
            alert('❌ Error: ' + (data.message || data.error || 'Failed to save link'));
            currentConfig.links.pop(); // Remove the link we just added
            console.error('API returned error:', data);
        }
    } catch (error) {
        console.error('Exception saving link:', error);
        alert('❌ Failed to save link: ' + error.message);
        if (currentConfig.links.length > 0) {
            currentConfig.links.pop(); // Remove the link we just added
        }
    }
}

async function deleteLink(id) {
    if (!confirm('Are you sure you want to delete this link?')) {
        return;
    }

    if (!adminPassword) {
        alert('❌ You must be logged in to delete links');
        return;
    }

    console.log('Deleting link with ID:', id);
    const deletedLink = currentConfig.links.find(link => link.id === id);
    if (!deletedLink) {
        alert('❌ Link not found');
        return;
    }
    
    currentConfig.links = currentConfig.links.filter(link => link.id !== id);

    try {
        const response = await fetch('/api/admin/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: adminPassword,
                links: currentConfig.links
            })
        });

        const data = await response.json();
        if (data.success) {
            alert('✅ Link deleted successfully!');
            displayLinks();
            document.getElementById('linkCount').textContent = currentConfig.links.length;
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to delete link'));
            currentConfig.links.push(deletedLink); // Restore the link
            console.error('API error:', data);
        }
    } catch (error) {
        console.error('Error deleting link:', error);
        alert('❌ Failed to delete link: ' + error.message);
        currentConfig.links.push(deletedLink); // Restore the link
    }
}

// Edit link functionality
let currentEditingLinkId = null;

function showEditLinkForm(linkId) {
    const link = currentConfig.links.find(l => l.id === linkId);
    if (!link) return;
    
    currentEditingLinkId = linkId;
    document.getElementById('editLinkName').value = link.name;
    document.getElementById('editLinkUrl').value = link.url;
    document.getElementById('editLinkIconFile').value = '';
    
    // Display current icon
    if (link.icon && link.icon.startsWith('data:image')) {
        document.getElementById('editIconPreview').innerHTML = `<img src="${link.icon}" alt="icon preview" style="width:100%;height:100%;object-fit:contain;">`;
    } else {
        document.getElementById('editIconPreview').innerHTML = 'Current icon';
    }
    
    document.getElementById('edit-link-form').classList.remove('hidden');
    document.getElementById('add-link-form').classList.add('hidden');
}

function cancelEditLink() {
    const editLinkForm = document.getElementById('edit-link-form');
    if (editLinkForm) editLinkForm.classList.add('hidden');
    
    const editLinkNameEl = document.getElementById('editLinkName');
    if (editLinkNameEl) editLinkNameEl.value = '';
    
    const editLinkUrlEl = document.getElementById('editLinkUrl');
    if (editLinkUrlEl) editLinkUrlEl.value = '';
    
    const editLinkIconFileEl = document.getElementById('editLinkIconFile');
    if (editLinkIconFileEl) editLinkIconFileEl.value = '';
    
    const editIconPreview = document.getElementById('editIconPreview');
    if (editIconPreview) {
        editIconPreview.innerHTML = '';
        editIconPreview.style.display = 'none';
    }
    currentEditingLinkId = null;
}

async function saveEditLink() {
    console.log('saveEditLink called');
    
    // Get elements with null checks
    const nameInput = document.getElementById('editLinkName');
    const urlInput = document.getElementById('editLinkUrl');
    const iconFileInput = document.getElementById('editLinkIconFile');
    
    if (!nameInput || !urlInput) {
        alert('❌ Form not loaded yet. Please try again.');
        console.error('Form elements not found');
        return;
    }
    
    const name = nameInput.value || '';
    const url = urlInput.value || '';

    if (!name || !url) {
        alert('❌ Please fill in all fields');
        return;
    }

    const linkIndex = currentConfig.links.findIndex(l => l.id === currentEditingLinkId);
    if (linkIndex === -1) {
        alert('❌ Link not found');
        return;
    }

    if (!adminPassword) {
        alert('❌ You must be logged in to edit links');
        return;
    }

    try {
        // Update name and URL
        currentConfig.links[linkIndex].name = name;
        currentConfig.links[linkIndex].url = url;

        // Update icon if a new file was uploaded
        if (iconFileInput && iconFileInput.files && iconFileInput.files.length > 0) {
            const file = iconFileInput.files[0];
            const newIcon = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => {
                    console.error('FileReader error:', e);
                    resolve(null);
                };
                reader.readAsDataURL(file);
            });
            if (newIcon) {
                currentConfig.links[linkIndex].icon = newIcon;
            }
        }

        console.log('Sending updated link to API');

        const response = await fetch('/api/admin/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: adminPassword,
                links: currentConfig.links
            })
        });

        const data = await response.json();
        if (data.success) {
            alert('✅ Link updated successfully!');
            cancelEditLink();
            displayLinks();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to update link'));
            console.error('API error:', data);
        }
    } catch (error) {
        console.error('Error updating link:', error);
        alert('❌ Failed to update link: ' + error.message);
    }
}

// Contact management
function displayContacts() {
    const contactsList = document.getElementById('contacts-list');
    contactsList.innerHTML = '';
    
    if (currentConfig.contacts && currentConfig.contacts.length > 0) {
        currentConfig.contacts.forEach(contact => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            contactItem.innerHTML = `
                <div class="contact-info">
                    <div class="contact-label">${contact.icon} ${contact.label}</div>
                    <div class="contact-value">${contact.value}</div>
                </div>
                <div class="contact-actions">
                    <button class="btn-primary btn-edit" onclick="showEditContactForm(${contact.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteContact(${contact.id})">Delete</button>
                </div>
            `;
            contactsList.appendChild(contactItem);
        });
    }
}

function showAddContactForm() {
    document.getElementById('add-contact-form').classList.remove('hidden');
}

function cancelAddContact() {
    const addContactForm = document.getElementById('add-contact-form');
    if (addContactForm) addContactForm.classList.add('hidden');
    
    const contactLabelEl = document.getElementById('contactLabel');
    if (contactLabelEl) contactLabelEl.value = '';
    
    const contactValueEl = document.getElementById('contactValue');
    if (contactValueEl) contactValueEl.value = '';
    
    const contactIconEl = document.getElementById('contactIcon');
    if (contactIconEl) contactIconEl.value = '📧';
}

async function saveNewContact() {
    const label = document.getElementById('contactLabel').value;
    const value = document.getElementById('contactValue').value;
    const icon = document.getElementById('contactIcon').value;

    if (!label || !value) {
        alert('❌ Please fill in all fields');
        return;
    }

    if (!adminPassword) {
        alert('❌ You must be logged in to save contacts');
        return;
    }

    const newContact = {
        id: Date.now(),
        label,
        value,
        icon: icon || '📧',
        type: label.toLowerCase()
    };

    currentConfig.contacts = currentConfig.contacts || [];
    currentConfig.contacts.push(newContact);

    try {
        console.log('Saving contact:', newContact);
        const response = await fetch('/api/admin/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: adminPassword,
                updates: { contacts: currentConfig.contacts }
            })
        });

        const data = await response.json();
        console.log('Contact save response:', data);
        if (data.success) {
            currentConfig = data.config;
            alert('✓ Contact saved successfully!');
            cancelAddContact();
            displayContacts();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to save contact'));
            currentConfig.contacts.pop();
        }
    } catch (error) {
        console.error('Error saving contact:', error);
        alert('❌ Failed to save contact: ' + error.message);
        currentConfig.contacts.pop();
    }
}

// Edit contact functionality
let currentEditingContactId = null;

function showEditContactForm(contactId) {
    const contact = currentConfig.contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    currentEditingContactId = contactId;
    document.getElementById('editContactLabel').value = contact.label;
    document.getElementById('editContactValue').value = contact.value;
    document.getElementById('editContactIcon').value = contact.icon;
    
    document.getElementById('edit-contact-form').classList.remove('hidden');
    document.getElementById('add-contact-form').classList.add('hidden');
}

function cancelEditContact() {
    const editContactForm = document.getElementById('edit-contact-form');
    if (editContactForm) editContactForm.classList.add('hidden');
    
    const editContactLabelEl = document.getElementById('editContactLabel');
    if (editContactLabelEl) editContactLabelEl.value = '';
    
    const editContactValueEl = document.getElementById('editContactValue');
    if (editContactValueEl) editContactValueEl.value = '';
    
    const editContactIconEl = document.getElementById('editContactIcon');
    if (editContactIconEl) editContactIconEl.value = '📧';
    
    currentEditingContactId = null;
}

async function saveEditContact() {
    const label = document.getElementById('editContactLabel').value;
    const value = document.getElementById('editContactValue').value;
    const icon = document.getElementById('editContactIcon').value;

    if (!label || !value) {
        alert('❌ Please fill in all fields');
        return;
    }

    if (!adminPassword) {
        alert('❌ You must be logged in to edit contacts');
        return;
    }

    const contactIndex = currentConfig.contacts.findIndex(c => c.id === currentEditingContactId);
    if (contactIndex === -1) return;

    currentConfig.contacts[contactIndex].label = label;
    currentConfig.contacts[contactIndex].value = value;
    currentConfig.contacts[contactIndex].icon = icon;

    try {
        const response = await fetch('/api/admin/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: adminPassword,
                updates: { contacts: currentConfig.contacts }
            })
        });

        const data = await response.json();
        if (data.success) {
            currentConfig = data.config;
            alert('✓ Contact updated successfully!');
            cancelEditContact();
            displayContacts();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to update contact'));
        }
    } catch (error) {
        console.error('Error updating contact:', error);
        alert('❌ Failed to update contact: ' + error.message);
    }
}

async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) {
        return;
    }

    if (!adminPassword) {
        alert('❌ You must be logged in to delete contacts');
        return;
    }

    const deletedContact = currentConfig.contacts.find(c => c.id === id);
    currentConfig.contacts = currentConfig.contacts.filter(contact => contact.id !== id);

    try {
        const response = await fetch('/api/admin/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: adminPassword,
                updates: { contacts: currentConfig.contacts }
            })
        });

        const data = await response.json();
        if (data.success) {
            currentConfig = data.config;
            alert('✓ Contact deleted successfully!');
            displayContacts();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to delete contact'));
            currentConfig.contacts.push(deletedContact);
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('❌ Failed to delete contact: ' + error.message);
        currentConfig.contacts.push(deletedContact);
    }
}

// Validate hex color
function isValidHexColor(hex) {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

// Save settings
async function saveSetting(key, value) {
    // Validate color inputs
    if (['primaryColor', 'secondaryColor', 'footerColor', 'textColor'].includes(key)) {
        if (!isValidHexColor(value)) {
            alert('Invalid color code. Use format: #RRGGBB (e.g., #ff0000)');
            return;
        }
    }
    
    if (!adminPassword) {
        alert('❌ You must be logged in to save settings');
        return;
    }
    
    const updates = { [key]: value };

    try {
        console.log('Saving setting:', key, value);
        const response = await fetch('/api/admin/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: adminPassword,
                updates
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            currentConfig = data.config;
            alert('✓ Setting saved successfully!');
            // Reload dashboard data to sync all fields
            loadDashboardData();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to save setting'));
            console.error('API error:', data);
        }
    } catch (error) {
        console.error('Error saving setting:', error);
        alert('❌ Failed to save setting: ' + error.message);
    }
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    const tabId = tabName + '-tab';
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Mark menu item as active - find the button that was clicked
    const buttons = document.querySelectorAll('.menu-item');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName.toLowerCase()) || 
            (tabName === 'dashboard' && btn.textContent.includes('Dashboard')) ||
            (tabName === 'links' && btn.textContent.includes('Links')) ||
            (tabName === 'contacts' && btn.textContent.includes('Contacts')) ||
            (tabName === 'settings' && btn.textContent.includes('Settings'))) {
            btn.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        links: 'Manage Links',
        contacts: 'Contact Information',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[tabName] || 'Dashboard';
}

// Preview viewer site
function openPreview() {
    window.open('/', '_blank');
}

// Load dashboard on page load
if (adminPassword) {
    loadDashboardData();
}

// Poll for config updates from other admin sessions
setInterval(() => {
    if (adminPassword) {
        loadDashboardData();
    }
}, 5000);
