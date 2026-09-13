class Addition {
    get currentLanguage() {
        return localStorage.getItem('selectedLanguage') || window.tutorial?.currentLanguage || window.currentLanguage || 'en';
    }

    async generateSteps(num1, num2) {
        const lang = this.currentLanguage;
        const translatedMessages = {
            step: await window.translationService.translate('Step', lang),
            setFirst: await window.translationService.translate('Set first number', lang) + `: ${num1}`,
            forAdding: await window.translationService.translate('For adding', lang) + ` ${num2}`,
            position: await window.translationService.translate('position', lang),
            currentValue: await window.translationService.translate('Current value:', lang),
            directAddition: await window.translationService.translate('direct addition', lang),
            add: await window.translationService.translate('add', lang),
            minus: await window.translationService.translate('minus', lang),
            stepNumber: await window.translationService.translate('Step ${number}:', lang),
            equation: await window.translationService.translate('X=${x}, Y=${y}: ${x}+${y}=${sum}', lang),
            stepPrefix: await window.translationService.translate('Step', lang),
            startingSmallest: await window.translationService.translate('Starting with smallest digit', lang),
            processingOnes: await window.translationService.translate('Processing ones position first', lang),
            movingToTens: await window.translationService.translate('Then moving to tens', lang),
            sinceSum: await window.translationService.translate('Since the sum is', lang),
            lessThan5: await window.translationService.translate('less than 5', lang),
            greaterOrEqual5: await window.translationService.translate('greater than or equal to 5', lang),
            use5Complement: await window.translationService.translate('we use the 5\'s complement (5 - Y)', lang),
            calculate: await window.translationService.translate('We calculate', lang),
            thisMeans: await window.translationService.translate('This means we add 5 and subtract', lang),
            use10Complement: await window.translationService.translate('we use the 10\'s complement (10 - Y)', lang),
            add10Subtract: await window.translationService.translate('This means we add 10 and subtract', lang),
            canAddDirectly: await window.translationService.translate('we can add directly', lang),
            andXIs: await window.translationService.translate('and X is', lang),
            lessThan5AndSumLessThan10: await window.translationService.translate('less than 5 and the sum is less than 10', lang),
            moveBeads: await window.translationService.translate('Move beads:', lang),
            addTop: await window.translationService.translate('Add top bead (5)', lang),
            removeBottom: await window.translationService.translate('Remove bottom beads', lang)
        };

        const steps = [];
        steps.push({
            value: num1,
            message: `${translatedMessages.stepPrefix} 1: ${translatedMessages.setFirst}`
        });

        const placeValues = this.getPlaceValues(num2);
        let stepMessage = `${translatedMessages.stepPrefix} 2: ${translatedMessages.forAdding}:<br>${translatedMessages.startingSmallest}<br><br>`;
        let currentValue = num1;

        const reversedPlaceValues = [...placeValues].reverse();

        for (let index = 0; index < reversedPlaceValues.length; index++) {
            const value = reversedPlaceValues[index];
            const placeValueBase = Math.pow(10, Math.floor(Math.log10(value)));
            const nextValue = currentValue + value;
            const X = Math.floor((currentValue / placeValueBase) % 10);
            const Y = Math.floor(value / placeValueBase);
            const sum = X + Y;

            const positionName = await this.getPositionName(placeValueBase);
            stepMessage += `${index + 1}. ${await window.translationService.translate('In', lang)} ${positionName} ${translatedMessages.position} X=${X}, Y=${Y}: ${X}+${Y}=${sum}<br>`;

            let processMessage = '';
            let complement;
            const doText = await window.translationService.translate('do', lang);
            const andText = await window.translationService.translate('and', lang);

            if (sum === 5) {
                complement = 5 - Y;
                processMessage = `${translatedMessages.sinceSum} ${sum}, ${translatedMessages.use5Complement}.<br>
                ${translatedMessages.calculate} 5 - ${Y} = ${complement}.<br>
                ${translatedMessages.moveBeads}:<br>
                1. ${translatedMessages.addTop}<br>
                2. ${translatedMessages.removeBottom} (${complement})`;
            } else if (sum < 5) {
                processMessage = `${translatedMessages.sinceSum} ${sum}, ${translatedMessages.lessThan5}, ${translatedMessages.canAddDirectly}`;
            } else if (sum >= 5) {
                if (X < 5 && sum < 10) {
                    processMessage = `${translatedMessages.sinceSum} ${sum}, ${translatedMessages.andXIs} ${X} ${translatedMessages.lessThan5AndSumLessThan10}, ${translatedMessages.canAddDirectly}`;
                } else if (Y < 5) {
                    complement = 5 - Y;
                    processMessage = `${translatedMessages.sinceSum} ${sum}, ${translatedMessages.greaterOrEqual5}, ${translatedMessages.use5Complement}. ${translatedMessages.calculate} 5 - ${Y} = ${complement}. ${translatedMessages.thisMeans} ${complement}`;
                } else {
                    complement = 10 - Y;
                    processMessage = `${translatedMessages.sinceSum} ${sum}, ${translatedMessages.greaterOrEqual5}, ${translatedMessages.use10Complement}. ${translatedMessages.calculate} 10 - ${Y} = ${complement}. ${translatedMessages.add10Subtract} ${complement}`;
                }
            }

            stepMessage += ` <span class="mental-process">${processMessage}</span><br>`;
            stepMessage += ` ${translatedMessages.currentValue} ${nextValue}<br><br>`;
            currentValue = nextValue;
        }

        steps.push({
            value: num1 + num2,
            message: stepMessage,
            isComplement: true,
            complementValue: num2
        });

        return steps;
    }
    async getPositionName(base) {
        const lang = this.currentLanguage;
        switch(base) {
            case 1: return await window.translationService.translate('ones', lang);
            case 10: return await window.translationService.translate('tens', lang);
            case 100: return await window.translationService.translate('hundreds', lang);
            case 1000: return await window.translationService.translate('thousands', lang);
            default: return '';
        }
    }

    getPlaceValues(number) {
        const values = [];
        let remaining = number;
        let placeValue = 1;
        while (remaining > 0) {
            const digit = remaining % 10;
            if (digit !== 0) {
                // Insert at beginning to maintain right-to-left order
                values.unshift(digit * placeValue);
            }
            remaining = Math.floor(remaining / 10);
            placeValue *= 10;
        }
        return values;
    }
    
    repeatComplementStep(complement, finalValue) {
        const columns = Array.from(document.querySelectorAll('.column')).reverse();
        const initialNum = parseInt(document.getElementById('num1').value);
        const numToAdd = parseInt(document.getElementById('num2').value);
        const placeValues = this.getPlaceValues(numToAdd);
        
        this.displayNumberWithHighlights(columns, initialNum);
        
        let currentSum = initialNum;
        // Process values from right to left (reverse the array)
        const reversedValues = [...placeValues].reverse();
        reversedValues.forEach((placeValue, index) => {
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
        // Start from rightmost column
        for (let i = 0; i < columns.length && remaining > 0; i++) {
            const digit = remaining % 10;
            const column = columns[i]; // Already in right-to-left order
            
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

    showSteps(num1, num2) {
        const steps = this.generateSteps(num1, num2);
        this.currentStep = 0;
        this.displayNextStep(steps);
    }
}
