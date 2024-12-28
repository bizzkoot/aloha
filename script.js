class Abacus {
    constructor() {
        this.columns = document.querySelectorAll('.column');
        this.setupColumns();
        this.currentValue = document.getElementById('currentValue');
        this.value = 0;
        this.setupResetButton();
    }

    setupColumns() {
        this.columns.forEach(column => {
            const rod = document.createElement('div');
            rod.className = 'rod';
            column.appendChild(rod);

            const topSection = document.createElement('div');
            topSection.className = 'top-section';
            const topBead = document.createElement('div');
            topBead.className = 'bead top-bead';
            topBead.dataset.value = 5;
            topBead.addEventListener('click', () => this.toggleBead(topBead, column, true));
            topSection.appendChild(topBead);
            column.appendChild(topSection);

            const bottomSection = document.createElement('div');
            bottomSection.className = 'bottom-section';
            for (let i = 0; i < 4; i++) {
                const bottomBead = document.createElement('div');
                bottomBead.className = `bead bottom-bead-${4 - i}`;
                bottomBead.dataset.value = 1;
                bottomBead.dataset.position = i;
                bottomBead.addEventListener('click', () => this.toggleBead(bottomBead, column, false));
                bottomSection.appendChild(bottomBead);
            }
            column.appendChild(bottomSection);
        });
    }

    setupResetButton() {
        const resetButton = document.createElement('button');
        resetButton.className = 'button-common';
        resetButton.textContent = 'Reset Abacus';
        resetButton.addEventListener('click', () => this.resetAbacus());
        document.querySelector('.container').appendChild(resetButton);
    }

    resetAbacus() {
        const allBeads = document.querySelectorAll('.bead');
        allBeads.forEach(bead => {
            bead.classList.remove('active');
            bead.classList.remove('tutorial-highlight');  // Clear tutorial highlights
        });
        this.calculateValue();
    }

    toggleBead(bead, column, isTop) {
        if (isTop) {
            BeadMovements.moveTopBead(bead, !bead.classList.contains('active'));
        } else {
            const position = parseInt(bead.dataset.position);
            const currentActive = bead.classList.contains('active');
            const activeBeads = currentActive ? position : position + 1;
            BeadMovements.moveBottomBeads(column, activeBeads);
        }
        this.calculateValue();
    }

    calculateValue() {
        this.value = 0;
        this.columns.forEach(column => {
            const place = parseInt(column.dataset.place);
            const topBead = column.querySelector('.top-bead');
            const bottomBeads = column.querySelectorAll('.bottom-bead-4, .bottom-bead-3, .bottom-bead-2, .bottom-bead-1');
            
            let columnValue = 0;
            if (topBead.classList.contains('active')) {
                columnValue += 5;
            }
            
            bottomBeads.forEach(bead => {
                if (bead.classList.contains('active')) {
                    columnValue += 1;
                }
            });
            
            this.value += columnValue * place;
        });
        
        this.currentValue.textContent = this.value;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.abacus = new Abacus();
});