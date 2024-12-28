class ArithmeticMenu {
    constructor() {
        this.createArithmeticButton();
        this.createArithmeticModal();
        this.currentStep = 0;
        this.steps = [];
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

        document.getElementById('calculate').onclick = () => this.startPractice();
        document.getElementById('guide').onclick = () => this.showNextStep();
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
        const num1 = parseInt(document.getElementById('num1').value);
        const num2 = parseInt(document.getElementById('num2').value);
        const operator = document.getElementById('operator').value;
        
        this.generateSteps(num1, num2, operator);
        this.showExpectedResult();
    }
    generateSteps(num1, num2, operator) {
        this.steps = [];
        switch(operator) {
            case '+':
                if (num1 + num2 >= 10) {
                    const placeValues = this.getPlaceValues(num2);
                    this.steps.push({
                        value: num1,
                        message: `Set first number: ${num1}`
                    });
                    
                    let stepMessage = `For adding ${num2}:<br>`;
                    placeValues.forEach((value, index) => {
                        const placeValueBase = Math.pow(10, Math.floor(Math.log10(value)));
                        const nextPlaceValue = placeValueBase * 10;
                        const complement = nextPlaceValue - value;
                        
                        stepMessage += `${index + 1}. Add ${value} to reach ${num1 + value} `;
                        stepMessage += `<span class="mental-process">=> ${nextPlaceValue}-${value}=${complement}, `;
                        stepMessage += `so we deduct ${complement} and then add ${nextPlaceValue}</span><br>`;
                    });
                    
                    this.steps.push({
                        value: num1 + num2,
                        message: stepMessage,
                        isComplement: true,
                        complementValue: num2
                    });
                } else {
                    // Keep existing simple addition logic
                    this.steps.push({
                        value: num1,
                        message: `Set first number: ${num1}`
                    });
                    this.steps.push({
                        value: num1 + num2,
                        message: `Add ${num2} directly`
                    });
                }
                break;
            case '-':
                this.steps.push({ value: num1, message: `Set first number: ${num1}` });
                this.steps.push({ value: num1 - num2, message: `Subtract ${num2}` });
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
    }    showNextStep() {
        if (this.currentStep < this.steps.length) {
            const step = this.steps[this.currentStep];
            
            let stepMessage = `Step ${this.currentStep + 1}: ${step.message}`;
            if (step.isComplement) {
                stepMessage += ` <button class="button-common" onclick="window.arithmetic.repeatComplementStep(${step.complementValue}, ${step.value})">Show Movement</button>`;
                this.repeatComplementStep(step.complementValue, step.value); //Call the function here
            }
            document.querySelector('.expected-result').innerHTML = stepMessage;
            
            const value = step.value;
            const columns = Array.from(document.querySelectorAll('.column')).reverse();
            
            document.querySelectorAll('.tutorial-highlight').forEach(el => {
                el.classList.remove('tutorial-highlight');
            });
            
            columns.forEach(column => BeadMovements.setValue(column, 0));
            
            let remainingValue = value;
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
            this.currentStep++;
        }
    }
    repeatComplementStep(complement, finalValue) {
        const columns = Array.from(document.querySelectorAll('.column')).reverse();
        const initialNum = parseInt(document.getElementById('num1').value);
        const numToAdd = parseInt(document.getElementById('num2').value);
        const placeValues = this.getPlaceValues(numToAdd);
        
        this.displayNumberWithHighlights(columns, initialNum);
        
        let currentSum = initialNum;
        placeValues.forEach((placeValue, index) => {
            setTimeout(() => {
                currentSum += placeValue;
                this.displayNumberWithHighlights(columns, currentSum);
                window.abacus.calculateValue();
            }, 2000 * (index + 1));
        });
    }

    displayNumberWithHighlights(columns, number) {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        columns.forEach(column => BeadMovements.setValue(column, 0));
        
        let remaining = number;
        for (let i = 0; i < columns.length && remaining > 0; i++) {
            const digit = remaining % 10;
            const column = columns[i];
            
            if (digit >= 5) {
                column.querySelector('.top-bead').classList.add('tutorial-highlight');
            }
            for (let j = 0; j < digit % 5; j++) {
                column.querySelector(`.bottom-bead-${4-j}`).classList.add('tutorial-highlight');
            }
            
            BeadMovements.setValue(column, digit);
            remaining = Math.floor(remaining / 10);
        }
    }

    getPlaceValues(number) {
        const values = [];
        let remaining = number;
        let placeValue = 1;
        
        while (remaining > 0) {
            const digit = remaining % 10;
            if (digit !== 0) {
                values.unshift(digit * placeValue);
            }
            remaining = Math.floor(remaining / 10);
            placeValue *= 10;
        }
        return values;
    }
    showExpectedResult() {
        const num1 = parseInt(document.getElementById('num1').value);
        const num2 = parseInt(document.getElementById('num2').value);
        const operator = document.getElementById('operator').value;
        let result;
        
        switch(operator) {
            case '+': result = num1 + num2; break;
            case '-': result = num1 - num2; break;
            case 'x': result = num1 * num2; break;
            case '/': result = Math.floor / num2; break;
        }
        
        document.querySelector('.expected-result').textContent = 
            `Expected Result: ${result}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.arithmetic = new ArithmeticMenu();
});