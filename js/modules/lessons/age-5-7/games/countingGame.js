/**
 * Core Counting Game Module for Age 5-7
 */
class CountingGame {
    constructor(soundManager) {
        this.soundManager = soundManager;
        this.currentLevel = 1;
        this.score = 0;
        this.maxLevel = 5;
        this.gameState = 'ready';
        this.numberHistory = [];
        this.levelConfig = {
            1: {
                max: 5,
                visual: '⭐',
                description: 'Practice with small numbers 1-5',
                encouragement: 'Great start! Let\'s count together!'
            },
            2: {
                max: 9,
                visual: '🌟',
                description: 'Try numbers from 1 to 9',
                encouragement: 'You\'re doing great with bigger numbers!'
            },
            3: {
                max: 15,
                visual: '�',
                description: 'Now try bigger numbers up to 15',
                encouragement: 'Wow! You\'re ready for teen numbers!'
            },
            4: {
                max: 20,
                visual: '🎯',
                description: 'Challenge yourself with numbers up to 20',
                encouragement: 'Amazing! You\'re almost a master!'
            },
            5: {
                max: 20,
                visual: '�',
                description: 'Master all numbers from 1-20!',
                encouragement: 'You\'re a counting champion!'
            }
        };
    }

    initialize(container) {
        try {
            if (!container) throw new Error('Container element required');

            this.container = container;
            this.container.classList.add('counting-game');

            // Create main content container
            const content = document.createElement('div');
            content.className = 'game-content';

            // Add resize handle
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            resizeHandle.setAttribute('role', 'separator');
            resizeHandle.setAttribute('aria-label', 'Resize game panel');

            this.container.appendChild(resizeHandle);
            this.container.appendChild(content);
            this.contentContainer = content;

            // Initialize game
            this.numberHistory = [];
            this.gameState = 'playing';
            this.setupAbacusObserver();
            this.setupResizeHandling(resizeHandle);
            this.resetAbacus();

            // Mark abacus container as game active
            const abacusContainer = document.getElementById('abacusContainer');
            if (abacusContainer) {
                requestAnimationFrame(() => {
                    abacusContainer.classList.add('game-active');
                    this.container.classList.add('active');
                });
            }

            this.render();

        } catch (error) {
            console.error('Game initialization error:', error);
            this.showError('Failed to initialize game');
        }
    }

    setupResizeHandling(handle) {
        let startX, startWidth, startY, startHeight;
        const isMobile = window.innerWidth <= 768;
        const isLandscape = window.innerWidth > window.innerHeight;

        const startResize = (e) => {
            startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            startWidth = this.container.offsetWidth;
            startHeight = this.container.offsetHeight;
            document.addEventListener('mousemove', resize);
            document.addEventListener('touchmove', resize);
            document.addEventListener('mouseup', stopResize);
            document.addEventListener('touchend', stopResize);
        };

        const resize = (e) => {
            if (isMobile && !isLandscape) {
                // Vertical resize for mobile portrait
                const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                const deltaY = startY - currentY;
                const newHeight = Math.min(Math.max(startHeight + deltaY, window.innerHeight * 0.3), window.innerHeight * 0.7);
                this.container.style.height = `${newHeight}px`;

                const abacusContainer = document.getElementById('abacusContainer');
                if (abacusContainer) {
                    abacusContainer.style.height = `${window.innerHeight - newHeight}px`;
                }
            } else {
                // Horizontal resize for desktop and landscape
                const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                const deltaX = startX - currentX;
                const newWidth = Math.min(Math.max(startWidth + deltaX, 280), window.innerWidth * 0.4);
                this.container.style.width = `${newWidth}px`;

                const abacusContainer = document.getElementById('abacusContainer');
                if (abacusContainer) {
                    abacusContainer.style.width = `calc(100% - ${newWidth}px)`;
                }
            }
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('touchmove', resize);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchend', stopResize);
        };

        handle.addEventListener('mousedown', startResize);
        handle.addEventListener('touchstart', startResize);
    }

