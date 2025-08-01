// Slick.ly Phone Query Plugin - Iframe Proxy Solution (Traditional Chinese)
(function() {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'slicklyTwHkPhoneNumberPlugin', // Unique ID for this plugin (specifically for TW/HK)
        name: 'Slick.ly TW/HK Phone Lookup (iframe Proxy)',
        version: '1.0.2', // Incrementing version due to correction
        description: 'Queries Slick.ly for TW/HK phone number information and maps to fixed predefined labels.'
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
        { 'label': 'Travel Ticketing' },
        { 'label': 'Application Software' },
        { 'label': 'Entertainment' },
        { 'label': 'Government' },
        { 'label': 'Local Services' },
        { 'label': 'Automotive Industry' },
        { 'label': 'Car Rental' },
        { 'label': 'Telecommunication' },
    ];

     // --- Keyword list provided by the user, translated to Traditional Chinese ---
     // This list is used for mapping and sourceLabel detection.
     // Please verify the translations and add/adjust mappings as needed.
    const slicklyKeywords_zh_TW = [
        '詐騙', '騙局', '垃圾郵件', '騷擾', '電話行銷', '自動撥號','騙','騙人','騙子',
        '送貨', '外賣', '叫車服務', '保險', '貸款',
        '客戶服務', '未知', '金融', '銀行', '教育',
        '醫療', '慈善', '其他', '催收', '調查',
        '政治', '電子商務', '風險', '代理人', '招募者',
        '獵頭', '無聲電話 語音複製', '互聯網',
        '旅遊與票務', '應用程式軟體', '娛樂',
        '政府', '在地服務', '汽車產業',
        '汽車租賃', '電信', '滋擾'
        // Add other common keywords/phrases from TW/HK reports if needed
         , '補習班', '補習', '假扮', '掛斷', '無聲', '問明對方如何取得資料', '掛你電話', '掛', '推銷', '理財', '融資', '推銷', '賣飛騙子', '騙案', '騙錢勿上當', '上當' // Examples from your HTML
    ];


    // --- Mapping from Slick.ly specific terms/labels (zh-TW) to our FIXED predefinedLabels (exact match) ---
    // Keys are the exact text from Slick.ly (Summary labels, Keywords, terms found in comments) in Traditional Chinese.
    // Values are the corresponding labels from our FIXED predefinedLabels list.
    const manualMapping = {
        // Mappings for Summary labels (zh-TW)
        '安全': 'Other', // Mapping '安全' (Safe) to 'Other' or a 'Safe' predefined label if you add one
        '危險': 'Risk', // Mapping '危險' (Dangerous) to 'Risk'

        // Mappings for Keywords and terms found in comments (based on slicklyKeywords_zh_TW list)
        '詐騙': 'Fraud Scam Likely',
        '騙局': 'Fraud Scam Likely',
        '垃圾郵件': 'Spam Likely', // Mapping to Spam Likely
        '騷擾': 'Spam Likely', // Mapping to Spam Likely
        '電話行銷': 'Telemarketing',
        '自動撥號': 'Robocall',
        '騙': 'Fraud Scam Likely', // Mapping '騙'
        '騙人': 'Fraud Scam Likely', // Mapping '騙人'
        '騙子': 'Fraud Scam Likely', // Mapping '騙子'
        '騙案': 'Fraud Scam Likely', // Mapping '騙子'
        
        '送貨': 'Delivery',
        '外賣': 'Takeaway',
        '叫車服務': 'Ridesharing',
        '保險': 'Insurance',
        '貸款': 'Loan',
        '客戶服務': 'Customer Service',
        '未知': 'Unknown',
        '金融': 'Financial',
        '銀行': 'Bank',
        '教育': 'Education',
        '醫療': 'Medical',
        '慈善': 'Charity',
        '其他': 'Other',
        '催收': 'Debt Collection',
        '調查': 'Survey',
        '政治': 'Political',
        '電子商務': 'Ecommerce',
        '風險': 'Risk',
        '代理人': 'Agent',
        '招募者': 'Recruiter',
        '獵頭': 'Headhunter',
        '無聲電話 語音複製': 'Silent Call Voice Clone', // Mapping to updated predefined label
        '互聯網': 'Internet', // Mapping to Internet
        '旅遊與票務': 'Travel Ticketing', // Mapping to Travel Ticketing
        '應用程式軟體': 'Application Software', // Mapping to Application Software
        '娛樂': 'Entertainment', // Mapping to Entertainment
        '政府': 'Government', // Mapping to Government
        '在地服務': 'Local Services', // Mapping to Local Services
        '汽車產業': 'Automotive Industry', // Mapping to Automotive Industry
        '汽車租賃': 'Car Rental', // Mapping to Car Rental
        '電信': 'Telecommunication', // Mapping to Telecommunication
        '滋擾': 'Spam Likely', // Mapping '滋擾' to Spam Likely

        // Add mappings for other common keywords/phrases from TW/HK reports if needed (based on updated list)
        '補習班': 'Education', // Mapping '補習班'
        '補習': 'Education', // Mapping '補習'
        '假扮': 'Fraud Scam Likely', // Mapping '假扮' to Fraud or Scam Likely
        '掛斷': 'Other', // Mapping '掛斷' (Hang up) to Other or Spam Likely
        '無聲': 'Silent Call Voice Clone', // Mapping '無聲' (Silent) to Silent Call Voice Clone
        '問明對方如何取得資料': 'Other', // Mapping phrase
        '掛你電話': 'Spam Likely', // Mapping phrase
        '掛': 'Other', // Mapping '掛' (Hang up)
        '推銷': 'Telemarketing', // Mapping '推銷'
        '理財': 'Financial', // Mapping '理財'
        '融資': 'Loan', // Mapping '融資'
        '賣飛騙子': 'Fraud Scam Likely', // Mapping phrase
        '騙錢勿上當': 'Fraud Scam Likely', // Mapping phrase
        '上當': 'Fraud Scam Likely' // Mapping '上當'
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
     * Parses the Slick.ly page content (Traditional Chinese).
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)}; // Use the corrected mapping
                const predefinedLabels = ${JSON.stringify(predefinedLabels)}; // Make predefinedLabels available in iframe for validation
                 const slicklyKeywords_zh_TW = ${JSON.stringify(slicklyKeywords_zh_TW)}; // Make keywords available

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

                 // Helper to find the first matching keyword (case-insensitive, whole word) in Traditional Chinese
                 function findMatchingKeyword_zh_TW(text) {
                     for (const keyword of slicklyKeywords_zh_TW) {
                         // Create a regex to find the whole word or exact phrase match, case-insensitive
                         // Handling Traditional Chinese characters in regex word boundaries might require careful consideration.
                         // For simplicity, we'll use a basic regex here.
                         const regex = new RegExp(keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'); // Basic match
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
                        name: '', predefinedLabel: '', source: PLUGIN_CONFIG.id, numbers: [], success: false, error: '', action: 'none'
                    };

                    try {
                        // --- Extract Comments Count (Count) ---
                        const commentsCountElement = doc.querySelector('.comments-count');
                        if (commentsCountElement) {
                            const countMatch = commentsCountElement.textContent.match(/註釋\\s*\\((\\d+)\\)/i); // Match "註釋"
                            if (countMatch && countMatch[1]) {
                                 result.count = parseInt(countMatch[1], 10) || 0;
                                 console.log('[Iframe-Parser] Found Comments count (註釋):', result.count);
                            }
                        }


                        // --- Extract Summary Label (zh-TW) and set initial sourceLabel ---
                        const summaryLabelElement = doc.querySelector('.summary-keywords .summary span.summary-result'); // Target the span with result class
                        let initialSourceLabel = '';
                        if (summaryLabelElement) {
                            const summaryLabelText = summaryLabelElement.textContent.trim();
                            // Match "安全" or "危險"
                            if (summaryLabelText === '安全' || summaryLabelText === '危險') {
                                 initialSourceLabel = summaryLabelText; // Set initial sourceLabel
                                 result.sourceLabel = initialSourceLabel; // Also set sourceLabel for display
                                 console.log('[Iframe-Parser] Found Summary label (initial sourceLabel):', initialSourceLabel);
                            }
                        }

                        // --- Check Keywords (zh-TW) for a more specific sourceLabel ---
                        let specificSourceLabel = null;
                        const keywordsElement = doc.querySelector('.summary-keywords .keywords span');
                        if (keywordsElement) {
                             const keywordsText = keywordsElement.textContent.trim();
                             console.log('[Iframe-Parser] Keywords text (zh-TW):', keywordsText);
                             const matchingKeyword = findMatchingKeyword_zh_TW(keywordsText); // Use the CORRECT finding function
                             if (matchingKeyword) {
                                  specificSourceLabel = matchingKeyword; // Override sourceLabel with the matched keyword
                                  console.log('[Iframe-Parser] Found matching keyword in Keywords (overriding sourceLabel):', specificSourceLabel);
                             }
                        }

                        // --- Check Comments (zh-TW) for an even more specific sourceLabel ---
                         if (!specificSourceLabel) { // Only check comments if no specific keyword found in Keywords
                             const commentContentElements = doc.querySelectorAll('.comments .comment .content p');
                             for (const commentElement of commentContentElements) {
                                  const commentText = commentElement.textContent.trim();
                                   console.log('[Iframe-Parser] Checking comment text (zh-TW) for keywords:', commentText);
                                  const matchingKeyword = findMatchingKeyword_zh_TW(commentText); // Use the CORRECT finding function
                                  if (matchingKeyword) {
                                       specificSourceLabel = matchingKeyword; // Override sourceLabel with the matched keyword from comments
                                      console.log('[Iframe-Parser] Found matching keyword in Comments (overriding sourceLabel):', specificSourceLabel);
                                      break; // Stop checking comments after the first match
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

                        // --- Determine Action based on combined logic ---
                        let action = 'none';

                        // 1. Prioritize action based on the final sourceLabel checking block/allow keywords (CORRECTED LOGIC)
                         const blockKeywords = ['推銷', '推廣', '廣告', '廣', '違規', '詐騙', '騙局', '反動', '行銷', '商業電話', '貸款', '欺詐', '敲詐', '起訴', '假扮', '掛斷', '無聲', '問明對方如何取得資料', '掛你電話', '掛', '推銷', '詐騙', '騙局', '垃圾郵件', '滋擾', '騷擾', '電話行銷', '自動撥號','騙','騙人','騙子', '推銷', '賣飛騙子', '騙案', '騙錢勿上當', '上當', '賣', '借錢', '上當', '騙案', '騙錢勿上當', '假扮'];
                         const allowKeywords = ['外賣', '送貨', '快遞', '叫車', '叫車服務','出租', '滴滴', '優步', '安全'];

                         if (result.sourceLabel) {
                             const lowerSourceLabel = result.sourceLabel.toLowerCase();
                             for (const keyword of blockKeywords) {
                                 if (lowerSourceLabel.includes(keyword.toLowerCase())) {
                                     action = 'block';
                                     break;
                                 }
                             }
                             if (action === 'none') { // Only check allow if not already blocked
                                 for (const keyword of allowKeywords) {
                                     if (lowerSourceLabel.includes(keyword.toLowerCase())) {
                                         action = 'allow';
                                         break;
                                     }
                                 }
                             }
                         }

                        // 2. If no action determined by keywords, check Summary Label (existing logic - lower priority)
                        if (action === 'none' && initialSourceLabel) {
                             if (initialSourceLabel === '危險' || initialSourceLabel === '可疑') { // Added '可疑' '危險' implies block in Traditional Chinese
                                 action = 'block';
                             } else if (initialSourceLabel === '安全') {
                                 action = 'allow';
                             }
                        }

                        // 3. If no action determined by keywords or summary, check Votes (existing logic - lowest priority)
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

                        result.action = action;


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
             // Attempt to extract country code digits (basic: assumes 1-3 digits after +)
             const match = e164Number.match(/^\\+(\\d{1,3})/);
             if (match && match[1]) {
                 const extractedCountryCodeDigits = match[1];
                  console.log('[Slickly Plugin] Extracted country code digits from e164Number:', extractedCountryCodeDigits);

                  // Map the country code digits to a Slick.ly country identifier (e.g., 886 -> tw, 852 -> hk)
                  // This requires a mapping from country calling code digits to Slick.ly country short code.
                  const countryCodeMap = {
                      '886': 'tw', // Taiwan
                      '852': 'hk', // Hong Kong
                       '853': 'mo',  // Macau
                       '44': 'gb', // United Kingdom
                       '61': 'au', // Australia
                       '60': 'my'  // Malaysia
                      // Add more mappings as needed
                  };
                  countryCode = countryCodeMap[extractedCountryCodeDigits];

                   if (!countryCode) {
                       logError(`Could not map country code digits "${extractedCountryCodeDigits}" to a Slick.ly country.`);
                       // You might still proceed with a default or return an error
                       sendPluginResult({ requestId, success: false, error: `Unsupported country code: ${extractedCountryCodeDigits}` });
                       return; // Exit if country code is required and not found
                   }
                    console.log('[Slickly Plugin] Mapped country code digits to Slick.ly country code:', countryCode);

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
