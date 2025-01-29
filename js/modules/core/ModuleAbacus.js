/**
 * ModuleAbacus - A dedicated abacus implementation for training modules
 * This version is isolated from the main abacus to prevent state conflicts
 */
class ModuleAbacus {
    constructor(container, config = {}) {
        this.container = container;
        this.config = {
            columns: config.columns || 1,
            beadsPerColumn: config.beadsPerColumn || 9,
            topBeads: config.topBeads || 1,
            bottomBeads: config.bottomBeads || 4,
            baseValue: config.baseValue || 10,
            allowDecimal: config.allowDecimal || false,  // For advanced modules
            highlightEnabled: config.highlightEnabled || true,
            ...config
        };
        this.currentValue = 0;
        this.valueChangeCallbacks = new Set();
        this.init();
    }

    init() {
        // Create abacus structure
        const abacus = document.createElement('div');
        abacus.className = 'module-abacus';
        
        // Create columns
        for (let i = 0; i < this.config.columns; i++) {
            const column = this.createColumn(i);
            abacus.appendChild(column);
        }

        // Create value display
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'module-value-display';
        valueDisplay.textContent = '0';
        
        // Create controls container (for advanced features)
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'module-controls';
        
        // Wrapper for layout management
        const wrapper = document.createElement('div');
        wrapper.className = 'module-abacus-wrapper';
        wrapper.appendChild(abacus);
        wrapper.appendChild(valueDisplay);
        wrapper.appendChild(controlsContainer);
        
        // Add to container
        this.container.appendChild(wrapper);
        
        // Save references
        this.abacusElement = abacus;
        this.valueDisplay = valueDisplay;
        this.controlsContainer = controlsContainer;
        this.wrapper = wrapper;

        // Initialize any enabled features
        this.initializeFeatures();
    }

    createColumn(index) {
        const column = document.createElement('div');
        column.className = 'module-column';
        
        // Calculate column value based on position and base
        const power = this.config.columns - 1 - index;
        const value = Math.pow(this.config.baseValue, power);
        column.dataset.value = value;
        column.dataset.index = index;

        // Add rod
        const rod = document.createElement('div');
        rod.className = 'module-rod';
        column.appendChild(rod);

        // Add top beads
        const topSection = document.createElement('div');
        topSection.className = 'module-top-section';
        for (let i = 0; i < this.config.topBeads; i++) {
            topSection.appendChild(this.createBead('top', index, i));
        }

        // Add bottom beads
        const bottomSection = document.createElement('div');
        bottomSection.className = 'module-bottom-section';
        for (let i = 0; i < this.config.bottomBeads; i++) {
            bottomSection.appendChild(this.createBead('bottom', index, i));
        }

        column.appendChild(topSection);
        column.appendChild(bottomSection);

        return column;
    }

    createBead(position, columnIndex, beadIndex) {
        const bead = document.createElement('div');
        bead.className = `module-bead ${position}-bead`;
        bead.dataset.columnIndex = columnIndex;
        bead.dataset.beadIndex = beadIndex;
        bead.dataset.position = position;
        
        // Add event listeners
        bead.addEventListener('click', () => this.toggleBead(bead));
        if (this.config.highlightEnabled) {
            bead.addEventListener('mouseenter', () => this.highlightBead(bead, true));
            bead.addEventListener('mouseleave', () => this.highlightBead(bead, false));
        }
        
        return bead;
    }

    toggleBead(bead) {
        const wasActive = bead.classList.contains('active');
        const position = bead.dataset.position;
        const columnIndex = parseInt(bead.dataset.columnIndex);
        const beadIndex = parseInt(bead.dataset.beadIndex);

        // Get all beads in the same column and position
        const column = this.abacusElement.querySelectorAll(
            `.module-column[data-index="${columnIndex}"] .${position}-bead`
        );

        // Apply proper bead movement logic
        if (position === 'top') {
            // Top beads move independently
            bead.classList.toggle('active');
        } else {
            // Bottom beads move as a group
            const shouldActivate = !wasActive;
            column.forEach((otherBead, index) => {
                if (shouldActivate && index <= beadIndex) {
                    otherBead.classList.add('active');
                } else if (!shouldActivate && index >= beadIndex) {
                    otherBead.classList.remove('active');
                }
            });
        }

        this.calculateValue();
    }

