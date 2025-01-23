/**
 * Counting Game Module for Age 5-7
 * Provides interactive counting exercises with increasing difficulty
 */
class CountingGame {
    constructor(soundManager) {
        this.soundManager = soundManager;
        this.currentLevel = 1;
        this.score = 0;
        this.maxLevel = 5;
        this.gameState = 'ready'; // ready, playing, completed
        
        // Load dedicated number display styles
        this.loadNumberStyles();
        this.levelConfig = {
            1: { max: 5, visual: '⭐', description: 'Practice with small numbers 1-5' },
            2: { max: 9, visual: '🌟', description: 'Try numbers from 1 to 9' },
            3: { max: 15, visual: '🎈', description: 'Now try bigger numbers up to 15' },
            4: { max: 20, visual: '🎯', description: 'Challenge yourself with numbers up to 20' },
            5: { max: 20, visual: '🏆', description: 'Master all numbers from 1-20!' }
        };
        this.valueObserver = null;
        this.numberHistory = []; // Track recently used numbers
    }

    loadNumberStyles() {
        const styleId = 'number-display-styles';
        if (!document.getElementById(styleId)) {
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = '/js/modules/lessons/age-5-7/games/number-display.css';
            document.head.appendChild(link);
        }
    }

    initialize(container) {
        this.container = container;
        this.setupAbacusValueObserver();
        this.numberHistory = []; // Clear history on init
        this.resetAbacus(); // Ensure abacus is in initial state
        this.gameState = 'playing'; // Set game state to playing
        this.render();
    }

