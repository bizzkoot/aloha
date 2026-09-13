class Subtraction {
    constructor() {
    }

    get currentLanguage() {
        return localStorage.getItem('selectedLanguage') || window.tutorial?.currentLanguage || window.currentLanguage || 'en';
    }

    async sorobanSubtract(num1, num2) {
        const lang = this.currentLanguage;
        // First check if result would be negative
        if (num1 < num2) {
            const errorMessage = await window.translationService.translate('Soroban cannot perform negative number calculations. Please enter a first number larger than the second number.', lang);
            alert(errorMessage);
            document.getElementById('num1').value = '';
            document.getElementById('num2').value = '';
            return null;
        }
    
        const translatedTexts = {
            since: await window.translationService.translate('Since', lang),
            lessThan: await window.translationService.translate('less than', lang),
            currentValue: await window.translationService.translate('Current value:', lang),
            subtract: await window.translationService.translate('subtract', lang),
            directly: await window.translationService.translate('directly', lang),
            and: await window.translationService.translate('and', lang),
            borrowTen: await window.translationService.translate('We borrow 10 from the Left', lang),
            then: await window.translationService.translate('Then', lang),
            soWeAdd: await window.translationService.translate('So we add', lang),
            directSubtract: await window.translationService.translate('Direct subtraction', lang),
            inPosition: await window.translationService.translate('In position', lang),
            greaterThan: await window.translationService.translate('greater than', lang),
            equals: await window.translationService.translate('equals', lang),
            afterRemoving: await window.translationService.translate('after removing', lang),
            borrowFromNext: await window.translationService.translate('Borrow from next column and add complement', lang),
            minus: '-', // Changed to symbol
            equalTo: '=', // Changed to symbol
            directSubtraction: await window.translationService.translate('Direct subtraction', lang),
            enoughBottomBeads: await window.translationService.translate('and we have enough bottom beads to subtract directly.', lang),
            complementOf5: await window.translationService.translate('but we need to use the complement of 5 because we are subtracting from', lang),
            remove5AndAdd: await window.translationService.translate('Remove 5 and add', lang),
            addComplement: await window.translationService.translate('Add', lang),
            weNeedToBorrow: await window.translationService.translate('we need to borrow 10.', lang),
            sinceYLessThan5: await window.translationService.translate('Since Y < 5, we use the complement of 5.', lang),
            sinceYGreaterThanOrEqual5: await window.translationService.translate('Since Y >= 5, we use the complement of 10.', lang),
            step: await window.translationService.translate('Step', lang),
            useComplementOf5: await window.translationService.translate('Use complement of 5:', lang),
            forSubtracting: await window.translationService.translate('For subtracting', lang)
        };
    
        const placeValues = String(num2).split('').map(Number).reverse();
        let currentValue = num1;
        let stepMessage = `${translatedTexts.step} 2: ${translatedTexts.forSubtracting} ${num2}:<br><br>`;
    
        for (let index = 0; index < placeValues.length; index++) {
            const value = placeValues[index];
            // Add this check right here
            if (value === 0) {
                continue; // Skip this iteration if we're subtracting 0
            }
            const placeValueBase = Math.pow(10, index);
            const digit = value;
            const currentDigit = Math.floor((currentValue / placeValueBase) % 10);
            const nextDigit = Math.floor((currentValue / (placeValueBase * 10)) % 10);
            const nextPlaceValueBase = placeValueBase * 10;
            const positionName = await this.getPositionName(placeValueBase);
    
            if (currentDigit < digit) {
                let borrow = 0;
                if (nextDigit > 0) {
                    borrow = 1;
                    currentValue -= nextPlaceValueBase;
                } else {
                    let nextNextDigit = Math.floor((currentValue / (nextPlaceValueBase * 10)) % 10);
                    let nextNextPlaceValueBase = nextPlaceValueBase * 10;
                    let carryOver = 0;
                    while (nextNextDigit === 0) {
                        carryOver++;
                        nextNextPlaceValueBase *= 10;
                        nextNextDigit = Math.floor((currentValue / (nextNextPlaceValueBase)) % 10);
                    }
                    currentValue -= nextNextPlaceValueBase;
                    for (let i = 0; i < carryOver; i++) {
                        currentValue += 9 * Math.pow(10, index + 1 + i);
                    }
                    currentValue += 10 * placeValueBase;
                }
                const complement = 10 - digit;
                currentValue += complement * placeValueBase;
                stepMessage += `${index + 1}. ${translatedTexts.inPosition} ${positionName} X=${currentDigit}, Y=${digit}:<br>`;
                stepMessage += ` ${translatedTexts.since} X=${currentDigit} ${translatedTexts.lessThan} Y=${digit}, ${translatedTexts.weNeedToBorrow}<br>`;
                stepMessage += ` <span class="mental-process">a. ${translatedTexts.borrowTen}</span><br>`;
                stepMessage += ` <span class="mental-process">b. ${translatedTexts.then} 10 ${translatedTexts.minus} ${digit} ${translatedTexts.equalTo} ${complement}. ${translatedTexts.soWeAdd} ${complement}</span><br>`;
                stepMessage += ` ${translatedTexts.currentValue} ${currentValue}<br><br>`;
            } else if (currentDigit === digit) {
                currentValue -= digit * placeValueBase;
                stepMessage += `${index + 1}. ${translatedTexts.inPosition} ${positionName} X=${currentDigit}, Y=${digit}:<br>`;
                stepMessage += ` ${translatedTexts.since} X=${currentDigit} ${translatedTexts.equals} Y=${digit}:<br>`;
                stepMessage += ` <span class="mental-process">a. ${translatedTexts.then} ${currentDigit} ${translatedTexts.minus} ${digit} ${translatedTexts.equalTo} 0. ${translatedTexts.directSubtraction}</span><br>`;
                stepMessage += ` ${translatedTexts.currentValue} ${currentValue}<br><br>`;
            } else {
                if (currentDigit >= 5 && digit < 5) {
                    if (currentDigit - 5 >= digit) {
                        // Direct subtraction if possible
                        currentValue -= digit * placeValueBase;
                        stepMessage += `${index + 1}. ${translatedTexts.inPosition} ${positionName} X=${currentDigit}, Y=${digit}:<br>`;
                        stepMessage += ` ${translatedTexts.since} X=${currentDigit} ${translatedTexts.greaterThan} Y=${digit}, ${translatedTexts.enoughBottomBeads}<br>`;
                        stepMessage += ` <span class="mental-process">a. ${translatedTexts.then} ${currentDigit} ${translatedTexts.minus} ${digit} ${translatedTexts.equalTo} ${currentDigit - digit}. ${translatedTexts.directSubtraction}</span><br>`;
                        stepMessage += ` ${translatedTexts.currentValue} ${currentValue}<br><br>`;
                    } else {
                        const complement5 = 5 - digit;
                        currentValue -= 5 * placeValueBase;
                        currentValue += complement5 * placeValueBase;
                        stepMessage += `${index + 1}. ${translatedTexts.inPosition} ${positionName} X=${currentDigit}, Y=${digit}:<br>`;
                        stepMessage += ` ${translatedTexts.since} X=${currentDigit} ${translatedTexts.greaterThan} Y=${digit}, ${translatedTexts.complementOf5} ${currentDigit} (5+${currentDigit % 5}).<br>`;
                        stepMessage += ` <span class="mental-process">a. ${translatedTexts.useComplementOf5} ${translatedTexts.then} 5 ${translatedTexts.minus} ${digit} ${translatedTexts.equalTo} ${complement5}. ${translatedTexts.remove5AndAdd} ${complement5}</span><br>`;
                        stepMessage += ` ${translatedTexts.currentValue} ${currentValue}<br><br>`;
                    }
                } else {
                    stepMessage += `${index + 1}. ${translatedTexts.inPosition} ${positionName} X=${currentDigit}, Y=${digit}:<br>`;
                    if (currentDigit >= digit) {
                        stepMessage += ` ${translatedTexts.since} X=${currentDigit} ${translatedTexts.greaterThan} Y=${digit}, ${translatedTexts.enoughBottomBeads}<br>`;
                        stepMessage += ` <span class="mental-process">a. ${translatedTexts.then} ${currentDigit} ${translatedTexts.minus} ${digit} ${translatedTexts.equalTo} ${currentDigit - digit}. ${translatedTexts.directSubtraction}</span><br>`;
                    } else {
                        stepMessage += ` ${translatedTexts.since} X=${currentDigit} ${translatedTexts.greaterThan} Y=${digit}, ${translatedTexts.complementOf5} ${currentDigit} (5+${currentDigit % 5}).<br>`;
                        const complement5 = 5 - digit;
                        currentValue -= 5 * placeValueBase;
                        currentValue += complement5 * placeValueBase;
                        stepMessage += ` <span class="mental-process">a. ${translatedTexts.sinceYLessThan5} ${translatedTexts.then} 5 ${translatedTexts.minus} ${digit} ${translatedTexts.equalTo} ${complement5}. ${translatedTexts.remove5AndAdd} ${complement5}</span><br>`;
                    }
                    currentValue -= digit * placeValueBase;
                    stepMessage += ` ${translatedTexts.currentValue} ${currentValue}<br><br>`;
                }
            }
        }
    
        const steps = [{
            value: num1,
            message: `${await window.translationService.translate('Step', this.currentLanguage)} 1: ${await window.translationService.translate('Set first number', this.currentLanguage)}: ${num1}`
        }, {
            value: num1 - num2,
            message: stepMessage,
            isComplement: true,
            complementValue: num2
        }];
        return steps;
    }    
    

    async generateSteps(num1, num2) {
        return this.sorobanSubtract(num1, num2);
    }

    async showSteps(num1, num2) {
        const steps = await this.generateSteps(num1, num2);
        if (!steps) return; // Exit if steps is null
    
        this.currentStep = 0;
        this.displayNextStep(steps);
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

    displayNextStep(steps) {
        if (!steps || !Array.isArray(steps)) return;
    
        const tutorialModal = document.getElementById('tutorialModal');
        const tutorialContent = document.getElementById('tutorialContent');
    
        if (this.currentStep < steps.length) {
            tutorialContent.innerHTML = steps[this.currentStep].message;
            tutorialModal.style.display = 'block';
        }
    }

    async repeatComplementStep(complement, finalValue) {
        const columns = Array.from(document.querySelectorAll('.column')).reverse();
        const num1 = parseInt(document.getElementById('num1').value);
        const num2 = parseInt(document.getElementById('num2').value);
        
        // Calculate all intermediate steps
        const steps = [];
        let currentValue = num1;
        
        const lang = this.currentLanguage;
        const translatedTexts = {
            initialNumber: await window.translationService.translate('Initial number', lang),
            borrowFromNext: await window.translationService.translate('Borrow from next column and add complement', lang),
            subtractFromPosition: await window.translationService.translate('Subtract from position', lang)
        };
        
        // Start with initial number
        steps.push({value: currentValue, desc: translatedTexts.initialNumber});
        
        // Process each digit from right to left
        const num2Digits = String(num2).split('').map(Number).reverse();
        for(let i = 0; i < num2Digits.length; i++) {
            const placeValue = Math.pow(10, i);
            const currentDigit = Math.floor((currentValue / placeValue) % 10);
            const subtractDigit = num2Digits[i];
            
            if(currentDigit < subtractDigit) {
                // Need to borrow
                const complement = 10 - subtractDigit;
                currentValue = currentValue - Math.pow(10, i + 1) + (complement * placeValue);
                steps.push({
                    value: currentValue,
                    desc: `${translatedTexts.borrowFromNext} ${complement}`
                });
            } else {
                // Direct subtraction
                currentValue -= subtractDigit * placeValue;
                steps.push({
                    value: currentValue,
                    desc: `${translatedTexts.subtractFromPosition} ${subtractDigit} from position ${i}`
                });
            }
        }
        
        let stepIndex = 0;
        const animate = () => {
            if (stepIndex < steps.length) {
                this.displayNumberWithHighlights(columns, steps[stepIndex].value);
                window.abacus.calculateValue();
                stepIndex++;
                setTimeout(() => requestAnimationFrame(animate), 2000);
            }
        };
        
        this.displayNumberWithHighlights(columns, num1);
        requestAnimationFrame(animate);
    }

    


    displayNumberWithHighlights(columns, number, beadMovements) {
        try {
            // Reset all beads and highlights
            columns.forEach(column => {
                column.querySelectorAll('.bead').forEach(bead => {
                    bead.classList.remove('active', 'tutorial-highlight');
                });
            });
    
            // Handle sequential bead movements
            if (beadMovements) {
                beadMovements.forEach(movement => {
                    const column = columns[movement.columnIndex];
                    if (!column) return;
                    
                    const bead = column.querySelector(`.${movement.beadType}`);
                    if (bead) {
                        // Set bead state
                        const isActive = movement.direction === 'add';
                        bead.classList.toggle('active', isActive);
                        bead.classList.toggle('tutorial-highlight', isActive);
                    }
                });
            }
    
            // Set final number display
            let remaining = number;
            for (let i = 0; i < columns.length && remaining > 0; i++) {
                const digit = remaining % 10;
                const column = columns[i];
                
                // Set top bead if needed
                if (digit >= 5) {
                    const topBead = column.querySelector('.top-bead');
                    if (topBead) {
                        topBead.classList.add('active', 'tutorial-highlight');
                    }
                }
                
                // Set bottom beads
                const bottomCount = digit % 5;
                for (let j = 0; j < bottomCount; j++) {
                    const bottomBead = column.querySelector(`.bottom-bead-${4-j}`);
                    if (bottomBead) {
                        bottomBead.classList.add('active', 'tutorial-highlight');
                    }
                }
                
                remaining = Math.floor(remaining / 10);
            }
        } catch (error) {
            console.error('Error in displayNumberWithHighlights:', error);
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
    
    async showSteps(num1, num2) {
        // First check if result would be negative
        if (num1 < num2) {
            const errorMessage = await window.translationService.translate('Soroban cannot perform negative number calculations. Please enter a first number larger than the second number.', this.currentLanguage);
            alert(errorMessage);
            // Reset or clear the input fields
            document.getElementById('num1').value = '';
            document.getElementById('num2').value = '';
            return; // Exit early
        }
        try {
            const steps = await this.generateSteps(num1, num2);
            this.currentStep = 0;
            this.displayNextStep(steps);
            // Check if there's a complement step and call repeatComplementStep
            if (steps && steps.length > 1 && steps[1].isComplement) {
                this.repeatComplementStep(steps[1].complementValue, num1 - num2);
            }
        } catch (error) {
            alert(error.message);
            document.getElementById('num1').value = '';
            document.getElementById('num2').value = '';
        }
    }
}

class BeadMovementLogger {
    static log(step, column, beadType, direction, currentValue) {
        console.group(`Bead Movement - Step ${step}`);
        console.log(`Column: ${column}`);
        console.log(`Bead: ${beadType}`);
        console.log(`Action: ${direction}`);
        console.log(`Current Value: ${currentValue}`);
        console.groupEnd();
    }
}