    highlightBead(bead, highlight) {
        if (!this.config.highlightEnabled) return;
        
        bead.classList.toggle('highlight', highlight);
        
        // Highlight related beads based on rules
        const position = bead.dataset.position;
        const columnIndex = bead.dataset.columnIndex;
        const beadIndex = parseInt(bead.dataset.beadIndex);

        if (position === 'bottom') {
            // Highlight all beads that would move together
            const column = this.abacusElement.querySelectorAll(
                `.module-column[data-index="${columnIndex}"] .bottom-bead`
            );
            column.forEach((otherBead, index) => {
                if (index <= beadIndex) {
                    otherBead.classList.toggle('highlight', highlight);
                }
            });
        }
    }

    calculateValue() {
        let totalValue = 0;
        const columns = this.abacusElement.querySelectorAll('.module-column');
        
        columns.forEach(column => {
            const columnValue = parseInt(column.dataset.value);
            const topBeads = column.querySelectorAll('.top-bead.active').length;
            const bottomBeads = column.querySelectorAll('.bottom-bead.active').length;
            
            totalValue += columnValue * (topBeads * 5 + bottomBeads);
        });

        this.currentValue = totalValue;
        this.valueDisplay.textContent = this.formatValue(totalValue);
        this.notifyValueChange();
    }

    formatValue(value) {
        if (this.config.allowDecimal) {
            return value.toFixed(Math.max(0, this.config.decimalPlaces || 0));
        }
        return value.toString();
    }

    notifyValueChange() {
        // Notify through custom event
        const event = new CustomEvent('valueChange', {
            detail: { value: this.currentValue }
        });
        this.container.dispatchEvent(event);

        // Notify registered callbacks
        this.valueChangeCallbacks.forEach(callback => {
            try {
                callback(this.currentValue);
            } catch (error) {
                console.error('Error in value change callback:', error);
            }
        });
    }

    onValueChange(callback) {
        this.valueChangeCallbacks.add(callback);
        return () => this.valueChangeCallbacks.delete(callback); // Return cleanup function
    }

    reset() {
        const activeBeads = this.abacusElement.querySelectorAll('.module-bead.active');
        activeBeads.forEach(bead => bead.classList.remove('active'));
        this.calculateValue();
    }

    getValue() {
        return this.currentValue;
    }

    setHighlighting(enabled) {
        this.config.highlightEnabled = enabled;
    }

    initializeFeatures() {
        // Add any additional features based on config
        if (this.config.allowDecimal) {
            this.initializeDecimalFeatures();
        }
    }

    initializeDecimalFeatures() {
        // Add decimal point indicator
        const decimalPoint = document.createElement('div');
        decimalPoint.className = 'module-decimal-point';
        decimalPoint.textContent = '.';
        
        // Position it after the appropriate column
        const decimalPosition = this.config.decimalPosition || 0;
        const columns = this.abacusElement.querySelectorAll('.module-column');
        if (columns[decimalPosition]) {
            columns[decimalPosition].after(decimalPoint);
        }
    }

    cleanup() {
        // Clear observers
        if (this.valueObserver) {
            this.valueObserver.disconnect();
            this.valueObserver = null;
        }

        const abacusContainer = document.getElementById('abacusContainer');

        // Reset abacus state first
        this.resetAbacus();

        // Function to restore abacus container
        const restoreAbacusContainer = () => {
            if (!abacusContainer) return;

            // Remove game-specific classes
            abacusContainer.classList.remove('game-active');

            // Clear all inline styles
            abacusContainer.removeAttribute('style');

            // Force reflow
            void abacusContainer.offsetHeight;

            // Set transition for smooth restore
            abacusContainer.style.transition = 'all 0.3s ease-out';

            // Ensure proper display properties
            abacusContainer.style.display = 'flex';
            abacusContainer.style.visibility = 'visible';
            abacusContainer.style.opacity = '1';
            abacusContainer.style.width = '100%';
            abacusContainer.style.height = '';

            // Force final value update
            requestAnimationFrame(() => {
                window.abacus?.calculateValue();
            });
        };

        // Clean up game container with transition
        if (this.container) {
            this.container.classList.remove('active');
            this.container.style.opacity = '0';

            // Wait for transition before cleanup
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                // Restore abacus after container is removed
                requestAnimationFrame(restoreAbacusContainer);
            }, 300);
        } else {
            restoreAbacusContainer();
        }

        // Reset game state
        this.container = null;
        this.contentContainer = null;
        this.gameState = 'ready';
        this.numberHistory = [];
        this.currentLevel = 1;
        this.score = 0;
    }
}

export default ModuleAbacus;