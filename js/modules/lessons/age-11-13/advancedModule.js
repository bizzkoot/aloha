class AdvancedModule {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                title: "Advanced Abacus Operations",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>Welcome to advanced abacus training!</p>
                            <p>Here we'll learn more complex operations and techniques.</p>
                        </div>
                        <button class="next-btn">Start</button>
                    </div>
                `
            },
            {
                title: "Complex Operations",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>We'll cover:</p>
                            <ul>
                                <li>Multi-digit multiplication</li>
                                <li>Division techniques</li>
                                <li>Speed calculations</li>
                            </ul>
                        </div>
                        <button class="next-btn">Next</button>
                    </div>
                `
            },
            {
                title: "Ready to Begin",
                content: `
                    <div class="intro-slide">
                        <div class="instruction">
                            <p>Let's start with some practice exercises!</p>
                        </div>
                        <button class="start-practice">Begin Practice</button>
                    </div>
                `
            }
        ];
    }

    async initialize() {
        // Add age-specific class to body
        document.body.classList.add('age-11-13');
        
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
                    <h3>Practice Mode</h3>
                    <p>Practice mode is under development.</p>
                    <p>Coming soon!</p>
                </div>
            `;
        }
    }

    cleanup() {
        // Remove age-specific class
        document.body.classList.remove('age-11-13');
    }
}

export default AdvancedModule;
