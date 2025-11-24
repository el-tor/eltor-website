// El Tor Website Interactive Scripts

// Version configuration - update this when releasing new versions
const ELTOR_VERSION = '0.0.18';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize features
    initCopyButtons();
    detectPlatform();
    initSmoothScroll();
    setupDownloadLinks();
});

/**
 * Setup download links with direct download URLs
 */
function setupDownloadLinks() {
    const macosCard = document.getElementById('download-macos');
    const linuxCard = document.getElementById('download-linux');
    
    if (macosCard) {
        // Universal macOS DMG
        macosCard.href = `https://github.com/el-tor/eltor-app/releases/download/v${ELTOR_VERSION}/eltor_vpn_${ELTOR_VERSION}_universal.dmg`;
    }
    
    if (linuxCard) {
        // Detect Linux architecture
        const isArm = /aarch64|arm64/i.test(navigator.userAgent) || 
                      /aarch64|arm64/i.test(navigator.platform);
        
        const arch = isArm ? 'arm64' : 'amd64';
        linuxCard.href = `https://github.com/el-tor/eltor-app/releases/download/v${ELTOR_VERSION}/eltor_vpn_${ELTOR_VERSION}_${arch}.deb`;
    }
}

/**
 * Copy to clipboard functionality for install commands
 */
function initCopyButtons() {
    // Main install command copy button
    const copyBtn = document.getElementById('copy-btn');
    const installCommand = document.getElementById('install-command');
    
    if (copyBtn && installCommand) {
        copyBtn.addEventListener('click', () => {
            copyToClipboard(installCommand.textContent, copyBtn);
        });
    }
    
    // Relay install command copy button
    const relayBtn = document.querySelector('.copy-relay-btn');
    const relayCommand = document.querySelector('.relay-terminal code');
    
    if (relayBtn && relayCommand) {
        relayBtn.addEventListener('click', () => {
            copyToClipboard(relayCommand.textContent, relayBtn);
        });
    }
}

/**
 * Copy text to clipboard with visual feedback
 */
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        button.classList.add('copied');
        
        // Change icon to checkmark
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        
        // Reset after 2 seconds
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalHTML;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        fallbackCopy(text);
    });
}

/**
 * Fallback copy method for older browsers
 */
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textarea);
}

/**
 * Detect user's platform and highlight appropriate download button
 */
function detectPlatform() {
    const platform = getPlatform();
    
    console.log('Detected platform:', platform);
    
    // Show Windows install note only on Windows
    const windowsNote = document.querySelector('.windows-only-note');
    console.log('Windows note element:', windowsNote);
    if (windowsNote) {
        if (platform === 'windows') {
            windowsNote.style.display = 'block';
            console.log('Windows note displayed');
        } else {
            windowsNote.style.display = 'none';
            console.log('Windows note hidden (not Windows)');
        }
    }
    
    // Map platform to download card IDs
    const platformMap = {
        'macos': 'download-macos',
        'linux': 'download-linux',
        'windows': 'download-windows'
    };
    
    const cardId = platformMap[platform];
    if (cardId) {
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.add('platform-detected');
            
            // Update download badge text
            const badge = card.querySelector('.download-badge');
            if (badge) {
                badge.textContent = 'Download for your platform';
            }
            
            // Scroll to download section on first visit (optional)
            // Uncomment if you want auto-scroll behavior
            // if (!sessionStorage.getItem('visited')) {
            //     sessionStorage.setItem('visited', 'true');
            //     setTimeout(() => {
            //         card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            //     }, 1000);
            // }
        }
    }
}

/**
 * Get user's platform from user agent and navigator
 */
function getPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    // Check for macOS
    if (platform.includes('mac') || userAgent.includes('mac')) {
        return 'macos';
    }
    
    // Check for Windows
    if (platform.includes('win') || userAgent.includes('win')) {
        return 'windows';
    }
    
    // Check for Linux
    if (platform.includes('linux') || userAgent.includes('linux')) {
        return 'linux';
    }
    
    // Default to null if platform cannot be determined
    return null;
}

/**
 * Smooth scroll for navigation links
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Skip if it's just "#"
            if (href === '#') return;
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Add animation on scroll (optional enhancement)
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate
    const animatedElements = document.querySelectorAll('.feature-card, .download-card, .relay-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize scroll animations (optional - uncomment if desired)
// initScrollAnimations();

/**
 * Track analytics (placeholder for future implementation)
 */
function trackDownload(platform) {
    // Placeholder for analytics tracking
    console.log(`Download initiated for platform: ${platform}`);
    
    // Future: Add Google Analytics, Plausible, or other tracking here
    // Example: gtag('event', 'download', { platform: platform });
}

