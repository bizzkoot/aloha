// Language Selection Modal Handler
class LanguageSelectionModal {
    constructor() {
        this.selectedLang = localStorage.getItem('selectedLanguage') || 'en';
    }

    async create() {
        // Wait for translation service to be available and ready
        while (!window.translationService) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        await window.translationService.ready;
        
        const modal = document.createElement('div');
        modal.className = 'language-select-modal';
        modal.innerHTML = `
            <div class="language-select-container">
                <h2>${await window.translationService.translate('Select Language', this.selectedLang)}</h2>
                <div class="language-options">
                    <button class="lang-btn ${this.selectedLang === 'en' ? 'selected' : ''}" data-lang="en">English</button>
                    <button class="lang-btn ${this.selectedLang === 'ms' ? 'selected' : ''}" data-lang="ms">Bahasa Melayu</button>
                    <button class="lang-btn ${this.selectedLang === 'zh' ? 'selected' : ''}" data-lang="zh">Mandarin</button>
                    <button class="lang-btn ${this.selectedLang === 'ta' ? 'selected' : ''}" data-lang="ta">Tamil</button>
                </div>
                <button id="confirmLanguageBtn">Continue</button>
            </div>
        `;
    
        document.body.appendChild(modal);
        this.setupEventListeners(modal);
        return modal;
    }

    setupEventListeners(modal) {
        const langButtons = modal.querySelectorAll('.lang-btn');
        langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                langButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedLang = btn.dataset.lang;
            });
        });

        const confirmBtn = modal.querySelector('#confirmLanguageBtn');
        confirmBtn.addEventListener('click', async () => {
            localStorage.setItem('selectedLanguage', this.selectedLang);
            modal.remove();
            await this.initializeApp();
        });
    }

    async initializeApp() {
        window.translationService = new LocalTranslationService();
        await window.translationService.ready;
        
        window.languageManager = new LanguageManager();
        window.abacus = new Abacus();
        window.arithmetic = new ArithmeticMenu();
        window.game = new ArithmeticGame();
        window.tutorial = new AbacusTutorial();

        window.languageManager.subscribe(window.abacus);
        window.languageManager.subscribe(window.arithmetic);
        window.languageManager.subscribe(window.game);
        window.languageManager.subscribe(window.tutorial);

        await window.languageManager.changeLanguage(this.selectedLang);
    }
}

class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
        this.subscribers = new Set();
    }

    subscribe(component) {
        this.subscribers.add(component);
    }

    async changeLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('selectedLanguage', language);
        
        await window.translationService.ready;
        
        await Promise.all(
            Array.from(this.subscribers).map(component =>
                component.updateLanguage?.(language)
            )
        );
        
        const event = new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        });
        window.dispatchEvent(event);
    }

    showLanguageSelector() {
        const modal = new LanguageSelectionModal();
        modal.create();
    }
}

class Abacus {
    constructor() {
        if (window.abacusInstance) {
            return window.abacusInstance;
        }
        window.abacusInstance = this;
        
        this.columns = document.querySelectorAll('.column');
        this.setupColumns();
        this.currentValue = document.getElementById('currentValue');
        this.value = 0;
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
        this.setupButtons();
        this.updateCurrentValueLabel(); // Add this line
    }

    async updateCurrentValueLabel() {
        const label = document.getElementById('currentValueLabel');
        const translatedText = await window.translationService.translate('Current Value:', this.currentLanguage);
        label.textContent = translatedText;
    }    

    async updateLanguage(newLanguage) {
        this.currentLanguage = newLanguage;
        await this.setupButtons();
        await this.updateButtonTexts(newLanguage);
        const label = document.getElementById('currentValueLabel');
        const translatedText = await window.translationService.translate('Current Value:', newLanguage);
        label.textContent = translatedText;
    }

    async setupButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const buttons = await Promise.all([
            this.createButton('Reset Abacus', () => this.resetAbacus()),
            this.createButton('Start Tutorial', () => window.tutorial.startTutorial()),
            this.createButton('Arithmetic Practice', () => window.arithmetic.toggleModal()),
            this.createButton('Practice Game', () => window.game.showGameSetup()),
            this.createButton('Change Language', () => window.languageManager.showLanguageSelector())
        ]);

        buttons.forEach(button => buttonContainer.appendChild(button));

        const existingContainer = document.querySelector('.button-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        document.querySelector('.container').appendChild(buttonContainer);
    }


    async createButton(textKey, clickHandler) {
        const button = document.createElement('button');
        
        // Special styling for language button
        if (textKey === 'Change Language') {
            button.className = 'language-button';
        } else {
            button.className = 'button-common';
        }
        
        const translatedText = await window.translationService.translate(textKey, this.currentLanguage);
        button.textContent = translatedText;
        button.addEventListener('click', clickHandler);
        return button;
    }

    async updateButtonTexts(newLanguage) {
        const buttons = document.querySelectorAll('.button-container .button-common');
        const texts = ['Reset Abacus', 'Start Tutorial', 'Arithmetic Practice', 'Practice Game', 'Change Language'];
        
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].textContent = await window.translationService.translate(texts[i], newLanguage);
        }
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

// Initialize language state
window.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
console.log('Initial language from localStorage:', window.currentLanguage);

async function updateAllUI(newLang) {
    console.log('updateAllUI called with:', newLang);
    window.currentLanguage = newLang;
    localStorage.setItem('selectedLanguage', newLang);
    await window.languageManager.changeLanguage(newLang);
    console.log('Language updated successfully:', newLang);
}

window.initializeCore = async () => {
    window.translationService = new LocalTranslationService();
    window.abacus = new Abacus();
    
    await window.translationService.ready;
    
    window.game = new ArithmeticGame();
    await window.game.ready;
};

window.initializeCore();

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('selectedLanguage')) {
        const modal = new LanguageSelectionModal();
        await modal.create();
    } else {
        window.translationService = new LocalTranslationService();
        await window.translationService.ready;
        
        window.languageManager = new LanguageManager();
        window.abacus = new Abacus();
        window.arithmetic = new ArithmeticMenu();
        window.game = new ArithmeticGame();
        window.tutorial = new AbacusTutorial();

        window.languageManager.subscribe(window.abacus);
        window.languageManager.subscribe(window.arithmetic);
        window.languageManager.subscribe(window.game);
        window.languageManager.subscribe(window.tutorial);

        await window.languageManager.changeLanguage(localStorage.getItem('selectedLanguage'));
    }
});