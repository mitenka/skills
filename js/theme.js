const THEME_KEY = 'app-theme';

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem(THEME_KEY) || 'system';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupListeners();
        this.updateActiveButton();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    setTheme(newTheme) {
        this.theme = newTheme;
        localStorage.setItem(THEME_KEY, newTheme);
        this.applyTheme();
        this.updateActiveButton();
    }

    updateActiveButton() {
        document.querySelectorAll('.theme-button').forEach(button => {
            button.classList.toggle('active', button.dataset.theme === this.theme);
        });
    }

    setupListeners() {
        document.querySelectorAll('.theme-button').forEach(button => {
            button.addEventListener('click', () => {
                this.setTheme(button.dataset.theme);
            });
        });

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.theme === 'system') {
                    this.applyTheme();
                }
            });
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

export default ThemeManager;
