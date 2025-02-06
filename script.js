document.addEventListener('DOMContentLoaded', () => {
    const defaultLanguage = 'en'; // Set the default language
    let currentLanguage = localStorage.getItem('language') || defaultLanguage;

    // Function to fetch and apply translations
    function setLanguage(lang) {
        fetch(`assets/language/${lang}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(translations => {
                // Apply translations to elements with data-i18n attribute
                document.querySelectorAll('[data-i18n]').forEach(element => {
                    const key = element.dataset.i18n;
                    if (translations[key]) {
                        element.innerHTML = translations[key]; // Use innerHTML to handle HTML tags
                    } else {
                        console.warn(`Translation key not found: ${key}`); // Warn if key is missing
                    }
                });

                // Set the lang attribute of the <html> element
                document.documentElement.lang = lang;

                // Store the selected language in localStorage
                localStorage.setItem('language', lang);
                currentLanguage = lang;
            })
            .catch(error => {
                console.error('Error fetching translations:', error);
                // Fallback to default language if there's an error.
                if (lang !== defaultLanguage) {
                  setLanguage(defaultLanguage);
                }

            });
    }


    // Initial language setup
    setLanguage(currentLanguage);


    // --- Language Switcher (Buttons) ---
    document.querySelectorAll('.language-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); //  This was the KEY fix!
            setLanguage(button.dataset.lang);
        });
    });
});
