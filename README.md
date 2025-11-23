# El Tor Website

Official marketing website for El Tor - High Bandwidth Tor Network with Bitcoin Lightning Incentives.

🌐 **Live Site:** https://eltor.app

## About

This repository contains the static website for El Tor, featuring:
- Quick install via curl command
- Platform-specific downloads (macOS, Linux, Windows)
- Installation tutorial video
- Relay operator information
- Dark theme matching the El Tor app

## Local Development

To run locally:

```bash
# Clone the repository
git clone https://github.com/el-tor/eltor-website.git
cd eltor-website

# Open in browser (or use a local server)
open index.html

# Or with Python
python3 -m http.server 8000

# Or with Node.js
npx serve
```

Visit `http://localhost:8000` in your browser.

## DNS Configuration for Custom Domain

To set up the custom domain `eltor.app` with GitHub Pages:

### Step 1: Configure DNS Records

Add the following DNS records in your domain registrar (e.g., Namecheap, Cloudflare, Route53):

#### A Records
Point your apex domain to GitHub Pages servers:

```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

#### CNAME Record (Optional - for www subdomain)
```
Type: CNAME
Name: www
Value: el-tor.github.io
```

### Step 2: Enable GitHub Pages

1. Go to repository Settings → Pages
2. Under "Source", select the `main` branch and root `/` folder
3. Under "Custom domain", enter `eltor.app`
4. Wait for DNS check to complete (can take up to 24 hours)
5. Enable "Enforce HTTPS" once DNS is verified

### Step 3: Verify Setup

- Check DNS propagation: `dig eltor.app`
- Verify CNAME file exists in repository root
- Confirm GitHub Pages is serving from custom domain

### DNS Verification Commands

```bash
# Check A records
dig eltor.app +short

# Check CNAME propagation
dig www.eltor.app +short

# Full DNS info
nslookup eltor.app
```

Expected output should show the GitHub Pages IP addresses.

## Repository Structure

```
eltor-website/
├── index.html          # Main landing page
├── styles.css          # Dark theme styles
├── script.js           # Interactive features
├── install.sh          # Curl installer script
├── CNAME               # Custom domain configuration
├── .nojekyll           # Disable Jekyll processing
├── robots.txt          # SEO configuration
└── README.md           # This file
```

## Technologies

- Pure HTML5, CSS3, JavaScript (no frameworks)
- Dark theme using El Tor brand colors
- Glassmorphism effects
- Responsive design
- Platform detection
- YouTube embed
- GitHub Pages hosting

## Contributing

This is a static marketing site. For issues or improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Related Repositories

- [eltor-app](https://github.com/el-tor/eltor-app) - Desktop application
- [eltord](https://github.com/el-tor/eltord) - Daemon for relay operators
- [eltor](https://github.com/el-tor/eltor) - Core Tor fork
- [eltor-store](https://github.com/el-tor/eltor-store) - Umbrel app store

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 🐛 Report bugs: [GitHub Issues](https://github.com/el-tor/eltor-website/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/el-tor/eltor-app/discussions)
- 📖 Documentation: [Technical Specs](https://github.com/el-tor/eltord/tree/master/spec)

---

Built with 💜 by the El Tor community
