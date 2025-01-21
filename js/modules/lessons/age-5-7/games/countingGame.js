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
        this.levelConfig = {
            1: { max: 5, visual: '⭐' },
            2: { max: 9, visual: '🌟' },
            3: { max: 15, visual: '🎈' },
            4: { max: 20, visual: '🎯' },
            5: { max: 20, visual: '🏆', useComplement: true }
        };
    }

    initialize(container) {
        this.container = container;
        this.render();
    }

    render() {
        const config = this.levelConfig[this.currentLevel];
        this.container.innerHTML = `
            <div class="counting-game">
                <div class="game-header">
                    <div class="level-info">Level ${this.currentLevel}</div>
                    <div class="score-info">Score: ${this.score}</div>
                </div>
                
                <div class="game-content">
                    <div class="target-number">
                        <h3>Show this number:</h3>
                        <div class="number">${this.generateTargetNumber()}</div>
                    </div>
                    
                    <div class="visual-aid">
                        ${this.generateVisualAid(config)}
                    </div>
                    
                    <div class="game-controls">
                        <button class="check-answer-btn">Check Answer</button>
                        <button class="hint-btn">Need a Hint?</button>
                    </div>
                    
                    <div class="feedback-area"></div>
                </div>
            </div>
        `;

        this.attachEventHandlers();
    }

    generateTargetNumber() {
        const config = this.levelConfig[this.currentLevel];
        return Math.floor(Math.random() * config.max) + 1;
    }

    generateVisualAid(config) {
        const targetNumber = parseInt(this.container.querySelector('.number')?.textContent || '0');
        return Array(targetNumber).fill(config.visual).join(' ');
    }

    attachEventHandlers() {
        const checkBtn = this.container.querySelector('.check-answer-btn');
        const hintBtn = this.container.querySelector('.hint-btn');

        if (checkBtn) {
            checkBtn.onclick = () => this.checkAnswer();
        }

        if (hintBtn) {
            hintBtn.onclick = () => this.showHint();
        }
    }

    checkAnswer() {
        // In a real implementation, this would check the abacus state
        const targetNumber = parseInt(this.container.querySelector('.number').textContent);
        const abacusValue = 0; // TODO: Get actual abacus value
        
        if (abacusValue === targetNumber) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }

    handleCorrectAnswer() {
        this.score += this.currentLevel * 10;
        this.soundManager?.play('success');
        
        const feedback = this.container.querySelector('.feedback-area');
        feedback.innerHTML = `
            <div class="success-message">
                <p>Great job! That's correct! 🎉</p>
                <button class="next-number-btn">Try Another Number</button>
            </div>
        `;

        const nextBtn = feedback.querySelector('.next-number-btn');
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.score >= this.currentLevel * 50 && this.currentLevel < this.maxLevel) {
                    this.levelUp();
                } else {
                    this.render();
                }
            };
        }
    }

    handleIncorrectAnswer() {
        this.soundManager?.play('bead');
        
        const feedback = this.container.querySelector('.feedback-area');
        feedback.innerHTML = `
            <div class="error-message">
                <p>Not quite right. Try again!</p>
                <button class="retry-btn">Retry</button>
            </div>
        `;

        const retryBtn = feedback.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.onclick = () => {
                feedback.innerHTML = '';
            };
        }
    }

    showHint() {
        const targetNumber = parseInt(this.container.querySelector('.number').textContent);
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
            steps.push('<li>Move up the 5-bead first</li>');
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
        
        this.container.innerHTML = `
            <div class="level-up-celebration">
                <h2>Level Up! 🎉</h2>
                <p>You've reached Level ${this.currentLevel}!</p>
                <button class="continue-btn">Continue</button>
            </div>
        `;

        const continueBtn = this.container.querySelector('.continue-btn');
        if (continueBtn) {
            continueBtn.onclick = () => this.render();
        }
    }

    cleanup() {
        // Remove event listeners and reset state
        this.container = null;
        this.gameState = 'ready';
    }
}

export default CountingGame;
