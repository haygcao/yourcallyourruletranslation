// Slick.ly Phone Query Plugin - Iframe Proxy Solution (Simplified Chinese)
(function () {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'slicklyCnPhoneNumberPlugin', // Unique ID for this plugin (specifically for CN)
        name: 'Slick.ly CN Phone Lookup (iframe Proxy)',
        version: '1.0.1', // Initial version for CN
        description: 'Queries Slick.ly for CN phone number information and maps to fixed predefined labels.'
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

    // --- Keyword list provided by the user, translated to Simplified Chinese and merged ---
    // This list is used for mapping and sourceLabel detection.
    // It includes keywords from the CN HTML example and previous bd.js Simplified Chinese keywords.
    // Please verify the list and add/adjust mappings as needed.
    const slicklyKeywords_zh_CN = [
        '诈骗', '骗局', '垃圾邮件', '骚扰', '电话营销', '自动拨号', '骗', '骗人', '骗子',
        '送货', '外卖', '叫车服务', '保险', '贷款',
        '客户服务', '未知', '金融', '银行', '教育',
        '医疗', '慈善', '其他', '催收', '调查',
        '政治', '电子商务', '风险', '代理人', '招聘者', // 招募者 -> 招聘者 (common Mainland usage)
        '猎头', '无声电话 语音复制', '互联网',
        '旅游与票务', '应用软件', '娱乐', // 应用程式軟體 -> 应用软件 (common Mainland usage)
        '政府', '本地服务', '汽车行业', // 在地服務 -> 本地服务, 汽車產業 -> 汽车行业 (common Mainland usage)
        '汽车租赁', '电信', '滋扰', // 汽車租賃 -> 汽车租赁, 電信 -> 电信 (common Mainland usage)
        // Keywords from the CN HTML example
        '诈骗电话', '借钱', '欺诈', '敲诈', '起诉', '老赖', '卖',
        // Keywords from previous bd.js manual mapping (Simplified Chinese)
        '中介', '房产中介', '违规催收', '快递物流', '快递', '教育培训', '股票证券', '保险理财', '涉诈电话',
        '招聘', '猎头招聘', '招聘猎头', '保险推销', '贷款理财', '医疗卫生', '送餐外卖', '美团', '饿了么',
        '滴滴/优步', '出租车', '网约车', '违法', '淫秽色情', '反动谣言', '发票办证', '客服热线',
        '非应邀商业电话', '广告', '骚扰电话', '商业营销', '广告推销', '旅游推广', '食药推销', '推销', '理财', '融资', '上当'
        // Add any other relevant keywords from CN reports
    ];


    // --- Mapping from Slick.ly specific terms/labels (zh-CN) to our FIXED predefinedLabels (exact match) ---
    // Keys are the exact text from Slick.ly (Summary labels, Keywords, terms found in comments) in Simplified Chinese.
    // Values are the corresponding labels from our FIXED predefinedLabels list.
    const manualMapping = {
        // Mappings for Summary labels (zh-CN)
        '可疑': 'Spam Likely', // Mapping '可疑' (Suspicious) to 'Spam Likely'
        '安全': 'Other', // Mapping '安全' (Safe) to 'Other' or a 'Safe' predefined label if you add one
        '危险': 'Risk', // Mapping '危险' (Dangerous) to 'Risk'

        // Mappings from the merged slicklyKeywords_zh_CN list
        '诈骗': 'Fraud Scam Likely',
        '骗局': 'Fraud Scam Likely',
        '垃圾邮件': 'Spam Likely',
        '骚扰': 'Spam Likely',
        '电话营销': 'Telemarketing',
        '自动拨号': 'Robocall',
        '骗': 'Fraud Scam Likely',
        '骗人': 'Fraud Scam Likely',
        '骗子': 'Fraud Scam Likely',
        '送货': 'Delivery',
        '外卖': 'Takeaway',
        '叫车服务': 'Ridesharing',
        '保险': 'Insurance',
        '贷款': 'Loan',
        '客户服务': 'Customer Service',
        '未知': 'Unknown',
        '金融': 'Financial',
        '银行': 'Bank',
        '教育': 'Education',
        '医疗': 'Medical',
        '慈善': 'Charity',
        '其他': 'Other',
        '催收': 'Debt Collection',
        '调查': 'Survey',
        '政治': 'Political',
        '电子商务': 'Ecommerce',
        '风险': 'Risk',
        '代理人': 'Agent',
        '招聘者': 'Recruiter',
        '猎头': 'Headhunter',
        '无声电话 语音复制': 'Silent Call Voice Clone',
        '互联网': 'Internet',
        '旅游与票务': 'Travel & Ticketing',
        '应用软件': 'Application Software',
        '娱乐': 'Entertainment',
        '政府': 'Government',
        '本地服务': 'Local Services',
        '汽车行业': 'Automotive Industry',
        '汽车租赁': 'Car Rental',
        '电信': 'Telecommunication',
        '滋扰': 'Spam Likely', // Mapping '滋扰' to Spam Likely

        // Mappings from the CN HTML example keywords
        '诈骗电话': 'Fraud Scam Likely',
        '借钱': 'Loan', // Mapping '借钱' to Loan or Fraud Scam Likely depending on context
        '欺诈': 'Fraud Scam Likely',
        '敲诈': 'Risk', // Mapping '敲诈' (Blackmail/Extortion) to Risk
        '起诉': 'Debt Collection', // Mapping '起诉' (Sue) to Debt Collection or Legal
        '老赖': 'Debt Collection', // Mapping '老赖' (Deadbeat/Debtor) to Debt Collection
        '卖': 'Risk', // Mapping '卖' (Sell) - might be telemarketing or other, mapping to Other
        // Mappings from previous bd.js manual mapping (Simplified Chinese)
        '中介': 'Agent',
        '房产中介': 'Agent',
        '违规催收': 'Debt Collection',
        '快递物流': 'Delivery',
        '快递': 'Delivery',
        '教育培训': 'Education',
        '股票证券': 'Financial',
        '保险理财': 'Financial',
        '涉诈电话': 'Fraud Scam Likely',
        '招聘': 'Recruiter',
        '猎头招聘': 'Headhunter',
        '招聘猎头': 'Headhunter',
        '保险推销': 'Insurance',
        '贷款理财': 'Loan',
        '医疗卫生': 'Medical',
        '送餐外卖': 'Takeaway',
        '美团': 'Takeaway',
        '饿了么': 'Takeaway',
        '滴滴/优步': 'Ridesharing',
        '出租车': 'Ridesharing',
        '网约车': 'Ridesharing',
        '违法': 'Risk',
        '淫秽色情': 'Risk',
        '反动谣言': 'Risk',
        '发票办证': 'Fraud Scam Likely', // Mapping '发票办证' to Fraud Scam Likely
        '客服热线': 'Customer Service',
        '非应邀商业电话': 'Spam Likely',
        '广告': 'Spam Likely',
        '骚扰电话': 'Spam Likely',
        '商业营销': 'Telemarketing',
        '广告推销': 'Telemarketing',
        '旅游推广': 'Telemarketing',
        '食药推销': 'Telemarketing',
        '推销': 'Telemarketing',
        '理财': 'Financial',
        '融资': 'Loan',
        '上当': 'Fraud Scam Likely', // Mapping '上当'
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
     * Parses the Slick.ly page content (Simplified Chinese).
     */
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)}; // Use the corrected mapping
                const predefinedLabels = ${JSON.stringify(predefinedLabels)}; // Make predefinedLabels available in iframe for validation
                 const slicklyKeywords_zh_CN = ${JSON.stringify(slicklyKeywords_zh_CN)}; // Make keywords available

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

                 // Helper to find the first matching keyword (case-insensitive) in Simplified Chinese
                 // This version looks for inclusion, not necessarily whole word for better Chinese matching.
                 function findMatchingKeyword_zh_CN(text) {
                     const lowerText = text.toLowerCase();
                     for (const keyword of slicklyKeywords_zh_CN) {
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
                            const countMatch = commentsCountElement.textContent.match(/注释\\s*\\((\\d+)\\)/i); // Match "注释"
                            if (countMatch && countMatch[1]) {
                                 result.count = parseInt(countMatch[1], 10) || 0;
                                 console.log('[Iframe-Parser] Found Comments count (注释):', result.count);
                            }
                        }


                        // --- Extract Summary Label (zh-CN) and set initial sourceLabel ---
                        const summaryLabelElement = doc.querySelector('.summary-keywords .summary span.summary-result'); // Target the span with result class
                        let initialSourceLabel = '';
                        if (summaryLabelElement) {
                            const summaryLabelText = summaryLabelElement.textContent.trim();
                            // Match "可疑", "安全", or "危险"
                            if (summaryLabelText === '可疑' || summaryLabelText === '安全' || summaryLabelText === '危险') {
                                 initialSourceLabel = summaryLabelText; // Set initial sourceLabel
                                 result.sourceLabel = initialSourceLabel; // Also set sourceLabel for display
                                 console.log('[Iframe-Parser] Found Summary label (initial sourceLabel):', initialSourceLabel);
                            }
                        }

                        // --- Check Keywords (zh-CN) for a more specific sourceLabel ---
                        let specificSourceLabel = null;
                        const keywordsElement = doc.querySelector('.summary-keywords .keywords span');
                        if (keywordsElement) {
                             const keywordsText = keywordsElement.textContent.trim();
                             console.log('[Iframe-Parser] Keywords text (zh-CN):', keywordsText);
                             // Directly check if the Keywords text is an exact match for a manualMapping key
                             if (manualMapping.hasOwnProperty(keywordsText)) {
                                  specificSourceLabel = keywordsText;
                                   console.log('[Iframe-Parser] Found exact manual mapping key in Keywords (setting specificSourceLabel):', specificSourceLabel);
                             } else {
                                  // If not an exact manual mapping key, check for matching keywords from the list
                                   const matchingKeyword = findMatchingKeyword_zh_CN(keywordsText);
                                   if (matchingKeyword) {
                                        specificSourceLabel = matchingKeyword; // Override sourceLabel with the matched keyword
                                       console.log('[Iframe-Parser] Found matching keyword in Keywords (setting specificSourceLabel):', specificSourceLabel);
                                   }
                             }
                        }

                        // --- Check Comments (zh-CN) for an even more specific sourceLabel ---
                         if (!specificSourceLabel) { // Only check comments if no specific keyword found in Keywords
                             const commentContentElements = doc.querySelectorAll('.comments .comment .content p');
                             for (const commentElement of commentContentElements) {
                                  const commentText = commentElement.textContent.trim();
                                   console.log('[Iframe-Parser] Checking comment text (zh-CN) for keywords:', commentText);
                                  // Directly check if the Comment text is an exact match for a manualMapping key
                                   if (manualMapping.hasOwnProperty(commentText)) {
                                        specificSourceLabel = commentText;
                                         console.log('[Iframe-Parser] Found exact manual mapping key in Comment (setting specificSourceLabel):', specificSourceLabel);
                                        break; // Stop checking comments after the first match
                                   } else {
                                        // If not an exact manual mapping key, check for matching keywords from the list
                                        const matchingKeyword = findMatchingKeyword_zh_CN(commentText);
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
                        // Regex to capture location information before "(中国)"
                        const locationMatch = basicInfoText.match(/(.+?)\s*\(中国\)/);

                        if (locationMatch && locationMatch[1]) {
                            const locationInfo = locationMatch[1].trim();
                            console.log('[Iframe-Parser] Extracted location info before (中国):', locationInfo);

                            // Attempt to split into province and city based on common patterns
                            // This regex looks for a potential province name followed by a city name
                            const provinceCitySplitMatch = locationInfo.match(/^(.+?[省自治区])?(.+?市)/);

                            if (provinceCitySplitMatch) {
                                result.province = provinceCitySplitMatch[1] ? provinceCitySplitMatch[1].trim() : '';
                                result.city = provinceCitySplitMatch[2] ? provinceCitySplitMatch[2].trim() : '';
                                console.log('[Iframe-Parser] Split into Province:', result.province, ', City:', result.city);
                            } else {
                                // If the split regex doesn't match, assume the whole locationInfo is the city
                                 result.city = locationInfo;
                                 result.province = ''; // Set province to empty
                                 console.log('[Iframe-Parser] Treated as City only:', result.city);
                            }

                        } else {
                             console.log('[Iframe-Parser] Could not extract location info before (中国).');
                        }
                    } else {
                         console.log('[Iframe-Parser] Basic info element not found.');
                    }


                        // --- Set success to true if we found at least a count or a sourceLabel ---
                        if (result.count > 0 || result.sourceLabel) {
                            result.success = true;
                        }

                        // --- Determine Action based on combined logic ---
                        let action = 'none';

                        // 1. Prioritize action based on Keywords (existing logic)
                        if (result.sourceLabel) {
                            const blockKeywords = ['推销', '推广', '广告', '广', '违规', '诈', '反动', '营销', '商业电话', '贷款', '欺诈', '敲诈', '起诉', '老赖', '卖', '借钱', '上当'];
                            const allowKeywords = ['外卖', '快递', '美团', '出租', '滴滴', '优步', '网约车', '送货'];

                            for (const keyword of blockKeywords) {
                                if (result.sourceLabel.includes(keyword)) {
                                    action = 'block';
                                    break;
                                }
                            }
                            if (action === 'none') { // Only check allow if not already blocked
                                for (const keyword of allowKeywords) {
                                    if (result.sourceLabel.includes(keyword)) {
                                        action = 'allow';
                                        break;
                                    }
                                }
                            }
                        }

                        // 2. If no action determined by keywords, check Summary Label
                        if (action === 'none' && initialSourceLabel) {
                             if (initialSourceLabel === '可疑' || initialSourceLabel === '危险') {
                                 action = 'block';
                             } else if (initialSourceLabel === '安全') {
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

            iframe.onload = function () {
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

            iframe.onerror = function () {
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
            const match = e164Number.match(/^\+(\d{1,3})/);
            if (match && match[1]) {
                const extractedCountryCodeDigits = match[1];
                console.log('[Slickly Plugin] Extracted country code digits from e164Number:', extractedCountryCodeDigits);

                // Map the country code digits to a Slick.ly country identifier (e.g., 86 -> cn)
                const countryCodeMap = {
                    '86': 'cn', // China
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
    window.addEventListener('message', function (event) {
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