class LocalTranslationService {
    constructor() {
        this.translations = {
            'en': {},
            'ms': {},
            'zh': {},
            'ta': {}
        };
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
        // Remove the line trying to access the removed dropdown
        this.ready = this.loadTranslations();
    }

    async loadTranslations() {
        try {
            const response = await fetch('translation.csv');
            const csvText = await response.text();
            const rows = csvText.split('\n');
            const headers = rows[0].split(',');
            const langIndexes = {
                en: 0,
                ms: 1,
                zh: 2,
                ta: 3
            };

            // Clear existing translations
            Object.keys(this.translations).forEach(lang => {
                this.translations[lang] = {};
            });

            rows.slice(1).forEach(row => {
                if (!row.trim()) return;
                const columns = row.split(',');
                const englishText = columns[langIndexes.en]?.trim();
                if (englishText && englishText !== 'English') {
                    this.translations.en[englishText] = englishText;
                    this.translations.ms[englishText] = columns[langIndexes.ms]?.trim() || englishText;
                    this.translations.zh[englishText] = columns[langIndexes.zh]?.trim() || englishText;
                    this.translations.ta[englishText] = columns[langIndexes.ta]?.trim() || englishText;
                }
            });
            return true;
        } catch (error) {
            console.error('Error loading translations:', error);
            return false;
        }
    }

    async translate(text, targetLanguage) {
        await this.ready;
        const lang = targetLanguage?.toLowerCase() || 'en';
        this.currentLanguage = lang;
        return this.translations[lang][text] || text;
    }

    notifyLanguageChange(newLang) {
        const event = new CustomEvent('languageChanged', {
            detail: { language: newLang }
        });
        document.dispatchEvent(event);
    }

    async changeLanguage(newLang) {
        this.currentLanguage = newLang;
        localStorage.setItem('selectedLanguage', newLang);
        this.ready = this.loadTranslations();
        await this.ready;
        
        this.notifyLanguageChange(newLang);
        
        return true;
    }
}
