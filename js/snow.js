/* JAVASCRIPT LOGIC */
        const canvasElement = document.getElementById("snow-canvas");
        const canvasContext = canvasElement.getContext("2d");

        let viewportWidth = window.innerWidth;
        let viewportHeight = window.innerHeight;
        const snowflakeCollection = [];
        const totalSnowflakeCount = 150;

        /**
         * Ensures the canvas always fills the entire browser window.
         */
        function resizeCanvasToWindow() {
            viewportWidth = window.innerWidth;
            viewportHeight = window.innerHeight;
            canvasElement.width = viewportWidth;
            canvasElement.height = viewportHeight;
        }

        window.addEventListener("resize", resizeCanvasToWindow);
        resizeCanvasToWindow();

        /**
         * Represents a single snowflake particle.
         * Using a Class is a "Good Practice" for organized object-oriented code.
         */
        class Snowflake {
            constructor() {
                this.initializeProperties();
            }

            initializeProperties() {
                // Randomize horizontal and vertical starting positions
                this.horizontalCoordinate = Math.random() * viewportWidth;
                this.verticalCoordinate = Math.random() * viewportHeight;
                
                // Randomize size and movement for a natural look
                this.particleRadius = Math.random() * 3 + 1;
                this.fallVelocity = Math.random() * 1.5 + 0.5;
                this.horizontalDrift = Math.random() * 1 - 0.5; // Slight left/right sway
                this.opacityLevel = Math.random() * 0.8 + 0.2;
            }

            updateMovement() {
                this.verticalCoordinate += this.fallVelocity;
                this.horizontalCoordinate += this.horizontalDrift;

                // Reset snowflake to top once it leaves the bottom of the screen
                if (this.verticalCoordinate > viewportHeight) {
                    this.verticalCoordinate = -10;
                    this.horizontalCoordinate = Math.random() * viewportWidth;
                }
            }

            drawToCanvas() {
                canvasContext.beginPath();
                canvasContext.arc(
                    this.horizontalCoordinate, 
                    this.verticalCoordinate, 
                    this.particleRadius, 
                    0, 
                    Math.PI * 2
                );
                canvasContext.fillStyle = `rgba(255, 255, 255, ${this.opacityLevel})`;
                canvasContext.fill();
            }
        }

        /**
         * Create the initial set of snowflake objects.
         */
        function createSnowfallEffect() {
            for (let i = 0; i < totalSnowflakeCount; i++) {
                snowflakeCollection.push(new Snowflake());
            }
        }

        /**
         * The main animation loop.
         */
        function renderAnimationLoop() {
            // Clear the previous frame to prevent "smearing"
            canvasContext.clearRect(0, 0, viewportWidth, viewportHeight);

            // Update and draw every snowflake in the collection
            snowflakeCollection.forEach((snowflake) => {
                snowflake.updateMovement();
                snowflake.drawToCanvas();
            });

            // Request next frame (Best practice for smooth 60fps performance)
            requestAnimationFrame(renderAnimationLoop);
        }

        // Start the engine
        createSnowfallEffect();
        renderAnimationLoop();