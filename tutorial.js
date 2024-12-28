class AbacusTutorial {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                title: "Welcome to Soroban",
                content: "Let's learn how to use the Japanese Abacus (Soroban).",
                highlight: ".abacus",
                position: "right"
            },
            {
                title: "Top Bead (Value: 5)",
                content: "Watch this top bead. It represents 5 units when moved down.",
                highlight: ".top-bead",
                position: "right",
                demo: () => {
                    const rightmostColumn = document.querySelector('.column:last-child');
                    BeadMovements.setValue(rightmostColumn, 5);
                    window.abacus.calculateValue();
                    setTimeout(() => {
                        BeadMovements.setValue(rightmostColumn, 0);
                        window.abacus.calculateValue();
                    }, 2000);
                }
            },
            {
                title: "Bottom Beads (Value: 1 each)",
                content: "Each bottom bead represents 1 unit. We start from the bead closest to the bar.",
                highlight: ".bottom-bead-4, .bottom-bead-3",
                position: "left",
                demo: () => {
                    const rightmostColumn = document.querySelector('.column:last-child');
                    BeadMovements.setValue(rightmostColumn, 1);
                    window.abacus.calculateValue();
                    setTimeout(() => {
                        BeadMovements.setValue(rightmostColumn, 2);
                        window.abacus.calculateValue();
                    }, 1500);
                    setTimeout(() => {
                        BeadMovements.setValue(rightmostColumn, 0);
                        window.abacus.calculateValue();
                    }, 3000);
                }
            },
            {
                title: "Making Numbers",
                content: "Let's make the number 7! We'll use one top bead (5) and two bottom beads (1+1).",
                highlight: ".column:last-child .top-bead, .column:last-child .bottom-bead-4, .column:last-child .bottom-bead-3",
                position: "left",
                demo: () => {
                    const rightmostColumn = document.querySelector('.column:last-child');
                    BeadMovements.setValue(rightmostColumn, 7);
                    window.abacus.calculateValue();
                    setTimeout(() => {
                        BeadMovements.setValue(rightmostColumn, 0);
                        window.abacus.calculateValue();
                    }, 3000);
                }
            }        ];
        this.setupTutorial();
    }

    setupTutorial() {
        this.createTutorialButton();
        this.createTutorialContainer();
    }

    createTutorialButton() {
        const button = document.createElement('button');
        button.textContent = 'Start Tutorial';
        button.className = 'button-common';
        button.onclick = () => this.startTutorial();
        document.querySelector('.container').appendChild(button);
    }

    createTutorialContainer() {
        const container = document.createElement('div');
        container.className = 'tutorial-container';
        container.style.display = 'none';
        container.innerHTML = `
            <div class="tutorial-content"></div>
            <div class="tutorial-navigation">
                <button class="tutorial-prev">Previous</button>
                <button class="tutorial-repeat">Repeat</button>
                <div class="tutorial-progress"></div>
                <button class="tutorial-next">Next</button>
            </div>
        `;
        document.body.appendChild(container);

        container.querySelector('.tutorial-prev').onclick = () => this.previousStep();
        container.querySelector('.tutorial-next').onclick = () => this.nextStep();
        container.querySelector('.tutorial-repeat').onclick = () => this.repeatStep();
    }

    repeatStep() {
        const step = this.steps[this.currentStep];
        if (step.demo) {
            // Clear any existing highlights and reset beads
            this.removeHighlight();
            BeadMovements.setValue(document.querySelector('.column:last-child'), 0);
            window.abacus.calculateValue();
            
            // Reapply highlight and run demo
            if (step.highlight) {
                document.querySelectorAll(step.highlight).forEach(el => {
                    el.classList.add('tutorial-highlight');
                });
            }
            step.demo();
        }
    }
    startTutorial() {
        this.currentStep = 0;
        this.showTutorial();
        this.updateContent();
    }

    showTutorial() {
        document.querySelector('.tutorial-container').style.display = 'block';
    }

    hideTutorial() {
        document.querySelector('.tutorial-container').style.display = 'none';
        this.removeHighlight();
    }

    updateContent() {
        const step = this.steps[this.currentStep];
        const container = document.querySelector('.tutorial-container');
        
        // Update position
        container.className = `tutorial-container tutorial-${step.position || 'right'}`;
        
        // Update content
        container.querySelector('.tutorial-content').innerHTML = `
            <h2>${step.title}</h2>
            <p>${step.content}</p>
        `;
        
        // Update progress
        const progress = container.querySelector('.tutorial-progress');
        progress.innerHTML = `Step ${this.currentStep + 1} of ${this.steps.length}`;
        
        // Clear previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // Add new highlight
        if (step.highlight) {
            document.querySelectorAll(step.highlight).forEach(el => {
                el.classList.add('tutorial-highlight');
            });
        }
        
        // Run demo if available
        if (step.demo) {
            step.demo(this);
        }
    }

    removeHighlight() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.updateContent();
        } else {
            this.hideTutorial();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateContent();
        }
    }
}// Initialize tutorial
document.addEventListener('DOMContentLoaded', () => {
    window.tutorial = new AbacusTutorial();
});
