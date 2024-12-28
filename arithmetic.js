class ArithmeticMenu {
    constructor() {
        this.createArithmeticButton();
        this.createArithmeticModal();
        this.currentStep = 0;
        this.steps = [];
        this.addition = new Addition();
        this.subtraction = new Subtraction();
        console.log('Addition:', this.addition);
        console.log('Subtraction:', this.subtraction);
    }

    createArithmeticButton() {
        const button = document.createElement('button');
        button.textContent = 'Arithmetic Practice';
        button.className = 'button-common';
        button.onclick = () => this.toggleModal();
        document.querySelector('.container').appendChild(button);
    }

    createArithmeticModal() {
        const modal = document.createElement('div');
        modal.className = 'arithmetic-section';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="arithmetic-content">
                <input type="number" id="num1" placeholder="First number">
                <select id="operator">
                    <option value="+">+</option>
                    <option value="-">-</option>
                    <option value="x">x</option>
                    <option value="/">/</option>
                </select>
                <input type="number" id="num2" placeholder="Second number">
                <button class="button-common" id="calculate">Calculate</button>
                <button class="button-common" id="guide">Guide Me</button>
                <div class="expected-result"></div>
            </div>
        `;
        document.querySelector('.container').appendChild(modal);

        const calculateButton = modal.querySelector('#calculate');
        const guideButton = modal.querySelector('#guide');
        calculateButton.addEventListener('click', () => this.startPractice());
        guideButton.addEventListener('click', () => this.showNextStep());
    }

    toggleModal() {
        const modal = document.querySelector('.arithmetic-section');
        if (modal.style.display === 'none' || modal.style.display === '') {
            modal.style.display = 'block';
        } else {
            modal.style.display = 'none';
        }
    }

    startPractice() {
        const num1Input = document.getElementById('num1');
        const num2Input = document.getElementById('num2');
        const operatorSelect = document.getElementById('operator');
        console.log('Input elements:', {
            num1: num1Input?.value,
            num2: num2Input?.value,
            operator: operatorSelect?.value
        });

        try {
            const num1 = parseInt(num1Input.value);
            const num2 = parseInt(num2Input.value);
            const operator = operatorSelect.value;
            console.log('Starting practice with:', {num1, num2, operator});
            this.generateSteps(num1, num2, operator);
            this.showExpectedResult();
        } catch (error) {
            console.error('Error in startPractice:', error);
        }
    }

    generateSteps(num1, num2, operator) {
        console.log('Generating steps for:', {num1, num2, operator});
        this.steps = [];
        
        switch(operator) {
            case '+':
                console.log('Addition case');
                this.steps = this.addition.generateSteps(num1, num2);
                console.log('Generated addition steps:', this.steps);
                break;
            case '-':
                console.log('Subtraction case');
                this.steps = this.subtraction.generateSteps(num1, num2);
                console.log('Generated subtraction steps:', this.steps);
                break;
            case 'x':
                this.steps.push({ value: num1, message: `Set first number: ${num1}` });
                this.steps.push({ value: num1 * num2, message: `Multiply by ${num2}` });
                break;
            case '/':
                this.steps.push({ value: num1, message: `Set first number: ${num1}` });
                this.steps.push({ value: Math.floor(num1 / num2), message: `Divide by ${num2}` });
                break;
        }
        this.currentStep = 0;
        return this.steps;
    }

    showNextStep() {
        console.log('Current step:', this.currentStep);
        console.log('Total steps:', this.steps.length);
        
        if (this.currentStep < this.steps.length) {
            const step = this.steps[this.currentStep];
            console.log('Current step data:', step);
            let stepMessage = `Step ${this.currentStep + 1}: ${step.message}`;
            
            if (step.isComplement) {
                const operator = document.getElementById('operator').value;
                console.log('Operator for complement:', operator);
                const handler = operator === '+' ? this.addition : this.subtraction;
                console.log('Selected handler:', handler);
                
                stepMessage += ` <button class="button-common" onclick="window.arithmetic.${operator === '+' ? 'addition' : 'subtraction'}.repeatComplementStep(${step.complementValue}, ${step.value})">Show Movement</button>`;
                handler.repeatComplementStep(step.complementValue, step.value);
            }
            
            document.querySelector('.expected-result').innerHTML = stepMessage;
            this.displayStep(step);
            this.currentStep++;
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

    showExpectedResult() {
        const num1 = parseInt(document.getElementById('num1').value);
        const num2 = parseInt(document.getElementById('num2').value);
        const operator = document.getElementById('operator').value;
        const result = this.calculateResult(num1, num2, operator);
        document.querySelector('.expected-result').textContent = `Expected Result: ${result}`;
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

document.addEventListener('DOMContentLoaded', () => {
    window.arithmetic = new ArithmeticMenu();
});
