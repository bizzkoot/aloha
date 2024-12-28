class Subtraction {
    generateSteps(num1, num2) {
        console.log('Subtraction generateSteps:', {num1, num2});
        const steps = [];
        steps.push({
            value: num1,
            message: `Set first number: ${num1}`
        });

        const placeValues = this.getPlaceValues(num2).reverse();
        let stepMessage = `For subtracting ${num2}:<br>`;
        let currentValue = num1;

        placeValues.forEach((value, index) => {
            const placeValueBase = Math.pow(10, Math.floor(Math.log10(value)));
            const digit = Math.floor(value / placeValueBase);
            const currentDigit = Math.floor((currentValue / placeValueBase) % 10);
            const currentTensDigit = Math.floor(currentValue / (placeValueBase * 10)) * 10;

            const baseComplement = 5 * Math.pow(10, Math.floor(Math.log10(placeValueBase)));
            if (currentDigit - digit < 0) {
                const complement = 10 - digit;
                currentValue = currentValue - (placeValueBase * 10) + (complement * placeValueBase);
                stepMessage += `${index + 1}. For ${value}: Since ${currentDigit}-${digit}<0 `;
                stepMessage += `<span class="mental-process">=> 10-${digit}=${complement}, `;
                stepMessage += `so remove 10 and add ${complement} (now ${currentValue})</span><br>`;
            } else if (placeValueBase >= 10 && (currentTensDigit - value) < baseComplement) {
                const complement = baseComplement - value;
                currentValue = currentValue - baseComplement + complement;
                stepMessage += `${index + 1}. For ${value}: Since ${currentTensDigit}-${value}<${baseComplement} `;
                stepMessage += `<span class="mental-process">=> ${baseComplement}-${value}=${complement}, `;
                stepMessage += `so remove ${baseComplement} and add ${complement} (now ${currentValue})</span><br>`;
            } else {
                currentValue -= value;
                stepMessage += `${index + 1}. Subtract ${value} directly to reach ${currentValue}<br>`;
            }
        });

        steps.push({
            value: num1 - num2,
            message: stepMessage,
            isComplement: true,
            complementValue: num2
        });

        return steps;
    }

    repeatComplementStep(complement, finalValue) {
        const columns = Array.from(document.querySelectorAll('.column')).reverse();
        const initialNum = parseInt(document.getElementById('num1').value);
        const numToSubtract = parseInt(document.getElementById('num2').value);
        const placeValues = this.getPlaceValues(numToSubtract).reverse();
        
        this.displayNumberWithHighlights(columns, initialNum);
        
        let currentValue = initialNum;
        placeValues.forEach((placeValue, index) => {
            setTimeout(() => {
                const placeValueBase = Math.pow(10, Math.floor(Math.log10(placeValue)));
                const digit = Math.floor(placeValue / placeValueBase);
                const currentDigit = Math.floor((currentValue / placeValueBase) % 10);
                
                if (currentDigit - digit < 0) {
                    this.displayNumberWithHighlights(columns, currentValue - (placeValueBase * 10));
                    setTimeout(() => {
                        currentValue = currentValue - (placeValueBase * 10) + ((10 - digit) * placeValueBase);
                        this.displayNumberWithHighlights(columns, currentValue);
                    }, 1000);
                } else if (placeValueBase >= 10) {
                    const baseComplement = 5 * Math.pow(10, Math.floor(Math.log10(placeValueBase)));
                    if ((Math.floor(currentValue / placeValueBase) * placeValueBase - placeValue) < baseComplement) {
                        this.displayNumberWithHighlights(columns, currentValue - baseComplement);
                        setTimeout(() => {
                            currentValue = currentValue - baseComplement + (baseComplement - placeValue);
                            this.displayNumberWithHighlights(columns, currentValue);
                        }, 1000);
                    } else {
                        currentValue -= placeValue;
                        this.displayNumberWithHighlights(columns, currentValue);
                    }
                } else {
                    currentValue -= placeValue;
                    this.displayNumberWithHighlights(columns, currentValue);
                }
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
}