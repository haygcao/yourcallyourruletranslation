// odebractelefon.js - Refactored to match bd.js structure
(function() {
  // --- Plugin Configuration ---
  const PLUGIN_CONFIG = {
      id: 'odebractelefonPlugin',
      name: 'Odebrac Telefon',
      version: '1.2.0',
      description: 'Queries odebractelefon.pl for phone number information using an iframe proxy.',
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
      'NEGATYWNA TELEMARKETER': 'Telemarketing', // Maps "NEGATYWNA TELEMARKETER" to "Telemarketing"
      'Telemarketer': 'Telemarketing',          // 1: 电销员 -> Telemarketing
      'Call center': 'Customer Service',        // 6: 呼叫中心 -> 考虑为客户服务的一种形式，映射到 Customer Service
      'Ćicha rozmowa / dzwonka': 'Spam Likely', // 3: 静默电话/响一声 -> Spam Likely
      'Złośiwe połączenie': 'Spam Likely',     // 4: 恶意电话 -> Spam Likely
      'Niechciany telefon': 'Spam Likely',     // 5: 不需要的电话 -> Spam Likely
      'Usługi finansowe': 'Financial',         // 15: 金融服务 -> Financial
      'Ściąganie długów': 'Debt Collection',         // 2: 债务催收 -> Collection
      'Organizacja non-profit': 'Charity',      // 8: 非营利组织 -> Charity
      'Polityka': 'Political',                  // 9: 政治 -> Political
      'Oszustwo': 'Fraud Scam Likely',         // 10: 欺诈 -> Fraud Scam Likely
      'Dowcip': 'Spam Likely',                 // 11: 恶作剧 -> Spam Likely (虽然风险低，但归为垃圾电话)
      'Fax': 'Other',                           // 7: 传真 -> Other (现代通信中传真较少见，归为其他)
      'SMS': 'Other',                           // 12: 短信 -> Other (虽然也可能是垃圾短信，但在此上下文中，我们将其归类为 Other)
      'Ankieta': 'Survey',                      // 13: 调查 -> Survey
      'Firma': 'Unknown',                       // 16: 公司 -> 含义较广，无法准确分类, 归类为 Unknown
      'Usługa': 'Unknown',                      // 17: 服务 -> 含义较广，无法准确分类, 归类为 Unknown
      'Inne': 'Other',                          // 14: 其他 -> Other
      'Automat': 'Robocall',                    // 18: 自动语音 -> Robocall
      'Unknown': 'Unknown', // Maps unknown labels to "Unknown"
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

                  // Extract phone number and label
                  const numberElement = doc.querySelector('.number');
                  console.log('[Iframe-Parser] numberElement:', numberElement);
                  if (numberElement) {
                    // Extract phone number
                    jsonObject.phoneNumber = numberElement.childNodes[0].nodeValue.trim();

                    // Extract label - targeting the correct span
                    const labelSpan = numberElement.querySelector('span:first-of-type'); // Selects the first span which contains the label
                    if (labelSpan) {
                      jsonObject.sourceLabel = labelSpan.textContent.trim();
                    }

                    // Extract city and province - targeting the third span
                    const locationSpan = numberElement.querySelector('span:nth-of-type(3)');
                    if (locationSpan) {
                        jsonObject.city = locationSpan.textContent.trim();
                        jsonObject.province = jsonObject.city; // Assuming city is also the province for this source structure
                    }

                    console.log('[Iframe-Parser] jsonObject.sourceLabel:', jsonObject.sourceLabel);
                    console.log('[Iframe-Parser] jsonObject.phoneNumber:', jsonObject.phoneNumber);
                    console.log('[Iframe-Parser] jsonObject.city:', jsonObject.city);
                  }

                  // Extract count
                  // Primary method: Extract count
                  const countElement = doc.querySelector('.ratings li.active');
                  console.log('[Iframe-Parser] countElement:', countElement);

                  if (countElement) {
                    const countText = countElement.textContent.trim().replace('x negatywna', '');
                    jsonObject.count = parseInt(countText, 10) || 0;
                    console.log('[Iframe-Parser] jsonObject.count (primary):', jsonObject.count);
                  } else {
                    // Secondary method: Extract count if primary is missing
                    const advancedCountElement = doc.querySelector('.advanced strong:nth-of-type(2)');
                    console.log('[Iframe-Parser] advancedCountElement:', advancedCountElement);
                    if (advancedCountElement) {
                      jsonObject.count = parseInt(advancedCountElement.textContent, 10) || 0;
                      console.log('[Iframe-Parser] jsonObject.count (secondary):', jsonObject.count);
                    }
                  }

                  // --- Map sourceLabel to predefinedLabel ---
                  jsonObject.predefinedLabel = manualMapping[jsonObject.sourceLabel] || 'Unknown';

                  jsonObject.success = true;
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
                      if (pageTitle.includes('Numer telefonu') || pageTitle.includes('Błąd')) {
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
          const targetSearchUrl = `https://www.odebractelefon.pl/numer-telefonu/${encodeURIComponent(phoneNumber)}`;
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