class ArithmeticMenu {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.addition = new Addition();
        this.subtraction = new Subtraction();
    
        this.init();
    
        // Update the event listener to use document instead of window
        document.addEventListener('languageChanged', (e) => {
            this.updateLanguage(e.detail.language);
            this.createArithmeticModal(e.detail.language);
        });
    }
    async init() {
        // Wait for translation service to be fully loaded
        await window.translationService.ready;
        
        // Get current language after service is ready
        const currentLanguage = window.tutorial.currentLanguage;
        
        // Remove any existing modal before creating a new one
        const existingModal = document.querySelector('.arithmetic-section');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal with correct translations
        await this.createArithmeticModal(currentLanguage);
    }
    // arithmetic.js
    async updateLanguage(targetLanguage) {
        const modal = document.querySelector('.arithmetic-section');
        if (!modal) return;
    
        // Force close the modal first
        modal.style.display = 'none';
    
        const translatedTexts = {
            firstNumber: await window.translationService.translate('First number', language),
            secondNumber: await window.translationService.translate('Second number', language),
            calculate: await window.translationService.translate('Calculate', language),
            guideMe: await window.translationService.translate('Guide Me', language),
            arithmeticPractice: await window.translationService.translate('Arithmetic Practice', language) // Add this
        };
    
        // Update existing elements
        const num1Input = modal.querySelector('#num1');
        const num2Input = modal.querySelector('#num2');
        const calculateButton = modal.querySelector('#calculate');
        const guideButton = modal.querySelector('#guide');
        const expectedResult = modal.querySelector('.expected-result');
    
        if (num1Input) num1Input.placeholder = translatedTexts.firstNumber;
        if (num2Input) num2Input.placeholder = translatedTexts.secondNumber;
        if (calculateButton) calculateButton.textContent = translatedTexts.calculate;
        if (guideButton) guideButton.textContent = translatedTexts.guideMe;
    
        // Reset steps and clear display
        this.steps = [];
        this.currentStep = 0;
        if (expectedResult) expectedResult.innerHTML = '';
    }    

    async createArithmeticModal(language) {
        // Wait for DOM to be ready
        await new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    
        // Remove any existing arithmetic modal first
        const existingModal = document.querySelector('.arithmetic-section');
        if (existingModal) {
            existingModal.remove();
        }
    
        const modal = document.createElement('div');
        modal.className = 'arithmetic-section modal draggable';
        modal.style.display = 'none';
    
        const translatedTexts = {
            firstNumber: await window.translationService.translate('First number', language),
            secondNumber: await window.translationService.translate('Second number', language),
            calculate: await window.translationService.translate('Calculate', language),
            guideMe: await window.translationService.translate('Guide Me', language),
            arithmeticPractice: await window.translationService.translate('Arithmetic Practice', language) // Add this
        };
    
        modal.innerHTML = `
            <div class="tutorial-header">
                <span class="tutorial-drag-handle">≡</span>
                <h2 class="tutorial-title">${translatedTexts.arithmeticPractice}</h2>
                <button class="tutorial-close">X</button>
            </div>
            <div class="arithmetic-content-wrapper">
                <div class="arithmetic-content">
                    <div class="input-row">
                        <span>(X)</span>
                        <input type="number" id="num1" class="arithmetic-input" placeholder="${translatedTexts.firstNumber}">
                        <select id="operator" class="arithmetic-select">
                            <option value="+">+</option>
                            <option value="-">-</option>
                            <option value="x">x</option>
                            <option value="/">/</option>
                        </select>
                        <span>(Y)</span>
                        <input type="number" id="num2" class="arithmetic-input" placeholder="${translatedTexts.secondNumber}">
                    </div>
                    <div class="button-row">
                        <button class="button-common" id="calculate">${translatedTexts.calculate}</button>
                        <button class="button-common" id="guide">${translatedTexts.guideMe}</button>
                    </div>
                    <div class="tutorial-section"></div>
                    <div class="expected-result"></div>
                </div>
            </div>
        `;
    
        const container = document.querySelector('.container');
        if (!container) {
            console.error('Container element not found');
            return;
        }
        container.appendChild(modal);

        // Add this block:
        const header = modal.querySelector('.tutorial-header');
        header.style.touchAction = 'none';

        let isDragging = false;
        let initialX, initialY;

        const dragStart = (e) => {
            if (e.target === header || e.target.closest('.tutorial-header')) {
                isDragging = true;
                
                // Ensure transform is removed and position is calculated from absolute values
                modal.style.transform = 'none';
                const rect = modal.getBoundingClientRect();
                
                // Force reflow to ensure new positioning is applied
                modal.offsetHeight;
                
                initialX = e.type === "touchstart" ? 
                    e.touches[0].clientX - rect.left : 
                    e.clientX - rect.left;
                initialY = e.type === "touchstart" ? 
                    e.touches[0].clientY - rect.top : 
                    e.clientY - rect.top;
            }
        };

        const dragEnd = () => {
            isDragging = false;
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
            const currentY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
            
            modal.style.left = `${currentX - initialX}px`;
            modal.style.top = `${currentY - initialY}px`;
            modal.style.bottom = 'auto';
        };

        // Event listeners
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        header.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', dragEnd);

        // Make inputs and select interactive
        const inputs = modal.querySelectorAll('.arithmetic-input');
        inputs.forEach(input => {
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            input.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        });
    
        const operatorSelect = modal.querySelector('.arithmetic-select');
        operatorSelect.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        operatorSelect.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
    
        // Add close button functionality
        const closeBtn = modal.querySelector('.tutorial-close');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    
        // Setup arithmetic functionality
        const calculateButton = modal.querySelector('#calculate');
        const guideButton = modal.querySelector('#guide');
    
        calculateButton.addEventListener('click', () => this.startPractice());
        guideButton.addEventListener('click', async () => {
            const translatedTexts = {
                nextStep: await window.translationService.translate('Next Step', window.tutorial.currentLanguage),
                repeat: await window.translationService.translate('Show Movement', window.tutorial.currentLanguage)
            };
        
            const num1 = parseInt(modal.querySelector('#num1').value);
            const num2 = parseInt(modal.querySelector('#num2').value);
            const operator = modal.querySelector('#operator').value;
        
            // First, ensure we have a container for the tutorial
            let tutorialContainer = modal.querySelector('.tutorial-section');
            
            // If no container exists, create one
            if (!tutorialContainer) {
                tutorialContainer = document.createElement('div');
                tutorialContainer.className = 'tutorial-section';
                // Insert after the button row
                const buttonRow = modal.querySelector('.button-row');
                if (buttonRow) {
                    buttonRow.insertAdjacentElement('afterend', tutorialContainer);
                } else {
                    modal.querySelector('.arithmetic-content').appendChild(tutorialContainer);
                }
            }
        
            // Now we can safely update the tutorial content
            tutorialContainer.innerHTML = `
                <div class="tutorial-content"></div>
                <div class="tutorial-controls">
                    <button class="tutorial-repeat button-common">${translatedTexts.repeat}</button>
                    <button class="tutorial-next button-common">${translatedTexts.nextStep}</button>
                </div>
            `;
        
            // Generate steps and continue with the tutorial
            this.currentStep = 0;
            this.steps = await this.generateSteps(num1, num2, operator);
        
            const repeatBtn = tutorialContainer.querySelector('.tutorial-repeat');
            const nextBtn = tutorialContainer.querySelector('.tutorial-next');
        
            repeatBtn.onclick = () => this.repeatCurrentStep();
            nextBtn.onclick = () => {
                this.currentStep++;
                this.showNextStep();
            };
        
            await this.showNextStep();
        });
        // Prevent dragging when interacting with buttons
        const buttons = modal.querySelectorAll('.button-common');
        buttons.forEach(button => {
            button.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        });
    }    
        
    toggleModal() {
        try {
            const modal = document.querySelector('.arithmetic-section');
            if (modal) {
                const isHidden = modal.style.display === 'none' || modal.style.display === '';
                
                if (isHidden) {
                    // First make the modal visible to get correct dimensions
                    modal.style.display = 'block';
                    
                    // Remove transform before positioning
                    modal.style.transform = 'none';
                    
                    // Calculate and set position
                    const viewportHeight = window.innerHeight;
                    const modalHeight = modal.offsetHeight;
                    const centerX = (window.innerWidth - modal.offsetWidth) / 2;
                    
                    modal.style.top = `${viewportHeight - modalHeight - 40}px`;
                    modal.style.left = `${centerX}px`;
                    modal.style.bottom = 'auto';
                } else {
                    modal.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error toggling arithmetic modal:', error);
        }
    }
    
    startPractice() {
        const modal = document.querySelector('.arithmetic-section');
        const num1Input = modal.querySelector('#num1');
        const num2Input = modal.querySelector('#num2');
        const operatorSelect = modal.querySelector('#operator');    

        try {
            const num1 = parseInt(num1Input.value);
            const num2 = parseInt(num2Input.value);
            const operator = operatorSelect.value;
            this.generateSteps(num1, num2, operator);
            this.showExpectedResult();
        } catch (error) {
            console.error('Error in startPractice:', error);
        }
    }
    async generateSteps(num1, num2, operator) {
        console.log('Generating steps for:', {num1, num2, operator});
        this.steps = [];
        const translatedTexts = {
            step: await window.translationService.translate('Step', window.tutorial.currentLanguage),
            setFirstNumber: await window.translationService.translate('Set first number:', window.tutorial.currentLanguage)
        };

        switch(operator) {
            case '+':
                this.steps.push({
                    value: num1,
                    message: `${translatedTexts.step} 1: ${translatedTexts.setFirstNumber}`
                });
                this.steps = await this.addition.generateSteps(num1, num2);
                break;
            case '-':
                this.steps = await this.subtraction.generateSteps(num1, num2);
                break;
            case 'x':
                const multiplyByText = await window.translationService.translate('Multiply by', window.tutorial.currentLanguage);
                this.steps.push({ value: num1, message: `${translatedTexts.setFirstNumber} ${num1}` });
                this.steps.push({ value: num1 * num2, message: `${multiplyByText} ${num2}` });
                break;
            case '/':
                const divideByText = await window.translationService.translate('Divide by', window.tutorial.currentLanguage);
                this.steps.push({ value: num1, message: `${translatedTexts.setFirstNumber} ${num1}` });
                this.steps.push({ value: Math.floor(num1 / num2), message: `${divideByText} ${num2}` });
                break;
        }
        
        console.log('Generated steps:', this.steps);
        this.currentStep = 0;
        return this.steps;
    }    
    async showNextStep() {
        if (this.currentStep < this.steps.length) {
            const modal = document.querySelector('.arithmetic-section');
            const tutorialContent = modal.querySelector('.tutorial-content');
            const tutorialControls = modal.querySelector('.tutorial-controls');
            const step = this.steps[this.currentStep];
            
            // Update tutorial content with step message
            tutorialContent.innerHTML = step.message;
            
            // Update existing repeat button functionality
            const repeatBtn = tutorialControls.querySelector('.tutorial-repeat');
            if (repeatBtn) {
                if (step.isComplement) {
                    repeatBtn.onclick = () => {
                        const operator = modal.querySelector('#operator').value;
                        if (operator === '+') {
                            this.addition.repeatComplementStep(step.complementValue, step.value);
                        } else {
                            this.subtraction.repeatComplementStep(step.complementValue, step.value);
                        }
                    };
                    repeatBtn.style.display = 'block';
                } else {
                    repeatBtn.onclick = () => this.repeatCurrentStep();
                    repeatBtn.style.display = 'block';
                }
            }
    
            // Update next button state
            const nextBtn = tutorialControls.querySelector('.tutorial-next');
            if (nextBtn) {
                nextBtn.disabled = this.currentStep >= this.steps.length - 1;
            }
    
            // Display current step on abacus
            window.abacus.resetAbacus();
            await this.displayStep(step);
        }
    }

    async repeatCurrentStep() {
        if (this.steps && this.currentStep < this.steps.length) {
            const step = this.steps[this.currentStep];
            window.abacus.resetAbacus();
            
            // Direct display of the current step value
            await this.displayStep(step);
            
            // Add visual feedback for the movement
            const columns = Array.from(document.querySelectorAll('.column')).reverse();
            columns.forEach(column => {
                const activeBeads = column.querySelectorAll('.active');
                activeBeads.forEach(bead => {
                    bead.classList.add('tutorial-highlight');
                    setTimeout(() => bead.classList.remove('tutorial-highlight'), 500);
                });
            });
        }
    }

    displayStep(step) {
        const columns = Array.from(document.querySelectorAll('.column')).reverse();
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        columns.forEach(column => BeadMovements.setValue(column, 0));

        let remainingValue = step.value;
        for (let i = 0; i < columns.length && remainingValue > 0; i++) {
            const digit = remainingValue % 10;
            const column = columns[i];
            
            if (digit >= 5) {
                column.querySelector('.top-bead').classList.add('tutorial-highlight');
            }
            for (let j = 0; j < digit % 5; j++) {
                column.querySelector(`.bottom-bead-${4-j}`).classList.add('tutorial-highlight');
            }
            
            BeadMovements.setValue(column, digit);
            remainingValue = Math.floor(remainingValue / 10);
        }
        window.abacus.calculateValue();
    }

    async showExpectedResult() {
        const modal = document.querySelector('.arithmetic-section');
        const num1 = parseInt(modal.querySelector('#num1').value);
        const num2 = parseInt(modal.querySelector('#num2').value);
        const operator = modal.querySelector('#operator').value;
        const result = this.calculateResult(num1, num2, operator);
        const expectedResultText = await window.translationService.translate('Expected Result:', window.tutorial.currentLanguage);
        modal.querySelector('.expected-result').textContent = `${expectedResultText} ${result}`;
    }
    calculateResult(num1, num2, operator) {
        switch(operator) {
            case '+': return num1 + num2;
            case '-': return num1 - num2;
            case 'x': return num1 * num2;
            case '/': return Math.floor(num1 / num2);
        }
    }
}