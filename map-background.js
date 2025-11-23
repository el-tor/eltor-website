// Animated global map background with relay hops using TopoJSON
class MapBackground {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        this.relayNodes = [];
        this.connections = [];
        this.animationFrame = null;
        this.worldData = null;
        this.projection = null;
        this.pathGenerator = null;
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loadWorldMap();
    }
    
    resize() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
        this.setupProjection();
    }
    
    setupProjection() {
        // Setup map projection
        this.projection = d3.geoEquirectangular()
            .scale(this.canvas.width / (2 * Math.PI))
            .translate([this.canvas.width / 2, this.canvas.height / 2]);
        
        this.pathGenerator = d3.geoPath(this.projection, this.ctx);
    }
    
    async loadWorldMap() {
        try {
            // Load world map data from public CDN
            const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json');
            const topology = await response.json();
            
            // Convert TopoJSON to GeoJSON - use land instead of countries for simplified continents
            this.worldData = topojson.feature(topology, topology.objects.land);
            
            this.setupProjection();
            this.generateRelayNodes();
            this.generateConnections();
            this.animate();
        } catch (error) {
            console.error('Failed to load world map:', error);
            // Fallback to generating nodes without map
            this.generateRelayNodes();
            this.generateConnections();
            this.animate();
        }
    }
    
    generateRelayNodes() {
        // Generate relay nodes scattered randomly on land masses
        const numNodes = 40;
        const maxAttempts = 1000;
        let attempts = 0;
        
        while (this.relayNodes.length < numNodes && attempts < maxAttempts) {
            attempts++;
            
            // Random position
            const x = Math.random();
            const y = 0.15 + Math.random() * 0.6; // Keep nodes in habitable latitudes
            
            const pixelX = x * this.canvas.width;
            const pixelY = y * this.canvas.height;
            
            // Check if this position is on land
            if (this.isOnLand(pixelX, pixelY)) {
                this.relayNodes.push({
                    x: pixelX,
                    y: pixelY,
                    radius: 3 + Math.random() * 2,
                    pulse: Math.random() * Math.PI * 2
                });
            }
        }
        
        // If we couldn't find enough land positions, fill remaining with random positions
        while (this.relayNodes.length < numNodes) {
            const x = Math.random();
            const y = 0.2 + Math.random() * 0.5;
            
            this.relayNodes.push({
                x: x * this.canvas.width,
                y: y * this.canvas.height,
                radius: 3 + Math.random() * 2,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    isOnLand(x, y) {
        if (!this.worldData || !this.projection) return true;
        
        // Convert pixel coordinates to geographic coordinates
        const coords = this.projection.invert([x, y]);
        if (!coords) return false;
        
        const point = {
            type: "Point",
            coordinates: coords
        };
        
        // Check if point intersects with any land feature
        if (this.worldData.type === 'FeatureCollection') {
            return this.worldData.features.some(feature => {
                return d3.geoContains(feature, coords);
            });
        } else {
            return d3.geoContains(this.worldData, coords);
        }
    }
    
    generateConnections() {
        // Create connections between nodes - can cross oceans
        for (let i = 0; i < this.relayNodes.length; i++) {
            const node = this.relayNodes[i];
            const allNodes = this.relayNodes
                .filter((n, idx) => idx !== i)
                .sort((a, b) => {
                    return this.distance(node, a) - this.distance(node, b);
                })
                .slice(0, 5); // Connect to 5 nearest nodes regardless of distance
            
            // Randomly select 2-4 of the nearest nodes to connect to
            const numConnections = 2 + Math.floor(Math.random() * 3);
            const selectedNodes = allNodes.slice(0, numConnections);
            
            selectedNodes.forEach(target => {
                this.connections.push({
                    from: node,
                    to: target,
                    progress: Math.random(),
                    speed: 0.002 + Math.random() * 0.003
                });
            });
        }
    }
    
    distance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw world map continents
        this.drawContinents();
        
        // Draw connections
        this.connections.forEach(conn => {
            this.drawConnection(conn);
        });
        
        // Draw nodes
        this.relayNodes.forEach(node => {
            this.drawNode(node);
        });
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    drawContinents() {
        if (!this.worldData || !this.pathGenerator) return;
        
        // Draw simplified continents without country borders
        this.ctx.fillStyle = 'rgba(60, 60, 60, 0.3)';
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        this.ctx.lineWidth = 1;
        
        // Draw landmasses as single shapes
        this.ctx.beginPath();
        this.pathGenerator(this.worldData);
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawConnection(conn) {
        const { from, to, progress, speed } = conn;
        
        // Update progress
        conn.progress += speed;
        if (conn.progress > 1) {
            conn.progress = 0;
        }
        
        // Draw static line (more visible)
        this.ctx.strokeStyle = 'rgba(144, 99, 215, 0.25)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        
        // Draw animated packet (larger and more visible)
        const packetX = from.x + (to.x - from.x) * progress;
        const packetY = from.y + (to.y - from.y) * progress;
        
        const gradient = this.ctx.createRadialGradient(packetX, packetY, 0, packetX, packetY, 15);
        gradient.addColorStop(0, 'rgba(144, 99, 215, 0.9)');
        gradient.addColorStop(0.4, 'rgba(144, 99, 215, 0.6)');
        gradient.addColorStop(1, 'rgba(144, 99, 215, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(packetX, packetY, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add bright center dot
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(packetX, packetY, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawNode(node) {
        // Pulsing effect
        node.pulse += 0.05;
        const pulseScale = 1 + Math.sin(node.pulse) * 0.4;
        
        // Outer glow (larger and more visible)
        const gradient = this.ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, node.radius * pulseScale * 5
        );
        gradient.addColorStop(0, 'rgba(56, 161, 150, 0.8)');
        gradient.addColorStop(0.5, 'rgba(56, 161, 150, 0.4)');
        gradient.addColorStop(1, 'rgba(56, 161, 150, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius * pulseScale * 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Middle ring
        this.ctx.strokeStyle = 'rgba(56, 161, 150, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius * pulseScale * 2, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Inner node
        this.ctx.fillStyle = 'rgba(56, 161, 150, 1)';
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius * pulseScale * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Core
        this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize map background when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const mapBackground = new MapBackground('map-background');
});