    setupAbacusObserver() {
        const valueDisplay = document.getElementById('currentValue');
        if (!valueDisplay) return;

        this.valueObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    this.handleValueChange(parseInt(mutation.target.textContent));
                }
            });
        });

        this.valueObserver.observe(valueDisplay, { childList: true });
    }

    handleValueChange(value) {
        if (value === 0 || this.gameState !== 'playing') return;

        const targetNumber = this.getTargetNumber();
        if (!targetNumber) return;

        if (value > this.levelConfig[this.currentLevel].max) {
            this.showError('That number is too big for this level!');
            return;
        }

        if (value === targetNumber) {
            this.handleSuccess();
        }
    }

    render() {
        if (!this.contentContainer) return;

        this.contentContainer.innerHTML = '';

        if (this.gameState === 'completed') {
            this.showCompletion();
            return;
        }

        const config = this.levelConfig[this.currentLevel];
        const targetNumber = this.generateTargetNumber();

        this.contentContainer.innerHTML = `
            <div class="game-header">
                <div class="level-info">Level ${this.currentLevel} ${config.visual}</div>
                <div class="score-info">Score: ${this.score}</div>
            </div>

            <div class="target-section">
                <div class="instruction">Make this number:</div>
                <div class="target-container">
                    <div class="number" data-value="${targetNumber}">
                        ${targetNumber}
                    </div>
                    <div class="visual-aid">${Array(targetNumber).fill(config.visual).join(' ')}</div>
                </div>
            </div>

            <div class="controls-section">
                <button class="check-btn">Check Answer</button>
                <button class="hint-btn">Need Help?</button>
                <button class="reset-btn">Reset</button>
            </div>

            <div class="feedback-section"></div>

            ${this.currentLevel < this.maxLevel ? `
                <div class="progress-section">
                    ${Math.floor((this.score / (this.currentLevel * 50)) * 100)}% to Level ${this.currentLevel + 1}
                </div>
            ` : ''}
        `;

        this.attachHandlers();
    }

    attachHandlers() {
        const checkBtn = this.contentContainer.querySelector('.check-btn');
        const hintBtn = this.contentContainer.querySelector('.hint-btn');
        const resetBtn = this.contentContainer.querySelector('.reset-btn');

        if (checkBtn) checkBtn.onclick = () => this.checkAnswer();
        if (hintBtn) hintBtn.onclick = () => this.showHint();
        if (resetBtn) resetBtn.onclick = () => this.resetAbacus();
    }

    generateTargetNumber() {
        const config = this.levelConfig[this.currentLevel];
        const numbers = Array.from({length: config.max}, (_, i) => i + 1)
            .filter(n => !this.numberHistory.includes(n));

        if (numbers.length === 0) {
            this.numberHistory = [];
            return this.generateTargetNumber();
        }

        const number = numbers[Math.floor(Math.random() * numbers.length)];
        this.numberHistory.push(number);
        return number;
    }

    getTargetNumber() {
        const element = this.contentContainer?.querySelector('.target-container .number');
        return element ? parseInt(element.dataset.value) : null;
    }

    getCurrentValue() {
        const element = document.getElementById('currentValue');
        return element ? parseInt(element.textContent) : null;
    }

    checkAnswer() {
        const current = this.getCurrentValue();
        const target = this.getTargetNumber();

        if (current === null || target === null) {
            this.showError('Unable to check answer');
            return;
        }

        if (current === target) this.handleSuccess();
        else this.handleError(current, target);
    }

    handleSuccess() {
        this.score += this.currentLevel * 10;
        this.soundManager?.play('success');

        const feedback = this.contentContainer.querySelector('.feedback-section');
        if (!feedback) return;

        feedback.innerHTML = `
            <div class="success-message">
                <div class="countdown">5</div>
                <p>Correct! +${this.currentLevel * 10} points</p>
                <button class="next-btn">Continue</button>
                <div class="countdown-hint">Move mouse/touch screen to cancel auto-continue</div>
            </div>
        `;

        const nextBtn = feedback.querySelector('.next-btn');
        if (nextBtn) nextBtn.onclick = () => this.handleNext();

        // Start countdown
        let countdown = 5;
        const countdownEl = feedback.querySelector('.countdown');
        let autoNextTimer = setInterval(() => {
            countdown--;
            if (countdownEl) countdownEl.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(autoNextTimer);
                this.handleNext();
            }
        }, 1000);

        // Cancel countdown on user interaction
        const cancelCountdown = () => {
            clearInterval(autoNextTimer);
            if (countdownEl) countdownEl.style.display = 'none';
            feedback.querySelector('.countdown-hint')?.remove();
        };

        feedback.addEventListener('mousemove', cancelCountdown);
        feedback.addEventListener('touchstart', cancelCountdown);
    }

    handleNext() {
        // Always reset abacus first
        this.resetAbacus();

        if (this.score >= this.currentLevel * 50) {
            if (this.currentLevel < this.maxLevel) {
                this.levelUp();
            } else {
                this.gameState = 'completed';
                this.soundManager?.play('achievement');
                this.showCompletion();
            }
        } else {
            this.render();
        }
    }

    showCompletion() {
        if (!this.contentContainer) return;

        // Clear existing content
        this.contentContainer.innerHTML = '';

        // Create completion screen
        const completion = document.createElement('div');
        completion.className = 'completion-section';
        completion.innerHTML = `
            <h2>🎉 Congratulations! 🎉</h2>
            <p>You've mastered all levels!</p>
            <div class="final-score">Final Score: ${this.score}</div>
            <button class="restart-btn">Play Again</button>
        `;

        this.contentContainer.appendChild(completion);

        // Add event listener to restart button
        const restartBtn = completion.querySelector('.restart-btn');
        if (restartBtn) {
            restartBtn.onclick = () => {
                this.currentLevel = 1;
                this.score = 0;
                this.gameState = 'playing';
                this.numberHistory = [];
                this.render();
            };
        }
    }

    levelUp() {
        this.currentLevel++;
        this.numberHistory = [];
        this.soundManager?.play('achievement');
        // Reset abacus when changing levels
        this.resetAbacus();
        this.render();
    }

    showHint() {
        const target = this.getTargetNumber();
        if (!target) return;

        const feedback = this.contentContainer.querySelector('.feedback-section');
        if (!feedback) return;

        const hint = target >= 5
            ? `Move down the 5-bead${target > 5 ? ` and move up ${target - 5} one-beads` : ''}`
            : `Move up ${target} one-beads`;

        feedback.innerHTML = `
            <div class="hint-message">
                <p>${hint}</p>
            </div>
        `;
    }

    showError(message) {
        const feedback = this.contentContainer?.querySelector('.feedback-section');
        if (!feedback) return;

        feedback.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button class="reset-btn">Reset</button>
            </div>
        `;

        const resetBtn = feedback.querySelector('.reset-btn');
        if (resetBtn) resetBtn.onclick = () => this.resetAbacus();
    }

    resetAbacus() {
        const abacus = window.moduleManager.getAbacus();
        if (!abacus) return;

        const beads = abacus.querySelectorAll('.bead.active');
        beads.forEach(bead => bead.classList.remove('active'));
        window.abacus.calculateValue();
    }

    cleanup() {
        if (this.valueObserver) {
            this.valueObserver.disconnect();
            this.valueObserver = null;
        }

        const abacusContainer = document.getElementById('abacusContainer');

        this.resetAbacus();

        // Function to restore abacus container
        const restoreAbacusContainer = () => {
            if (!abacusContainer) return;

            // Remove any game-specific classes
            abacusContainer.classList.remove('game-active');

            // Clear all styles
            abacusContainer.removeAttribute('style');

            // Force reflow
            void abacusContainer.offsetHeight;

            // Set transition for smooth restore
            abacusContainer.style.transition = 'all 0.3s ease-out';

            // Ensure proper display
            abacusContainer.style.display = 'flex';
            abacusContainer.style.visibility = 'visible';
            abacusContainer.style.opacity = '1';
            abacusContainer.style.width = '';
            abacusContainer.style.height = '';
            abacusContainer.style.transform = 'none';
        };

        // Clean up game container with transition
        if (this.container) {
            this.container.classList.remove('active');
            this.container.style.opacity = '0';

            // Wait for transition and then clean up
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }

                // Restore abacus after container is removed
                requestAnimationFrame(() => {
                    restoreAbacusContainer();

                    // Force final value update
                    setTimeout(() => {
                        window.abacus?.calculateValue();
                    }, 50);
                });
            }, 300);
        } else {
            restoreAbacusContainer();
        }

        // Reset all game state
        this.container = null;
        this.contentContainer = null;
        this.gameState = 'ready';
        this.numberHistory = [];
        this.currentLevel = 1;
        this.score = 0;

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);

        // Ensure main abacus is visible and interactive
        const mainAbacus = document.querySelector('.abacus');
        if (mainAbacus) {
            mainAbacus.style.display = 'flex';
            mainAbacus.style.visibility = 'visible';
            mainAbacus.style.opacity = '1';
        }

        // Watcher to reload abacus when game window is closed
        const gameWindow = document.querySelector('.counting-game');
        if (gameWindow) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && !gameWindow.contains(document.querySelector('.counting-game'))) {
                        restoreAbacusContainer();
                    }
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
}

export default CountingGame;