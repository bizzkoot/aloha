class ModuleManager {
    constructor() {
        this.currentModule = null;
        this.initialized = false;
        this.selectedAgeGroup = localStorage.getItem('selectedAgeGroup');
        this.ageGroupPaths = {
            '5-7': 'age-5-7',
            '8-10': 'age-8-10',
            '11-13': 'age-11-13',
            '14+': 'age-14-plus'
        };
        this.ageGroups = {
            '5-7': 'introduction',
            '8-10': 'placeValue',
            '11-13': 'advanced',
            '14+': 'mastering'
        };
    }

    async initialize() {
        if (this.initialized) return true;
        
        console.log('Initializing Training Module System');
        await this.createAgeGroupModal();
        
        this.initialized = true;
        console.log('Training Module System initialized');
        return true;
    }

    showTrainingButton() {
        const trainingBtn = document.getElementById('trainingBtn');
        if (trainingBtn) {
            trainingBtn.style.display = 'inline-block';
            trainingBtn.classList.remove('hidden');
            console.log('Training button visibility set');
        } else {
            console.error('Training button not found in DOM');
        }
    }

    createAgeGroupModal() {
        // Create or get elements
        let section = document.querySelector('.training-section');
        let overlay = document.querySelector('.dark-overlay');
        
        if (!section || !overlay) {
            // Create overlay first (so it appears under the section)
            overlay = document.createElement('div');
            overlay.className = 'dark-overlay';
            document.body.appendChild(overlay);
            
            // Create section
            section = document.createElement('div');
            section.className = 'training-section';
            section.style.position = 'fixed';
            document.body.appendChild(section);
            
            // Set initial content
            section.innerHTML = `
                <div class="tutorial-header">
                    <span class="tutorial-drag-handle">⋮</span>
                    <h2 class="tutorial-title">Select Age Group</h2>
                    <button class="tutorial-close">&times;</button>
                </div>
                <div class="age-group-buttons">
                    <button data-age="5-7">Age 5-7</button>
                    <button data-age="8-10">Age 8-10</button>
                    <button data-age="11-13">Age 11-13</button>
                    <button data-age="14+">Age 14+</button>
                </div>
            `;

            // Set up close button
            const closeButton = section.querySelector('.tutorial-close');
            closeButton.addEventListener('click', () => this.hideAgeGroupModal());
            
            // Add click handlers for age group selection
            section.querySelectorAll('button[data-age]').forEach(button => {
                button.onclick = () => this.selectAgeGroup(button.dataset.age);
            });

            // Set up drag functionality
            this.setupDragFunctionality(section);
        }
        
        this.centerElement(section);
        return section;
    }

    setupDragFunctionality(element) {
        const header = element.querySelector('.tutorial-header');
        const closeButton = element.querySelector('.tutorial-close');
        let isDragging = false;
        let initialX;
        let initialY;
        let initialLeft;
        let initialTop;
    
        const dragStart = (e) => {
            if (e.target === closeButton || e.target.closest('.tutorial-close')) {
                return;
            }
    
            if (e.type === "touchstart") {
                e.preventDefault();
            }

            const rect = element.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            initialX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
            initialY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
                document.body.style.userSelect = 'none';
            }
        };
    
        const dragEnd = () => {
            isDragging = false;
            document.body.style.userSelect = '';
        };
    
        const drag = (e) => {
            if (!isDragging) return;
    
            e.preventDefault();
            
            const currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
            const currentY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
            
            const deltaX = currentX - initialX;
            const deltaY = currentY - initialY;
            
            element.style.left = `${initialLeft + deltaX}px`;
            element.style.top = `${initialTop + deltaY}px`;
        };
    
        header.addEventListener('mousedown', dragStart);
        header.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
    }

    centerElement(element) {
        if (!element) return;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const elementWidth = element.offsetWidth;
        const elementHeight = element.offsetHeight;
        
        const left = Math.max(0, (windowWidth - elementWidth) / 2);
        const top = Math.max(0, (windowHeight - elementHeight) / 2);
        
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
    }

    showAgeGroupModal() {
        console.log('Showing age group selection');
        let section = document.querySelector('.training-section');
        let overlay = document.querySelector('.dark-overlay');
        
        if (!section || !overlay) {
            this.createAgeGroupModal();
            section = document.querySelector('.training-section');
            overlay = document.querySelector('.dark-overlay');
        }

        overlay.classList.add('visible');
        section.classList.add('visible');
        this.centerElement(section);
    }

    hideAgeGroupModal() {
        const section = document.querySelector('.training-section');
        const overlay = document.querySelector('.dark-overlay');
        
        if (section) {
            section.classList.remove('visible');
        }
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

    hideTrainingSection() {
        const container = document.getElementById('training-container');
        if (container) {
            container.classList.remove('visible');
            // Reset abacus state
            const abacus = this.getAbacus();
            if (abacus) {
                const beads = abacus.querySelectorAll('.bead');
                beads.forEach(bead => {
                    bead.classList.remove('active');
                    bead.classList.remove('highlight');
                });
            }
            // Update value display
            const valueDisplay = document.getElementById('currentValue');
            if (valueDisplay) {
                valueDisplay.textContent = '0';
            }
        }
    }

    async selectAgeGroup(ageGroup) {
        this.selectedAgeGroup = ageGroup;
        localStorage.setItem('selectedAgeGroup', ageGroup);
        this.hideAgeGroupModal();
        await this.loadModule(ageGroup);
    }

    
    async loadModule(ageGroup) {
        const moduleName = this.ageGroups[ageGroup];
        const agePath = this.ageGroupPaths[ageGroup];
        if (!moduleName || !agePath) return;

        try {
            // Update the training container
            const container = document.getElementById('training-container');
            if (!container) return;

            // Set up or update container content
            container.innerHTML = `
                <div class="header">
                    <h3>Training Module (${ageGroup})</h3>
                    <button class="close-button">&times;</button>
                </div>
                <div id="training-panel">
                    <div class="panel-content"></div>
                </div>
            `;

            // Set up close button handler
            const closeButton = container.querySelector('.close-button');
            closeButton.addEventListener('click', () => this.hideTrainingSection());

            // Show the container
            container.classList.add('visible');

            // Load and initialize the module
            await this.unloadCurrentModule();
            const module = await import(`../lessons/${agePath}/${moduleName}Module.js`);
            this.currentModule = new module.default();
            await this.currentModule.initialize();
        } catch (error) {
            console.error(`Error loading module for age group ${ageGroup}:`, error);
        }
    }

    async unloadCurrentModule() {
        if (this.currentModule && this.currentModule.cleanup) {
            await this.currentModule.cleanup();
        }
        this.currentModule = null;
    }

    getAbacus() {
        return document.querySelector('.abacus');
    }

    highlightBeads(columnIndex, beadIndices) {
        console.log('Highlighting beads:', columnIndex, beadIndices);
        const abacus = this.getAbacus();
        if (!abacus) {
            console.error('Abacus not found');
            return;
        }

        const columns = abacus.querySelectorAll('.column');
        if (columnIndex >= 0 && columnIndex < columns.length) {
            const column = columns[columnIndex];
            const beads = column.querySelectorAll('.bead');
            console.log('Found beads:', beads.length);
            beads.forEach((bead, index) => {
                if (beadIndices.includes(index)) {
                    console.log('Adding highlight to bead:', index);
                    bead.classList.add('highlight');
                } else {
                    bead.classList.remove('highlight');
                }
            });
        }
    }

    clearHighlights() {
        const abacus = this.getAbacus();
        if (!abacus) return;

        abacus.querySelectorAll('.bead').forEach(bead => {
            bead.classList.remove('highlight');
        });
    }
}

export const moduleManager = new ModuleManager();
