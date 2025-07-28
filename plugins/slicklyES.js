// Slick.ly Phone Query Plugin - Iframe Proxy Solution (Spanish)
(function() {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'slicklyEsPhoneNumberPlugin', // Unique ID for this plugin (specifically for Spanish-speaking countries)
        name: 'Slick.ly ES Phone Lookup (iframe Proxy)',
        version: '1.0.0', // Initial version for ES
        description: 'Queries Slick.ly for Spanish-speaking countries phone number information and maps to fixed predefined labels.'
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
        { label: 'Travel & Ticketing' },
        { label: 'Application Software' },
        { label: 'Entertainment' },
        { label: 'Government' },
        { label: 'Local Services' },
        { label: 'Automotive Industry' },
        { label: 'Car Rental' },
        { label: 'Telecommunication' },
        // Note: 'Nuisance' from the previous list is not in the updated predefinedLabels, mapping it to 'Spam Likely'
    ];

     // --- Keyword list (English base) translated to Spanish (based on common usage and examples) ---
     // This list is used for mapping and sourceLabel detection.
     // Please verify the translations and add/adjust mappings as needed.
    const slicklyKeywords_es_ES = [
        'Estafa', 'Fraude', 'Sospechoso', 'Engaño', 'Datos falsos', 'Información falsa',
        'Spam', 'Molestia', 'Telemarketing', 'Llamada automática',
        'Entrega', 'Comida para llevar', 'Viaje compartido', 'Seguro', 'Préstamo',
        'Servicio al cliente', 'Desconocido', 'Financiero', 'Banco', 'Educación',
        'Médico', 'Caridad', 'Otros', 'Cobro de deudas', 'Encuesta',
        'Político', 'Comercio electrónico', 'Riesgo', 'Agente', 'Reclutador',
        'Cazatalentos', 'Llamada silenciosa', 'Clon de voz', 'Internet',
        'Viajes y boletos', 'Software de aplicación', 'Entretenimiento',
        'Gobierno', 'Servicios locales', 'Industria automotriz',
        'Alquiler de coches', 'Telecomunicaciones',

        // Keywords from the Spanish HTML examples
        'Peligroso', // Dangerous (from Summary)
        'Suspicious', // Suspicious (from Summary - sometimes English is present)
        'SCAM', 'Swindle', 'Offer', 'Deception', 'Scammer', // From Peru example Keywords
         '$#%@!la', 'jajajaja', // From Chile example Keywords and Comments (consider if these are relevant)
         'Datos falsos', 'Provides false information', // From Peru example Comments
         'Llamadas y cortan', // Calls and hang up (common phrase)
         'Mismo cuento', // Same story (common scam phrase)
         'Envío código no solicitado', // Sending unsolicited code (related to scams)
         'Hackear cuentas', // Hacking accounts (related to scams)
         'Ganado un premio', // Won a prize (common scam phrase)
         'Ofreciendo productos', // Offering products (related to telemarketing/scam)
         'Venta al por mayor', // Wholesale (related to business calls)
         'Extorsión', // Extortion
         'Extorsionador', // Extortion
         'Acosador', // Stalker

         // Add other common Spanish keywords/phrases from reports if needed
    ];


    // --- Mapping from Slick.ly specific terms/labels (es-ES) to our FIXED predefinedLabels (exact match) ---
    // Keys are the exact text from Slick.ly (Summary labels, Keywords, terms found in comments) in Spanish or English.
    // Values are the corresponding labels from our FIXED predefinedLabels list.
    const manualMapping = {
         // Mappings for Summary labels (es-ES and English)
         'Peligroso': 'Risk', // Mapping 'Peligroso' (Dangerous) to 'Risk'
         'Dangerous': 'Risk', // Mapping 'Dangerous' to 'Risk'
         'Sospechoso': 'Spam Likely', // Mapping 'Sospechoso' (Suspicious) to 'Spam Likely'
         'Suspicious': 'Spam Likely', // Mapping 'Suspicious' to 'Spam Likely'

         // Mappings from the slicklyKeywords_es_ES list
         'Estafa': 'Fraud Scam Likely', // Scam
         'Fraude': 'Fraud Scam Likely', // Fraud
         'Sospechoso': 'Spam Likely', // Suspicious (already mapped, but good to have for keywords too)
         'Engaño': 'Fraud Scam Likely', // Deception
         'Datos falsos': 'Fraud Scam Likely', // False data
         'Información falsa': 'Fraud Scam Likely', // False information

         'Spam': 'Spam Likely',
         'Molestia': 'Spam Likely', // Annoyance/Nuisance
         'Telemarketing': 'Telemarketing',
         'Llamada automática': 'Robocall', // Automatic call

         'Entrega': 'Delivery',
         'Comida para llevar': 'Takeaway',
         'Viaje compartido': 'Ridesharing',
         'Seguro': 'Insurance',
         'Préstamo': 'Loan',
         'Servicio al cliente': 'Customer Service',
         'Desconocido': 'Unknown',
         'Financiero': 'Financial',
         'Banco': 'Bank',
         'Educación': 'Education',
         'Médico': 'Medical',
         'Caridad': 'Charity',
         'Otros': 'Other',
         'Cobro de deudas': 'Debt Collection', // Debt collection
         'Encuesta': 'Survey',
         'Político': 'Political',
         'Comercio electrónico': 'Ecommerce',
         'Riesgo': 'Risk',
         'Agente': 'Agent',
         'Reclutador': 'Recruiter',
         'Cazatalentos': 'Headhunter',
         'Llamada silenciosa': 'Silent Call Voice Clone', // Silent call
         'Clon de voz': 'Silent Call Voice Clone', // Voice clone

         'Internet': 'Internet',
         'Viajes y boletos': 'Travel & Ticketing',
         'Software de aplicación': 'Application Software',
         'Entretenimiento': 'Entertainment',
         'Gobierno': 'Government',
         'Servicios locales': 'Local Services',
         'Industria automotriz': 'Automotive Industry',
         'Alquiler de coches': 'Car Rental',
         'Telecomunicaciones': 'Telecommunication',

         // Mappings for keywords from the Spanish HTML examples
         'SCAM': 'Fraud Scam Likely', // From Peru example (English in Spanish page)
         'Swindle': 'Fraud Scam Likely',
         'Offer': 'Telemarketing', // Offer could be Telemarketing
         'Deception': 'Fraud Scam Likely',
         'Scammer': 'Fraud Scam Likely',
         '$#%@!la': 'Other', // Mapping unusual characters/phrases
         'jajajaja': 'Other', // Mapping colloquial/unrelated text
         'Provides false information': 'Fraud Scam Likely', // Mapping phrase from comment

         // Mappings for common Spanish keywords/phrases
         'Estafadores': 'Fraud Scam Likely', // Scammers
         'Llamadas y cortan': 'Spam Likely', // Calls and hang up
         'Mismo cuento': 'Fraud Scam Likely', // Same story
         'Envío código no solicitado': 'Fraud Scam Likely', // Sending unsolicited code
         'Hackear cuentas': 'Fraud Scam Likely', // Hacking accounts
         'Ganado un premio': 'Fraud Scam Likely', // Won a prize
         'Ofreciendo productos': 'Telemarketing', // Offering products
         'Venta al por mayor': 'Other', // Wholesale
         'Extorsión': 'Risk', // Extortion
         'Extorsionador': 'Risk', // Extortion
         'Acosador': 'Risk',
         // Add any other relevant mappings
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
     * Parses the Slick.ly page content (Spanish).
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)}; // Use the corrected mapping
                const predefinedLabels = ${JSON.stringify(predefinedLabels)}; // Make predefinedLabels available in iframe for validation
                 const slicklyKeywords_es_ES = ${JSON.stringify(slicklyKeywords_es_ES)}; // Make keywords available

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

                 // Helper to find the first matching keyword (case-insensitive) in Spanish
                 // This version looks for inclusion, not necessarily whole word for better matching.
                 function findMatchingKeyword_es_ES(text) {
                     const lowerText = text.toLowerCase();
                     for (const keyword of slicklyKeywords_es_ES) {
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
                        name: '', predefinedLabel: '', source: PLUGIN_CONFIG.id, numbers: [], success: false, error: ''
                    };

                    try {
                        // --- Extract Comments Count (Count) ---
                        const commentsCountElement = doc.querySelector('.comments-count');
                        if (commentsCountElement) {
                            // Match "Comentarios" (Spanish)
                            const countMatch = commentsCountElement.textContent.match(/Comentarios\\s*\\((\\d+)\\)/i);
                            if (countMatch && countMatch[1]) {
                                 result.count = parseInt(countMatch[1], 10) || 0;
                                 console.log('[Iframe-Parser] Found Comments count (Comentarios):', result.count);
                            }
                        }


                        // --- Extract Summary Label (es-ES/English) and set initial sourceLabel ---
                        const summaryLabelElement = doc.querySelector('.summary-keywords .summary span.summary-result'); // Target the span with result class
                        let initialSourceLabel = '';
                        if (summaryLabelElement) {
                            const summaryLabelText = summaryLabelElement.textContent.trim();
                            // Match "Peligroso", "Dangerous", "Sospechoso", or "Suspicious" (case-insensitive)
                            const lowerSummaryLabel = summaryLabelText.toLowerCase();
                            if (lowerSummaryLabel === 'peligroso' || lowerSummaryLabel === 'dangerous' || lowerSummaryLabel === 'sospechoso' || lowerSummaryLabel === 'suspicious') {
                                 initialSourceLabel = summaryLabelText; // Set initial sourceLabel (keep original casing)
                                 result.sourceLabel = initialSourceLabel; // Also set sourceLabel for display
                                 console.log('[Iframe-Parser] Found Summary label (initial sourceLabel):', initialSourceLabel);
                            }
                        }

                        // --- Check Keywords (es-ES/English) for a more specific sourceLabel ---
                        let specificSourceLabel = null;
                        const keywordsElement = doc.querySelector('.summary-keywords .keywords span');
                        if (keywordsElement) {
                             const keywordsText = keywordsElement.textContent.trim();
                             console.log('[Iframe-Parser] Keywords text (es-ES/English):', keywordsText);
                             // Directly check if the Keywords text is an exact match for a manualMapping key
                             if (manualMapping.hasOwnProperty(keywordsText)) {
                                  specificSourceLabel = keywordsText;
                                   console.log('[Iframe-Parser] Found exact manual mapping key in Keywords (setting specificSourceLabel):', specificSourceLabel);
                             } else {
                                  // If not an exact manual mapping key, check for matching keywords from the list
                                   const matchingKeyword = findMatchingKeyword_es_ES(keywordsText);
                                   if (matchingKeyword) {
                                        specificSourceLabel = matchingKeyword; // Override sourceLabel with the matched keyword
                                       console.log('[Iframe-Parser] Found matching keyword in Keywords (setting specificSourceLabel):', specificSourceLabel);
                                   }
                             }
                        }

                        // --- Check Comments (es-ES/English) for an even more specific sourceLabel ---
                         if (!specificSourceLabel) { // Only check comments if no specific keyword found in Keywords
                             const commentContentElements = doc.querySelectorAll('.comments .comment .content p');
                             for (const commentElement of commentContentElements) {
                                  const commentText = commentElement.textContent.trim();
                                   console.log('[Iframe-Parser] Checking comment text (es-ES/English) for keywords:', commentText);
                                  // Directly check if the Comment text is an exact match for a manualMapping key
                                   if (manualMapping.hasOwnProperty(commentText)) {
                                        specificSourceLabel = commentText;
                                         console.log('[Iframe-Parser] Found exact manual mapping key in Comment (setting specificSourceLabel):', specificSourceLabel);
                                        break; // Stop checking comments after the first match
                                   } else {
                                        // If not an exact manual mapping key, check for matching keywords from the list
                                        const matchingKeyword = findMatchingKeyword_es_ES(commentText);
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
                             // Perform exact lookup in manualMapping (case-insensitive key comparison)
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
                        result.predefinedLabel = foundPredefinedLabel || 'Unknown'; // Default to 'Unknown' if no valid mapping found


                        // --- Set success to true if we found at least a count or a sourceLabel ---
                        if (result.count > 0 || result.sourceLabel) {
                            result.success = true;
                        }


                        if (result.success) {
                            return result;
                        }

                        console.log('[Iframe-Parser] Could not extract required information from the page.');
                         // Return a basic result even if parsing failed to indicate the process finished
                         return { phoneNumber: PHONE_NUMBER, success: false, error: 'Could not parse content from the page.' };


                    } catch (e) {
                        console.error('[Iframe-Parser] Error during parsing:', e);
                        result.error = e.toString();
                        // Return the result with error details
                        return result;
                    }
                }

                function findAndParse() {
                    if (parsingCompleted) return;
                    console.log('[Iframe-Parser] Starting parse attempt...');
                    const finalResult = parseContent(window.document);
                     // Ensure sendResult is called even if parsing fails
                    sendResult(finalResult || { phoneNumber: PHONE_NUMBER, success: false, error: 'Parsing logic returned null.' });
                }

                console.log('[Iframe-Parser] Parsing script has started execution for phone: ' + PHONE_NUMBER);
                // Give the page a moment to render before parsing
                setTimeout(findAndParse, 800); // Increased timeout slightly for rendering

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
             iframe.sandbox = 'allow-scripts allow-same-origin'; // Keep sandbox for security
             activeIFrames.set(requestId, iframe);

             iframe.onload = function() {
                 log(`Iframe loaded for requestId ${requestId}. Posting parsing script.`);
                 try {
                     const parsingScript = getParsingScript(PLUGIN_CONFIG.id, phoneNumber);
                     // We need to execute the script within the iframe's context
                     iframe.contentWindow.postMessage({
                         type: 'executeScript',
                         script: parsingScript
                     }, '*'); // Use '*' as targetOrigin or a specific origin if known
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

             // Set a timeout for the query
             setTimeout(() => {
                 if (activeIFrames.has(requestId)) {
                     logError(`Query timeout for requestId: ${requestId}`);
                     sendPluginResult({ requestId, success: false, error: 'Query timed out after 45 seconds' }); // Increased timeout
                     cleanupIframe(requestId);
                 }
             }, 45000); // Increased timeout duration

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

         // Extract country code from e164Number if available
         // This is a basic implementation and might need refinement
         let countryCode = null;
         if (e164Number && e164Number.startsWith('+')) {
             // Attempt to extract country code (basic: assumes 1-3 digits after +)
             const match = e164Number.match(/^\\+(\\d{1,3})/);
             if (match && match[1]) {
                 const extractedCountryCodeDigits = match[1];
                  console.log('[Slickly Plugin] Extracted country code digits from e164Number:', extractedCountryCodeDigits);

                  // Map the country code digits to a Slick.ly country identifier (e.g., 51 -> pe, 56 -> cl, 34 -> es)
                  const countryCodeMap = {
                      '51': 'pe', // Peru
                      '52': 'mx', // Mexico
                      '54': 'ar', // Argentina (+54)
                      '58': 've', // Venezuela (+58)
                      '57': 'co', // Colombia (+57)
                      '56': 'cl', // Chile
                      '34': 'es' // Spain
                      

                      // Add more mappings as needed
                  };
                  countryCode = countryCodeMap[extractedCountryCodeDigits];

                   if (!countryCode) {
                       logError(`Could not map country code digits "${extractedCountryCodeDigits}" to a Slick.ly country.`);
                       // You might still proceed with a default or return an error
                       sendPluginResult({ requestId, success: false, error: `Unsupported country code: ${extractedCountryCodeDigits}` });
                       return; // Exit if country code is required and not found
                   }
                    console.log('[Iframe-Parser] Mapped country code digits to Slick.ly country code:', countryCode);

             } else {
                 logError('Could not extract country code digits from e164Number:', e164Number);
                 // You might proceed without a country code or return an error
                  sendPluginResult({ requestId, success: false, error: 'Could not extract country code from e164Number: ' + e164Number });
                 return;
             }
         } else {
             logError('e164Number is not available or does not start with "+". Cannot extract country code.');
             // You might proceed without a country code or return an error
              sendPluginResult({ requestId, success: false, error: 'e164Number is required to extract country code.' });
             return;
         }


        // Format the number for Slick.ly (usually just the digits)
        const formattedNumber = numberToQuery.replace(/[^0-9]/g, ''); // Remove non-digits

        // Proceed with the query only if a country code was successfully extracted
        if (countryCode) {
             initiateQuery(formattedNumber, requestId, countryCode);
        } else {
             // This case should ideally be handled by the country code extraction logic above
             logError('Country code is missing after extraction attempt.');
             sendPluginResult({ requestId, success: false, error: 'Country code could not be determined.' });
        }
    }

    // --- Message Listener (similar to bd.js) ---
    window.addEventListener('message', function(event) {
        // Check if the message is from our iframe proxy and contains the expected data
        if (!event.data || event.data.type !== 'phoneQueryResult' || !event.data.data) {
            return;
        }
        // Ensure the message is for this specific plugin
        if (event.data.data.pluginId !== PLUGIN_CONFIG.id) {
            return;
        }

        let requestId = null;
        // Find the requestId associated with the source window
        for (const [id, iframe] of activeIFrames.entries()) {
            if (iframe.contentWindow === event.source) {
                requestId = id;
                break;
            }
        }

        if (requestId) {
            log(`Received result via postMessage for requestId: ${requestId}`);
            const result = { requestId, ...event.data.data };
            delete result.pluginId; // Remove pluginId from the final result
            sendPluginResult(result);
            cleanupIframe(requestId); // Clean up the iframe after receiving the result
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
            generateOutput: generateOutput // Register the main function
        };
        log(`Plugin registered: window.plugin.${PLUGIN_CONFIG.id}`);
        sendPluginLoaded(); // Notify Flutter that the plugin is loaded
    }

    initialize(); // Run initialization when the script is loaded

})();
