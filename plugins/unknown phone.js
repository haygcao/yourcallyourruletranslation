// unknownphone.com Phone Query Plugin - Iframe Proxy Solution
(function() {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'unknownphonePhoneNumberPlugin', // Unique ID for this plugin
        name: 'UnknownPhone Phone Lookup (iframe Proxy)',
        version: '1.0.3', // Updated version for exact mapping
        description: 'Queries unknownphone.com for phone number information using an iframe proxy with exact label mapping.'
    };

    // --- Our application's predefined labels (provided by the user) ---
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
        // Adding labels from unknownphone.com options if they are intended to be part of predefinedLabels
        // Based on your previous input, some of these might already be covered by existing predefined labels.
        // We should map to the most appropriate existing predefined label.
        // For example, 'Scam' maps to 'Fraud Scam Likely'.
        // 'Threats', 'Prank call', 'Reminder' might be new predefined labels or map to existing ones.
        // For now, I'll assume the predefinedLabels list you provided is exhaustive.
    ];


    // --- Mapping from unknownphone.com specific terms/labels to our predefinedLabels (exact match) ---
    // Keys are exactly what we expect to extract from the unknownphone.com page.
    // Values are the corresponding labels from our predefinedLabels list.
       // --- Mapping from unknownphone.com specific terms/labels to our FIXED predefinedLabels (exact match) ---
    // Keys are the exact text from unknownphone.com (e.g., select options, rating terms, report keywords).
    // Values are the corresponding labels from our FIXED predefinedLabels list.
    const manualMapping = {
        // Mappings from <select> options
        'Silent call': 'Silent Call Voice Clone', // Mapping 'Silent call' from website to our predefined label
        'Telemarketing': 'Telemarketing',
        'Debt collector': 'Debt Collection',
        'Spoofed call': 'Fraud Scam Likely', // Mapping 'Spoofed call' to Fraud Scam Likely or Spam Likely
        'Survey': 'Survey',
        'Text Message': 'Other', // Mapping 'Text Message' to 'Other' or most appropriate predefined label
        'Scam': 'Fraud Scam Likely', // Mapping 'Scam' from website to our predefined label
        'Threats': 'Risk', // Mapping 'Threats' to 'Risk'
        'Prank call': 'Spam Likely', // Mapping 'Prank call' to 'Spam Likely' or 'Other'
        'Reminder': 'Other', // Mapping 'Reminder' to 'Other' or most appropriate predefined label

        // Mappings for rating terms and other relevant phrases from the reports (exact match needed)
        'Dangerous': 'Risk', // Mapping 'Dangerous' rating to 'Risk'
        'Harassing': 'Spam Likely', // Example mapping for 'Harassing' from reports
        'Recruitment': 'Recruiter', // Example mapping for 'Recruitment' from reports
        'job scam call': 'Fraud Scam Likely' // Example mapping for the phrase "job scam call"
        // ... add more exact mappings based on common report phrases from unknownphone.com and map to predefinedLabels
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
        const iframe = activeIFFrames.get(requestId);
        if (iframe) {
            if (iframe.parentNode) { iframe.parentNode.removeChild(iframe); }
            activeIFrames.delete(requestId);
            log(`Cleaned up iframe for requestId: ${requestId}`);
        }
    }

    /**
     * Parses the unknownphone.com page content.
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)}; // Use the corrected mapping
                const predefinedLabels = ${JSON.stringify(predefinedLabels)}; // Make predefinedLabels available in iframe for validation
                let parsingCompleted = false;

                function sendResult(result) {
                    if (parsingCompleted) return;
                    parsingCompleted = true;
                    console.log('[Iframe-Parser] Sending result back to parent:', result);
                    window.parent.postMessage({ type: 'phoneQueryResult', data: { pluginId: PLUGIN_ID, ...result } }, '*');
                }

                function isValidPredefinedLabel(label) {
                    return predefinedLabels.some(predefined => predefined.label === label);
                }


                function parseContent(doc) {
                    console.log('[Iframe-Parser] Attempting to parse content in document with title:', doc.title);
                    const result = {
                        phoneNumber: PHONE_NUMBER, sourceLabel: '', count: 0, province: '', city: '', carrier: '',
                        name: '', predefinedLabel: '', source: PLUGIN_CONFIG.id, numbers: [], success: false, error: ''
                    };

                    try {
                        // --- Extract Total Reports (Count) ---
                        const totalReportsElementStats = doc.querySelector('.statistics .stat-item strong:contains("Total reports:")');
                        if (totalReportsElementStats) {
                            const countText = totalReportsElementStats.nextSibling.textContent.trim();
                            result.count = parseInt(countText, 10) || 0;
                            console.log('[Iframe-Parser] Found Total reports in statistics:', result.count);
                        } else {
                            const totalReportsElementSummary = doc.querySelector('.data_summary strong a[href="#user_reports"]');
                             if (totalReportsElementSummary) {
                                 const countText = totalReportsElementSummary.textContent.trim();
                                 result.count = parseInt(countText, 10) || 0;
                                 console.log('[Iframe-Parser] Found Total reports in summary:', result.count);
                             }
                        }


                        // --- Extract Rating and set sourceLabel ---
                        let rawSourceLabelText = '';
                        const ratingElementStats = doc.querySelector('.statistics .stat-item strong:contains("Rating:")');
                        if (ratingElementStats) {
                            rawSourceLabelText = ratingElementStats.nextSibling.textContent.trim();
                            result.sourceLabel = 'Rating: ' + rawSourceLabelText; // Keep the full source label for display
                            console.log('[Iframe-Parser] Found Rating (sourceLabel):', result.sourceLabel);
                        } else {
                            const ratingElementSummary = doc.querySelector('.data_summary .phone_rating');
                            if (ratingElementSummary) {
                                const titleAttribute = ratingElementSummary.getAttribute('title');
                                if (titleAttribute) {
                                     rawSourceLabelText = titleAttribute.replace('Global rating:', '').trim(); // Extract just the rating word(s)
                                     result.sourceLabel = titleAttribute; // Keep the full title as source label
                                     console.log('[Iframe-Parser] Found Rating in summary (sourceLabel):', result.sourceLabel);
                                }
                            }
                        }

                        // --- Check for specific call type mentions in data_summary and identify additional source labels ---
                        const dataSummarySection = doc.querySelector('.data_summary');
                        const additionalSourceLabels = []; // Array to hold potential additional source labels from summary text
                        if (dataSummarySection) {
                             const summaryText = dataSummarySection.textContent.trim();
                             console.log('[Iframe-Parser] Data Summary Text for keyword matching:', summaryText);

                             // Look for exact matches of manualMapping keys (case-insensitive) within the summary text
                             // We need to be careful about how we extract these keywords for exact matching.
                             // A simple approach is to look for sentences or phrases that contain these keywords.
                             // More robust parsing might be needed for complex structures.
                             // For now, let's try to find the exact keywords as whole words.
                             for (const key in manualMapping) {
                                  // Create a regex to find the whole word or exact phrase match, case-insensitive
                                  const regex = new RegExp('\\b' + key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
                                  if (regex.test(summaryText)) {
                                      additionalSourceLabels.push(key); // Add the matched keyword as a potential source label
                                      console.log('[Iframe-Parser] Found exact keyword in summary: "' + key + '"');
                                  }
                             }
                              // Also look for specific phrases that might not be single words in the select options
                             if (summaryText.toLowerCase().includes('job scam call')) {
                                  if (!additionalSourceLabels.includes('job scam call')) additionalSourceLabels.push('job scam call');
                             }
                              // Add other specific phrase checks here based on common reports
                        }


                        // --- Map rawSourceLabelText and additionalSourceLabels to predefinedLabel using manualMapping (exact match) ---
                        let foundPredefinedLabel = '';

                        // Prioritize mapping from additional source labels found in the summary text
                         for (const sourceLabelToMap of additionalSourceLabels) {
                              if (manualMapping.hasOwnProperty(sourceLabelToMap)) {
                                   const mappedLabel = manualMapping[sourceLabelToMap];
                                   if (isValidPredefinedLabel(mappedLabel)) {
                                       foundPredefinedLabel = mappedLabel;
                                        console.log('[Iframe-Parser] Mapped additional source label "' + sourceLabelToMap + '" to predefinedLabel: "' + foundPredefinedLabel + '"');
                                       break; // Stop after finding the first valid mapping
                                   } else {
                                        console.warn('[Iframe-Parser] Manual mapping for "' + sourceLabelToMap + '" points to an invalid predefined label: "' + mappedLabel + '"');
                                   }
                              }
                         }

                         // If no mapping found from additional source labels, try mapping from the raw rating text
                         if (!foundPredefinedLabel && rawSourceLabelText) {
                             if (manualMapping.hasOwnProperty(rawSourceLabelText)) {
                                  const mappedLabel = manualMapping[rawSourceLabelText];
                                  if (isValidPredefinedLabel(mappedLabel)) {
                                       foundPredefinedLabel = mappedLabel;
                                      console.log('[Iframe-Parser] Mapped raw rating text "' + rawSourceLabelText + '" to predefinedLabel: "' + foundPredefinedLabel + '"');
                                  } else {
                                       console.warn('[Iframe-Parser] Manual mapping for raw rating text "' + rawSourceLabelText + '" points to an invalid predefined label: "' + mappedLabel + '"');
                                  }
                             }
                             // Also check for specific words within the raw rating text if an exact match wasn't found
                             if (!foundPredefinedLabel) {
                                  for (const key in manualMapping) {
                                      if (rawSourceLabelText.toLowerCase().includes(key.toLowerCase())) {
                                           const mappedLabel = manualMapping[key];
                                           if (isValidPredefinedLabel(mappedLabel)) {
                                               foundPredefinedLabel = mappedLabel;
                                                console.log('[Iframe-Parser] Mapped part of raw rating text using key "' + key + '" to predefinedLabel: "' + foundPredefinedLabel + '"');
                                                break; // Stop after finding the first match
                                           } else {
                                                 console.warn('[Iframe-Parser] Manual mapping for key "' + key + '" points to an invalid predefined label: "' + mappedLabel + '"');
                                           }
                                      }
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

     function initiateQuery(phoneNumber, nationalNumber, e164Number, requestId) {
         log(`Initiating query for '${phoneNumber}' (requestId: ${requestId})`);
         try {
             // unknownphone.com search URL structure
             const targetSearchUrl = `https://www.unknownphone.com/phone/${encodeURIComponent(phoneNumber)}`;
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


    function generateOutput(phoneNumber, nationalNumber, e164Number, requestId) {
        log(`generateOutput called for requestId: ${requestId}`);
        const numberToQuery = phoneNumber || nationalNumber || e164Number;
        if (numberToQuery) {
             // Format the number for unknownphone.com
             // unknownphone.com seems to handle various formats, but a clean number is usually best.
             const formattedNumber = numberToQuery.replace(/[^0-9]/g, ''); // Remove non-digits

            initiateQuery(formattedNumber, requestId);
        } else {
            sendPluginResult({ requestId, success: false, error: 'No valid phone number provided.' });
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
