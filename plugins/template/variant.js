// Phone Query Plugin - Iframe Proxy Solution (Refactored to Standard Template)
(function() {
    // --- SECTION 1: Core Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: ' PhoneNumberPlugin',
        name: ' Phone Lookup (iframe Proxy)',
        version: '1.0.8', // Version updated for template alignment
        description: 'Queries  using a country-specific URL, fully aligned with the standard template structure.'
    };

    // --- SECTION 2: Business-Specific Data (Unchanged) ---
    // (This section is specific to the website's content and remains as provided)
    const predefinedLabels = [ /* ... as provided ... */ ];
    const manualMapping = { /* ... as provided ... */ };
    const slicklyKeywords = [ /* ... as provided ... */ ];

    // --- SECTION 3: Generic Framework (DO NOT MODIFY - Standard Template) ---
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
    function sendPluginResult(result) { sendToFlutter('PluginResultChannel', result); }
    function sendPluginLoaded() { sendToFlutter('TestPageChannel', { type: 'pluginLoaded', pluginId: PLUGIN_CONFIG.id, version: PLUGIN_CONFIG.version }); }
    function cleanupIframe(requestId) {
        const iframe = activeIFrames.get(requestId);
        if (iframe) {
            if (iframe.parentNode) { iframe.parentNode.removeChild(iframe); }
            activeIFrames.delete(requestId);
            log(`Cleaned up iframe for requestId: ${requestId}`);
        }
    }

    // --- SECTION 4: Page Parsing Logic (Unchanged) ---
    // (The getParsingScript function remains the same as it only deals with parsing the fetched HTML)
    function getParsingScript(pluginId, phoneNumberToQuery) {
        // The entire parsing script logic from your example goes here.
        // It's correct and doesn't need changes for this refactoring.
        return `(function() { /* ... full parsing logic as you provided ... */ })();`;
    }

    // --- SECTION 5: Query Initiation & Iframe Creation (KEY REFACTOR) ---
    // (This function is now 100% compliant with the standard template structure)
    function initiateQuery(phoneNumber, requestId, countryCode) { // Accepting extra params is fine
        log(`Initiating query for '${phoneNumber}' in country '${countryCode}' (requestId: ${requestId})`);
        try {
            // ★★★ 1. Build the target website's URL (CRITICAL ALIGNMENT) ★★★
            // Perfectly aligned with the template, all URL construction logic is now on this single line.
            // No more `baseUrl`; the `countryCode` is used directly here.
            const targetSearchUrl = `https://slick.ly/${countryCode.toLowerCase()}/${encodeURIComponent(phoneNumber)}`;

            // --- The following is generic code, identical to the standard template ---
            const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/5.0.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/5.0.36' };
            const originalOrigin = new URL(targetSearchUrl).origin;

            // ★★★ 2. (Optional) Define sanitization rules (MODIFY AS NEEDED) ★★★
            const domPurgeRules = [];

            // --- The following is template code and should not be modified ---
            const purgeRulesParam = domPurgeRules.length > 0 ? `&purgeRules=${encodeURIComponent(JSON.stringify(domPurgeRules))}` : '';
            const proxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?requestId=${encodeURIComponent(requestId)}&originalOrigin=${encodeURIComponent(originalOrigin)}&targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}${purgeRulesParam}`;

            log(`Iframe proxy URL: ${proxyUrl}`);

            // The rest of the iframe creation, loading, and timeout logic is
            // identical to the standard template and does not need to be changed.
            const iframe = document.createElement('iframe');
            iframe.id = `query-iframe-${requestId}`;
            iframe.style.display = 'none';
            iframe.sandbox = 'allow-scripts allow-same-origin';
            activeIFrames.set(requestId, iframe);

            iframe.onload = function() {
                log(`Iframe loaded for requestId ${requestId}. Posting parsing script.`);
                try {
                    const parsingScript = getParsingScript(PLUGIN_CONFIG.id, phoneNumber);
                    iframe.contentWindow.postMessage({ type: 'executeScript', script: parsingScript }, '*');
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


    // --- SECTION 6: Plugin's Public API (Unchanged) ---
    // (This function correctly prepares the specific parameters needed by this plugin's initiateQuery)
    function generateOutput(phoneNumber, nationalNumber, e164Number, requestId) {
        log(`generateOutput called for requestId: ${requestId}`);

        // [Developer Note]: This specific plugin requires the e164Number to function,
        // as the target website's URL is country-dependent. This validation is correct.
        if (!e164Number || !e164Number.startsWith('+')) {
            const errorMsg = 'e164Number is required for this plugin to determine the country code.';
            logError(errorMsg);
            sendPluginResult({ requestId, success: false, error: errorMsg });
            return;
        }

        // The custom logic to extract `countryCode` belongs here in the preparation phase.
        let countryCode = null;
        let digits = '';
        const match = e164Number.match(/^\+(\d{1,3})/);
        if (match && match[1]) {
            digits = match[1];
            const countryCodeMap = {
                '1': 'us', '44': 'gb', '61': 'au', '65': 'sg', '64': 'nz', '234': 'ng'
                // Add more mappings as needed
            };
            // This logic correctly finds the right country code from the digits.
            while (digits.length > 0) {
                if (countryCodeMap[digits]) {
                    countryCode = countryCodeMap[digits];
                    break;
                }
                digits = digits.slice(0, -1);
            }
        }

        if (!countryCode) {
            const errorMsg = `Unsupported country code digits extracted from e164Number: ${match ? match[1] : 'none'}`;
            logError(errorMsg);
            sendPluginResult({ requestId, success: false, error: errorMsg });
            return;
        }

        // Choosing the number format and removing special characters is also correct preparation logic.
        const numberToQuery = (phoneNumber || nationalNumber).replace(/[^0-9]/g, '');

        // Finally, call initiateQuery with all the necessary parameters.
        if (numberToQuery) {
            initiateQuery(numberToQuery, requestId, countryCode);
        } else {
            sendPluginResult({ requestId, success: false, error: 'No valid phone number provided.' });
        }
    }

    // --- SECTION 7: Event Listener & Initialization (DO NOT MODIFY - Standard Template) ---
    window.addEventListener('message', function(event) {
        if (!event.data || event.data.type !== 'phoneQueryResult' || !event.data.data) return;
        if (event.data.data.pluginId !== PLUGIN_CONFIG.id) return;
        let requestId = null;
        for (const [id, iframe] of activeIFrames.entries()) {
            if (iframe.contentWindow === event.source) { requestId = id; break; }
        }
        if (requestId) {
            const result = { requestId, ...event.data.data };
            delete result.pluginId;
            sendPluginResult(result);
            cleanupIframe(requestId);
        } else {
            logError('Received postMessage from an untracked iframe.', event.data);
        }
    });

    function initialize() {
        if (window.plugin && window.plugin[PLUGIN_CONFIG.id]) return;
        if (!window.plugin) window.plugin = {};
        window.plugin[PLUGIN_CONFIG.id] = { info: PLUGIN_CONFIG, generateOutput: generateOutput };
        log(`Plugin registered: window.plugin.${PLUGIN_CONFIG.id}`);
        sendPluginLoaded();
    }

    initialize();

})();