class MasteringModule {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                title: "Master Level Training",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>Welcome to master level abacus training!</p>
                            <p>Here we'll perfect advanced techniques and develop mental calculation abilities.</p>
                        </div>
                        <button class="next-btn">Start</button>
                    </div>
                `
            },
            {
                title: "Advanced Techniques",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>We'll master:</p>
                            <ul>
                                <li>Lightning calculations</li>
                                <li>Complex problem solving</li>
                                <li>Mental visualization</li>
                                <li>Speed enhancement methods</li>
                            </ul>
                        </div>
                        <button class="next-btn">Next</button>
                    </div>
                `
            },
            {
                title: "Begin Training",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>Ready to enhance your skills?</p>
                        </div>
                        <button class="start-practice">Start Training</button>
                    </div>
                `
            }
        ];
    }

    async initialize() {
        // Add age-specific class to body
        document.body.classList.add('age-14-plus');
        
        // Set up initial content
        this.renderCurrentStep();
    }

    renderCurrentStep() {
        const panel = document.querySelector('#training-panel .panel-content');
        if (!panel) return;

        const step = this.steps[this.currentStep];
        panel.innerHTML = `
            <h3>${step.title}</h3>
            ${step.content}
        `;

        this.attachStepHandlers();
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
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderCurrentStep();
        }
    }

    startPractice() {
        const panel = document.querySelector('#training-panel .panel-content');
        if (panel) {
            panel.innerHTML = `
                <div class="practice-section">
                    <h3>Advanced Training Mode</h3>
                    <p>Advanced training mode is under development.</p>
                    <p>Coming soon!</p>
                </div>
            `;
        }
    }

    cleanup() {
        // Remove age-specific class
        document.body.classList.remove('age-14-plus');
    }
}

export default MasteringModule;
