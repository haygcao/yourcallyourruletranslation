// usphonebook.com Phone Query Plugin - Iframe Proxy Solution
(function() {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'usphonebookPhoneNumberPlugin', // Unique ID for this plugin
        name: 'USPhonebook Phone Lookup (iframe Proxy)',
        version: '1.0.0', // Initial version
        description: 'Queries usphonebook.com for phone number information using an iframe proxy.'
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
     * Parses the usphonebook.com page content.
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                let parsingCompleted = false;

                function sendResult(result) {
                    if (parsingCompleted) return;
                    parsingCompleted = true;
                    console.log('[Iframe-Parser] Sending result back to parent:', result);
                    window.parent.postMessage({ type: 'phoneQueryResult', data: { pluginId: PLUGIN_ID, ...result } }, '*');
                }

                function parseContent(doc) {
                    console.log('[Iframe-Parser] Attempting to parse content in document with title:', doc.title);
                    const result = {
                        phoneNumber: PHONE_NUMBER, sourceLabel: '', count: 0, province: '', city: '', carrier: '',
                        name: '', predefinedLabel: '', source: PLUGIN_ID, numbers: [], success: false, error: ''
                    };

                    try {
                        // --- Extract Name ---
                        const nameElement = doc.querySelector('.ls_number-text span[itemprop="name"]');
                        if (nameElement) {
                            const givenName = nameElement.querySelector('strong[itemprop="givenName"]')?.textContent?.trim() || '';
                            const familyName = nameElement.querySelector('strong[itemprop="familyName"]')?.textContent?.trim() || '';
                            result.name = (givenName + ' ' + familyName).trim();
                            console.log('[Iframe-Parser] Found Name:', result.name);
                        }

                        // --- Extract Spam/Fraud Potential ---
                        const spamPotentialElement = doc.querySelector('.spam-check-block .block-success, .spam-check-block .block-warning, .spam-check-block .block-danger');
                         if (spamPotentialElement) {
                             result.sourceLabel = 'Spam/Fraud Potential: ' + spamPotentialElement.textContent.trim();
                             // Basic mapping based on content
                             const status = spamPotentialElement.textContent.trim().toLowerCase();
                             if (status === 'safe') {
                                 result.predefinedLabel = 'Safe';
                             } else if (status === 'spam' || status === 'fraud') {
                                 result.predefinedLabel = 'Spam Likely'; // Or 'Fraud Scam Likely'
                             } else {
                                  result.predefinedLabel = 'Unknown'; // Or other relevant label
                             }
                             console.log('[Iframe-Parser] Found Spam/Fraud Potential:', result.sourceLabel, 'Mapped Label:', result.predefinedLabel);
                         } else {
                             // Look for the Spam/Fraud button as an indicator if the block-success/warning/danger is not found
                             const spamButton = doc.querySelector('button.btn-spam');
                             if(spamButton) {
                                 result.sourceLabel = 'Spam/Fraud Check Available';
                                 result.predefinedLabel = 'Unknown'; // Can't determine status without the block
                                  console.log('[Iframe-Parser] Found Spam/Fraud Check button.');
                             }
                         }


                        // --- Set success to true if we found at least a name or spam info ---
                        if (result.name || result.sourceLabel) {
                            result.success = true;
                        }

                        if (result.success) {
                            return result;
                        }

                        console.log('[Iframe-Parser] Could not extract required information from the page.');
                        return null;

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
                    if (finalResult) {
                        sendResult(finalResult);
                    } else {
                        console.error('[Iframe-Parser] Failed to parse content from any known structure.');
                         // Send a basic result even if parsing failed to indicate the process finished
                        sendResult({ success: false, error: 'Could not parse content from the page.' });
                    }
                }

                console.log('[Iframe-Parser] Parsing script has started execution for phone: ' + PHONE_NUMBER);
                // Give the page a moment to render before parsing
                setTimeout(findAndParse, 500); // Increased timeout slightly
            })();
        `;
    }

     function initiateQuery(phoneNumber, requestId) {
         log(`Initiating query for '${phoneNumber}' (requestId: ${requestId})`);
         try {
             // usphonebook.com search URL structure
             const targetSearchUrl = `https://www.usphonebook.com/${encodeURIComponent(phoneNumber)}`;
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
            // Format the number for usphonebook.com (e.g., remove spaces, dashes, and potentially country code if not needed)
            // You might need to experiment with the exact format usphonebook.com expects.
            // For now, let's use the provided phoneNumber as is, assuming it's already formatted correctly for the search URL.
            // If not, add formatting logic here.
            const digitsOnly = numberToQuery.replace(/[^0-9]/g, ''); // Example: remove non-digits
            // Format the 10-digit number into xxx-xxx-xxxx format
            let formattedNumber = digitsOnly;
            if (digitsOnly.length === 10) {
                formattedNumber = digitsOnly.substring(0, 3) + '-' + digitsOnly.substring(3, 6) + '-' + digitsOnly.substring(6);
            } else {
                 logError(`Input number is not 10 digits long. Cannot format to xxx-xxx-xxxx: ${numberToQuery}`);
                 // Decide if you want to proceed with the unformatted number or return an error
                 // For now, we'll proceed with the digits only, but usphonebook.com might not accept it
                 formattedNumber = digitsOnly; // Or handle as an error
                 // sendPluginResult({ requestId, success: false, error: 'Input number must be 10 digits for formatting.' });
                 // return;
            }


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
