// [Plugin Name] - Iframe Proxy Solution Universal Template V5.5 (Final & Complete)
// =======================================================================================
// TEMPLATE DESCRIPTION:
// This is a standardized template for creating phone number query plugins. It's based on a
// universal architecture that bypasses website security restrictions (like CORS) by creating
// a hidden iframe and leveraging Flutter's native network proxy capabilities.
//
// Developers only need to modify a few clearly marked sections based on the target
// website's specific characteristics.
//
// HOW IT WORKS:
// 1. The Flutter app calls the `generateOutput` function.
// 2. `initiateQuery` builds the target website's URL and sets it as the `src` of a hidden
//    iframe, using a special internal proxy URL.
// 3. The Flutter-side proxy server intercepts this request, fetches the real HTML content
//    from the target website, and returns it to the iframe.
// 4. When the iframe finishes loading (`onload`), the main page injects a parsing script
//    (`getParsingScript`) into it via `postMessage`.
// 5. The parsing script executes inside the iframe, scraping the necessary information from
//    the page's HTML (`parseContent` function).
// 6. The parsing script sends the result back to the main page using `window.parent.postMessage`.
// 7. The main page's `message` event listener receives the result and sends the final,
//    formatted data back to the Flutter app using `sendToFlutter`.
// =======================================================================================

