(function() {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'telnaviPlugin',
        name: 'Telnavi Phone Lookup (iframe Proxy)',
        version: '1.0.1',
        description: 'Queries telnavi.jp for phone number information and maps to fixed predefined labels.'
    };

    // --- Our application's FIXED predefined labels ---
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
        { label: 'Telecommunication' }
    ];

     // --- Keyword list provided by the user, translated to Japanese (based on common usage and examples) ---
     // This list is used for mapping and sourceLabel detection.
     // Please verify the translations and add/adjust mappings as needed.
    const jpnumberKeywords_ja_JP = [
        '詐欺', 'フィッシング詐欺', 'スパム', '嫌がらせ', 'テレマーケティング', 'ロボコール',
        '配送', '出前', 'ライドシェア', '保険', 'ローン',
        'カスタマーサービス', '不明', '金融', '銀行', '教育',
        '医療', '慈善', 'その他', '借金取り立て', '調査',
        '政治', 'Eコマース', 'リスク', 'エージェント', 'リクルーター',
        'ヘッドハンター', '無音電話', 'インターネット',
        '旅行・チケット', 'アプリケーションソフト', 'エンターテイメント',
        '政府', '地域サービス', '自動車産業',
        'レンタカー', '電気通信', '迷惑電話',

        // Keywords from the JP HTML example
        '電力会社なりすまし詐欺',
         'あなたが対応しているのでは',
         'あなたの名前は',
         'さんの戸籍謄本と印鑑証明が必要と言っているが',
         'その人とは知り合いでもなく関わりがない旨伝えた',
         'その同僚の方のお名前は',
         '危険番号',

         // Add other common Japanese keywords/phrases from reports if needed
         'オレオレ詐欺', // Ore Ore fraud (It's me, it's me fraud)
         '還付金詐欺', // Refund fraud
         '架空請求詐欺', // Fabricated billing fraud
         'ワンクリック詐欺', // One-click fraud
         '個人情報', // Personal information
         '登録料', // Registration fee
         '当選しました', // You have won
         '未納料金', // Unpaid fees
         '裁判', // Lawsuit
         '警察', // Police
         '消費者センター', // Consumer center
         'SMS', // SMS
         'ショートメール', // Short mail (SMS)
         '折り返し電話', // Call back
         '〇〇ですが', // This is XX... (Common opening)
         '不審な電話', // Suspicious call
         '怪しい電話', // Suspicious call
         '注意喚起', // Warning/Heads-up
         '詐欺注意', // Scam warning
         '不明な番号', // Unknown number
         '無言電話', // Silent call
    ];


    // --- Mapping from Slick.ly specific terms/labels (ja-JP) to our FIXED predefinedLabels (exact match) ---
    // Keys are the exact text from Slick.ly (Summary labels, Keywords, terms found in comments) in Japanese.
    // Values are the corresponding labels from our FIXED predefinedLabels list.
    const manualMapping = {
         // Mappings for Summary labels (ja-JP)
         '疑わしい': 'Spam Likely',
         '危険な': 'Risk',

         // Mappings from the jpnumberKeywords_ja_JP list
         '詐欺': 'Fraud Scam Likely',
         'フィッシング詐欺': 'Fraud Scam Likely',
         'スパム': 'Spam Likely',
         '嫌がらせ': 'Spam Likely',
         'テレマーケティング': 'Telemarketing',
         'ロボコール': 'Robocall',
         '配送': 'Delivery',
         '出前': 'Takeaway',
         'ライドシェア': 'Ridesharing',
         '保険': 'Insurance',
         'ローン': 'Loan',
         'カスタマーサービス': 'Customer Service',
         '不明': 'Unknown',
         '金融': 'Financial',
         '銀行': 'Bank',
         '教育': 'Education',
         '医療': 'Medical',
         '慈善': 'Charity',
         'その他': 'Other',
         '借金取り立て': 'Debt Collection',
         '調査': 'Survey',
         '政治': 'Political',
         'Eコマース': 'Ecommerce',
         'リスク': 'Risk',
         'エージェント': 'Agent',
         'リクルーター': 'Recruiter',
         'ヘッドハンター': 'Headhunter',
         '無音電話': 'Silent Call Voice Clone',

         'インターネット': 'Internet',
         '旅行・チケット': 'Travel Ticketing',
         'アプリケーションソフト': 'Application Software',
         'エンターテイメント': 'Entertainment',
         '政府': 'Government',
         '地域サービス': 'Local Services',
         '自動車産業': 'Automotive Industry',
         'レンタカー': 'Car Rental',
         '電気通信': 'Telecommunication',
         '迷惑電話': 'Spam Likely',

         // Mappings for keywords from the JP HTML example
         '電力会社なりすまし詐欺': 'Fraud Scam Likely',
         'あなたが対応しているのでは': 'Other',
         'あなたの名前は': 'Other',
         'さんの戸籍謄本と印鑑証明が必要と言っているが': 'Fraud Scam Likely',
         'その人とは知り合いでもなく関わりがない旨伝えた': 'Other',
         'その同僚の方のお名前は': 'Other',
         '危険番号': 'Risk',

         // Mappings for other common Japanese keywords/phrases
                  // Mappings for other common Japanese keywords/phrases
                  'オレオレ詐欺': 'Fraud Scam Likely',
                  '還付金詐欺': 'Fraud Scam Likely',
                  '架空請求詐欺': 'Fraud Scam Likely',
                  'ワンクリック詐欺': 'Fraud Scam Likely',
                  '個人情報': 'Risk', // Personal information (often related to scams)
                  '登録料': 'Fraud Scam Likely', // Registration fee (often related to scams)
                  '当選しました': 'Fraud Scam Likely', // You have won (common scam phrase)
                  '未納料金': 'Debt Collection', // Unpaid fees (can be legitimate or scam) - mapping to Debt Collection
                  '裁判': 'Debt Collection', // Lawsuit (can be legitimate or scam) - mapping to Debt Collection
                  '警察': 'Other', // Police (can be legitimate or scam) - mapping to Other or Risk
                  '消費者センター': 'Other', // Consumer center
                  'SMS': 'Other', // SMS
                  'ショートメール': 'Other', // Short mail (SMS)
                  '折り返し電話': 'Other', // Call back (can be legitimate or suspicious)
                  '〇〇ですが': 'Other', // This is XX... (common opening, map to Other)
                  '不審な電話': 'Spam Likely', // Suspicious call
                  '怪しい電話': 'Spam Likely', // Suspicious call
                  '注意喚起': 'Other', // Warning/Heads-up
                  '詐欺注意': 'Fraud Scam Likely', // Scam warning
                  '不明な番号': 'Unknown', // Unknown number
                  '無言電話': 'Silent Call Voice Clone', // Silent call
    };



    // --- Constants, State, Logging, and Communication functions (similar to bd.js) ---
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
            if (iframe.parentNode) { iframe.parentNode.removeChild(iframe); }
            activeIFrames.delete(requestId);
            log(`Cleaned up iframe for requestId: ${requestId}`);
        }
    }

    /**
     * Parses the Slick.ly page content (Japanese).
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)};
                const predefinedLabels = ${JSON.stringify(predefinedLabels)};
                const jpnumberKeywords_ja_JP = ${JSON.stringify(jpnumberKeywords_ja_JP)};
                const blockKeywords = ${JSON.stringify(blockKeywords)};
                const allowKeywords = ${JSON.stringify(allowKeywords)};

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

                 // Helper to find the first matching keyword (case-insensitive) in Japanese
                 // This version looks for inclusion, not necessarily whole word for better Japanese matching.
                 function findMatchingKeyword_ja_JP(text) {
                     const lowerText = text.toLowerCase();
                     for (const keyword of jpnumberKeywords_ja_JP) {
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
                        name: '', predefinedLabel: '', source: PLUGIN_CONFIG.id, numbers: [], success: false, error: '', action: 'none'
                    };

                    try {
                       // --- Extracting Data from the HTML ---
                        const resultMainRight = doc.getElementById('result-main-right');
                        if (resultMainRight) {
                            // --- Extracting Name  ---
                            const titleBackgroundOrange = resultMainRight.querySelector('.title-background-orange span.title-text12 a');
                            if (titleBackgroundOrange) {
                                const nameParts = titleBackgroundOrange.textContent.split('|');
                                result.name = nameParts[0] ? nameParts[0].trim() : '';
                            }

                            // --- Extracting Count ---
                             const countTextElement = resultMainRight.querySelector("div.frame-728-orange-l > table > tbody > tr > td > div.content > dt:nth-child(4)");
                            if(countTextElement){
                                const countText = countTextElement.textContent;
                                const countMatch = countText.match(/口コミ数:<span class="orange">(\d+)<\/span>/);
                                if (countMatch && countMatch[1]) {
                                    result.count = parseInt(countMatch[1], 10);
                                }
                            }


                             // --- Extract sourceLabel from comments/name  (using keywords) ---
                            let specificSourceLabel = null;
                            const contentDiv = resultMainRight.querySelector('.content');
                            if (contentDiv) {
                                const allText = contentDiv.textContent.toLowerCase();


                                        const matchingKeyword = findMatchingKeyword_ja_JP(allText);
                                        if (matchingKeyword) {
                                             specificSourceLabel = matchingKeyword; // Override sourceLabel with the matched keyword from comments
                                            console.log('[Iframe-Parser] Found matching keyword in Comments (setting specificSourceLabel):', specificSourceLabel);
                                        }


                                // --- Set the final sourceLabel based on priority ---
                                if (specificSourceLabel) {
                                    result.sourceLabel = specificSourceLabel;
                                }
                            }


                         // --- Determine Action based on combined logic ---
                        let action = 'none';
                         const initialSourceLabel = '';

                         if (action === 'none' && result.sourceLabel ) { // Only check if sourceLabel was updated from keywords/comments
                            const blockKeywords = ['詐欺', '危険番号', '悪徳押し買い業者', '訪問詐欺', '詐', '欺', '迷惑', '迷惑詐欺', 'フィッシング詐欺', 'スパム', '嫌がらせ', 'テレマーケティング', 'ロボコール', 'ローン', '借金取り立て', '調査', '政治', 'Eコマース', 'リスク', '無音電話', '電力会社なりすまし詐欺', 'オレオレ詐欺', '還付金詐欺', '架空請求詐欺', 'ワンクリック詐欺', '個人情報', '登録料', '当選しました', '未納料金', '裁判', '不審な電話', '怪しい電話', '詐欺注意', '無言電話']; // Updated relevant JP block keywords
                            const allowKeywords = ['配送', '出前', 'ライドシェア']; // Updated relevant JP allow keywords                           

                            for (const keyword of blockKeywords) {
                                if (result.sourceLabel.includes(keyword)) {
                                     action = 'block';
                                     break;
                                } else if (findMatchingKeyword_ja_JP(result.sourceLabel) === keyword) { // Check if sourceLabel is a mapped keyword
                                    action = 'block';
                                     break;
                                }
                            }
                            if (action === 'none') { // Only check allow if not already blocked
                                 for (const keyword of allowKeywords) {
                                    if (result.sourceLabel.includes(keyword)) {
                                         action = 'allow';
                                         break;
                                    } else if (findMatchingKeyword_ja_JP(result.sourceLabel) === keyword) { // Check if sourceLabel is a mapped keyword
                                        action = 'allow';
                                         break;
                                    }
                                }
                            }
                        }

                         result.action = action;

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

                    // --- Extract Province and City --- NO PROVINCE AND CITY IN JP HTML

                        // --- Set success to true if we found at least a count or a sourceLabel ---
                        if (result.count > 0 || result.sourceLabel) {
                            result.success = true;
                        }

                        return result;


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

     function initiateQuery(phoneNumber, requestId) {
         log(`Initiating query for '${phoneNumber}' (requestId: ${requestId})`);
         try {
             // Construct Slick.ly search URL based on country code
             const targetSearchUrl = `https://www.jpnumber.com/searchnumber.do?number=${encodeURIComponent(phoneNumber)}`;
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

       
             initiateQuery(numberToQuery, requestId);

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
