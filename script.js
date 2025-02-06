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

                // Update the selected option in the dropdown (NEW)
                const languageSelector = document.getElementById('language-selector');
                if (languageSelector) {
                    languageSelector.value = lang;
                }
                 // Add/remove the 'selected' class for styling (NEW)
                 document.querySelectorAll('.language-button').forEach(button => {
                    if (button.dataset.lang === lang) {
                        button.classList.add('selected');
                    } else {
                        button.classList.remove('selected');
                    }
                });
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

    // --- Language Switcher (Dropdown) ---
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.addEventListener('change', (event) => {
            setLanguage(event.target.value); // Get language from the selected option
        });
    }
    // --- Language Switcher (Buttons) --- No longer use button
    // document.querySelectorAll('.language-button').forEach(button => {
    //     button.addEventListener('click', (event) => {
    //         event.preventDefault(); // Prevent default link behavior
    //         setLanguage(button.dataset.lang); // Get language from data-lang attribute
    //     });
    // });

    // Function to set the flags in the dropdown
    function setFlags() {
        const options = document.querySelectorAll('#language-selector option');
        options.forEach(option => {
            const flagCode = option.dataset.flag;
            if (flagCode) {
                //  Insert the flag icon before the option text
                option.innerHTML = `<span class="flag-icon flag-icon-${flagCode}"></span> ${option.textContent}`;
            }
        });
    }

    //  Call setFlags on load to set initial flags, and also when the language changes.
    setFlags();  // Set flags on initial load
    //  Now, also call setFlags whenever we change the language:
      function applyTranslations(translations) {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            if (translations[key]) {
                element.innerHTML = translations[key];
            } else {
                console.warn(`Translation key not found: ${key}`);
            }
        });

        document.documentElement.lang = currentLanguage;
        localStorage.setItem('language', currentLanguage);

        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            languageSelector.value = currentLanguage;
        }
         document.querySelectorAll('.language-button').forEach(button => {
            if (button.dataset.lang === currentLanguage) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
        //  Add this line to update the flags when translations are applied:
        setFlags(); //  Update flags after applying translations
    }


});
