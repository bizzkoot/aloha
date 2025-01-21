class PlaceValueModule {
    constructor() {
        this.currentSlide = 0;
        this.slides = [
            {
                title: "Understanding Place Values",
                content: `
                    <div class="place-value-intro">
                        <div class="abacus-diagram">
                            <div class="column hundreds">
                                <span class="label">Hundreds</span>
                                <div class="column-highlight"></div>
                            </div>
                            <div class="column tens">
                                <span class="label">Tens</span>
                                <div class="column-highlight"></div>
                            </div>
                            <div class="column ones">
                                <span class="label">Ones</span>
                                <div class="column-highlight"></div>
                            </div>
                        </div>
                        <div class="explanation">
                            <p>Each column on the abacus represents a different place value.</p>
                            <p>Moving from right to left: Ones, Tens, and Hundreds!</p>
                        </div>
                        <button class="next-btn">Next</button>
                    </div>
                `
            },
            {
                title: "Place Value Practice",
                content: `
                    <div class="place-value-practice">
                        <div class="number-display">
                            <span class="current-number">123</span>
                        </div>
                        <div class="number-breakdown">
                            <div class="place">
                                <span class="digit">1</span>
                                <span class="value">100</span>
                            </div>
                            <div class="place">
                                <span class="digit">2</span>
                                <span class="value">20</span>
                            </div>
                            <div class="place">
                                <span class="digit">3</span>
                                <span class="value">3</span>
                            </div>
                        </div>
                        <div class="instruction">
                            <p>Try setting this number on your abacus!</p>
                        </div>
                        <button class="check-btn">Check My Answer</button>
                    </div>
                `
            }
        ];
    }

    async initialize() {
        // Add age-specific class to body for styling
        document.body.classList.add('age-8-10');
        
        // Initialize sound manager
        import('../../core/soundManager.js').then(({ soundManager }) => {
            this.soundManager = soundManager;
            this.soundManager.initialize();
        }).catch(error => {
            console.error('Failed to initialize sound manager:', error);
        });
        
        // Set up initial slide
        this.renderCurrentSlide();
    }

    renderCurrentSlide() {
        const panel = document.querySelector('#training-panel .panel-content');
        if (!panel) return;

        const slide = this.slides[this.currentSlide];
        panel.innerHTML = `
            <h3>${slide.title}</h3>
            ${slide.content}
        `;

        this.attachSlideHandlers();
    }

    attachSlideHandlers() {
        const panel = document.querySelector('#training-panel .panel-content');
        
        // Next button handler
        const nextBtn = panel.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.onclick = () => this.nextSlide();
        }

        // Check answer button handler
        const checkBtn = panel.querySelector('.check-btn');
        if (checkBtn) {
            checkBtn.onclick = () => this.checkAnswer();
        }

        // Add column highlight handlers
        const columns = panel.querySelectorAll('.column');
        columns.forEach(column => {
            column.onmouseenter = () => this.highlightColumn(column);
            column.onmouseleave = () => this.unhighlightColumn(column);
        });
    }

    highlightColumn(column) {
        column.querySelector('.column-highlight').style.opacity = '0.3';
        // Play a soft sound when highlighting column
        this.soundManager?.play('bead');
    }

    unhighlightColumn(column) {
        column.querySelector('.column-highlight').style.opacity = '0';
    }

    nextSlide() {
        if (this.currentSlide < this.slides.length - 1) {
            this.currentSlide++;
            this.renderCurrentSlide();
            this.soundManager?.play('next');
        }
    }

    checkAnswer() {
        // In a real implementation, this would check the abacus state
        // against the target number
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message';
        feedback.textContent = 'Great job! The beads are in the correct position.';
        
        const practice = document.querySelector('.place-value-practice');
        practice.appendChild(feedback);
        
        // Play success sound when answer is correct
        this.soundManager?.play('success');
    }

    cleanup() {
        // Remove age-specific class
        document.body.classList.remove('age-8-10');
    }
}

export default PlaceValueModule;
