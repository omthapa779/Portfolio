    document.addEventListener('DOMContentLoaded', () => {
        const loadingScreen = document.querySelector('.loading-screen');
        const latElement = document.getElementById('latitude');
        const longElement = document.getElementById('longitude');
        
        const FINAL_LAT = "27.7172";
        const FINAL_LONG = "85.3240";
        
        // Continental regions with multiple viewpoints
        const REGIONS = [
            // North America
            { name: 'North America', coords: [
                [-100.5469, 45.7040], // Central
                [-118.2437, 34.0522], // West Coast
                [-73.9352, 40.7306],  // East Coast
                [-114.0719, 51.0447], // Canada
                [-99.1332, 19.4326],  // Mexico
            ], weight: 1 },
            // South America
            { name: 'South America', coords: [
                [-58.9375, -13.2340], // Central
                [-46.6333, -23.5505], // Brazil
                [-70.6483, -33.4489], // Chile
                [-74.0721, 4.7110],   // Colombia
            ], weight: 1 },
            // Europe
            { name: 'Europe', coords: [
                [15.2551, 54.5260],   // Central
                [2.3522, 48.8566],    // Western (Paris)
                [37.6173, 55.7558],   // Eastern (Moscow)
                [12.4964, 41.9028],   // Southern (Rome)
                [18.0686, 59.3293],   // Northern (Stockholm)
            ], weight: 1 },
            // Asia
            { name: 'Asia', coords: [
                [100.6197, 34.0479],  // Central
                [116.4074, 39.9042],  // China
                [139.6503, 35.6762],  // Japan
                [77.2090, 28.6139],   // India
                [103.8198, 1.3521],   // Southeast Asia
            ], weight: 1.2 },         // Slightly higher weight since it's larger
            // Africa
            { name: 'Africa', coords: [
                [19.0000, 8.7832],    // Central
                [31.2357, 30.0444],   // North (Cairo)
                [3.3792, 6.5244],     // West (Lagos)
                [36.8219, -1.2921],   // East (Nairobi)
                [28.0473, -26.2041],  // South (Johannesburg)
            ], weight: 1 },
            // Oceania
            { name: 'Oceania', coords: [
                [133.7751, -25.2744], // Central Australia
                [151.2093, -33.8688], // Sydney
                [174.7633, -41.2865], // New Zealand
                [147.1707, -9.4438],  // Papua New Guinea
            ], weight: 0.8 }          // Slightly lower weight since it's smaller
        ];
        
        // Function to select random region based on weights
        function getRandomRegion() {
            const totalWeight = REGIONS.reduce((sum, region) => sum + region.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const region of REGIONS) {
                random -= region.weight;
                if (random <= 0) {
                    // Get random viewpoint within the selected region
                    const viewpoint = region.coords[Math.floor(Math.random() * region.coords.length)];
                    return {
                        name: region.name,
                        coords: viewpoint
                    };
                }
            }
            return REGIONS[0]; // Fallback to first region
        }
        
        // Get random region and viewpoint
        const randomRegion = getRandomRegion();
        
        // Add some slight randomization to the exact center point
        const jitterAmount = 5; // degrees
        const randomizedCoords = [
            randomRegion.coords[0] + (Math.random() - 0.5) * jitterAmount,
            randomRegion.coords[1] + (Math.random() - 0.5) * jitterAmount
        ];
        
        // Use viewport units for sizing
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Create SVG with 100vw/vh
        const svg = d3.select("#world-map")
            .attr("width", "50%")
            .attr("height", "50vh")
            .attr("viewBox", `2 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Create a group for the map content
        const g = svg.append("g");
        
        // Setup projection using viewport dimensions and random region
        const projection = d3.geoMercator()
            .scale(Math.min(width, height))
            .center(randomizedCoords)
            .translate([width / 2, height / 2]);
        
        const path = d3.geoPath().projection(projection);
        
        // Rest of the code remains the same...
        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
        
        svg.call(zoom);
        
        function zoomToKathmandu() {
            const kathmandu = [85.3240, 27.7172];
            const [x, y] = projection(kathmandu);
            
            const scale = 4;
            const translate = [
                width / 2 - x * scale,
                height / 2 - y * scale
            ];
            
            svg.transition()
                .duration(2500)
                .call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate(translate[0], translate[1])
                        .scale(scale)
                );
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            
            svg.attr("viewBox", `0 0 ${newWidth} ${newHeight}`);
            
            // Update projection to fill viewport
            projection
                .scale(Math.min(newWidth, newHeight))
                .center(randomizedCoords)
                .translate([newWidth / 2, newHeight / 2]);
                
            // Update all paths with new projection
            g.selectAll("path").attr("d", path);
            
            // Update Kathmandu point position
            g.select("circle")
                .attr("cx", projection([85.3240, 27.7172])[0])
                .attr("cy", projection([85.3240, 27.7172])[1]);
        });
        
        // Load and render world map
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
            .then(world => {
                const countries = topojson.feature(world, world.objects.countries);
                
                g.selectAll("path")
                    .data(countries.features)
                    .enter()
                    .append("path")
                    .attr("class", "country")
                    .attr("d", path);
                
                // Add Kathmandu point
                g.append("circle")
                    .attr("cx", projection([85.3240, 27.7172])[0])
                    .attr("cy", projection([85.3240, 27.7172])[1])
                    .attr("r", "0.4vw")
                    .attr("fill", "#34d399");
            });
        
        // Coordinate scramble function
        function randomDigit() {
            return Math.floor(Math.random() * 10);
        }
        
        function scrambleNumber(element, finalNumber) {
            const finalDigits = finalNumber.split('');
            const currentDigits = element.textContent.split('');
            
            finalDigits.forEach((digit, index) => {
                if (digit === '.') return;
                
                let iterations = 0;
                const maxIterations = 20 + Math.random() * 10;
                
                const interval = setInterval(() => {
                    currentDigits[index] = randomDigit();
                    element.textContent = currentDigits.join('');
                    
                    iterations++;
                    if (iterations >= maxIterations) {
                        clearInterval(interval);
                        currentDigits[index] = digit;
                        element.textContent = currentDigits.join('');
                    }
                }, 50);
            });
        }

        // Prepare hero elements before loading sequence completes
        function prepareHeroElements() {
            // Prepare OHM text
            const ohmTitle = document.querySelector('.name_emoji_holder h1');
            if (ohmTitle && !ohmTitle.classList.contains('prepared')) {
                const text = ohmTitle.textContent;
                ohmTitle.innerHTML = '';
                ohmTitle.classList.add('prepared');
                
                // Split each letter into spans for individual animation
                for (let i = 0; i < text.length; i++) {
                    const span = document.createElement('span');
                    span.className = 'ohm-letter';
                    span.textContent = text[i];
                    span.style.transitionDelay = `${0.1 + i * 0.12}s`;
                    ohmTitle.appendChild(span);
                }
            }
            
            // Prepare emoji
            const emoji = document.querySelector('.emoji');
            if (emoji) {
                emoji.classList.add('rise-element');
                emoji.style.transitionDelay = '0.4s';
            }
            
            // Prepare roles
            const roles = document.querySelectorAll('.roles_holder h3');
            roles.forEach((role, index) => {
                role.classList.add('rise-element');
                role.style.transitionDelay = `${0.65 + index * 0.15}s`;
            });
            
            // Prepare button holder elements
            const buttons = document.querySelectorAll('.button_holder > *');
            buttons.forEach((button, index) => {
                button.classList.add('rise-element');
                button.style.transitionDelay = `${0.9 + index * 0.12}s`;
            });
            
            // Prepare works text
            const worksText = document.querySelector('.works_hero');
            if (worksText) {
                worksText.classList.add('rise-element');
                worksText.style.transitionDelay = '1.2s';
            }
        }
        
        // Setup for primary button coordinates effect
        const primaryButton = document.querySelector('.primary_button');
        if (primaryButton) {
            // Generate random coordinates on each page load
            primaryButton.setAttribute('data-lat', (27 + Math.random()).toFixed(4));
            primaryButton.setAttribute('data-long', (85 + Math.random()).toFixed(4));
            
            // Update coordinates on hover
            primaryButton.addEventListener('mousemove', (e) => {
                // Convert mouse position to "coordinate-like" values
                const rect = primaryButton.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Calculate percentage across button and convert to fake coordinates
                const latValue = (27 + (y / rect.height) * 2).toFixed(4);
                const longValue = (85 + (x / rect.width) * 2).toFixed(4);
                
                // Update attributes
                primaryButton.setAttribute('data-lat', latValue);
                primaryButton.setAttribute('data-long', longValue);
            });
        }
    
        // Setup for secondary button pulse effect
        const secondaryButton = document.querySelector('.secondary_s_button');
        if (secondaryButton) {
            // Add multiple pulse waves on click
            secondaryButton.addEventListener('click', () => {
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const wave = document.createElement('div');
                        wave.classList.add('scan-pulse-wave');
                        wave.style.cssText = `
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            width: 0;
                            height: 0;
                            background: radial-gradient(circle, 
                                rgba(52, 211, 153, 0.8) 0%, 
                                rgba(52, 211, 153, 0.3) 40%,
                                transparent 70%);
                            transform: translate(-50%, -50%);
                            border-radius: 50%;
                            z-index: 1;
                            animation: scanPulse 1.5s forwards ease-out;
                        `;
                        secondaryButton.appendChild(wave);
                        
                        // Remove after animation completes
                        setTimeout(() => {
                            wave.remove();
                        }, 1500);
                    }, i * 200); // Staggered start times
                }
            });
        }
        
        function initLiquidEffect() {
            const container = document.querySelector('.liquid-text-container');
            const canvas = document.getElementById('liquidCanvas');
            const ctx = canvas.getContext('2d');
            
            const mouse = { x: -1000, y: -1000 };
            let textPixels = [];
            const text = "OHM";
            
            function setupCanvas() {
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;
                
                const fontSize = Math.min(canvas.width * 0.33, canvas.height * 1.5);
                ctx.font = `900 ${fontSize}px Montserrat`;
                
                createTextParticles();
            }
            
            function createTextParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = getComputedStyle(document.documentElement)
                    .getPropertyValue('--text-color').trim();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Calculate sample resolution based on viewport width
                const sampleResolution = Math.max(
                    2, 
                    Math.floor(window.innerWidth * 0.01)  // 1vw as base resolution
                );
                textPixels = [];
                
                for (let y = 0; y < canvas.height; y += sampleResolution) {
                    for (let x = 0; x < canvas.width; x += sampleResolution) {
                        const index = (y * canvas.width + x) * 4;
                        if (data[index + 3] > 128) {
                            textPixels.push({
                                x: x,
                                y: y,
                                origX: x,
                                origY: y,
                                size: sampleResolution * 1.5  // Adjusted particle size
                            });
                        }
                    }
                }
            }
            
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Calculate influence radius based on viewport width
                const influenceRadius = window.innerWidth * 0.05;  // 5vw
                const pushForce = window.innerWidth * 0.005;      // 0.5vw
                const returnSpeed = 0.1;
                
                for (const pixel of textPixels) {
                    const dx = mouse.x - pixel.x;
                    const dy = mouse.y - pixel.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < influenceRadius) {
                        const force = (influenceRadius - dist) / influenceRadius;
                        const angle = Math.atan2(dy, dx);
                        pixel.x -= Math.cos(angle) * force * pushForce;
                        pixel.y -= Math.sin(angle) * force * pushForce;
                    } else {
                        pixel.x += (pixel.origX - pixel.x) * returnSpeed;
                        pixel.y += (pixel.origY - pixel.y) * returnSpeed;
                    }
                    
                    ctx.beginPath();
                    ctx.arc(pixel.x, pixel.y, pixel.size/2, 0, Math.PI * 2);
                    ctx.fillStyle = getComputedStyle(document.documentElement)
                        .getPropertyValue('--text-color').trim();
                    ctx.fill();
                }
                
                requestAnimationFrame(animate);
            }
            
            container.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
            });
            
            container.addEventListener('mouseleave', () => {
                mouse.x = -1000;
                mouse.y = -1000;
            });
            
            setupCanvas();
            animate();
            
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(setupCanvas, 250);
            });
        }

        
    // Modified timing sequence
    setTimeout(() => {
        scrambleNumber(latElement, FINAL_LAT);
        scrambleNumber(longElement, FINAL_LONG);
        prepareHeroElements();
    }, 1000);
        
    setTimeout(() => {
        zoomToKathmandu();
    }, 2500);
        
    setTimeout(() => {
            loadingScreen.classList.add('fade-out');
    }, 4000);
        
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        // Initialize liquid text effect
        initLiquidEffect();
        // Add animations-ready class after a small delay
        setTimeout(() => {
            document.body.classList.add('animations-ready');
        }, 100);
    }, 5500);
});