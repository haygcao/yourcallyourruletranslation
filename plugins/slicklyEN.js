// Slick.ly Phone Query Plugin - Iframe Proxy Solution
(function() {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'slicklyPhoneNumberPlugin', // Unique ID for this plugin
        name: 'Slick.ly Phone Lookup (iframe Proxy)',
        version: '1.0.7', // Updated version for improved province/city parsing
        description: 'Queries Slick.ly for phone number information and maps to fixed predefined labels, extracting country code from e164Number, and determines an action.'
    };

    // --- Our application's FIXED predefined labels (provided by the user) ---
    const predefinedLabels = [
        { 'label': 'Fraud Scam Likely' },
        { 'label': 'Spam Likely' },
        { 'label': 'Telemarketing' },
        { 'label': 'Robocall' },
        { 'label': 'Delivery' },
        { 'label': 'Takeaway' },
        { 'label': 'Ridesharing' },
        { 'label': 'Insurance' },
        { 'label': 'Loan' },
        { 'label': 'Customer Service' },
        { 'label': 'Unknown' },
        { 'label': 'Financial' },
        { 'label': 'Bank' },
        { 'label': 'Education' },
        { 'label': 'Medical' },
        { 'label': 'Charity' },
        { 'label': 'Other' },
        { 'label': 'Debt Collection' },
        { 'label': 'Survey' },
        { 'label': 'Political' },
        { 'label': 'Ecommerce' },
        { 'label': 'Risk' },
        { 'label': 'Agent' },
        { 'label': 'Recruiter' },
        { 'label': 'Headhunter' },
        { 'label': 'Silent Call Voice Clone' },
        { 'label': 'Internet' },
        { 'label': 'Travel & Ticketing' },
        { 'label': 'Application Software' },
        { 'label': 'Entertainment' },
        { 'label': 'Government' },
        { 'label': 'Local Services' },
        { 'label': 'Automotive Industry' },
        { 'label': 'Car Rental' },
        { 'label': 'Telecommunication' },
    ];

     // --- Keyword list provided by the user for mapping and sourceLabel detection ---
    const slicklyKeywords = [
        'Fraud', 'Scam', 'Spam', 'Harassment', 'Telemarketing', 'Robocall',
        'Delivery', 'Takeaway', 'Ridesharing', 'Insurance', 'Loan',
        'Customer Service', 'Unknown', 'Financial', 'Bank', 'Education',
        'Medical', 'Charity', 'Other', 'Debt Collection', 'Survey',
        'Political', 'Ecommerce', 'Risk', 'Agent', 'Recruiter',
        'Headhunter', 'Silent Call Voice Clone', 'Internet',
        'Travel & Ticketing', 'Application Software', 'Entertainment',
        'Government', 'Local Services', 'Automotive Industry','scandals','Fake','Pretending',
        'Car Rental', 'Telecommunication', 'Nuisance'
    ];


    // --- Mapping from Slick.ly specific terms/labels to our FIXED predefinedLabels (exact match) ---
    // Keys are the exact text from Slick.ly (Summary labels, Keywords, terms found in comments).
    // Values are the corresponding labels from our FIXED predefinedLabels list.
    const manualMapping = {
         // Mappings for Summary labels
         'Suspicious': 'Spam Likely', // Example mapping
         'Dangerous': 'Risk', // Example mapping

         // Mappings for Keywords and terms found in comments (based on slicklyKeywords list)
         'Fraud': 'Fraud Scam Likely',
         'Scam': 'Fraud Scam Likely',
         'Fake': 'Fraud Scam Likely',
         'Pretending': 'Fraud Scam Likely',
         'Spam': 'Spam Likely',
         'Harassment': 'Spam Likely', // Or Risk
         'Telemarketing': 'Telemarketing',
         'Robocall': 'Robocall',
         'Delivery': 'Delivery',
         'Takeaway': 'Takeaway',
         'Ridesharing': 'Ridesharing',
         'Insurance': 'Insurance',
         'Loan': 'Loan',
         'Customer Service': 'Customer Service',
         'Unknown': 'Unknown',
         'Financial': 'Financial',
         'Bank': 'Bank',
         'Education': 'Education',
         'Medical': 'Medical',
         'Charity': 'Charity',
         'Other': 'Other',
         'Debt Collection': 'Debt Collection',
         'Survey': 'Survey',
         'Political': 'Political',
         'Ecommerce': 'Ecommerce',
         'Risk': 'Risk',
         'Agent': 'Agent',
         'Recruiter': 'Recruiter',
         'Headhunter': 'Headhunter',
         'Silent Call Voice Clone': 'Silent Call Voice Clone', // Mapping to our predefined label
         'Internet': 'Other', // Example mapping
         'Travel & Ticketing': 'Travel Ticketing', // Example mapping
         'Application Software': 'Application Software', // Example mapping
         'Entertainment': 'Entertainment', // Example mapping
         'Government': 'Government', // Example mapping
         'Local Services': 'Local Services', // Example mapping
         'Automotive Industry': 'Automotive Industry', // Example mapping
         'Car Rental': 'Car Rental', // Example mapping
         'Telecommunication': 'Telecommunication', // Example mapping
         'Nuisance': 'Spam Likely', // Example mapping
         'Scandals': 'Spam Likely', // Example mapping
         // Add other specific phrases from comments if needed and map them
         'Random person': 'Other', // Example
         'wanting to ask questions': 'Spam Likely', // Example
         'Disturbing': 'Risk', // Example
         'looking around her property': 'Risk' // Example
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
     * Parses the Slick.ly page content.
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)}; // Use the corrected mapping
                const predefinedLabels = ${JSON.stringify(predefinedLabels)}; // Make predefinedLabels available in iframe for validation
                const slicklyKeywords = ${JSON.stringify(slicklyKeywords)}; // Make keywords available

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

                 // Helper to find the first matching keyword (case-insensitive, whole word)
                 function findMatchingKeyword(text) {
                     for (const keyword of slicklyKeywords) {
                         // Create a regex to find the whole word or exact phrase match, case-insensitive
                         const regex = new RegExp('\\b' + keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
                         if (regex.test(text)) {
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
                            const countMatch = commentsCountElement.textContent.match(/Comments\\s*\\((\\d+)\\)/i);
                            if (countMatch && countMatch[1]) {
                                 result.count = parseInt(countMatch[1], 10) || 0;
                                 console.log('[Iframe-Parser] Found Comments count:', result.count);
                            }
                        }


                        // --- Extract Summary Label and set initial sourceLabel ---
                        const summaryLabelElement = doc.querySelector('.summary-keywords .summary span.summary-result'); // Target the span with result class
                        let initialSourceLabel = '';
                        if (summaryLabelElement) {
                            const summaryLabelText = summaryLabelElement.textContent.trim();
                            if (summaryLabelText.toLowerCase() === 'suspicious' || summaryLabelText.toLowerCase() === 'dangerous' || summaryLabelText.toLowerCase() === 'safe') {
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
                             // Directly check if the Keywords text is an exact match for a manualMapping key
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
                                  // Directly check if the Comment text is an exact match for a manualMapping key
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

                        // --- Extract Province and City ---
                        const basicInfoElement = doc.querySelector('.basic span');
                        if (basicInfoElement) {
                            const basicInfoText = basicInfoElement.textContent.trim();
                            console.log('[Iframe-Parser] Basic Info text:', basicInfoText);
                            
                            // Extract the part before "· Fixed Line or Mobile" or similar service info
                            const serviceInfoIndex = basicInfoText.indexOf(' · ');
                            let locationInfo = basicInfoText;
                            if (serviceInfoIndex !== -1) {
                                locationInfo = basicInfoText.substring(0, serviceInfoIndex).trim();
                            }

                            console.log('[Iframe-Parser] Extracted locationInfo for parsing:', locationInfo);

                            // Regex to capture "City, State (Country)" or "State (Country)" or "City (Country)"
                            // This regex aims to extract the main location part and the country in parentheses.
                            const locationMatch = locationInfo.match(/^(.+?)\\s*\\((.+?)\\)$/);

                            if (locationMatch && locationMatch[1]) {
                                const mainLocationPart = locationMatch[1].trim(); // e.g., "Iowa" or "New York City, NY" or "London"
                                const countryPart = locationMatch[2].trim(); // e.g., "United States" or "United Kingdom"
                                console.log('[Iframe-Parser] mainLocationPart:', mainLocationPart, ', countryPart:', countryPart);

                                if (mainLocationPart.includes(',')) {
                                    // Likely "City, State" format
                                    const parts = mainLocationPart.split(',').map(p => p.trim());
                                    if (parts.length >= 2) {
                                        result.city = parts[0];
                                        result.province = parts[1];
                                        console.log('[Iframe-Parser] Split into City:', result.city, ', Province (State):', result.province);
                                    } else {
                                        // Fallback if comma exists but split is unexpected
                                        result.city = mainLocationPart;
                                        console.log('[Iframe-Parser] Treated as City only (comma present):', result.city);
                                    }
                                } else {
                                    // Assume it's either a State or a City.
                                    // For simplicity, we can assign it to province for states or city for cities,
                                    // or just set one if the distinction is not critical.
                                    // Aligning with CN's fallback, if no clear split, treat as city.
                                    result.city = mainLocationPart;
                                    console.log('[Iframe-Parser] Treated as City only (no comma):', result.city);
                                }

                            } else {
                                 console.log('[Iframe-Parser] Could not parse location info with (Country) format. Storing raw text to city:', locationInfo);
                                 result.city = locationInfo; // Store the whole thing in city if format is unexpected
                            }
                        } else {
                             console.log('[Iframe-Parser] Basic info element not found.');
                        }


                        // --- Determine Action based on combined logic ---
                        let action = 'none';

                        // 1. Prioritize action based on Keywords (existing logic)
                        if (result.sourceLabel) {
                        
                // Define block and allow keywords for action determination
                const blockKeywords = [
                    'Fraud', 'Scam', 'Spam', 'Harassment', 'Telemarketing', 'Robocall',
                    'Loan', 'Risk', 'Fake', 'Pretending', 'Nuisance', 'Scandals', 'call',
                    'Debt Collection', 'Silent Call Voice Clone'
                ];
                const allowKeywords = [
                    'Delivery', 'Takeaway', 'Ridesharing', 'Customer Service', 'Insurance',
                    'Bank', 'Education', 'Medical', 'Charity', 'Government',
                    'Local Services', 'Automotive Industry', 'Car Rental', 'Telecommunication'
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
                             if (initialSourceLabel.toLowerCase() === 'suspicious' || initialSourceLabel.toLowerCase() === 'dangerous') {
                                 action = 'block';
                             } else if (initialSourceLabel.toLowerCase() === 'safe') {
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
                                   console.log('[Iframe-Parser] Negative votes:', negativeVotes, ', Positive votes:', positiveVotes);

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
                         // Return a basic result even if parsing failed to indicate the process finished
                         return { phoneNumber: PHONE_NUMBER, success: false, error: 'Could not parse content from the page.', action: 'none' };


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
                    sendResult(finalResult || { phoneNumber: PHONE_NUMBER, success: false, error: 'Parsing logic returned null.', action: 'none' });
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
                 // Map the country code digits to a Slick.ly country identifier (e.g., 1 -> us)
                 // This requires a mapping from country calling code to Slick.ly country short code.
                 // For simplicity here, I'll just log the extracted digits.
                 // You will need a proper mapping mechanism here.
                 const extractedCountryCodeDigits = match[1];
                  console.log('[Slickly Plugin] Extracted country code digits from e164Number:', extractedCountryCodeDigits);
                  // *** IMPORTANT: Implement mapping from extractedCountryCodeDigits to Slick.ly country short code (e.g., 'us', 'gb', 'au', 'my') ***
                  // For now, I'll use a placeholder or a simple hardcoded example if applicable to your testing.
                  // Replace the following line with your actual mapping logic.
                  // Example placeholder mapping (replace with your actual mapping):
                  const countryCodeMap = {
                      '1': 'us',  // United States
                      '44': 'gb', // United Kingdom
                      '61': 'au', // Australia
                      '65': 'sg',  // Singapore
                      '64': 'nz',  // New Zealand
                      '234': 'ng'  // Nigeria
                      // Add more mappings as needed
                  };
                  countryCode = countryCodeMap[extractedCountryCodeDigits];
                   if (!countryCode) {
                       logError(`Could not map country code digits "${extractedCountryCodeDigits}" to a Slick.ly country.`);
                       // You might still proceed with a default or return an error
                       // For now, I'll proceed without a country code, which will likely fail the Slick.ly query
                       sendPluginResult({ requestId, success: false, error: `Unsupported country code: ${extractedCountryCodeDigits}` });
                       return; // Exit if country code is required and not found
                   }
                    console.log('[Slickly Plugin] Mapped country code digits to Slick.ly country code:', countryCode);

             } else {
                 logError('Could not extract country code digits from e164Number:', e164Number);
                 // You might proceed without a country code or return an error
                  sendPluginResult({ requestId, success: false, error: `Could not extract country code from e164Number: ${e164Number}` });
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