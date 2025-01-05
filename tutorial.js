// tutorial.js
class AbacusTutorial {
    constructor() {
        this.currentStep = 0;
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
        this.ready = Promise.resolve(); // Add this line
    
        window.addEventListener('languageChanged', async (e) => {
            this.currentLanguage = e.detail.language;
            this.hideTutorial();
            await this.updateNavigationButtons();
        });
    
        // Initialize steps without running demos
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
                position: "right",
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
                position: "right",
                demo: () => {
                    const rightmostColumn = document.querySelector('.column:last-child');
                    BeadMovements.setValue(rightmostColumn, 7);
                    window.abacus.calculateValue();
                    setTimeout(() => {
                        BeadMovements.setValue(rightmostColumn, 0);
                        window.abacus.calculateValue();
                    }, 3000);
                }
            },
            {
                title: "Addition Mental Math",
                content: "Let's learn how to add numbers efficiently using complements and place values.",
                position: "right"
            },
            {
                title: "Addition Example: 7 + 8 = 15",
                content: "First we show 7 (5+2). To add 8: Since 8 is close to 10 we think '10-8=2'. So we add 10 (move up in tens column) and subtract 2 from 7 giving us 15 (10+5).",
                position: "right",
                highlight: ".column:last-child .top-bead, .column:last-child .bottom-bead-4, .column:last-child .bottom-bead-3",
                demo: () => {
                    const rightmostColumn = document.querySelector('.column:last-child');
                    const tensColumn = document.querySelector('.column:nth-last-child(2)');
        
                    // Show initial number 7
                    BeadMovements.setValue(rightmostColumn, 7);
                    window.abacus.calculateValue();
                    document.querySelector('.column:last-child .top-bead').classList.add('tutorial-highlight');
                    document.querySelectorAll('.column:last-child .bottom-bead-4, .column:last-child .bottom-bead-3').forEach(bead => bead.classList.add('tutorial-highlight'));
        
                    // Adding 8: In ones position X=7, Y=8: 7+8=15
                    setTimeout(() => {
                        // Since 15>=10 and Y>=5, do 10-8=2, add 10 and minus 2
                        document.querySelectorAll('.column:last-child .bottom-bead-4, .column:last-child .bottom-bead-3').forEach(bead => bead.classList.add('tutorial-highlight'));
                        BeadMovements.setValue(tensColumn, 1);
                        BeadMovements.setValue(rightmostColumn, 5);
                        window.abacus.calculateValue();
        
                        document.querySelector('.column:nth-last-child(2) .bottom-bead-4').classList.add('tutorial-highlight');
                        document.querySelector('.column:last-child .top-bead').classList.add('tutorial-highlight');
                    }, 2000);
        
                    // Reset after demonstration
                    setTimeout(() => {
                        document.querySelector('.column:nth-last-child(2) .bottom-bead-4').classList.add('tutorial-highlight');
                        document.querySelector('.column:last-child .top-bead').classList.add('tutorial-highlight');
                        BeadMovements.setValue(tensColumn, 0);
                        BeadMovements.setValue(rightmostColumn, 0);
                        window.abacus.calculateValue();
                    }, 4000);
                }
            },
            {
                title: "Addition Example: 23 + 38 = 61",
                content: "Starting with 23 first add 30 by moving tens column from 2 to 5. Then for +8: Since 3+8=11 we add 1 to tens column (making 6) and keep 1 in ones column giving us 61.",
                position: "right",
                highlight: ".column:nth-last-child(2) .bottom-bead-4, .column:nth-last-child(2) .bottom-bead-3, .column:last-child .top-bead, .column:last-child .bottom-bead-4",
                demo: () => {
                    const onesColumn = document.querySelector('.column:last-child');
                    const tensColumn = document.querySelector('.column:nth-last-child(2)');
        
                    // Show initial number 23
                    BeadMovements.setValue(tensColumn, 2);
                    BeadMovements.setValue(onesColumn, 3);
                    window.abacus.calculateValue();
                    // Highlight initial 23 beads
                    document.querySelectorAll('.column:nth-last-child(2) .bottom-bead-4, .column:nth-last-child(2) .bottom-bead-3').forEach(bead => bead.classList.add('tutorial-highlight'));
                    document.querySelectorAll('.column:last-child .bottom-bead-4, .column:last-child .bottom-bead-3, .column:last-child .bottom-bead-2').forEach(bead => bead.classList.add('tutorial-highlight'));
        
                    // Adding 30: In tens position X=2, Y=3: 2+3=5
                    setTimeout(() => {
                        BeadMovements.setValue(tensColumn, 5);
                        window.abacus.calculateValue();
                        // Highlight the new position in tens column (5)
                        document.querySelector('.column:nth-last-child(2) .top-bead').classList.add('tutorial-highlight');
                        document.querySelectorAll('.column:nth-last-child(2) .bottom-bead-4, .column:nth-last-child(2) .bottom-bead-3, .column:nth-last-child(2) .bottom-bead-2').forEach(bead => bead.classList.add('tutorial-highlight'));
                    }, 2000);
        
                    // Adding 8: In ones position X=3, Y=8: 3+8=11
                    setTimeout(() => {
                        BeadMovements.setValue(tensColumn, 6);
                        BeadMovements.setValue(onesColumn, 1);
                        window.abacus.calculateValue();
                        // Highlight the final position beads
                        document.querySelector('.column:nth-last-child(2) .top-bead').classList.add('tutorial-highlight');
                        document.querySelector('.column:nth-last-child(2) .bottom-bead-4').classList.add('tutorial-highlight');
                        document.querySelector('.column:last-child .bottom-bead-4').classList.add('tutorial-highlight');
                    }, 4000);
        
                    // Reset after demonstration
                    setTimeout(() => {
                        BeadMovements.setValue(tensColumn, 0);
                        BeadMovements.setValue(onesColumn, 0);
                        window.abacus.calculateValue();
                    }, 6000);
                }
            },
            {
                title: "Subtraction Mental Math",
                content: "Now let's learn subtraction using complements.",
                position: "right"
            },
            {
                title: "Subtraction Example: 15 - 7",
                content: "When subtracting 7: Since 7 is less than 10 we can think: 10 - 7 = 3. So remove 10 and add 3.",
                position: "right",
                highlight: ".column:nth-last-child(2) .bottom-bead-4, .column:last-child .top-bead",
                demo: () => {
                    const rightmostColumn = document.querySelector('.column:last-child');
                    const tensColumn = document.querySelector('.column:nth-last-child(2)');
        
                    // Show 15 (10 + 5)
                    BeadMovements.setValue(tensColumn, 1);
                    BeadMovements.setValue(rightmostColumn, 5);
                    window.abacus.calculateValue();
                    document.querySelector('.column:nth-last-child(2) .bottom-bead-4').classList.add('tutorial-highlight');
                    document.querySelector('.column:last-child .top-bead').classList.add('tutorial-highlight');
        
                    // Show transition to 8
                    setTimeout(() => {
                        // Highlight beads that need to move to rest
                        document.querySelector('.column:nth-last-child(2) .bottom-bead-4').classList.add('tutorial-highlight');
                        document.querySelector('.column:last-child .top-bead').classList.add('tutorial-highlight');
                        BeadMovements.setValue(tensColumn, 0);
                        BeadMovements.setValue(rightmostColumn, 8);
                        window.abacus.calculateValue();
                
                        // Highlight new active beads
                        document.querySelector('.column:last-child .top-bead').classList.add('tutorial-highlight');
                        document.querySelectorAll('.column:last-child .bottom-bead-4, .column:last-child .bottom-bead-3, .column:last-child .bottom-bead-2').forEach(bead => bead.classList.add('tutorial-highlight'));
                    }, 2000);
        
                    // Reset with highlights
                    setTimeout(() => {
                        // Highlight beads that will move to rest
                        document.querySelector('.column:last-child .top-bead').classList.add('tutorial-highlight');
                        document.querySelectorAll('.column:last-child .bottom-bead-4, .column:last-child .bottom-bead-3, .column:last-child .bottom-bead-2').forEach(bead => bead.classList.add('tutorial-highlight'));
                        BeadMovements.setValue(tensColumn, 0);
                        BeadMovements.setValue(rightmostColumn, 0);
                        window.abacus.calculateValue();
                    }, 4000);
                }
            }
        ];        
    
        // Only setup container, don't trigger content updates
        this.setupTutorial();
    }

    async setupTutorial() {
        // Only create container without updating content
        await this.createTutorialContainer();
    }

    startTutorial() {
        this.currentStep = 0;
        this.showTutorial();
        // Now trigger content and demo updates
        this.updateContent();
        this.currentStep = 0;
        this.showTutorial();
        // Now trigger content and demo updates
        this.updateContent();
    }

    async createTutorialContainer() {
        const container = document.createElement('div');
        container.className = 'tutorial-container';
        container.style.display = 'none';
        const tutorialTitle = await window.translationService.translate('Soroban Tutorial', this.currentLanguage);
        const previousText = await window.translationService.translate('Previous', this.currentLanguage);
        const repeatText = await window.translationService.translate('Repeat', this.currentLanguage);
        const nextText = await window.translationService.translate('Next', this.currentLanguage);

        container.innerHTML = `
            <div class="tutorial-header">
                <span class="tutorial-drag-handle">≡</span>
                <h2 class="tutorial-title">${tutorialTitle}</h2>
                <button class="tutorial-close">X</button>
            </div>
            <div class="tutorial-content"></div>
            <div class="tutorial-navigation">
                <button class="tutorial-prev">${previousText}</button>
                <button class="tutorial-repeat">${repeatText}</button>
                <div class="tutorial-progress"></div>
                <button class="tutorial-next">${nextText}</button>
            </div>
        `;

        document.body.appendChild(container);
        this.makeDraggable(container);
        
        container.querySelector('.tutorial-prev').onclick = () => this.previousStep();
        container.querySelector('.tutorial-next').onclick = () => this.nextStep();
        container.querySelector('.tutorial-repeat').onclick = () => this.repeatStep();
        container.querySelector('.tutorial-close').onclick = () => this.hideTutorial();    }

    async updateContent() {
        const step = this.steps[this.currentStep];
        const container = document.querySelector('.tutorial-container');
        
        container.className = `tutorial-container tutorial-${step.position || 'right'}`;
        
        const translatedTitle = await window.translationService.translate(step.title, this.currentLanguage);
        const translatedContent = await window.translationService.translate(step.content, this.currentLanguage);
        
        container.querySelector('.tutorial-content').innerHTML = `
            <h2>${translatedTitle}</h2>
            <p>${translatedContent}</p>
        `;

        const stepText = await window.translationService.translate('Step', this.currentLanguage);
        const ofText = await window.translationService.translate('of', this.currentLanguage);
        const progress = container.querySelector('.tutorial-progress');
        progress.innerHTML = `${stepText} ${this.currentStep + 1} ${ofText} ${this.steps.length}`;

        this.updateHighlightsAndDemo(step);
    }

    async updateNavigationButtons() {
        const container = document.querySelector('.tutorial-container');
        if (!container) return;

        const prevButton = container.querySelector('.tutorial-prev');
        const repeatButton = container.querySelector('.tutorial-repeat');
        const nextButton = container.querySelector('.tutorial-next');
        const title = container.querySelector('.tutorial-title');

        prevButton.textContent = await window.translationService.translate('Previous', this.currentLanguage);
        repeatButton.textContent = await window.translationService.translate('Repeat', this.currentLanguage);
        nextButton.textContent = await window.translationService.translate('Next', this.currentLanguage);
        title.textContent = await window.translationService.translate('Soroban Tutorial', this.currentLanguage);
    }

    updateHighlightsAndDemo(step) {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        if (step.highlight) {
            document.querySelectorAll(step.highlight).forEach(el => {
                el.classList.add('tutorial-highlight');
            });
        }

        if (step.demo) {
            step.demo(this);
        }
    }

    // tutorial.js
    async changeLanguage(targetLang) {
        this.currentLanguage = targetLang;
        localStorage.setItem('selectedLanguage', targetLang);

        // Only update text content, skip demos
        await this.updateNavigationButtons();

        // Update text content without running demos
        const tempStep = this.currentStep;
        this.currentStep = 0;

        // Force refresh text content only
        for (let i = 0; i < this.steps.length; i++) {
            this.currentStep = i;
            // Update text without triggering demos
            const step = this.steps[this.currentStep];
            const container = document.querySelector('.tutorial-container');
            if (container) {
                const translatedTitle = await window.translationService.translate(step.title, this.currentLanguage);
                const translatedContent = await window.translationService.translate(step.content, this.currentLanguage);
                container.querySelector('.tutorial-content').innerHTML = `
                    <h2>${translatedTitle}</h2>
                    <p>${translatedContent}</p>
                `;
            }
        }

        // Return to original step
        this.currentStep = tempStep;
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
        this.currentStep = 0; // Reset step counter when closing
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

    makeDraggable(element) {
        const header = element.querySelector('.tutorial-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', startDragging);

        function startDragging(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDragging);
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function stopDragging() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDragging);
        }
    }



    repeatStep() {
        const step = this.steps[this.currentStep];
        if (step.demo) {
            this.removeHighlight();
            BeadMovements.setValue(document.querySelector('.column:last-child'), 0);
            window.abacus.calculateValue();
            
            if (step.highlight) {
                document.querySelectorAll(step.highlight).forEach(el => {
                    el.classList.add('tutorial-highlight');
                });
            }
            step.demo();
        }
    }
}
