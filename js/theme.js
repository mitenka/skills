const THEME_KEY = 'app-theme';

// Немедленно применяем тему до загрузки DOM
(function() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'system';
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Определяем реальную тему для применения
    const effectiveTheme = savedTheme === 'system' ? 
        (systemDark ? 'dark' : 'light') : 
        savedTheme;
    
    // Применяем тему немедленно
    document.documentElement.setAttribute('data-theme', effectiveTheme);
})();

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem(THEME_KEY) || 'system';
        this.init();
    }

    init() {
        // Тема уже применена, просто настраиваем интерактивность
        this.setupListeners();
        this.updateActiveButton();
    }

    applyTheme() {
        const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const effectiveTheme = this.theme === 'system' ? 
            (systemDark ? 'dark' : 'light') : 
            this.theme;
        
        document.documentElement.setAttribute('data-theme', effectiveTheme);
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
