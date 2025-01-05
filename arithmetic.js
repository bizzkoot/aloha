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
            firstNumber: await window.translationService.translate('First number', targetLanguage),
            secondNumber: await window.translationService.translate('Second number', targetLanguage),
            calculate: await window.translationService.translate('Calculate', targetLanguage),
            guideMe: await window.translationService.translate('Guide Me', targetLanguage)
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
    // Remove any existing arithmetic modal first
    const existingModal = document.querySelector('.arithmetic-section');
    if (existingModal) {
        existingModal.remove();
    }

    // Your existing code starts here
    const modal = document.createElement('div');
    modal.className = 'arithmetic-section';
    modal.style.display = 'none';
    
    const translatedTexts = {
        firstNumber: await window.translationService.translate('First number', language),
        secondNumber: await window.translationService.translate('Second number', language),
        calculate: await window.translationService.translate('Calculate', language),
        guideMe: await window.translationService.translate('Guide Me', language)
    };
    
    console.log('Initial translations:', translatedTexts);

    console.log('Creating modal with translations:', {
        calculate: translatedTexts.calculate,
        guideMe: translatedTexts.guideMe,
        language: language
    });

    modal.innerHTML = `
        <div class="arithmetic-content">
            <span>(X)</span>
            <input type="number" id="num1" placeholder="${translatedTexts.firstNumber}">
            <select id="operator">
                <option value="+">+</option>
                <option value="-">-</option>
                <option value="x">x</option>
                <option value="/">/</option>
            </select>
            <span>(Y)</span>
            <input type="number" id="num2" placeholder="${translatedTexts.secondNumber}">
            <button class="button-common" id="calculate">${translatedTexts.calculate}</button>
            <button class="button-common" id="guide">${translatedTexts.guideMe}</button>
            <div class="expected-result"></div>
        </div>
    `;

    document.querySelector('.container').appendChild(modal);

    const calculateButton = modal.querySelector('#calculate');
    const guideButton = modal.querySelector('#guide');
    calculateButton.addEventListener('click', () => this.startPractice());
    guideButton.addEventListener('click', async () => {
        const num1 = parseInt(document.getElementById('num1').value);
        const num2 = parseInt(document.getElementById('num2').value);
        const operator = document.getElementById('operator').value;
        this.steps = await this.generateSteps(num1, num2, operator);
        this.showNextStep();
    });
    }    toggleModal() {
        const modal = document.querySelector('.arithmetic-section');
        modal.style.display = modal.style.display === 'none' || modal.style.display === '' ? 'block' : 'none';
    }
    startPractice() {
        const num1Input = document.getElementById('num1');
        const num2Input = document.getElementById('num2');
        const operatorSelect = document.getElementById('operator');

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
    }    async showNextStep() {
        if (this.currentStep < this.steps.length) {
            const step = await this.steps[this.currentStep];
            let stepMessage;
        
            if (this.currentStep === 0) {
                stepMessage = step.message;
            } else {
                stepMessage = step.message;
            }
        
            if (step.isComplement) {
                const operator = document.getElementById('operator').value;
                const handler = operator === '+' ? this.addition : this.subtraction;
                const showMovementText = await window.translationService.translate('Show Movement', window.tutorial.currentLanguage);
                stepMessage += ` <button class="button-common" onclick="window.arithmetic.${operator === '+' ? 'addition' : 'subtraction'}.repeatComplementStep(${step.complementValue}, ${step.value})">${showMovementText}</button>`;            }
        
            if (this.currentStep < this.steps.length - 1) {
                const nextStepText = await window.translationService.translate('Next Step', window.tutorial.currentLanguage);
                stepMessage += ` <button class="button-common" id="nextStepBtn">${nextStepText}</button>`;            }
        
            document.querySelector('.expected-result').innerHTML = stepMessage;
        
            // Add event listener after button is added to DOM
            const nextStepBtn = document.getElementById('nextStepBtn');
            if (nextStepBtn) {
                nextStepBtn.addEventListener('click', () => {
                    this.currentStep++;
                    this.showNextStep();
                });
            }
        
            this.displayStep(step);
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
        const num1 = parseInt(document.getElementById('num1').value);
        const num2 = parseInt(document.getElementById('num2').value);
        const operator = document.getElementById('operator').value;
        const result = this.calculateResult(num1, num2, operator);
        const expectedResultText = await window.translationService.translate('Expected Result:', window.tutorial.currentLanguage);
        document.querySelector('.expected-result').textContent = `${expectedResultText} ${result}`;
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
