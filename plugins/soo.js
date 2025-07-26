// soo.js - Refactored to match bd.js structure
(function() {
  // --- Plugin Configuration ---
  const PLUGIN_CONFIG = {
      id: 'sooPhoneNumberPlugin', // Changed ID to be unique for soo.js
      name: 'Soo', // Changed name to Soo
      version: '5.5.0', // Adjusted version to match bd.js structure versioning
      description: 'Queries soo.com for phone number information using an iframe proxy.', // Updated description
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
    '骚扰电话': 'Fraud Scam Likely', // 对应预设标签 "Fraud Scam Likely"
    '非应邀商业电话': 'Spam Likely', // 对应预设标签 "Spam Likely"
    '保险推销': 'Insurance',
    '贷款理财': 'Loan', // Or 'Financial'
    '房产中介': 'Agent', // Or 'Spam Likely'
    '猎头招聘': 'Headhunter', // Or 'Spam Likely'
    '广告营销': 'Telemarketing',
    '客服热线': 'Customer Service',
    '淫秽色情': 'Risk', // Or 'Spam Likely', 'Risk'
    '发票办证': 'Fraud Scam Likely', // Or 'Spam Likely'
    '反动谣言': 'Risk', // Or 'Spam Likely', 'Risk', 'Political'
    '教育培训': 'Education',
    '违规催收': 'Debt Collection',
    '医疗卫生': 'Medical',
    '股票证券': 'Financial',
    '旅游推广': 'Telemarketing', // Or 'Spam Likely'
    '食药推销': 'Telemarketing', // Or 'Spam Likely', potentially 'Medical' for some cases
    '其他': 'Other',
    '涉诈电话': 'Fraud Scam Likely',
    '送餐外卖': 'Takeaway',
    '快递物流': 'Delivery',
    '网约车': 'Ridesharing',
    '滴滴/优步': 'Ridesharing',
    '出租车': 'Ridesharing',
    '美团': 'Takeaway',
    '饿了么': 'Takeaway',
    '广告推销': 'Telemarketing',  
    '金融': 'Financial',  
    '广告': 'Spam Likely', // 对应预设标签 "Spam Likely"
    '骚扰': 'Spam Likely', // 对应预设标签 "Spam Likely"  
    '诈骗': 'Fraud Scam Likely', // 对应预设标签 "Spam Likely"  
    '违法': 'Risk', // 对应预设标签 "Spam Likely" 
    '推销': 'Telemarketing',
    '中介': 'Agent',
    '保险理财': 'Financial',
    '保险': 'Insurance',
    '招聘猎头': 'Headhunter', // Or 'Spam Likely'
    '招聘': 'Recruiter', // Or 'Spam Likely'
    '猎头': 'Headhunter', // Or 'Spam Likely'
    '快递': 'Delivery', // 对应预设标签 "Spam Likely" 
    '外卖': 'Takeaway', // 对应预设标签 "Spam Likely" 
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

  /**
   * 【V5.5.0 逻辑升级】 Implements intelligent name selection based on data-tools and element text content.
   */
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
                const jsonObject = {
                  count: 0,
                  sourceLabel: "",
                  province: "",
                  city: "",
                  carrier: "",
                  phoneNumber: PHONE_NUMBER,
                  name: "unknown"
                };

                try {
                  console.log('[Iframe-Parser] Document Object:', doc);

                  const bodyElement = doc.body;
                  console.log('[Iframe-Parser] Body Element:', bodyElement);
                  if (!bodyElement) {
                    console.error('[Iframe-Parser] Error: Could not find body element.');
                    return jsonObject;
                  }

                  // Extract data from the page content (adapt selectors based on soo.com structure)
                  // This part needs to be adapted to parse soo.com's HTML structure
                  // For now, keeping the structure from the original soo.js extractDataFromDOM
                  // as a placeholder. You will need to inspect soo.com's page structure
                  // and update the selectors accordingly.

                  // 尝试提取结构一的标记次数和标签
                  const countElement = doc.querySelector('.mohe-tips-zp b');
                  console.log('[Iframe-Parser] countElement:', countElement);
                  const sourceLabelElement = doc.querySelector('.mohe-tips-zp');
                  console.log('[Iframe-Parser] sourceLabelElement:', sourceLabelElement);

                  if (countElement && sourceLabelElement) {
                      const countText = countElement.textContent.trim();
                      console.log('[Iframe-Parser] countText:', countText);
                      jsonObject.count = parseInt(countText, 10) || 0;
                      console.log('[Iframe-Parser] jsonObject.count:', jsonObject.count);

                      let sourceLabelText = sourceLabelElement.textContent.trim();
                      sourceLabelText = sourceLabelText.replace(/此号码近期被|d+位|360手机卫士|用户标记，疑似为|！/g, '').replace(/，/g, '').trim();
                      jsonObject.sourceLabel = sourceLabelText;
                      console.log('[Iframe-Parser] jsonObject.sourceLabel:', jsonObject.sourceLabel);
                  } else {
                      // 尝试提取结构二的标记次数和标签
                      const countElement2 = doc.querySelector('.mh-tel-desc b');
                      console.log('[Iframe-Parser] countElement2:', countElement2);
                      const sourceLabelElement2 = doc.querySelector('.mh-tel-mark'); //尝试根据新的结构进行选择
                      console.log('[Iframe-Parser] sourceLabelElement2:', sourceLabelElement2);

                      if (countElement2) {
                          const countText = countElement2.textContent.trim();
                          console.log('[Iframe-Parser] countText:', countText);
                          jsonObject.count = parseInt(countText, 10) || 0;
                          console.log('[Iframe-Parser] jsonObject.count:', jsonObject.count);
                      }

                      if (sourceLabelElement2) {
                          let sourceLabelText = sourceLabelElement2.textContent.trim();
                          jsonObject.sourceLabel = sourceLabelText;
                          console.log('[Iframe-Parser] jsonObject.sourceLabel:', jsonObject.sourceLabel);
                      }
                  }

                  // 尝试提取结构一的号码、省份、城市、运营商
                  const detailElement = doc.querySelector('.mh-detail');
                  console.log('[Iframe-Parser] detailElement:', detailElement);
                  if (detailElement) {
                    const spans = detailElement.querySelectorAll('span');
                    console.log('[Iframe-Parser] spans:', spans);
                    if (spans.length >= 2) {
                      jsonObject.phoneNumber = spans[0].textContent.trim();
                      const locationCarrierText = spans[1].textContent.trim();
                      const match = locationCarrierText.match(/([一-龥]+)[s ]*([一-龥]+)?[s ]*([一-龥]+)?/);
                      if (match) {
                        jsonObject.province = match[1] || '';
                        jsonObject.city = match[2] || '';
                        jsonObject.carrier = match[3] || '';
                      }
                    }
                  } else {
                    // 尝试提取结构二的号码、省份、城市、运营商
                    const phoneNumberElement = doc.querySelector('.mh-tel-num span');
                    console.log('[Iframe-Parser] phoneNumberElement:', phoneNumberElement);
                    const locationElement = doc.querySelector('.mh-tel-adr p');
                    console.log('[Iframe-Parser] locationElement:', locationElement);

                    if (phoneNumberElement) {
                      jsonObject.phoneNumber = phoneNumberElement.textContent.trim();
                      console.log('[Iframe-Parser] jsonObject.phoneNumber:', jsonObject.phoneNumber);
                    }

                    if (locationElement) {
                      const locationText = locationElement.textContent.trim();
                      console.log('[Iframe-Parser] locationText:', locationText);
                      const match = locationText.match(/([一-龥]+)[s ]*([一-龥]+)?[s ]*([一-龥]+)?/);
                      if (match) {
                        jsonObject.province = match[1] || '';
                        jsonObject.city = match[2] || '';
                        jsonObject.carrier = match[3] || '';
                      }
                      console.log('[Iframe-Parser] jsonObject.province:', jsonObject.province);
                      console.log('[Iframe-Parser] jsonObject.city:', jsonObject.city);
                      console.log('[Iframe-Parser] jsonObject.carrier:', jsonObject.carrier);
                    }
                  }

                  // --- Map sourceLabel to predefinedLabel ---
                  jsonObject.predefinedLabel = manualMapping[jsonObject.sourceLabel] || 'Unknown';

                  // Determine success based on whether a label or count was found
                  jsonObject.success = jsonObject.sourceLabel !== "" || jsonObject.count > 0;

                  console.log('[Iframe-Parser] Final jsonObject:', jsonObject);
                  return jsonObject;

                } catch (e) {
                  console.error('[Iframe-Parser] Error extracting data:', e);
                  jsonObject.error = e.toString();
                  jsonObject.success = false;
                  return jsonObject;
                }
              }

              // Use MutationObserver to wait for relevant content
              const observer = new MutationObserver((mutations, obs) => {
                  const result = parseContent(document);
                  if (result && result.success) {
                      sendResult(result);
                      obs.disconnect(); // Stop observing once content is found and parsed
                  } else {
                      // Additional checks or fallback if initial parse fails
                       const pageTitle = document.title;
                      if (pageTitle.includes('电话号码查询') || pageTitle.includes('Error')) { // Assuming the title indicates results
                          console.log('[Iframe-Parser] Search results or error page detected, attempting final parse.');
                           const finalAttemptResult = parseContent(document);
                           sendResult(finalAttemptResult);
                           obs.disconnect();
                      }
                   }
              });

              console.log('[Iframe-Parser] Starting observation for DOM changes...');
              observer.observe(document.body, { childList: true, subtree: true });

              // Fallback timeout in case observer fails or content takes too long
              setTimeout(() => {
                  if (!parsingCompleted) {
                      console.log('[Iframe-Parser] Timeout reached, performing final parse attempt.');
                      const finalAttemptResult = parseContent(document);
                      sendResult(finalAttemptResult);
                  }
              }, 10000); // 10 second timeout
          })();
      `;
  }

  function initiateQuery(phoneNumber, requestId) {
      log(`Initiating query for '${phoneNumber}' (requestId: ${requestId})`);
      try {
          const targetSearchUrl = `https://www.so.com/s?q=${encodeURIComponent(phoneNumber)}`; // Updated URL for soo.com
          const headers = { 'User-Agent': 'Mozilla/5.0 (Linux; arm_64; Android 14; SM-S711B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.199 YaBrowser/24.12.4.199.00 SA/3 Mobile Safari/537.36' };
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
          }, 30000); // 30 seconds timeout for the entire iframe process
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