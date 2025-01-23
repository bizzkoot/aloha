import CountingGame from './games/countingGame.js';

class IntroductionModule {
    constructor() {
        this.currentStep = 0;
        this.mode = 'tutorial'; // 'tutorial' or 'practice'
        this.game = null; // Will hold CountingGame instance
        this.soundManager = window.moduleManager.soundManager;
        this.steps = [
            {
                title: "Welcome to Abacus Training!",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>Hi! I'll help you learn to use the abacus above.</p>
                            <p>We'll start by learning about the different types of beads.</p>
                        </div>
                        <button class="next-btn">Start</button>
                    </div>
                `,
                onEnter: () => {
                    // Clear any highlights when starting
                    window.moduleManager.clearHighlights();
                    // Reset the abacus
                    this.resetAbacus();
                }
            },
            {
                title: "The Upper Beads",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>Look at the rightmost column of the abacus.</p>
                            <p>The <strong>upper bead</strong> is worth 5!</p>
                            <p>Try clicking it to move it down.</p>
                        </div>
                        <div class="counter">Value: <span>0</span></div>
                        <button class="next-btn" style="display: none;">Next</button>
                    </div>
                `,
                onEnter: () => {
                    this.resetAbacus();
                    this.setupUpperBeadListener();
                }
            },
            {
                title: "The Lower Beads",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>Now look at the four beads below.</p>
                            <p>Each of these beads is worth 1!</p>
                            <p>Try moving them up one at a time.</p>
                        </div>
                        <div class="counter">Value: <span>0</span></div>
                        <button class="next-btn" style="display: none;">Next</button>
                    </div>
                `,
                onEnter: () => {
                    this.resetAbacus();
                    this.setupLowerBeadsListener();
                }
            },
            {
                title: "Making Numbers",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>Great job! Now you know:</p>
                            <ul>
                                <li>Upper bead = 5</li>
                                <li>Lower beads = 1 each</li>
                            </ul>
                            <p>Let's practice making the number 7:</p>
                            <ol>
                                <li>Move down the upper bead (5)</li>
                                <li>Move up two lower beads (1+1)</li>
                            </ol>
                        </div>
                        <div class="target">Target: 7</div>
                        <div class="counter">Current: <span>0</span></div>
                        <button class="next-btn" style="display: none;">Next</button>
                    </div>
                `,
                onEnter: () => {
                    this.resetAbacus();
                    this.setupNumberPractice(7);
                }
            },
            {
                title: "Well Done!",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>Excellent! You've learned the basics of the abacus:</p>
                            <ul>
                                <li>Upper bead = 5</li>
                                <li>Lower beads = 1 each</li>
                                <li>Combine them to make numbers!</li>
                            </ul>
                            <p>Are you ready to practice with different numbers?</p>
                        </div>
                        <div class="final-buttons">
                            <button class="start-practice">Start Practice!</button>
                            <button class="restart-tutorial">Review Tutorial</button>
                        </div>
                    </div>
                `,
                onEnter: () => {
                    window.moduleManager.clearHighlights();
                    this.resetAbacus();
                }
            }
        ];
    }

    async initialize() {
        // Add age-specific class to body for styling
        document.body.classList.add('age-5-7');
        
        // Set up initial slide
        this.renderCurrentStep();

        // Set up abacus value observer
        this.setupValueObserver();

        // Listen for return to tutorial event
        window.addEventListener('returnToTutorial', () => {
            this.restartTutorial();
        });
    }

    // Helper method to safely reset a bead
    // Helper to safely reset a bead with proper value update
    resetBeadsInColumn(column, preserveHighlight = true) {
        // Get all beads in correct order (top to bottom)
        const beads = Array.from(column.querySelectorAll('.bead'));
        const upperBead = beads[0];
        const lowerBeads = beads.slice(1);

        // Store which beads were highlighted
        const wasHighlighted = beads.map(bead => bead.classList.contains('highlight'));

        // Reset upper bead first
        if (upperBead.classList.contains('active')) {
            upperBead.classList.remove('wrong');
            upperBead.classList.remove('active');
        }

        // Then reset lower beads in reverse order
        for (let i = lowerBeads.length - 1; i >= 0; i--) {
            const bead = lowerBeads[i];
            if (bead.classList.contains('active')) {
                bead.classList.remove('wrong');
                bead.classList.remove('active');
            }
        }

        // Restore highlights if needed
        if (preserveHighlight) {
            beads.forEach((bead, index) => {
                if (wasHighlighted[index]) {
                    bead.classList.add('highlight');
                }
            });
        }

        // Update the value after resetting beads
        window.abacus.calculateValue();
    }

    resetBead(bead, resetEntireColumn = false) {
        if (resetEntireColumn) {
            const column = bead.closest('.column');
            if (column) {
                this.resetBeadsInColumn(column, true); // preserve highlights
                return;
            }
        }

        const wasHighlighted = bead.classList.contains('highlight');
        if (bead.classList.contains('active')) {
            bead.classList.remove('wrong');
            bead.classList.remove('active');
            if (wasHighlighted) {
                bead.classList.add('highlight');
            }
            window.abacus.calculateValue();
        }
    }

    resetAbacus() {
        const abacus = window.moduleManager.getAbacus();
        if (!abacus) return;

        // First clear all highlights
        window.moduleManager.clearHighlights();

        // Then reset columns top to bottom
        const columns = abacus.querySelectorAll('.column');
        columns.forEach(column => this.resetBeadsInColumn(column));

        // Ensure the value display is reset
        const valueDisplay = document.getElementById('currentValue');
        if (valueDisplay) {
            valueDisplay.textContent = '0';
        }
    }

    setupValueObserver() {
        // Watch for changes to the current value display
        const valueDisplay = document.getElementById('currentValue');
        if (valueDisplay) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        this.onValueChange(parseInt(mutation.target.textContent));
                    }
                });
            });
            
            observer.observe(valueDisplay, {
                childList: true
            });

            this.valueObserver = observer;
        }
    }

    onValueChange(value) {
        if (this.mode === 'practice') {
            return; // Let the game handle value changes in practice mode
        }

        // Update any counter displays in the tutorial step
        const counter = document.querySelector('.intro-slide .counter span');
        if (counter) {
            counter.textContent = value;

            // Check if we're in a practice step
            if (this.currentStep === 3 && value === 7) {
                const nextBtn = document.querySelector('.next-btn');
                if (nextBtn) {
                    nextBtn.style.display = 'block';
                    this.showFeedback("Perfect! You've made the number 7!", 'success');
                }
            }
        }
    }

    renderCurrentStep() {
        const panel = document.querySelector('#training-panel .panel-content');
        if (!panel) return;

        if (this.mode === 'practice') {
            // Initialize the practice game if not already done
            if (!this.game) {
                this.game = new CountingGame(this.soundManager);
            }
            this.game.initialize(panel);
        } else {
            // Render tutorial step
            const step = this.steps[this.currentStep];
            panel.innerHTML = `
                <h3>${step.title}</h3>
                ${step.content}
            `;

            this.attachStepHandlers();
            
            // Call onEnter if it exists
            if (step.onEnter) {
                step.onEnter();
            }
        }
    }

    showFeedback(message, type = 'success') {
        const instruction = document.querySelector('.instruction');
        if (instruction) {
            const feedbackMsg = document.createElement('div');
            feedbackMsg.className = `feedback-message ${type}`;
            feedbackMsg.textContent = message;
            
            // Remove any existing feedback message
            const existingFeedback = instruction.querySelector('.feedback-message');
            if (existingFeedback) {
                existingFeedback.remove();
            }
            
            instruction.appendChild(feedbackMsg);
        }
    }

    setupUpperBeadListener() {
        const abacus = window.moduleManager.getAbacus();
        if (!abacus) return;

        const columns = Array.from(abacus.querySelectorAll('.column'));
        const targetColumnIndex = columns.length - 1;
        const targetColumn = columns[targetColumnIndex];
        
        // Track beads in target column
        const targetBeads = Array.from(targetColumn.querySelectorAll('.bead'));
        const targetUpperBead = targetBeads[0];

        // Variables to track state
        let isCorrectBeadMoved = false;
        let isProcessingWrongBead = false;

        // Highlight the target upper bead
        window.moduleManager.highlightBeads(targetColumnIndex, [0]);
        const nextBtn = document.querySelector('.next-btn');

        // Set up observers for all columns
        this.currentObservers = [];

        columns.forEach((column, columnIndex) => {
            const beads = Array.from(column.querySelectorAll('.bead'));
            const upperBead = beads[0];
            const lowerBeads = beads.slice(1);

            // Handle upper bead
            if (columnIndex === targetColumnIndex) {
                // Target column - check for correct move
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        if (mutation.attributeName === 'class') {
                            if (upperBead.classList.contains('active') && !isCorrectBeadMoved) {
                                isCorrectBeadMoved = true;
                                nextBtn.style.display = 'block';
                                this.showFeedback("Great job! That's the 5-bead.", 'success');
                            } else if (!upperBead.classList.contains('active') && isCorrectBeadMoved) {
                                isCorrectBeadMoved = false;
                                nextBtn.style.display = 'none';
                            }
                        }
                    });
                });
                observer.observe(upperBead, { attributes: true });
                this.currentObservers.push(observer);
            } else {
                // Other columns - handle wrong moves
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        if (!isProcessingWrongBead && mutation.attributeName === 'class' && upperBead.classList.contains('active')) {
                            isProcessingWrongBead = true;
                            upperBead.classList.add('wrong');
                            this.showFeedback("Try clicking the highlighted 5-bead in the rightmost column!", 'error');
                            
                            setTimeout(() => {
                                this.resetBead(upperBead, true); // true to reset entire column
                                isProcessingWrongBead = false;
                                window.abacus.calculateValue(); // Ensure value updates after reset
                            }, 500);
                        }
                    });
                });
                observer.observe(upperBead, { attributes: true });
                this.currentObservers.push(observer);
            }

            // Handle lower beads - all wrong in this step
            lowerBeads.forEach(bead => {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        if (!isProcessingWrongBead && mutation.attributeName === 'class' && bead.classList.contains('active')) {
                            isProcessingWrongBead = true;
                            bead.classList.add('wrong');
                            this.showFeedback("That's a 1-bead. Try clicking the highlighted 5-bead!", 'error');
                            
                            setTimeout(() => {
                                this.resetBead(bead, true); // true to reset entire column
                                isProcessingWrongBead = false;
                                window.abacus.calculateValue(); // Ensure value updates after reset
                            }, 500);
                        }
                    });
                });
                observer.observe(bead, { attributes: true });
                this.currentObservers.push(observer);
            });
        });
    }

    setupLowerBeadsListener() {
        const abacus = window.moduleManager.getAbacus();
        if (!abacus) return;

        const columns = Array.from(abacus.querySelectorAll('.column'));
        const targetColumnIndex = columns.length - 1;
        const targetColumn = columns[targetColumnIndex];

        // Track beads in target column
        const targetBeads = Array.from(targetColumn.querySelectorAll('.bead'));
        const targetLowerBeads = targetBeads.slice(1);

        // Variables to track state
        let isProcessingWrongBead = false;

        // Re-enable highlighting with simpler CSS implementation
        window.moduleManager.highlightBeads(targetColumnIndex, [1, 2, 3, 4]);
        const nextBtn = document.querySelector('.next-btn');

        const checkProgress = () => {
            if (isProcessingWrongBead) return;
            
            const activeCount = targetLowerBeads.filter(bead => bead.classList.contains('active')).length;
            if (activeCount >= 2) {
                nextBtn.style.display = 'block';
                this.showFeedback(`Great! You've moved ${activeCount} beads. Each one is worth 1.`, 'success');
            } else {
                nextBtn.style.display = 'none';
            }
        };

        // Set up observers for all columns
        this.currentObservers = [];

        columns.forEach((column, columnIndex) => {
            const beads = Array.from(column.querySelectorAll('.bead'));
            const upperBead = beads[0];
            const lowerBeads = beads.slice(1);

            // Handle wrong upper bead clicks
            const upperObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (!isProcessingWrongBead && mutation.attributeName === 'class' && upperBead.classList.contains('active')) {
                        isProcessingWrongBead = true;
                        upperBead.classList.add('wrong');
                        this.showFeedback("That's the 5-bead! Try clicking the highlighted 1-beads below.", 'error');
                        
                            setTimeout(() => {
                                this.resetBead(upperBead, true); // true to reset entire column
                                isProcessingWrongBead = false;
                                window.abacus.calculateValue(); // Ensure value updates after reset
                            }, 500);
                    }
                });
            });
            upperObserver.observe(upperBead, { attributes: true });
            this.currentObservers.push(upperObserver);

            // Handle lower beads
            lowerBeads.forEach(bead => {
                const observer = new MutationObserver((mutations) => {
                    if (isProcessingWrongBead) return;

                    mutations.forEach(mutation => {
                        if (mutation.attributeName === 'class') {
                            if (columnIndex === targetColumnIndex) {
                                // Right column - check progress
                                checkProgress();
                            } else if (bead.classList.contains('active')) {
                                // Wrong column - show error and reset
                                isProcessingWrongBead = true;
                                bead.classList.add('wrong');
                                this.showFeedback("Try clicking the highlighted beads in the rightmost column!", 'error');
                                
                            setTimeout(() => {
                                this.resetBead(bead, true); // true to reset entire column
                                isProcessingWrongBead = false;
                                window.abacus.calculateValue(); // Ensure value updates after reset
                            }, 500);
                            }
                        }
                    });
                });
                observer.observe(bead, { attributes: true });
                this.currentObservers.push(observer);
            });
        });

        // Initial check
        checkProgress();
    }

    setupNumberPractice(targetNumber) {
        const abacus = window.moduleManager.getAbacus();
        if (!abacus) return;

        this.resetAbacus();
        
        // Variables to track state
        let isProcessingWrongBead = false;
        let messageTimeout;
        
        const counter = document.querySelector('.intro-slide .counter span');
        const nextBtn = document.querySelector('.next-btn');

        const checkProgress = () => {
            if (isProcessingWrongBead) return;
            
            const currentValue = parseInt(document.getElementById('currentValue').textContent);
            
            if (messageTimeout) {
                clearTimeout(messageTimeout);
                messageTimeout = null;
            }

            if (currentValue === targetNumber) {
                nextBtn.style.display = 'block';
                this.showFeedback(`Perfect! You've made the number ${targetNumber}!`, 'success');
            } else if (currentValue > targetNumber) {
                this.showFeedback(`That's too high! Try to make exactly ${targetNumber}.`, 'error');
                
                // Auto-reset beads after delay
                isProcessingWrongBead = true;
                messageTimeout = setTimeout(() => {
                    this.resetAbacus();
                    this.showFeedback(`Let's try again to make ${targetNumber}!`, 'error');
                    isProcessingWrongBead = false;
                    window.abacus.calculateValue(); // Ensure value updates after reset
                }, 1500);
            }
        };

        // Set up observers for all columns
        const columns = Array.from(abacus.querySelectorAll('.column'));
        this.currentObservers = [];

        columns.forEach((column, columnIndex) => {
            const beads = Array.from(column.querySelectorAll('.bead'));
            
            beads.forEach(bead => {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        if (!isProcessingWrongBead && mutation.attributeName === 'class') {
                            checkProgress();
                        }
                    });
                });
                observer.observe(bead, { attributes: true });
                this.currentObservers.push(observer);
            });
        });

        // Set up value observer
        const valueDisplay = document.getElementById('currentValue');
        if (valueDisplay) {
            this.currentObserver = new MutationObserver(() => {
                if (!isProcessingWrongBead) {
                    checkProgress();
                }
            });
            this.currentObserver.observe(valueDisplay, { childList: true });
        }

        // Initial check
        checkProgress();
    }

    attachStepHandlers() {
        const panel = document.querySelector('#training-panel .panel-content');
        
        // Next button handler
        const nextBtn = panel.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.onclick = () => this.nextStep();
        }

        // Start practice button handler
        const startBtn = panel.querySelector('.start-practice');
        if (startBtn) {
            startBtn.onclick = () => this.startPractice();
        }

        // Restart tutorial button handler
        const restartBtn = panel.querySelector('.restart-tutorial');
        if (restartBtn) {
            restartBtn.onclick = () => this.restartTutorial();
        }
    }

    nextStep() {
        // Clean up all observers
        if (this.currentObserver) {
            this.currentObserver.disconnect();
            this.currentObserver = null;
        }
        if (this.currentObservers) {
            this.currentObservers.forEach(observer => observer.disconnect());
            this.currentObservers = [];
        }

        // Ensure proper cleanup
        const abacus = window.moduleManager.getAbacus();
        if (abacus) {
            // Reset all beads to initial state
            const columns = Array.from(abacus.querySelectorAll('.column'));
            columns.forEach(column => {
                const beads = Array.from(column.querySelectorAll('.bead'));
                beads.forEach(bead => {
                    if (bead.classList.contains('active')) {
                        // Reset bead state properly
                        this.resetBead(bead);
                    }
                });
            });
        }

        // Clear all highlights and states
        window.moduleManager.clearHighlights();

        // Move to next step
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderCurrentStep();
        }
    }

    startPractice() {
        this.cleanupCurrentMode();
        this.mode = 'practice';
        this.renderCurrentStep();
    }

    restartTutorial() {
        this.cleanupCurrentMode();
        this.mode = 'tutorial';
        this.currentStep = 0;
        this.renderCurrentStep();
    }

    cleanupCurrentMode() {
        // Clean up game if in practice mode
        if (this.mode === 'practice' && this.game) {
            this.game.cleanup();
            this.game = null;
        }

        // Clean up observers
        if (this.currentObserver) {
            this.currentObserver.disconnect();
            this.currentObserver = null;
        }
        if (this.currentObservers) {
            this.currentObservers.forEach(observer => observer.disconnect());
            this.currentObservers = [];
        }

        // Reset abacus and clear highlights
        this.resetAbacus();
        window.moduleManager.clearHighlights();
    }

    cleanup() {
        // Clean up the current mode
        this.cleanupCurrentMode();

        // Clean up value observer
        if (this.valueObserver) {
            this.valueObserver.disconnect();
            this.valueObserver = null;
        }

        // Remove age-specific class
        document.body.classList.remove('age-5-7');

        // Ensure game is cleaned up
        if (this.game) {
            this.game.cleanup();
            this.game = null;
        }
    }
}

export default IntroductionModule;
