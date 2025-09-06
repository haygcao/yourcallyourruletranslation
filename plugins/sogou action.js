(function() {
    // --- Plugin Configuration ---
    const PLUGIN_CONFIG = {
        id: 'sogouPhoneNumberPlugin',
        name: 'Sogou Phone Lookup (iframe Proxy)',
        version: '1.0.0', 
        description: 'Queries Sogou for phone number information using an iframe proxy. Extracts source label.'
    };
  
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
  
    const manualMapping = {
        '中介': 'Agent', '房产中介': 'Agent', '违规催收': 'Debt Collection', '快递物流': 'Delivery','快递送餐': 'Delivery',
        '快递': 'Delivery', '教育培训': 'Education', '金融': 'Financial', '股票证券': 'Financial',
        '保险理财': 'Financial', '涉诈电话': 'Fraud Scam Likely', '诈骗': 'Fraud Scam Likely',
        '招聘': 'Recruiter', '猎头': 'Headhunter', '猎头招聘': 'Headhunter', '招聘猎头': 'Headhunter',
        '保险': 'Insurance', '保险推销': 'Insurance', '贷款理财': 'Loan', '医疗卫生': 'Medical',
        '其他': 'Other', '送餐外卖': 'Takeaway', '美团': 'Takeaway', '饿了么': 'Takeaway',
        '外卖': 'Takeaway', '滴滴/优步': 'Ridesharing', '出租车': 'Ridesharing', '网约车': 'Ridesharing',
        '违法': 'Risk', '淫秽色情': 'Risk', '反动谣言': 'Risk', '发票办证': 'Risk',
        '客服热线': 'Customer Service', '非应邀商业电话': 'Spam Likely', '广告': 'Spam Likely',
        '骚扰': 'Spam Likely', '骚扰电话': 'Spam Likely', '商业营销': 'Telemarketing',
        '广告推销': 'Telemarketing', '旅游推广': 'Telemarketing', '食药推销': 'Telemarketing',
        '推销': 'Telemarketing',
    };
  
    // --- Constants, State, Logging, and Communication functions remain the same ---
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
  
    function getParsingScript(pluginId, phoneNumberToQuery) {
        return `
            (function() {
                const PLUGIN_ID = '${pluginId}';
                const PHONE_NUMBER = '${phoneNumberToQuery}';
                const manualMapping = ${JSON.stringify(manualMapping)};
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
                        name: '', predefinedLabel: '', source: PLUGIN_ID, numbers: [], success: false, error: '', action: 'none'
                    };
  
                    try {
                        const vrwraps = doc.querySelectorAll('.vrwrap[id^="sogou_vr_undefined_"]');

                        if (!vrwraps || vrwraps.length === 0) {
                            console.log('[Iframe-Parser] Could not find any vrwrap containers.');
                            return null;
                        }

                        for (const vrwrap of vrwraps) {
                            const textLayout = vrwrap.querySelector('.text-layout > p:first-child');
                            if (textLayout) {
                                result.sourceLabel = textLayout.textContent.trim();
                                result.success = true;

                                // --- Action Mapping Based on sourceLabel ---
                                const blockKeywords = ['骚扰电话', '非应邀商业电话', '保险推销', '贷款理财',
                                    '广告营销', '淫秽色情', '发票办证', '反动谣言', '违规催收', '旅游推广',
                                    '食药推销', '涉诈电话', '广告推销', '广告', '骚扰', '诈骗', '违法',
                                    '推销', '推销', '推广', '广告', '广', '违规', '诈', '反动', '营销', '商业电话', '贷款'];
                                const allowKeywords = ['送餐外卖', '快递物流', '网约车', '滴滴/优步', '出租车',
                                    '美团', '饿了么', '快递', '外卖', '送餐', '美团', '出租', '滴滴', '优步'];

                                let action = 'none';
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
                                result.action = action;

                                return result; // Return after the first successful extraction
                            }
                        }

                        console.log('[Iframe-Parser] Could not find the specific text layout element.');
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
                        sendResult({ success: false, error: 'Could not parse content from the page.' });
                    }
                }
  
                console.log('[Iframe-Parser] Parsing script has started execution for phone: ' + PHONE_NUMBER);
                setTimeout(findAndParse, 300);
            })();
        `;
    }
    
    function initiateQuery(phoneNumber, requestId) {
        log(`Initiating query for '${phoneNumber}' (requestId: ${requestId})`);
        try {
            const targetSearchUrl = `https://sogou.com/web?query=${encodeURIComponent(phoneNumber)}`;
            const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' };
            const proxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
            log(`Iframe proxy URL: ${proxyUrl}`);
            const iframe = document.createElement('iframe');
            iframe.id = `query-iframe-${requestId}`;
            iframe.style.display = 'none';
            iframe.sandbox = 'allow-scripts allow-same-origin';
            activeIFrames.set(requestId, iframe);
            iframe.onload = function() {
                log(`Iframe loaded for requestId ${requestId}. Posting parsing script directly.`);
                try {
                    const parsingScript = getParsingScript(PLUGIN_CONFIG.id, phoneNumber);
                    iframe.contentWindow.postMessage({
                        type: 'executeScript',
                        script: parsingScript
                    }, '*');
                    log(`Parsing script posted to iframe for requestId: ${requestId}`);
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
                    sendPluginResult({ requestId, success: false, error: 'Query timed out after 30 seconds' });
                    cleanupIframe(requestId);
                }
            }, 30000);
        } catch (error) {
            logError(`Error in initiateQuery for requestId ${requestId}:`, error);
            sendPluginResult({ requestId, success: false, error: `Query initiation failed: ${error.message}` });
        }
    }
  
    function generateOutput(phoneNumber, nationalNumber, e164Number, requestId) {
        log(`generateOutput called for requestId: ${requestId}`);
        const numberToQuery = phoneNumber || nationalNumber || e164Number;
        if (numberToQuery) {
            initiateQuery(numberToQuery, requestId);
        } else {
            sendPluginResult({ requestId, success: false, error: 'No valid phone number provided.' });
        }
    }
  
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