    setupAbacusValueObserver() {
        // Watch for changes to the current value display
        const valueDisplay = document.getElementById('currentValue');
        if (valueDisplay && !this.valueObserver) {
            this.valueObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        this.onAbacusValueChange(parseInt(mutation.target.textContent));
                    }
                });
            });
            
            this.valueObserver.observe(valueDisplay, {
                childList: true
            });
        }
    }

    onAbacusValueChange(value) {
        // Don't do anything if value is 0 (initial state)
        if (value === 0) {
            return;
        }
        
        const targetNumber = parseInt(this.container.querySelector('.big-number')?.textContent || '0');
        const feedback = this.container.querySelector('.feedback-area');
        
        // Only process if game is in playing state
        if (this.gameState === 'playing') {
            if (value > this.levelConfig[this.currentLevel].max) {
                // Show error for exceeding level maximum
                feedback.innerHTML = `
                    <div class="error-message">
                        <p>That number is too big for this level!</p>
                        <button class="reset-btn">Reset Beads</button>
                    </div>
                `;
                
                const resetBtn = feedback.querySelector('.reset-btn');
                if (resetBtn) {
                    resetBtn.onclick = () => {
                        this.resetAbacus();
                        feedback.innerHTML = '';
                    };
                }
            } else if (value === targetNumber) {
                // Show success message only when correct number is achieved
                this.handleCorrectAnswer();
            } else {
                // Clear any existing feedback while user is working
                feedback.innerHTML = '';
            }
        }
    }

    render() {
        if (this.gameState === 'completed') {
            this.renderGameCompletion();
            return;
        }

        const config = this.levelConfig[this.currentLevel];
        this.container.innerHTML = `
            <div class="counting-game">
                <div class="game-header">
                    <div class="level-info">Level ${this.currentLevel} ${config.visual}</div>
                    <div class="score-info">Score: ${this.score}</div>
                </div>
                
                <div class="game-content">
                    <div class="level-description">
                        <p>${config.description}</p>
                    </div>

                    <div class="target-number">
                        <div class="instruction">Make this number:</div>
                        <div class="big-number">${this.generateTargetNumber()}</div>
                        <div class="hint">
                            <span class="hint-icon">💡</span>
                            Move the beads to show this value
                        </div>
                    </div>
                    
                    <div class="visual-aid">
                        ${this.generateVisualAid(config)}
                    </div>
                    
                    <div class="game-controls">
                        <button class="check-answer-btn">Check Answer</button>
                        <button class="hint-btn">Need a Hint?</button>
                        <button class="reset-btn">Reset Beads</button>
                    </div>
                    
                    <div class="feedback-area"></div>
                    
                    ${this.currentLevel < this.maxLevel ? `
                        <div class="level-progress">
                            Progress: ${Math.floor((this.score / (this.currentLevel * 50)) * 100)}%
                            to Level ${this.currentLevel + 1}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        const feedback = this.container.querySelector('.feedback-area');
        if (feedback) {
            feedback.innerHTML = ''; // Ensure feedback area is empty on initial render
        }

        this.attachEventHandlers();
    }

    renderGameCompletion() {
        // Calculate stars based on score
        const totalPossibleScore = (1 + 2 + 3 + 4 + 5) * 50; // Sum of points possible for all levels
        const scorePercentage = (this.score / totalPossibleScore) * 100;
        const stars = scorePercentage >= 90 ? '⭐⭐⭐' : 
                     scorePercentage >= 70 ? '⭐⭐' : '⭐';

        this.container.innerHTML = `
            <div class="game-completion">
                <h2>Congratulations! 🎉</h2>
                <p>You've completed all levels!</p>
                <div class="completion-stats">
                    <p>Final Score: ${this.score} points</p>
                    <p>Performance: ${stars}</p>
                </div>
                <div class="completion-message">
                    ${scorePercentage >= 90 ? 
                        'Amazing! You\'re an abacus master!' : 
                        scorePercentage >= 70 ? 
                        'Great work! You\'re getting really good at this!' :
                        'Good job! Keep practicing to improve your score!'}
                </div>
                <div class="completion-buttons">
                    <button class="restart-game">Play Again</button>
                    <button class="review-tutorial">Review Tutorial</button>
                </div>
            </div>
        `;

        // Attach handlers for completion buttons
        const restartBtn = this.container.querySelector('.restart-game');
        const reviewBtn = this.container.querySelector('.review-tutorial');

        if (restartBtn) {
            restartBtn.onclick = () => this.restartGame();
        }
        if (reviewBtn) {
            reviewBtn.onclick = () => {
                // Notify parent module to switch back to tutorial
                const event = new CustomEvent('returnToTutorial');
                window.dispatchEvent(event);
            }
        }
    }

    restartGame() {
        this.currentLevel = 1;
        this.score = 0;
        this.gameState = 'playing';
        this.numberHistory = []; // Clear history on restart
        this.resetAbacus();
        this.render();
    }

    generateTargetNumber() {
        const config = this.levelConfig[this.currentLevel];
        
        // Create array of all possible numbers for this level
        const possibleNumbers = Array.from(
            {length: config.max},
            (_, i) => i + 1
        ).filter(num => !this.numberHistory.includes(num));

        // If we've used all numbers in the range, clear history completely
        if (possibleNumbers.length === 0) {
            this.numberHistory = [];
            return this.generateTargetNumber();
        }

        let number;
        
        // For higher levels, favor bigger numbers
        if (this.currentLevel >= 3) {
            const higherRange = possibleNumbers.filter(n => n > Math.floor(config.max * 0.6));
            const lowerRange = possibleNumbers.filter(n => n <= Math.floor(config.max * 0.6));
            
            // 70% chance to get a number from the higher range if available
            if (higherRange.length > 0 && Math.random() < 0.7) {
                number = higherRange[Math.floor(Math.random() * higherRange.length)];
            } else if (lowerRange.length > 0) {
                number = lowerRange[Math.floor(Math.random() * lowerRange.length)];
            } else {
                // If one range is empty, use numbers from the other range
                number = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
            }
        } else {
            // For levels 1-2, keep the original random selection
            number = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
        }

        // Add to history
        this.numberHistory.push(number);

        return number;
    }

    generateVisualAid(config) {
        const targetNumber = parseInt(this.container.querySelector('.big-number')?.textContent || '0');
        return Array(targetNumber).fill(config.visual).join(' ');
    }

    attachEventHandlers() {
        const checkBtn = this.container.querySelector('.check-answer-btn');
        const hintBtn = this.container.querySelector('.hint-btn');
        const resetBtn = this.container.querySelector('.reset-btn');

        if (checkBtn) {
            checkBtn.onclick = () => this.checkAnswer();
        }

        if (hintBtn) {
            hintBtn.onclick = () => this.showHint();
        }

        if (resetBtn) {
            resetBtn.onclick = () => {
                this.resetAbacus();
                this.container.querySelector('.feedback-area').innerHTML = '';
            };
        }
    }

    checkAnswer() {
        const targetNumber = parseInt(this.container.querySelector('.big-number').textContent);
        const abacusValue = parseInt(document.getElementById('currentValue').textContent);
        
        // Get rightmost column for visual feedback
        const abacus = window.moduleManager.getAbacus();
        const columns = Array.from(abacus.querySelectorAll('.column'));
        const rightmostColumn = columns[columns.length - 1];
        
        if (abacusValue === targetNumber) {
            // Add visual success feedback
            rightmostColumn.classList.add('correct-value');
            setTimeout(() => rightmostColumn.classList.remove('correct-value'), 1000);
            
            this.handleCorrectAnswer();
        } else {
            // Add visual error feedback
            rightmostColumn.classList.add('wrong-value');
            setTimeout(() => rightmostColumn.classList.remove('wrong-value'), 1000);
            
            this.handleIncorrectAnswer(abacusValue, targetNumber);
        }
    }

    handleCorrectAnswer() {
        this.score += this.currentLevel * 10;
        this.soundManager?.play('success');
        
        const feedback = this.container.querySelector('.feedback-area');
        feedback.innerHTML = `
            <div class="success-message">
                <p>Great job! That's correct! 🎉</p>
                <p>+${this.currentLevel * 10} points!</p>
                <button class="next-number-btn">Try Another Number</button>
            </div>
        `;

        const nextBtn = feedback.querySelector('.next-number-btn');
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.score >= this.currentLevel * 50) {
                    if (this.currentLevel < this.maxLevel) {
                        this.levelUp();
                    } else {
                        // Game completed!
                        this.gameState = 'completed';
                        this.soundManager?.play('achievement');
                        this.render();
                    }
                } else {
                    this.resetAbacus();
                    this.render();
                }
            };
        }
    }

    handleIncorrectAnswer(currentValue, targetValue) {
        this.soundManager?.play('bead');
        
        const feedback = this.container.querySelector('.feedback-area');
        let message = 'Not quite right. ';
        
        if (currentValue > targetValue) {
            message += 'Your number is too high! ';
        } else {
            message += 'Your number is too low! ';
        }
        
        const difference = Math.abs(targetValue - currentValue);
        if (difference >= 5) {
            message += 'Remember, the upper bead counts as 5!';
        } else {
            message += `You're off by ${difference}. Adjust the lower beads!`;
        }
        
        feedback.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button class="retry-btn">Try Again</button>
                <button class="reset-btn">Reset Beads</button>
            </div>
        `;

        const retryBtn = feedback.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.onclick = () => {
                feedback.innerHTML = '';
            };
        }

        const resetBtn = feedback.querySelector('.reset-btn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                this.resetAbacus();
                feedback.innerHTML = '';
            };
        }
    }

    showHint() {
        const targetNumber = parseInt(this.container.querySelector('.big-number').textContent);
        const feedback = this.container.querySelector('.feedback-area');
        
        feedback.innerHTML = `
            <div class="hint-message">
                <p>Try this:</p>
                <ol>
                    ${this.generateHintSteps(targetNumber)}
                </ol>
            </div>
        `;
        
        this.soundManager?.play('next');
    }

    generateHintSteps(number) {
        const steps = [];
        if (number >= 5) {
            steps.push('<li>Move down the 5-bead first</li>');
            if (number > 5) {
                steps.push(`<li>Then move up ${number - 5} one-beads</li>`);
            }
        } else {
            steps.push(`<li>Move up ${number} one-beads</li>`);
        }
        return steps.join('');
    }

    levelUp() {
        this.currentLevel++;
        this.soundManager?.play('achievement');
        
        // Clear history for new level
        this.numberHistory = [];
        
        this.container.innerHTML = `
            <div class="level-up-celebration">
                <h2>Level Up! 🎉</h2>
                <p>You've reached Level ${this.currentLevel}!</p>
                <p>${this.levelConfig[this.currentLevel].description}</p>
                <button class="continue-btn">Continue</button>
            </div>
        `;

        const continueBtn = this.container.querySelector('.continue-btn');
        if (continueBtn) {
            continueBtn.onclick = () => {
                this.resetAbacus();
                this.render();
            };
        }
    }

    resetAbacus() {
        const abacus = window.moduleManager.getAbacus();
        if (!abacus) return;

        const columns = Array.from(abacus.querySelectorAll('.column'));
        columns.forEach(column => {
            const beads = Array.from(column.querySelectorAll('.bead'));
            beads.forEach(bead => {
                if (bead.classList.contains('active')) {
                    bead.classList.remove('active');
                    bead.classList.remove('wrong');
                }
            });
        });
        
        // Ensure the value display is updated
        window.abacus.calculateValue();
    }

    cleanup() {
        if (this.valueObserver) {
            this.valueObserver.disconnect();
            this.valueObserver = null;
        }
        this.resetAbacus();
        this.container = null;
        this.gameState = 'ready';
        this.numberHistory = [];
    }
}

export default CountingGame;
