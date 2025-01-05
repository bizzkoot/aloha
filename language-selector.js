class LanguageSelector {
    constructor() {
        this.selectedLang = 'en';
        this.init();
    }

    init() {
        document.querySelectorAll('[data-lang]').forEach(btn => {
            btn.onclick = () => this.selectLanguage(btn.dataset.lang);
        });

        document.getElementById('confirmLanguage').onclick = () => {
            localStorage.setItem('selectedLanguage', this.selectedLang);
            window.location.href = 'index.html';
        };
    }

    selectLanguage(lang) {
        this.selectedLang = lang;
    }
}
