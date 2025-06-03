// Minimal, accessible JavaScript for Anton de Kom timeline
// WCAG AA compliant with keyboard navigation and screen reader support

class AccessibleTimeline {
    constructor() {
        this.currentLanguage = 'en';
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.setupLanguageSwitching();
        this.setupThemeSwitching();
        this.setupKeyboardNavigation();
        this.setupReducedMotion();
        this.setupScrollSpy();
        this.applyStoredPreferences();
    }

    // Language switching with WCAG AA compliance
    setupLanguageSwitching() {
        const langButtons = document.querySelectorAll('.lang-btn');
        
        langButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = button.dataset.lang;
                this.switchLanguage(lang);
                
                // Update ARIA states
                langButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            });

            // Keyboard support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.target.click();
                }
            });
        });
    }

    switchLanguage(lang) {
        this.currentLanguage = lang;
        document.documentElement.lang = lang;
        
        // Update all elements with language data attributes
        const elements = document.querySelectorAll('[data-en]');
        elements.forEach(element => {
            const text = element.dataset[lang];
            if (text) {
                element.textContent = text;
            }
        });

        // Store preference
        localStorage.setItem('language', lang);
        
        // Announce change to screen readers
        this.announceToScreenReader(`Language changed to ${this.getLanguageName(lang)}`);
    }

    // Theme switching with WCAG AA compliance
    setupThemeSwitching() {
        const themeButton = document.getElementById('theme-toggle');
        if (!themeButton) return;

        themeButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTheme();
        });

        // Keyboard support
        themeButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.body.dataset.theme = this.currentTheme;
        
        // Update button text and ARIA label
        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) {
            themeButton.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
            themeButton.setAttribute('aria-label', 
                `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} mode`);
        }

        // Store preference
        localStorage.setItem('theme', this.currentTheme);
        
        // Announce change to screen readers
        this.announceToScreenReader(`Switched to ${this.currentTheme} theme`);
    }

    // Enhanced keyboard navigation for accessibility
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC key to focus on main content
            if (e.key === 'Escape') {
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.focus();
                    e.preventDefault();
                }
            }

            // Arrow keys for navigation dots
            if (e.target.matches('.dot')) {
                const dots = Array.from(document.querySelectorAll('.dot'));
                const currentIndex = dots.indexOf(e.target);
                
                let newIndex = currentIndex;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    newIndex = (currentIndex + 1) % dots.length;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    newIndex = currentIndex === 0 ? dots.length - 1 : currentIndex - 1;
                }

                if (newIndex !== currentIndex) {
                    dots[newIndex].focus();
                    e.preventDefault();
                }
            }
        });
    }

    // Respect user's motion preferences
    setupReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (prefersReducedMotion.matches) {
            document.body.classList.add('reduced-motion');
        }

        // Listen for changes
        prefersReducedMotion.addEventListener('change', (e) => {
            if (e.matches) {
                document.body.classList.add('reduced-motion');
            } else {
                document.body.classList.remove('reduced-motion');
            }
        });
    }

    // Scroll spy functionality for navigation dots
    setupScrollSpy() {
        const sections = document.querySelectorAll('.story-section');
        const dots = document.querySelectorAll('.dot');
        
        // Add proper ARIA attributes to dots
        dots.forEach((dot, index) => {
            const href = dot.getAttribute('href');
            const targetSection = document.querySelector(href);
            if (targetSection) {
                const sectionTitle = targetSection.querySelector('h1, h2');
                const title = sectionTitle ? sectionTitle.textContent : `Section ${index + 1}`;
                dot.setAttribute('aria-label', `Go to ${title}`);
                dot.setAttribute('aria-current', 'false');
            }
        });

        // Intersection Observer for scroll spy
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px', // Trigger when section is 20% into viewport
            threshold: 0.3
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.updateActiveDot(sectionId);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });

        // Handle scroll to update active dot immediately for better responsiveness
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateActiveDotOnScroll();
            }, 50);
        });
    }

    // Update active dot based on section ID
    updateActiveDot(sectionId) {
        const dots = document.querySelectorAll('.dot');
        const targetDot = document.querySelector(`[href="#${sectionId}"]`);
        
        if (targetDot) {
            dots.forEach(dot => {
                dot.classList.remove('active');
                dot.setAttribute('aria-current', 'false');
            });
            
            targetDot.classList.add('active');
            targetDot.setAttribute('aria-current', 'true');
            
            // Announce to screen readers
            const sectionTitle = document.querySelector(`#${sectionId} h1, #${sectionId} h2`);
            if (sectionTitle) {
                this.announceToScreenReader(`Now viewing: ${sectionTitle.textContent}`);
            }
        }
    }

    // Update active dot based on current scroll position (fallback method)
    updateActiveDotOnScroll() {
        const sections = document.querySelectorAll('.story-section');
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        
        let currentSection = null;
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                currentSection = section.id;
            }
        });
        
        if (currentSection) {
            this.updateActiveDot(currentSection);
        }
    }

    // Apply stored user preferences
    applyStoredPreferences() {
        // Apply stored language
        const storedLang = localStorage.getItem('language');
        if (storedLang && ['en', 'nl', 'sr'].includes(storedLang)) {
            this.switchLanguage(storedLang);
            const langButton = document.querySelector(`[data-lang="${storedLang}"]`);
            if (langButton) {
                document.querySelectorAll('.lang-btn').forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                langButton.classList.add('active');
                langButton.setAttribute('aria-pressed', 'true');
            }
        }

        // Apply stored theme
        document.body.dataset.theme = this.currentTheme;
        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) {
            themeButton.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
            themeButton.setAttribute('aria-label', 
                `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} mode`);
        }
    }

    // Utility functions
    getLanguageName(lang) {
        const names = {
            'en': 'English',
            'nl': 'Nederlands',
            'sr': 'Sranan Tongo'
        };
        return names[lang] || 'English';
    }

    // Screen reader announcements
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
}

// Initialize when DOM is ready
let timelineInstance;
document.addEventListener('DOMContentLoaded', () => {
    timelineInstance = new AccessibleTimeline();
});

// Smooth scroll behavior for navigation dots (CSS-only with JS fallback)
document.addEventListener('click', (e) => {
    if (e.target.matches('.dot')) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        if (href && href.startsWith('#')) {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // The scroll spy will automatically update the active dot
                // But we can also update it immediately for better UX
                const sectionId = href.substring(1);
                if (timelineInstance) {
                    timelineInstance.updateActiveDot(sectionId);
                }
            }
        }
    }
});
