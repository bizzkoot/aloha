// Remove the APP_VERSION constant and use APP_CONFIG.VERSION instead
async function checkAppVersion() {
    try {
        const response = await fetch('/aloha/version.json?t=' + new Date().getTime());
        const data = await response.json();
        
        if (data.version !== APP_CONFIG.VERSION) {
            if ('caches' in window) {
                await caches.delete('aloha-cache');
            }
            window.location.reload(true);
        }
    } catch (error) {
        console.log('Version check failed:', error);
    }
}

// Update version display
const versionDisplay = document.getElementById('appVersionDisplay');
if (versionDisplay) {
    versionDisplay.textContent = `v${APP_CONFIG.VERSION}`;  // Using centralized version
}

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

        // Add event listeners for the arithmetic and game buttons
        const additionBtn = document.getElementById('additionBtn');
        if (additionBtn) {
            additionBtn.addEventListener('click', () => window.arithmetic.toggleModal());
        }

        const gameBtn = document.getElementById('gameBtn');
        if (gameBtn) {
            gameBtn.addEventListener('click', () => window.game.showGameSetup());
        }
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

// Add DraggableManager here
class DraggableManager {
    static initialize() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('draggable')) {
                        DraggableManager.makeDraggable(node);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    static makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        const header = element.querySelector('.modal-header') || element;
        header.onmousedown = dragMouseDown;
        header.style.cursor = 'move';

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}

// Then add this line right before your existing initialization code
document.addEventListener('DOMContentLoaded', () => {
    DraggableManager.initialize();
});

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

console.log('script.js starting to load');

window.initializeCore = async () => {
    console.log('Core initialization starting...');
    
    // Add version display initialization
    const versionDisplay = document.getElementById('appVersionDisplay');
    if (versionDisplay) {
        versionDisplay.textContent = `v${APP_CONFIG.VERSION}`;  // Using centralized version
    }
    
    // Define timeout constants
    const MAX_WAIT_TIME = 5000; // 5 seconds
    const CHECK_INTERVAL = 100; // 100ms between checks
    const startTime = Date.now();

    try {
        // Wait for required classes with timeout
        while (!window.ArithmeticGame) {
            if (Date.now() - startTime > MAX_WAIT_TIME) {
                throw new Error("ArithmeticGame class failed to load after 5 seconds");
            }
            console.log('Waiting for ArithmeticGame class...', {
                elapsed: Date.now() - startTime,
                maxWait: MAX_WAIT_TIME
            });
            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
        }
        console.log('ArithmeticGame class available');

        // Initialize services with logging
        window.translationService = new LocalTranslationService();
        console.log('Translation service created');

        window.abacus = new Abacus();
        console.log('Abacus instance created');

        await Promise.race([
            window.translationService.ready,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Translation service timeout')), MAX_WAIT_TIME)
            )
        ]);
        console.log('Translation service ready');

        window.game = new ArithmeticGame();
        console.log('Game instance created');

        await Promise.race([
            window.game.ready,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Game initialization timeout')), MAX_WAIT_TIME)
            )
        ]);
        console.log('Game initialization complete');
        
        return true;
    } catch (error) {
        console.error('Core initialization failed:', error.message);
        // Log detailed state for debugging
        console.log('Current state:', {
            hasArithmeticGame: !!window.ArithmeticGame,
            hasTranslationService: !!window.translationService,
            hasAbacus: !!window.abacus,
            hasGame: !!window.game
        });
        return false;
    }
};

window.initializeCore();

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    
    if (!localStorage.getItem('selectedLanguage')) {
        console.log('No language selected, showing language modal');
        const modal = new LanguageSelectionModal();
        await modal.create();
    } else {
        console.log('Initializing with saved language');
        window.translationService = new LocalTranslationService();
        await window.translationService.ready;
        console.log('Translation service ready');

        window.languageManager = new LanguageManager();
        console.log('Language manager created');

        window.abacus = new Abacus();
        console.log('Abacus created');

        window.arithmetic = new ArithmeticMenu();
        console.log('Arithmetic menu created');

        window.game = new ArithmeticGame();
        console.log('Game created');

        window.tutorial = new AbacusTutorial();
        console.log('Tutorial created');

        // Log subscriptions
        console.log('Setting up component subscriptions');
        window.languageManager.subscribe(window.abacus);
        window.languageManager.subscribe(window.arithmetic);
        window.languageManager.subscribe(window.game);
        window.languageManager.subscribe(window.tutorial);

        const savedLanguage = localStorage.getItem('selectedLanguage');
        console.log('Changing language to:', savedLanguage);
        await window.languageManager.changeLanguage(savedLanguage);
        console.log('Language change complete');
    }
});

// Find the service worker registration code (around line 315)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        console.log('Registering ServiceWorker...');
        navigator.serviceWorker.register('/aloha/sw.js', {
            scope: '/aloha/'
        })
        .then(registration => {
            console.log('ServiceWorker registration successful');
        })
        .catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}