(function () {
    // Using an IIFE (Immediately Invoked Function Expression) to encapsulate the plugin logic
    // and avoid polluting the global scope.

    // --- SECTION 1: Core Plugin Configuration (MUST BE MODIFIED) ---
    // ---------------------------------------------------------------------------------------
    // This section uniquely identifies your plugin. Be sure to provide unique information.
    // ---------------------------------------------------------------------------------------
    const PLUGIN_CONFIG = {
        id: 'yourUniquePluginId', // A unique ID for the plugin, using camelCase (e.g., 'someWebsitePlugin')
        name: 'Your Plugin Name (iframe Proxy)', // A human-readable name for the plugin (e.g., 'SomeWebsite Lookup (iframe Proxy)')
        version: '5.5.0', // The plugin version, semantic versioning is recommended
        description: 'A brief description of what this plugin does.' // A short explanation of the plugin's purpose
    };

    // --- SECTION 2: Business-Specific Data & Keywords (MODIFY AS NEEDED) ---
    // ---------------------------------------------------------------------------------------
    // This section defines how to map raw text (sourceLabel) scraped from the website
    // to our application's internal standard labels (predefinedLabel), and how to determine
    // the recommended action based on those labels.
    // ---------------------------------------------------------------------------------------

    /**
     * @constant {Array<Object>} predefinedLabels - The app's fixed, predefined list of labels.
     * @description This list is standard and usually does not need to be modified. It defines
     *              the complete set of possible output labels for all plugins.
     */
    const predefinedLabels = [
        { 'label': 'Fraud Scam Likely' }, { 'label': 'Spam Likely' }, { 'label': 'Telemarketing' },
        { 'label': 'Robocall' }, { 'label': 'Delivery' }, { 'label': 'Takeaway' },
        { 'label': 'Ridesharing' }, { 'label': 'Insurance' }, { 'label': 'Loan' },
        { 'label': 'Customer Service' }, { 'label': 'Unknown' }, { 'label': 'Financial' },
        { 'label': 'Bank' }, { 'label': 'Education' }, { 'label': 'Medical' },
        { 'label': 'Charity' }, { 'label': 'Other' }, { 'label': 'Debt Collection' },
        { 'label': 'Survey' }, { 'label': 'Political' }, { 'label': 'Ecommerce' },
        { 'label': 'Risk' }, { 'label': 'Agent' }, { 'label': 'Recruiter' },
        { 'label': 'Headhunter' }, { 'label': 'Silent Call Voice Clone' }, { 'label': 'Internet' },
        { 'label': 'Travel Ticketing' }, { 'label': 'Application Software' }, { 'label': 'Entertainment' },
        { 'label': 'Government' }, { 'label': 'Local Services' }, { 'label': 'Automotive Industry' },
        { 'label': 'Car Rental' }, { 'label': 'Telecommunication' },
    ];

    /**
     * @constant {Object} manualMapping - The manual mapping table.
     * @description Key: The raw text scraped from the target website.
     *              Value: The corresponding standard label from `predefinedLabels`.
     *              This is the core of the plugin's localization. You must populate this object
     *              based on the target website's language and common tags.
     * @example
     * const manualMapping = {
     *     'Spam Call': 'Spam Likely',
     *     'Delivery Service': 'Delivery',
     *     'Dudoso': 'Spam Likely', // Spanish
     *     'Werbung': 'Telemarketing' // German
     * };
     */
    const manualMapping = {
        // Example: 'scraped label from website': 'corresponding standard label'
        'Real Estate Agent': 'Agent',
        'Courier': 'Delivery',
        'Suspected Fraud': 'Fraud Scam Likely',
        'Telemarketer': 'Telemarketing',
    };

    /**
     * @constant {Array<string>} blockKeywords - Keywords used to determine a "block" action.
     * @description If the parsed `sourceLabel` or `predefinedLabel` includes any keyword from
     *              this list, the `action` field in the result will be set to 'block'.
     */
    const blockKeywords = [
        'Harassment', 'Scam', 'Fraud', 'Spam', 'Telemarketing', 'Robocall', 'Debt'
    ];

    /**
     * @constant {Array<string>} allowKeywords - Keywords used to determine an "allow" action.
     * @description If the parsed `sourceLabel` or `predefinedLabel` includes any keyword from this list,
     *              and it doesn't meet the block criteria, the `action` field will be set to 'allow'.
     */
    const allowKeywords = [
        'Delivery', 'Courier', 'Takeaway', 'Customer Service', 'Support', 'Bank', 'Verification'
    ];


    // --- SECTION 3: Generic Framework (DO NOT MODIFY) ---
    // ---------------------------------------------------------------------------------------
    // This part is the core of the plugin framework, responsible for communication with
    // Flutter, iframe creation/cleanup, logging, and other generic functions. Do not
    // modify this code unless you are an expert on the framework.
    // ---------------------------------------------------------------------------------------
    const PROXY_SCHEME = "https";
    const PROXY_HOST = "flutter-webview-proxy.internal";
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
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
            activeIFrames.delete(requestId);
            log(`Cleaned up iframe for requestId: ${requestId}`);
        }
    }

    // --- SECTION 4: Page Parsing Logic (THE CORE MODIFICATION AREA) ---
    /**
     * @function getParsingScript
     * @description Generates the script string that will be injected and executed within the iframe.
     *              This script is responsible for parsing the iframe's HTML content and sending
     *              the results back via postMessage.
     * @param {string} pluginId - The ID of the current plugin.
     * @param {string} phoneNumberToQuery - The phone number being queried.
     * @returns {string} - An executable JavaScript script as a string.
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        // Use a template literal to dynamically build the script, serializing external
        // configurations like manualMapping to pass them into the iframe's scope.
        return `
            (function() {
                // --- Constants within the iframe script ---
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)};
                const blockKeywords = ${JSON.stringify(blockKeywords)};
                const allowKeywords = ${JSON.stringify(allowKeywords)};
                let parsingCompleted = false;

                // --- Communication function within the iframe ---
                function sendResult(result) {
                    if (parsingCompleted) return;
                    parsingCompleted = true;
                    console.log('[Iframe-Parser] Sending result back to parent:', result);
                    // Use postMessage to send the parsed result to the parent window (the plugin's environment)
                    window.parent.postMessage({ type: 'phoneQueryResult', data: { pluginId: PLUGIN_ID, ...result } }, '*');
                }

                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                // ★  THE CORE PARSING FUNCTION - This is where developers should focus  ★
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                /**
                 * @function parseContent
                 * @description Parses the Document Object Model (DOM) to extract phone number information.
                 * @param {Document} doc - The iframe's document object.
                 * @returns {Object|null} - An object containing the parsed results, or null on failure.
                 */
                function parseContent(doc) {
                    console.log('[Iframe-Parser] Attempting to parse content in document.');
                    // Initialize a standard result object
                    const result = {
                        phoneNumber: PHONE_NUMBER, sourceLabel: '', count: 0, province: '', city: '', carrier: '',
                        name: '', predefinedLabel: '', source: PLUGIN_ID, numbers: [], success: false, error: '', action: 'none'
                    };

                    try {
                        // [PARSING STRATEGY EXAMPLE 1: Find a specific tag card]
                        // Try to find the main container holding the phone number information.
                        const mainContainer = doc.querySelector('.result-op.c-container, #content_left, .main-content');
                        if (mainContainer) {
                            // Within the container, look for an element with the tag/label.
                            const labelEl = mainContainer.querySelector('.op_mobilephone_label, .tel-tag, .phone-label');
                            if (labelEl) {
                                // Clean up and extract the label text.
                                const labelText = labelEl.textContent.replace(/Tag:|标记：/, '').trim();
                                if (labelText) {
                                    result.sourceLabel = labelText;
                                    result.success = true;

                                    // Attempt to find and parse other info, like location, report count, etc.
                                    const locationEl = mainContainer.querySelector('.op_mobilephone_location');
                                    if (locationEl) {
                                        const locText = locationEl.textContent.replace(/Location:/, '').trim();
                                        const [province, city, carrier] = locText.split(/\\s+/);
                                        result.province = province || '';
                                        result.city = city || '';
                                        result.carrier = carrier || '';
                                    }
                                    console.log('[Iframe-Parser] Strategy 1 (Tag Card) successful. Found label:', labelText);
                                }
                            }
                        }

                        // [PARSING STRATEGY EXAMPLE 2: Extract latest tag from comments]
                        if (!result.success) {
                            const commentLabelCell = doc.querySelector('#comments .container-recent-comments td.callertype');
                            if (commentLabelCell) {
                                const labelText = commentLabelCell.textContent.trim();
                                if (labelText) {
                                    result.sourceLabel = labelText;
                                    result.success = true;
                                    console.log('[Iframe-Parser] Strategy 2 (Comments) successful. Found label:', labelText);
                                }
                            }
                        }

                        // You can add more parsing strategies here if needed...


                        // [FINAL PROCESSING STEPS]
                        if (result.success && result.sourceLabel) {
                            // 1. Map the sourceLabel to a predefinedLabel
                            // Using find is useful if the sourceLabel contains a keyword rather than being an exact match.
                            const mappedKey = Object.keys(manualMapping).find(key => result.sourceLabel.includes(key));
                            result.predefinedLabel = mappedKey ? manualMapping[mappedKey] : 'Unknown';

                            // 2. Determine the recommended action
                            const labelToCheck = result.sourceLabel.toLowerCase();
                            let determinedAction = 'none';
                            for (const keyword of blockKeywords) {
                                if (labelToCheck.includes(keyword.toLowerCase())) {
                                    determinedAction = 'block';
                                    break;
                                }
                            }
                            if (determinedAction === 'none') {
                                for (const keyword of allowKeywords) {
                                    if (labelToCheck.includes(keyword.toLowerCase())) {
                                        determinedAction = 'allow';
                                        break;
                                    }
                                }
                            }
                            result.action = determinedAction;
                            console.log('[Iframe-Parser] Action determined as:', result.action);
                        }

                        if (result.success) {
                            return result;
                        }

                        console.log('[Iframe-Parser] All parsing strategies failed.');
                        return null; // Indicates that no valid information was found on the page.

                    } catch (e) {
                        console.error('[Iframe-Parser] An error occurred during parsing:', e);
                        result.error = e.toString();
                        return result; // Return the result object with error details.
                    }
                }
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

                // --- Startup logic for the iframe script ---
                function findAndParse() {
                    if (parsingCompleted) return;
                    console.log('[Iframe-Parser] Starting parse attempt...');
                    const finalResult = parseContent(window.document);
                    if (finalResult) {
                        sendResult(finalResult);
                    } else {
                        // If parseContent returns null, it means parsing failed.
                        sendResult({ success: false, error: 'Could not parse any recognizable content from the page.' });
                    }
                }
                console.log('[Iframe-Parser] Parsing script has started execution for phone: ' + PHONE_NUMBER);
                // Delay execution to ensure any dynamic content on the page has loaded.
                setTimeout(findAndParse, 500);
            })();
        `;
    }

    // --- SECTION 5: Query Initiation & Iframe Creation (ADJUST AS NEEDED) ---
    // ---------------------------------------------------------------------------------------
    // This section is responsible for building the target URL and initiating the query.
    // You will typically only need to modify `targetSearchUrl` and optionally `domPurgeRules`.
    // ---------------------------------------------------------------------------------------
    function initiateQuery(phoneNumber, requestId) {
        log(`Initiating query for '${phoneNumber}' (requestId: ${requestId})`);
        try {
            // ★★★ 1. Build the target website's URL (MUST BE MODIFIED) ★★★
            // This is the URL of the website you want to query. Use encodeURIComponent to ensure
            // the phone number is correctly encoded in the URL.
            const targetSearchUrl = `https://www.example.com/search?q=${encodeURIComponent(phoneNumber)}`;

            // --- The following is generic code and usually does not need modification ---
            const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' };
            const originalOrigin = new URL(targetSearchUrl).origin;

            // ★★★ 2. (Optional) Define sanitization rules (MODIFY AS NEEDED) ★★★
            // If the target website has disruptive JS or elements (like anti-debugging scripts
            // or ad popups), you can define rules here to remove them. This is executed
            // by the Flutter-side proxy server before the page is sent to the iframe.
            const domPurgeRules = [
                // { type: 'remove', selector: 'script[src*="anti-debug"]' }
            ];

            // --- The following is template code and should not be modified ---
            const purgeRulesParam = domPurgeRules.length > 0 ? `&purgeRules=${encodeURIComponent(JSON.stringify(domPurgeRules))}` : '';
            const proxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?requestId=${encodeURIComponent(requestId)}&originalOrigin=${encodeURIComponent(originalOrigin)}&targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}${purgeRulesParam}`;

            log(`Iframe proxy URL: ${proxyUrl}`);

            const iframe = document.createElement('iframe');
            iframe.id = `query-iframe-${requestId}`;
            iframe.style.display = 'none'; // Keep the iframe hidden
            iframe.sandbox = 'allow-scripts allow-same-origin';
            activeIFrames.set(requestId, iframe);

            iframe.onload = function () {
                log(`Iframe loaded for requestId ${requestId}. Posting parsing script directly.`);
                try {
                    const parsingScript = getParsingScript(PLUGIN_CONFIG.id, phoneNumber);
                    iframe.contentWindow.postMessage({ type: 'executeScript', script: parsingScript }, '*');
                    log(`Parsing script posted to iframe for requestId: ${requestId}`);
                } catch (e) {
                    logError(`Error posting script to iframe for requestId ${requestId}:`, e);
                    sendPluginResult({ requestId, success: false, error: `postMessage failed: ${e.message}` });
                    cleanupIframe(requestId);
                }
            };
            iframe.onerror = function () {
                logError(`Iframe error for requestId ${requestId}`);
                sendPluginResult({ requestId, success: false, error: 'Iframe loading failed.' });
                cleanupIframe(requestId);
            };

            document.body.appendChild(iframe);
            iframe.src = proxyUrl;

            // Set a query timeout in case the iframe fails to load or the parsing script hangs.
            setTimeout(() => {
                if (activeIFrames.has(requestId)) {
                    logError(`Query timeout for requestId: ${requestId}`);
                    sendPluginResult({ requestId, success: false, error: 'Query timed out after 30 seconds' });
                    cleanupIframe(requestId);
                }
            }, 30000);

        } catch (error) {
            logError(`Error in initiateQuery for requestId ${requestId}:`, error);
            sendPluginResult({ requestId, success: false, error: `Query initiation failed: ${error.message}` });
        }
    }


    // --- SECTION 6: Plugin's Public API (ADJUST AS NEEDED) ---
    // ---------------------------------------------------------------------------------------
    // This is the entry point called by the Flutter application.
    // ---------------------------------------------------------------------------------------
    function generateOutput(phoneNumber, nationalNumber, e164Number, requestId) {
        log(`generateOutput called for requestId: ${requestId}`);

        // [Developer Note]: Choose the best phone number format for the target website.
        // Different websites expect different formats. Test the site to see which works best.
        // - phoneNumber: The raw, original input.
        // - nationalNumber: The number in its local format (e.g., '0123 456 7890').
        // - e164Number: The number in international format with a '+' (e.g., '+441234567890').

        // The line below defaults to trying each format in order. You should modify this to
        // be more specific for your target site to improve reliability.
        const numberToQuery = phoneNumber || nationalNumber || e164Number;

        // --- EXAMPLES of how to select a specific format ---
        // const numberToQuery = nationalNumber; // Use this if the site requires a local format.
        // const numberToQuery = e164Number;     // Use this for international sites that need the country code.
        // const numberToQuery = phoneNumber.replace(/[^0-9]/g, ''); // Use this for a digits-only format.

        if (numberToQuery) {
            initiateQuery(numberToQuery, requestId);
        } else {
            sendPluginResult({ requestId, success: false, error: 'No valid phone number provided.' });
        }
    }

    // --- SECTION 7: Event Listener & Initialization (DO NOT MODIFY) ---
    // ---------------------------------------------------------------------------------------
    // This code listens for messages from the iframe and registers the plugin globally
    // so that Flutter can call it.
    // ---------------------------------------------------------------------------------------
    window.addEventListener('message', function (event) {
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