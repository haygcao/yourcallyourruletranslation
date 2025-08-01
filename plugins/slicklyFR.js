// Slick.ly Phone Query Plugin - Iframe Proxy Solution (French)
(function() {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'slicklyFrPhoneNumberPlugin', // Unique ID for this plugin (specifically for French-speaking countries)
        name: 'Slick.ly FR Phone Lookup (iframe Proxy)',
        version: '1.0.0', // Initial version for FR
        description: 'Queries Slick.ly for French-speaking countries phone number information and maps to fixed predefined labels.'
    };

    // --- Our application's FIXED predefined labels (provided by the user) ---
    const predefinedLabels = [
        { label: 'Fraud Scam Likely' },
        { label: 'Spam Likely' },
        { label: 'Telemarketing' },
        { label: 'Robocall' },
        { label: 'Delivery' },
        { label: 'Takeaway' },
        { label: 'Ridesharing' },
        { label: 'Insurance' },
        { label: 'Loan' },
        { label: 'Customer Service' },
        { label: 'Unknown' },
        { label: 'Financial' },
        { label: 'Bank' },
        { label: 'Education' },
        { label: 'Medical' },
        { label: 'Charity' },
        { label: 'Other' },
        { label: 'Debt Collection' },
        { label: 'Survey' },
        { label: 'Political' },
        { label: 'Ecommerce' },
        { label: 'Risk' },
        { label: 'Agent' },
        { label: 'Recruiter' },
        { label: 'Headhunter' },
        { label: 'Silent Call Voice Clone' },
        { label: 'Internet' },
        { label: 'Travel Ticketing' },
        { label: 'Application Software' },
        { label: 'Entertainment' },
        { label: 'Government' },
        { label: 'Local Services' },
        { label: 'Automotive Industry' },
        { label: 'Car Rental' },
        { label: 'Telecommunication' },
    ];

    // --- Keyword list translated to French ---
    const slicklyKeywords_fr_FR = [
        'Fraude', 'Arnaque', 'Escroquerie', 'Imposture', 'Supercherie',
        'Spam', 'Indésirable', 'Pourriel', 'Non sollicité',
        'Télémarketing', 'Marketing téléphonique', 'Démarchage téléphonique',
        'Robocall', 'Appel automatique', 'Robot',
        'Livraison', 'Expédition', 'Distribution',
        'Plats à emporter', 'À emporter', 'Vente à emporter',
        'Covoiturage', 'Partage de voiture', 'Voiture partagée',
        'Assurance', 'Police', 'Couverture',
        'Prêt', 'Emprunt', 'Crédit',
        'Service client', 'Assistance', 'Support',
        'Inconnu', 'Masqué', 'Non identifié',
        'Financier', 'Argent', 'Finance',
        'Banque', 'Bancaire', 'Compte',
        'Éducation', 'Formation', 'École',
        'Médical', 'Santé', 'Docteur',
        'Charité', 'Don', 'Association caritative',
        'Autre', 'Divers', 'Varié',
        'Recouvrement de créances', 'Dette', 'Facture impayée',
        'Sondage', 'Enquête', 'Questionnaire',
        'Politique', 'Élection', 'Parti politique',
        'Commerce électronique', 'Boutique en ligne', 'Vente en ligne',
        'Risque', 'Danger', 'Menace',
        'Agent', 'Représentant', 'Intermédiaire',
        'Recruteur', 'RH', 'Ressources humaines',
        'Chasseur de têtes', 'Executive Search', 'Recrutement de cadres',
        'Appel silencieux', 'Silence au téléphone', 'Aucune réponse',
        'Clone de voix', 'Fausse voix', 'Imitation de voix',
        'Internet', 'En ligne', 'Web',
        'Voyages et billets', 'Tourisme', 'Billets d avion',
        'Logiciel d application', 'Application', 'Programme',
        'Divertissement', 'Spectacle', 'Cinéma',
        'Gouvernement', 'État', 'Autorité',
        'Services locaux', 'Services de proximité', 'Services municipaux',
        'Industrie automobile', 'Automobile', 'Voiture',
        'Location de voitures', 'Voiture de location', 'Véhicule de location',
        'Télécommunications', 'Communications', 'Téléphonie',

        //Keywords from the HTML content provided
        'couper', 'laissé', 'message', 'rappelé', 'sonnerie', //cut, left, message, recalled, ringing
        'Dangereux', //Dangerous
        'Méfiant' //Wary/Distrustful
    ];

    // --- Mapping from Slick.ly specific terms/labels (fr-FR) to our FIXED predefinedLabels (exact match) ---
    const manualMapping = {
        // Summary labels
        'Dangereux': 'Risk', //Dangerous
        'Méfiant': 'Spam Likely', //Suspicious

        //Keywords
        'Fraude': 'Fraud Scam Likely',
        'Arnaque': 'Fraud Scam Likely',
        'Escroquerie': 'Fraud Scam Likely',
        'Imposture': 'Fraud Scam Likely',
        'Supercherie': 'Fraud Scam Likely',
        'Spam': 'Spam Likely',
        'Indésirable': 'Spam Likely',
        'Pourriel': 'Spam Likely',
        'Non sollicité': 'Spam Likely',
        'Télémarketing': 'Telemarketing',
        'Marketing téléphonique': 'Telemarketing',
        'Démarchage téléphonique': 'Telemarketing',
        'Robocall': 'Robocall',
        'Appel automatique': 'Robocall',
        'Robot': 'Robocall',
        'Livraison': 'Delivery',
        'Expédition': 'Delivery',
        'Distribution': 'Delivery',
        'Plats à emporter': 'Takeaway',
        'À emporter': 'Takeaway',
        'Vente à emporter': 'Takeaway',
        'Covoiturage': 'Ridesharing',
        'Partage de voiture': 'Ridesharing',
        'Voiture partagée': 'Ridesharing',
        'Assurance': 'Insurance',
        'Police': 'Insurance',
        'Couverture': 'Insurance',
        'Prêt': 'Loan',
        'Emprunt': 'Loan',
        'Crédit': 'Loan',
        'Service client': 'Customer Service',
        'Assistance': 'Customer Service',
        'Support': 'Customer Service',
        'Inconnu': 'Unknown',
        'Masqué': 'Unknown',
        'Non identifié': 'Unknown',
        'Financier': 'Financial',
        'Argent': 'Financial',
        'Finance': 'Financial',
        'Banque': 'Bank',
        'Bancaire': 'Bank',
        'Compte': 'Bank',
        'Éducation': 'Education',
        'Formation': 'Education',
        'École': 'Education',
        'Médical': 'Medical',
        'Santé': 'Medical',
        'Docteur': 'Medical',
        'Charité': 'Charity',
        'Don': 'Charity',
        'Association caritative': 'Charity',
        'Autre': 'Other',
        'Divers': 'Other',
        'Varié': 'Other',
        'Recouvrement de créances': 'Debt Collection',
        'Dette': 'Debt Collection',
        'Facture impayée': 'Debt Collection',
        'Sondage': 'Survey',
        'Enquête': 'Survey',
        'Questionnaire': 'Survey',
        'Politique': 'Political',
        'Élection': 'Political',
        'Parti politique': 'Political',
        'Commerce électronique': 'Ecommerce',
        'Boutique en ligne': 'Ecommerce',
        'Vente en ligne': 'Ecommerce',
        'Risque': 'Risk',
        'Danger': 'Risk',
        'Menace': 'Risk',
        'Agent': 'Agent',
        'Représentant': 'Agent',
        'Intermédiaire': 'Agent',
        'Recruteur': 'Recruiter',
        'RH': 'Recruiter',
        'Ressources humaines': 'Recruiter',
        'Chasseur de têtes': 'Headhunter',
        'Executive Search': 'Headhunter',
        'Recrutement de cadres': 'Headhunter',
        'Appel silencieux': 'Silent Call Voice Clone',
        'Silence au téléphone': 'Silent Call Voice Clone',
        'Aucune réponse': 'Silent Call Voice Clone',
        'Clone de voix': 'Silent Call Voice Clone',
        'Fausse voix': 'Silent Call Voice Clone',
        'Imitation de voix': 'Silent Call Voice Clone',
        'Internet': 'Internet',
        'En ligne': 'Internet',
        'Web': 'Internet',
        'Voyages et billets': 'Travel Ticketing',
        'Tourisme': 'Travel Ticketing',
        'Billets d avion': 'Travel Ticketing',
        'Logiciel d application': 'Application Software',
        'Application': 'Application Software',
        'Programme': 'Application Software',
        'Divertissement': 'Entertainment',
        'Spectacle': 'Entertainment',
        'Cinéma': 'Entertainment',
        'Gouvernement': 'Government',
        'État': 'Government',
        'Autorité': 'Government',
        'Services locaux': 'Local Services',
        'Services de proximité': 'Local Services',
        'Services municipaux': 'Local Services',
        'Industrie automobile': 'Automotive Industry',
        'Automobile': 'Automotive Industry',
        'Voiture': 'Automotive Industry',
        'Location de voitures': 'Car Rental',
        'Voiture de location': 'Car Rental',
        'Véhicule de location': 'Car Rental',
        'Télécommunications': 'Telecommunication',
        'Communications': 'Telecommunication',
        'Téléphonie': 'Telecommunication',

        //Keywords from the HTML content provided
        'couper': 'Other', //cut
        'laissé': 'Other', //left
        'message': 'Other', //message
        'rappelé': 'Other', //recalled
        'sonnerie': 'Other'  //ringing
    };

    // --- Constants, State, Logging, and Communication functions (similar to bd.js) ---
    const PROXY_SCHEME = "https";
    const PROXY_HOST = "flutter-webview-proxy.internal"; // Assuming the same proxy setup
    const PROXY_PATH_FETCH = "/fetch";
    const activeIFrames = new Map();

    function log(message) { console.log(`[${PLUGIN_CONFIG.id} v${PLUGIN_CONFIG.version}] ${message}`); }
    function logError(message, error) { console.error(`[${PLUGIN_CONFIG.id} v${PLUGIN_CONFIG.version}] ${message}`, error); }

    function sendToFlutter(channel, data) {
        if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
            window.flutter_inappwebview.callHandler(channel, JSON.stringify(data));
        } else {
            logError(`Cannot send to Flutter on channel '${channel}', handler not available.`);
        }
    }

    function sendPluginResult(result) {
        log(`Sending final result to Flutter: ${JSON.stringify(result)}`);
        sendToFlutter('PluginResultChannel', result);
    }

    function sendPluginLoaded() {
        log('Plugin loaded, notifying Flutter.');
        sendToFlutter('TestPageChannel', { type: 'pluginLoaded', pluginId: PLUGIN_CONFIG.id, version: PLUGIN_CONFIG.version });
    }

    function cleanupIframe(requestId) {
        const iframe = activeIFrames.get(requestId);
        if (iframe) {
            if (iframe.parentNode) { iframe.parentNode.removeChild(iframe); }
            activeIFrames.delete(requestId);
            log(`Cleaned up iframe for requestId: ${requestId}`);
        }
    }

    /**
     * Parses the Slick.ly page content (French).
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)};
                const predefinedLabels = ${JSON.stringify(predefinedLabels)};
                const slicklyKeywords_fr_FR = ${JSON.stringify(slicklyKeywords_fr_FR)};

                let parsingCompleted = false;

                function sendResult(result) {
                    if (parsingCompleted) return;
                    parsingCompleted = true;
                    console.log('[Iframe-Parser] Sending result back to parent:', result);
                    window.parent.postMessage({ type: 'phoneQueryResult', data: { pluginId: PLUGIN_ID, ...result } }, '*');
                }

                // Helper to check if a label exists in our fixed predefinedLabels list
                function isValidPredefinedLabel(label) {
                    return predefinedLabels.some(predefined => predefined.label === label);
                }

                // Helper to find the first matching keyword (case-insensitive)
                function findMatchingKeyword(text) {
                    const lowerText = text.toLowerCase();
                    for (const keyword of slicklyKeywords_fr_FR) {
                        if (lowerText.includes(keyword.toLowerCase())) {
                            return keyword; // Return the original keyword from the list
                        }
                    }
                    return null;
                }

                function parseContent(doc) {
                    console.log('[Iframe-Parser] Attempting to parse content in document with title:', doc.title);
                    const result = {
                        phoneNumber: PHONE_NUMBER, sourceLabel: '', count: 0, province: '', city: '', carrier: '',
                        name: '', predefinedLabel: '', source: PLUGIN_CONFIG.id, numbers: [], success: false, error: '', action: 'none' // Added action field
                    };

                    try {
                        // --- Extract Comments Count (Count) ---
                        const commentsCountElement = doc.querySelector('.comments-count');
                        if (commentsCountElement) {
                            const countMatch = commentsCountElement.textContent.match(/Commentaires\s*\((\d+)\)/i); // Match "Commentaires"
                            if (countMatch && countMatch[1]) {
                                result.count = parseInt(countMatch[1], 10) || 0;
                                console.log('[Iframe-Parser] Found Comments count (Commentaires):', result.count);
                            }
                        }

                        // --- Extract Summary Label and set initial sourceLabel ---
                        const summaryLabelElement = doc.querySelector('.summary-keywords .summary span.summary-result');
                        let initialSourceLabel = '';
                        if (summaryLabelElement) {
                            const summaryLabelText = summaryLabelElement.textContent.trim();
                            if (summaryLabelText === 'Dangereux' || summaryLabelText === 'Méfiant') {
                                initialSourceLabel = summaryLabelText; // Set initial sourceLabel
                                result.sourceLabel = initialSourceLabel; // Also set sourceLabel for display
                                console.log('[Iframe-Parser] Found Summary label (initial sourceLabel):', initialSourceLabel);
                            }
                        }

                        // --- Check Keywords for a more specific sourceLabel ---
                        let specificSourceLabel = null;
                        const keywordsElement = doc.querySelector('.summary-keywords .keywords span');
                        if (keywordsElement) {
                            const keywordsText = keywordsElement.textContent.trim();
                            console.log('[Iframe-Parser] Keywords text:', keywordsText);
                            if (manualMapping.hasOwnProperty(keywordsText)) {
                                specificSourceLabel = keywordsText;
                                console.log('[Iframe-Parser] Found exact manual mapping key in Keywords (setting specificSourceLabel):', specificSourceLabel);
                            } else {
                                // If not an exact manual mapping key, check for matching keywords from the list
                                const matchingKeyword = findMatchingKeyword(keywordsText);
                                if (matchingKeyword) {
                                    specificSourceLabel = matchingKeyword; // Override sourceLabel with the matched keyword
                                    console.log('[Iframe-Parser] Found matching keyword in Keywords (setting specificSourceLabel):', specificSourceLabel);
                                }
                            }
                        }

                        // --- Check Comments for an even more specific sourceLabel ---
                        if (!specificSourceLabel) { // Only check comments if no specific keyword found in Keywords
                            const commentContentElements = doc.querySelectorAll('.comments .comment .content p');
                            for (const commentElement of commentContentElements) {
                                const commentText = commentElement.textContent.trim();
                                console.log('[Iframe-Parser] Checking comment text for keywords:', commentText);
                                if (manualMapping.hasOwnProperty(commentText)) {
                                    specificSourceLabel = commentText;
                                    console.log('[Iframe-Parser] Found exact manual mapping key in Comment (setting specificSourceLabel):', specificSourceLabel);
                                    break; // Stop checking comments after the first match
                                } else {
                                    // If not an exact manual mapping key, check for matching keywords from the list
                                    const matchingKeyword = findMatchingKeyword(commentText);
                                    if (matchingKeyword) {
                                        specificSourceLabel = matchingKeyword; // Override sourceLabel with the matched keyword from comments
                                        console.log('[Iframe-Parser] Found matching keyword in Comments (setting specificSourceLabel):', specificSourceLabel);
                                        break; // Stop checking comments after the first match
                                    }
                                }
                            }
                        }

                        // --- Set the final sourceLabel based on priority ---
                        if (specificSourceLabel) {
                            result.sourceLabel = specificSourceLabel;
                        } else if (initialSourceLabel) {
                            result.sourceLabel = initialSourceLabel;
                        }

                        // --- Map the final sourceLabel to predefinedLabel using manualMapping (exact match) ---
                        let foundPredefinedLabel = '';
                        if (result.sourceLabel) {
                            const mappedLabel = manualMapping[Object.keys(manualMapping).find(key => key.toLowerCase() === result.sourceLabel.toLowerCase())];
                            if (mappedLabel) {
                                if (isValidPredefinedLabel(mappedLabel)) {
                                    foundPredefinedLabel = mappedLabel;
                                    console.log('[Iframe-Parser] Mapped source label "' + result.sourceLabel + '" to predefinedLabel: "' + foundPredefinedLabel + '"');
                                } else {
                                    console.warn('[Iframe-Parser] Manual mapping for "' + result.sourceLabel + '" points to an invalid predefined label: "' + mappedLabel + '"');
                                }
                            }
                        }

                        // Set the final predefinedLabel
                        result.predefinedLabel = foundPredefinedLabel || 'Unknown';

                        // --- Determine Action based on combined logic ---
                        let action = 'none';

                        // 1. Prioritize action based on Keywords (existing logic)
                        if (result.sourceLabel) {

                            // Define block and allow keywords for action determination
                            const blockKeywords = [
                                'Fraude', 'Arnaque', 'Escroquerie', 'Imposture', 'Supercherie',
                                'Spam', 'Indésirable', 'Pourriel',
                                'Télémarketing', 'Marketing téléphonique',
                                'Robocall', 'Appel automatique',
                                'Recouvrement de créances', 'Dette'
                            ];
                            const allowKeywords = [
                                'Livraison', 'Expédition',
                                'Plats à emporter', 'À emporter',
                                'Covoiturage', 'Partage de voiture',
                                'Assurance', 'Police',
                                'Service client', 'Assistance'
                            ];

                            for (const keyword of blockKeywords) {
                                if (result.sourceLabel.toLowerCase().includes(keyword.toLowerCase())) {
                                    action = 'block';
                                    break;
                                }
                            }
                            if (action === 'none') { // Only check allow if not already blocked
                                for (const keyword of allowKeywords) {
                                    if (result.sourceLabel.toLowerCase().includes(keyword.toLowerCase())) {
                                        action = 'allow';
                                        break;
                                    }
                                }
                            }
                        }

                        // 2. If no action determined by keywords, check Summary Label
                        if (action === 'none' && initialSourceLabel) {
                            if (initialSourceLabel === 'Dangereux' || initialSourceLabel === 'Méfiant') {
                                action = 'block';
                            }
                        }

                        // 3. If no action determined by keywords or summary, check Votes
                        if (action === 'none') {
                            const negativeVotesElement = doc.querySelector('.vote .negative-count');
                            const positiveVotesElement = doc.querySelector('.vote .positive-count');

                            if (negativeVotesElement && positiveVotesElement) {
                                const negativeVotes = parseInt(negativeVotesElement.textContent.trim(), 10) || 0;
                                const positiveVotes = parseInt(positiveVotesElement.textContent.trim(), 10) || 0;

                                if (negativeVotes > positiveVotes) {
                                    action = 'block';
                                } else if (positiveVotes > negativeVotes) {
                                    action = 'allow';
                                }
                            }
                        }

                        result.action = action; // Set the determined action

                        // --- Set success to true if we found at least a count or a sourceLabel ---
                        if (result.count > 0 || result.sourceLabel) {
                            result.success = true;
                        }

                        if (result.success) {
                            return result;
                        }

                        console.log('[Iframe-Parser] Could not extract required information from the page.');
                        return { phoneNumber: PHONE_NUMBER, success: false, error: 'Could not parse content from the page.', action: 'none' };

                    } catch (e) {
                        console.error('[Iframe-Parser] Error during parsing:', e);
                        result.error = e.toString();
                        return result;
                    }
                }

                function findAndParse() {
                    if (parsingCompleted) return;
                    console.log('[Iframe-Parser] Starting parse attempt...');
                    const finalResult = parseContent(window.document);
                    sendResult(finalResult || { phoneNumber: PHONE_NUMBER, success: false, error: 'Parsing logic returned null.', action: 'none' });
                }

                console.log('[Iframe-Parser] Parsing script has started execution for phone: ' + PHONE_NUMBER);
                setTimeout(findAndParse, 800);
            })();
        `;
    }

    function initiateQuery(phoneNumber, requestId, countryCode) {
        log(`Initiating query for '${phoneNumber}' (requestId: ${requestId}, countryCode: ${countryCode})`);
        try {
            // Construct Slick.ly search URL based on country code
            const baseUrl = `https://slick.ly/${countryCode.toLowerCase()}/`;
            const targetSearchUrl = `${baseUrl}${encodeURIComponent(phoneNumber)}`;
            const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36' }; // Using a common user agent
            const proxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
            log(`Iframe proxy URL: ${proxyUrl}`);

            const iframe = document.createElement('iframe');
            iframe.id = `query-iframe-${requestId}`;
            iframe.style.display = 'none';
            iframe.sandbox = 'allow-scripts allow-same-origin';
            activeIFrames.set(requestId, iframe);

            iframe.onload = function() {
                log(`Iframe loaded for requestId ${requestId}. Posting parsing script.`);
                try {
                    const parsingScript = getParsingScript(PLUGIN_CONFIG.id, phoneNumber);
                    iframe.contentWindow.postMessage({
                        type: 'executeScript',
                        script: parsingScript
                    }, '*');
                    log(`Parsing script post message sent for requestId: ${requestId}`);
                } catch (e) {
                    logError(`Error posting script to iframe for requestId ${requestId}:`, e);
                    sendPluginResult({ requestId, success: false, error: `postMessage failed: ${e.message}` });
                    cleanupIframe(requestId);
                }
            };

            iframe.onerror = function() {
                logError(`Iframe error for requestId ${requestId}`);
                sendPluginResult({ requestId, success: false, error: 'Iframe loading failed.' });
                cleanupIframe(requestId);
            };

            document.body.appendChild(iframe);
            iframe.src = proxyUrl;

            setTimeout(() => {
                if (activeIFrames.has(requestId)) {
                    logError(`Query timeout for requestId: ${requestId}`);
                    sendPluginResult({ requestId, success: false, error: 'Query timed out after 45 seconds' });
                    cleanupIframe(requestId);
                }
            }, 45000);

        } catch (error) {
            logError(`Error in initiateQuery for requestId ${requestId}:`, error);
            sendPluginResult({ requestId, success: false, error: `Query initiation failed: ${error.message}` });
        }
    }

    // Modified generateOutput to extract country code from e164Number
    function generateOutput(phoneNumber, nationalNumber, e164Number, requestId) {
        log(`generateOutput called for requestId: ${requestId}`);
        const numberToQuery = phoneNumber || nationalNumber || e164Number;

        if (!numberToQuery) {
            sendPluginResult({ requestId, success: false, error: 'No valid phone number provided.' });
            return;
        }

        let countryCode = null;
        if (e164Number && e164Number.startsWith('+')) {
            const match = e164Number.match(/^\+(\d{1,3})/);
            if (match && match[1]) {
                const extractedCountryCodeDigits = match[1];
                console.log('[Slickly Plugin] Extracted country code digits from e164Number:', extractedCountryCodeDigits);

                const countryCodeMap = {
                    '33': 'fr' // France
                };
                countryCode = countryCodeMap[extractedCountryCodeDigits];

                if (!countryCode) {
                    logError(`Could not map country code digits "${extractedCountryCodeDigits}" to a Slick.ly country.`);
                    sendPluginResult({ requestId, success: false, error: `Unsupported country code: ${extractedCountryCodeDigits}` });
                    return;
                }
                console.log('[Iframe-Parser] Mapped country code digits to Slick.ly country code:', countryCode);

            } else {
                logError('Could not extract country code digits from e164Number:', e164Number);
                sendPluginResult({ requestId, success: false, error: 'Could not extract country code from e164Number: ' + e164Number });
                return;
            }
        } else {
            logError('e164Number is not available or does not start with "+". Cannot extract country code.');
            sendPluginResult({ requestId, success: false, error: 'e164Number is required to extract country code.' });
            return;
        }

        const formattedNumber = numberToQuery.replace(/[^0-9]/g, '');

        if (countryCode) {
            initiateQuery(formattedNumber, requestId, countryCode);
        } else {
            logError('Country code is missing after extraction attempt.');
            sendPluginResult({ requestId, success: false, error: 'Country code could not be determined.' });
        }
    }

    // --- Message Listener (similar to bd.js) ---
    window.addEventListener('message', function(event) {
        if (!event.data || event.data.type !== 'phoneQueryResult' || !event.data.data) {
            return;
        }
        if (event.data.data.pluginId !== PLUGIN_CONFIG.id) {
            return;
        }

        let requestId = null;
        for (const [id, iframe] of activeIFrames.entries()) {
            if (iframe.contentWindow === event.source) {
                requestId = id;
                break;
            }
        }

        if (requestId) {
            log(`Received result via postMessage for requestId: ${requestId}`);
            const result = { requestId, ...event.data.data };
            delete result.pluginId;
            sendPluginResult(result);
            cleanupIframe(requestId);
        } else {
            logError('Received postMessage from an untracked iframe.', event.data);
        }
    });

    // --- Initialization (similar to bd.js) ---
    function initialize() {
        if (window.plugin && window.plugin[PLUGIN_CONFIG.id]) {
            log('Plugin already initialized.');
            return;
        }
        if (!window.plugin) {
            window.plugin = {};
        }
        window.plugin[PLUGIN_CONFIG.id] = {
            info: PLUGIN_CONFIG,
            generateOutput: generateOutput
        };
        log(`Plugin registered: window.plugin.${PLUGIN_CONFIG.id}`);
        sendPluginLoaded();
    }

    initialize();
})();