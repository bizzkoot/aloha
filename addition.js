class Addition {
    generateSteps(num1, num2) {
        console.log('Addition generateSteps:', {num1, num2});
        const steps = [];
        
        if (num1 + num2 >= 10) {
            const placeValues = this.getPlaceValues(num2);
            steps.push({
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
            
            steps.push({
                value: num1 + num2,
                message: stepMessage,
                isComplement: true,
                complementValue: num2
            });
        } else {
            steps.push({
                value: num1,
                message: `Set first number: ${num1}`
            });
            steps.push({
                value: num1 + num2,
                message: `Add ${num2} directly`
            });
        }
        
        return steps;
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
}