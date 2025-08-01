// Slick.ly Phone Query Plugin - Iframe Proxy Solution (German)
(function() {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'slicklyDePhoneNumberPlugin', // Unique ID for this plugin (specifically for German-speaking countries)
        name: 'Slick.ly DE Phone Lookup (iframe Proxy)',
        version: '1.0.0', // Initial version for DE
        description: 'Queries Slick.ly for German-speaking countries phone number information and maps to fixed predefined labels.'
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

    // --- Keyword list translated to German ---
    const slicklyKeywords_de_DE = [
        'Betrug', 'Schwindel', 'Scam', 'Abzocke', 'Täuschung',
        'Spam', 'Unerwünscht', 'Belästigung', 'Werbung',
        'Telemarketing', 'Kaltanruf', 'Telefonwerbung',
        'Robocall', 'Automatischer Anruf', 'Sprachcomputer',
        'Lieferung', 'Zustellung', 'Versand',
        'Essen zum Mitnehmen', 'Abholung', 'Lieferservice',
        'Mitfahrgelegenheit', 'Fahrgemeinschaft', 'Taxi',
        'Versicherung', 'Police', 'Absicherung',
        'Kredit', 'Darlehen', 'Finanzierung',
        'Kundenservice', 'Support', 'Hilfe',
        'Unbekannt', 'Anonym', 'Versteckt',
        'Finanzen', 'Geld', 'Finanziell',
        'Bank', 'Banking', 'Konto',
        'Bildung', 'Ausbildung', 'Schule',
        'Medizinisch', 'Gesundheit', 'Arzt',
        'Wohltätigkeit', 'Spende', 'Hilfsorganisation',
        'Andere', 'Sonstige', 'Verschiedenes',
        'Inkasso', 'Schulden', 'Forderung',
        'Umfrage', 'Meinung', 'Marktforschung',
        'Politisch', 'Wahl', 'Partei',
        'E-Commerce', 'Online-Shop', 'Internet-Handel',
        'Risiko', 'Gefahr', 'Bedrohung',
        'Agent', 'Vertreter', 'Vermittler',
        'Personalvermittler', 'Recruiter', 'HR',
        'Headhunter', 'Kopfjäger', 'Executive Search',
        'Stiller Anruf', 'Ruhe am Telefon', 'Kein Gespräch',
        'Sprachklon', 'Gefälschte Stimme', 'Stimmimitation',
        'Internet', 'Online', 'Netz',
        'Reisen und Tickets', 'Tourismus', 'Flugtickets',
        'Anwendungssoftware', 'Software', 'Programme',
        'Unterhaltung', 'Show', 'Kino',
        'Regierung', 'Staat', 'Behörde',
        'Lokale Dienste', 'Services', 'Dienstleistungen',
        'Automobilindustrie', 'Auto', 'PKW',
        'Autovermietung', 'Mietwagen', 'Leihwagen',
        'Telekommunikation', 'Kommunikation', 'Telefonie',

        //Keywords from the HTML content provided
        'Stromanbieterwerbung', //Electricity provider advertising
        'Sicher', 'Gefährlich', 'Verdächtig'

    ];

    // --- Mapping from Slick.ly specific terms/labels (de-DE) to our FIXED predefinedLabels (exact match) ---
    const manualMapping = {
        // Summary labels
        'Gefährlich': 'Risk', //Dangerous
        'Verdächtig': 'Spam Likely', //Suspicious
        'Sicher': 'Safe', //Safe

        //Keywords
        'Betrug': 'Fraud Scam Likely',
        'Schwindel': 'Fraud Scam Likely',
        'Scam': 'Fraud Scam Likely',
        'Abzocke': 'Fraud Scam Likely',
        'Täuschung': 'Fraud Scam Likely',
        'Spam': 'Spam Likely',
        'Unerwünscht': 'Spam Likely',
        'Belästigung': 'Spam Likely',
        'Werbung': 'Telemarketing',
        'Telemarketing': 'Telemarketing',
        'Kaltanruf': 'Telemarketing',
        'Telefonwerbung': 'Telemarketing',
        'Robocall': 'Robocall',
        'Automatischer Anruf': 'Robocall',
        'Sprachcomputer': 'Robocall',
        'Lieferung': 'Delivery',
        'Zustellung': 'Delivery',
        'Versand': 'Delivery',
        'Essen zum Mitnehmen': 'Takeaway',
        'Abholung': 'Takeaway',
        'Lieferservice': 'Takeaway',
        'Mitfahrgelegenheit': 'Ridesharing',
        'Fahrgemeinschaft': 'Ridesharing',
        'Taxi': 'Ridesharing',
        'Versicherung': 'Insurance',
        'Police': 'Insurance',
        'Absicherung': 'Insurance',
        'Kredit': 'Loan',
        'Darlehen': 'Loan',
        'Finanzierung': 'Loan',
        'Kundenservice': 'Customer Service',
        'Support': 'Customer Service',
        'Hilfe': 'Customer Service',
        'Unbekannt': 'Unknown',
        'Anonym': 'Unknown',
        'Versteckt': 'Unknown',
        'Finanzen': 'Financial',
        'Geld': 'Financial',
        'Finanziell': 'Financial',
        'Bank': 'Bank',
        'Banking': 'Bank',
        'Konto': 'Bank',
        'Bildung': 'Education',
        'Ausbildung': 'Education',
        'Schule': 'Education',
        'Medizinisch': 'Medical',
        'Gesundheit': 'Medical',
        'Arzt': 'Medical',
        'Wohltätigkeit': 'Charity',
        'Spende': 'Charity',
        'Hilfsorganisation': 'Charity',
        'Andere': 'Other',
        'Sonstige': 'Other',
        'Verschiedenes': 'Other',
        'Inkasso': 'Debt Collection',
        'Schulden': 'Debt Collection',
        'Forderung': 'Debt Collection',
        'Umfrage': 'Survey',
        'Meinung': 'Survey',
        'Marktforschung': 'Survey',
        'Politisch': 'Political',
        'Wahl': 'Political',
        'Partei': 'Political',
        'E-Commerce': 'Ecommerce',
        'Online-Shop': 'Ecommerce',
        'Internet-Handel': 'Ecommerce',
        'Risiko': 'Risk',
        'Gefahr': 'Risk',
        'Bedrohung': 'Risk',
        'Agent': 'Agent',
        'Vertreter': 'Agent',
        'Vermittler': 'Agent',
        'Personalvermittler': 'Recruiter',
        'Recruiter': 'Recruiter',
        'HR': 'Recruiter',
        'Headhunter': 'Headhunter',
        'Kopfjäger': 'Headhunter',
        'Executive Search': 'Headhunter',
        'Stiller Anruf': 'Silent Call Voice Clone',
        'Ruhe am Telefon': 'Silent Call Voice Clone',
        'Kein Gespräch': 'Silent Call Voice Clone',
        'Sprachklon': 'Silent Call Voice Clone',
        'Gefälschte Stimme': 'Silent Call Voice Clone',
        'Stimmimitation': 'Silent Call Voice Clone',
        'Internet': 'Internet',
        'Online': 'Internet',
        'Netz': 'Internet',
        'Reisen und Tickets': 'Travel Ticketing',
        'Tourismus': 'Travel Ticketing',
        'Flugtickets': 'Travel Ticketing',
        'Anwendungssoftware': 'Application Software',
        'Software': 'Application Software',
        'Programme': 'Application Software',
        'Unterhaltung': 'Entertainment',
        'Show': 'Entertainment',
        'Kino': 'Entertainment',
        'Regierung': 'Government',
        'Staat': 'Government',
        'Behörde': 'Government',
        'Lokale Dienste': 'Local Services',
        'Services': 'Local Services',
        'Dienstleistungen': 'Local Services',
        'Automobilindustrie': 'Automotive Industry',
        'Auto': 'Automotive Industry',
        'PKW': 'Automotive Industry',
        'Autovermietung': 'Car Rental',
        'Mietwagen': 'Car Rental',
        'Leihwagen': 'Car Rental',
        'Telekommunikation': 'Telecommunication',
        'Kommunikation': 'Telecommunication',
        'Telefonie': 'Telecommunication',

        //Keywords from the HTML content provided
        'Stromanbieterwerbung': 'Telemarketing'

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
     * Parses the Slick.ly page content (German).
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)};
                const predefinedLabels = ${JSON.stringify(predefinedLabels)};
                const slicklyKeywords_de_DE = ${JSON.stringify(slicklyKeywords_de_DE)};

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
                    for (const keyword of slicklyKeywords_de_DE) {
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
                            const countMatch = commentsCountElement.textContent.match(/Bemerkungen\s*\((\d+)\)/i); // Match "Bemerkungen"
                            if (countMatch && countMatch[1]) {
                                result.count = parseInt(countMatch[1], 10) || 0;
                                console.log('[Iframe-Parser] Found Comments count (Bemerkungen):', result.count);
                            }
                        }

                        // --- Extract Summary Label and set initial sourceLabel ---
                        const summaryLabelElement = doc.querySelector('.summary-keywords .summary span.summary-result');
                        let initialSourceLabel = '';
                        if (summaryLabelElement) {
                            const summaryLabelText = summaryLabelElement.textContent.trim();
                            if (summaryLabelText === 'Gefährlich' || summaryLabelText === 'Verdächtig' || summaryLabelText === 'Sicher') {
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
                                'Betrug', 'Schwindel', 'Scam', 'Abzocke', 'Täuschung',
                                'Spam', 'Unerwünscht', 'Belästigung',
                                'Telemarketing', 'Kaltanruf', 'Telefonwerbung',
                                'Robocall', 'Automatischer Anruf',
                                'Inkasso', 'Schulden', 'Forderung'
                            ];
                            const allowKeywords = [
                                'Lieferung', 'Zustellung', 'Versand',
                                'Essen zum Mitnehmen', 'Abholung', 'Lieferservice',
                                'Mitfahrgelegenheit', 'Fahrgemeinschaft', 'Taxi',
                                'Versicherung', 'Police', 'Absicherung',
                                'Kundenservice', 'Support', 'Hilfe'
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
                            if (initialSourceLabel === 'Gefährlich' || initialSourceLabel === 'Verdächtig') {
                                action = 'block';
                            } else if (initialSourceLabel === 'Sicher') {
                                action = 'allow';
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
                    '49': 'de' // Germany
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