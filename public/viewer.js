let lastConfigJSON = '';

// Load and display config on page load
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        // Prevent unnecessary DOM updates which break clicks
        const newConfigJSON = JSON.stringify(config);
        if (newConfigJSON === lastConfigJSON) return;
        lastConfigJSON = newConfigJSON;
        
        // Apply primary and secondary colors via CSS variables for dynamic styling
        document.documentElement.style.setProperty('--primary-color', config.primaryColor || '#a855f7');
        document.documentElement.style.setProperty('--secondary-color', config.secondaryColor || '#6366f1');
        
        // Update background using CSS variables (not inline style)
        // This allows the CSS to use var(--primary-color) and var(--secondary-color)
        
        // Update text color
        document.body.style.color = config.textColor || "#ffffff";
        
        // Update title
        const titleElement = document.getElementById('title');
        if (titleElement) {
            if (config.headerImage) {
                titleElement.innerHTML = `<img src="${config.headerImage}" alt="${config.title || 'Header'}" class="header-image">`;
                titleElement.style.textShadow = 'none';
            } else {
                titleElement.innerHTML = (config.title || "KitKat Universe").replace(/\s+/g, '<br>');
                titleElement.style.color = config.textColor || "#ffffff";
                titleElement.style.textShadow = '';
            }
        }
        
        // Update commissions status
        const commissionsText = document.getElementById('commissionsText');
        if (commissionsText) {
            commissionsText.textContent = `Commissions : ${config.commissionsStatus || 'Open'}`;
        }
        
        // Load links
        const socialIconsContainer = document.getElementById('social-icons');
        if (socialIconsContainer) {
            socialIconsContainer.innerHTML = '';
            if (config.links && config.links.length > 0) {
                config.links.forEach(link => {
                    const linkEl = document.createElement('a');
                    
                    // Ensure URL works (add https:// if missing)
                    let url = link.url;
                    if (url && !url.startsWith('http') && !url.startsWith('//')) {
                        url = 'https://' + url;
                    }
                    linkEl.href = url;
                    linkEl.target = '_blank';
                    linkEl.className = 'social-icon-link';
                    linkEl.title = link.name; // Tooltip for name
                    
                    // Check if icon is an image (base64)
                    const isImage = link.icon && link.icon.startsWith('data:image');
                    const iconHTML = isImage 
                        ? `<img src="${link.icon}" alt="${link.name}" class="social-icon-img">` 
                        : `<span class="icon-text">${link.icon || '🔗'}</span>`;
                    
                    linkEl.innerHTML = iconHTML;
                    socialIconsContainer.appendChild(linkEl);
                });
            }
        }
        
        // Update Footer Text
        const footerText = document.getElementById('footer-text');
        if (footerText) {
            footerText.textContent = config.footerText || '';
        }

        // Update Contact Button
        const contactBtn = document.getElementById('contact-btn');
        if (contactBtn && config.contactEmail) {
            contactBtn.href = `mailto:${config.contactEmail}`;
        }

        // Update Number Button
        const numberBtn = document.getElementById('number-btn');
        if (numberBtn && config.phoneNumber) {
            numberBtn.href = `tel:${config.phoneNumber}`;
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Bubble trail on mousemove
let lastBubbleTime = 0;
document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    // Create a bubble every 50ms to create a trail without slowing down the page
    if (now - lastBubbleTime > 50) {
        createBubble(e.clientX, e.clientY);
        lastBubbleTime = now;
    }
});

function createBubble(x, y) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = Math.random() * 40 + 20; // 20-60px
    const offsetX = (Math.random() - 0.5) * 100; // -50 to 50
    
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.setProperty('--tx', offsetX + 'px');
    
    const bubbleContainer = document.getElementById('bubble-container');
    bubbleContainer.appendChild(bubble);
    
    // Remove bubble after animation completes
    setTimeout(() => bubble.remove(), 4000);
}

// Poll for config changes every 2 seconds
setInterval(loadConfig, 2000);

// Initial load
loadConfig();