// Add download tracking to download cards
document.querySelectorAll('.download-card').forEach(card => {
    card.addEventListener('click', () => {
        const platform = card.id.replace('download-', '');
        trackDownload(platform);
    });
});

/**
 * Add keyboard shortcuts for power users
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus on search (if we add search later)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Future: implement search
    }
    
    // Ctrl/Cmd + C when hovering over terminal to copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const activeElement = document.activeElement;
        if (activeElement.closest('.terminal-block')) {
            const code = activeElement.closest('.terminal-block').querySelector('code');
            if (code) {
                copyToClipboard(code.textContent, activeElement.querySelector('.copy-btn'));
            }
        }
    }
});

/**
 * Enhance video loading with YouTube API (optional)
 */
function initYouTubePlayer() {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    // This function will be called when the YouTube API is ready
    window.onYouTubeIframeAPIReady = () => {
        // Future: Add player controls or analytics
        console.log('YouTube API ready');
    };
}

// Uncomment to enable YouTube API features
// initYouTubePlayer();

/**
 * Add "Back to Top" button (optional enhancement)
 */
function initBackToTop() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'back-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--purple-7);
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 1000;
        display: none;
    `;
    
    document.body.appendChild(button);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.display = 'block';
            setTimeout(() => button.style.opacity = '1', 10);
        } else {
            button.style.opacity = '0';
            setTimeout(() => button.style.display = 'none', 300);
        }
    });
    
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
    });
}

// Initialize back to top button (optional - uncomment if desired)
// initBackToTop();

/**
 * Load latest tweets from @eltordev using CORS proxy
 */
async function loadLatestTweets() {
    const tweetsGrid = document.getElementById('tweets-grid');
    if (!tweetsGrid) return;

    const USERNAME = 'eltordev';
    const NUM_TWEETS = 3;

    try {
        // Use CORS proxy to fetch from nitter
        const corsProxy = 'https://corsproxy.io/?';
        const nitterUrl = `https://nitter.net/search?f=tweets&q=${USERNAME}`;
        const response = await fetch(corsProxy + encodeURIComponent(nitterUrl));
        const html = await response.text();

        // Extract tweet IDs from HTML
        const tweetIds = [];
        const regex = /\/eltordev\/status\/(\d+)/g;
        let match;

        while ((match = regex.exec(html)) !== null && tweetIds.length < NUM_TWEETS) {
            const id = match[1];
            if (!tweetIds.includes(id)) {
                tweetIds.push(id);
            }
        }

        if (tweetIds.length > 0) {
            // Clear loading message
            tweetsGrid.innerHTML = '';

            // Create tweet embeds
            tweetIds.forEach(id => {
                const tweetItem = document.createElement('div');
                tweetItem.className = 'tweet-item';
                
                const blockquote = document.createElement('blockquote');
                blockquote.className = 'twitter-tweet';
                blockquote.setAttribute('data-theme', 'dark');
                blockquote.setAttribute('data-dnt', 'true');
                
                const link = document.createElement('a');
                link.href = `https://twitter.com/eltordev/status/${id}`;
                
                blockquote.appendChild(link);
                tweetItem.appendChild(blockquote);
                tweetsGrid.appendChild(tweetItem);
            });

            // Load Twitter widgets to render the tweets
            if (window.twttr && window.twttr.widgets) {
                window.twttr.widgets.load(tweetsGrid);
            }

            console.log(`✅ Loaded ${tweetIds.length} tweets from @${USERNAME}`);
        } else {
            tweetsGrid.innerHTML = '<p style="text-align: center; color: var(--gray-6);">No recent tweets found. Follow <a href="https://x.com/eltordev" target="_blank" style="color: var(--purple-5);">@eltordev</a> on X!</p>';
        }
    } catch (error) {
        console.error('Failed to load tweets:', error);
        tweetsGrid.innerHTML = '<p style="text-align: center; color: var(--gray-6);">Follow <a href="https://x.com/eltordev" target="_blank" style="color: var(--purple-5);">@eltordev</a> on X for the latest updates!</p>';
    }
}

// Load tweets when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadLatestTweets();
});

// Console easter egg for developers
console.log('%cEl Tor', 'font-size: 3rem; font-weight: bold; background: linear-gradient(135deg, #9163d7 0%, #38A196 100%); -webkit-background-clip: text; color: transparent;');
console.log('%cHigh bandwidth Tor network fork\nIncentivized by the Bitcoin Lightning Network', 'font-size: 1rem; color: #9163d7;');
console.log('%c\nWant to contribute? Check out https://github.com/el-tor', 'font-size: 0.9rem; color: #38A196;');
