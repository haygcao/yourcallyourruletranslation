// listaspam.js - Refactored to match bd.js structure
(function() {
  // --- Plugin Configuration ---
  const PLUGIN_CONFIG = {
      id: 'listaspamPlugin', // Plugin ID, must be unique
      name: 'ListaspamES', // Plugin name
      version: '5.5.0', // Adjusted version to match bd.js structure versioning
      description: 'Queries listaspam.com for phone number information using an iframe proxy.', // Updated description
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
    'Suplantación de identidad': 'Fraud Scam Likely',
    'Presunta estafa': 'Fraud Scam Likely',
    'Presuntas amenazas': 'Fraud Scam Likely',
    'Cobro de deudas': 'Debt Collection',
    'Telemarketing': 'Telemarketing',
    'Llamada de broma': 'Spam Likely',
    'Mensaje SMS': 'Spam Likely',
    'Encuesta': 'Survey',
    'Recordatorio automático': 'Robocall',
    'Llamada perdida': 'Spam Likely',
    'Sin especificar': 'Unknown',
    'Unknown' : 'Unknown',
    'Spam Call' : 'Spam Likely',
    'Beratung': 'Other',
    'Crypto Betrug': 'Fraud Scam Likely',
    'Daueranrufe': 'Spam Likely',
    'Dienstleistung': 'Customer Service',
    'Gastronomie': 'Other',
    'Geschäft': 'Other',
    'Gesundheit': 'Medical',
    'Gewinnspiel': 'Other',
    'Inkassounternehmen': 'Debt Collection',
    'Kostenfalle': 'Fraud Scam Likely',
    'Kundendienst': 'Customer Service',
    'Mailbox': 'Other',
    'Phishing': 'Fraud Scam Likely',
    'Ping Anruf': 'Spam Likely',
    'Spam': 'Spam Likely',
    'Spenden': 'Charity',
    'Support': 'Customer Service',
    'Umfrage': 'Survey',
    'Unseriös': 'Spam Likely',
    'Verkauf': 'Telemarketing',
    'Werbung': 'Telemarketing',
    'Unknown': 'Unknown',
    'Business': 'Other',
    'Charity': 'Charity',
    'Commercial': 'Telemarketing',
    'Continuous calls': 'Spam Likely',
    'Cost trap': 'Fraud Scam Likely',
    'Counsel': 'Other',
    'Crypto fraud': 'Fraud Scam Likely',
    'Customer Service': 'Customer Service',
    'Debt collection agency': 'Debt Collection',
    'Dubious': 'Spam Likely',
    'Health': 'Medical',
    'Hospitality industry': 'Other',
    'Mailbox': 'Other',
    'Phishing': 'Fraud Scam Likely',
    'Ping call': 'Spam Likely',
    'Sales': 'Telemarketing',
    'Service': 'Customer Service',
    'Spam': 'Spam Likely',
    'Support': 'Customer Service',
    'Survey': 'Survey',
    'Sweepstake': 'Other',
    'Unknown': 'Unknown',
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

                  // --- Priority 1: Label and Count from within the <section> ---
                  const numberDataSection = doc.querySelector('section.number_data_box');
                  if (numberDataSection) { // Check if the section exists
                      const labelParagraph = numberDataSection.querySelector('p[style*="margin-bottom:0"]');

                      if(labelParagraph) {
                          const paragraphText = labelParagraph.textContent;

                           const labelOrder = [
                              'Suplantación de identidad',
                              'Presunta estafa',
                              'Presuntas amenazas',
                              'Cobro de deudas',
                              'Telemarketing',
                              'Llamada de broma',
                              'Mensaje SMS',
                              'Encuesta',
                              'Recordatorio automático',
                              'Llamada perdida',
                              'Sin especificar',
                            ];

                            for (const labelText of labelOrder) {
                                                        // 【这是最终修正的、健壮的正则表达式】
                            // 1. 使用 \\s* 替代了错误的 s*
                            // 2. 补上了必须的 \\( 和 \\) 来匹配括号
                            // 3. 在 <strong> 标签内部增加了 \\s* 来兼容 "<strong> spam </strong>" 这种有空格的情况
                            const regex = new RegExp(\`<strong>\\s*${labelText}\\s*</strong>\\s*\\((\\d+)\\s*veces\\)\`);

                              const match = paragraphText.match(regex);
                              if (match) {
                                jsonObject.sourceLabel = labelText;
                                jsonObject.count = parseInt(match[1], 10) || 0;
                                break; // Important: Stop after the first match
                              }
                            }
                      }
                  }


                  // --- Priority 2: Label and Count from other elements (if Priority 1 fails) ---
                  if (!jsonObject.sourceLabel) {
                    const ratingDiv = doc.querySelector('.rate-and-owner > div[class^="phone_rating"]');
                    if (ratingDiv) {
                      if (ratingDiv.classList.contains('result-2') || ratingDiv.classList.contains('result-1')) {
                          jsonObject.sourceLabel = "Spam Call";
                      } else if (ratingDiv.classList.contains('result-3')) {
                          jsonObject.sourceLabel = "Unknown";
                      } else if (ratingDiv.classList.contains('result-4') || ratingDiv.classList.contains('result-5')) {
                          jsonObject.sourceLabel = "Other";
                      }

                      const countSpan = doc.querySelector('.n_reports .result a');
                      if (countSpan) {
                        jsonObject.count = parseInt(countSpan.textContent, 10) || 0;
                      }
                    }
                  }

                  // --- Extract City ---
                  const citySpan = doc.querySelector('.data_location span');
                  if (citySpan) {
                    jsonObject.city = citySpan.textContent.split('-')[0].trim();
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
                      if (pageTitle.includes('Listaspam') || pageTitle.includes('Error')) { // Assuming the title indicates results or error
                          console.log('[Iframe-Parser] Search results or error page detected, attempting final parse.');
                           const finalAttemptResult = parseContent(document);
                           sendResult(finalAttemptResult);
                           obs.disconnect();
                      }
                   }
              });

              console.log('[Iframe-Parser] Starting observation for DOM changes...');
              // Observe changes in the body, including descendants
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
          const targetSearchUrl = `https://www.listaspam.com/busca.php?Telefono=${encodeURIComponent(phoneNumber)}`; // Updated URL
          const headers = { "User-Agent": 'Mozilla/5.0 (Linux; arm_64; Android 14; SM-S711B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.199 YaBrowser/24.12.4.199.00 SA/3 Mobile Safari/537.36' };
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