// shouldianswer.js - Refactored to match bd.js structure
(function() {
  // --- Plugin Configuration ---
  const PLUGIN_CONFIG = {
      id: 'shouldianswerPlugin',
      name: 'Should I Answer',
      version: '1.2.0',
      description: 'Queries shouldianswer.com for phone number information using an iframe proxy.',
  };

  const predefinedLabels = [
      {'label': 'Fraud Scam Likely'},
      {'label': 'Spam Likely'},
      {'label': 'Telemarketing'},
      {'label': 'Robocall'},
      {'label': 'Delivery'},
      {'label': 'Takeaway'},
      {'label': 'Ridesharing'},
      {'label': 'Insurance'},
      {'label': 'Loan'},
      {'label': 'Customer Service'},
      {'label': 'Unknown'},
      {'label': 'Financial'},
      {'label': 'Bank'},
      {'label': 'Education'},
      {'label': 'Medical'},
      {'label': 'Charity'},
      {'label': 'Other'},
      {'label': 'Debt Collection'},
      {'label': 'Survey'},
      {'label': 'Political'},
      {'label': 'Ecommerce'},
      {'label': 'Risk'},
      {'label': 'Silent call(Voice Clone?)译'},
  ];

  const manualMapping = {
      'Telemarketer': 'Telemarketing',
      'Call centre': 'Customer Service', // Or 'Telemarketing' if more appropriate - you can decide based on context
      'Financial services': 'Financial',
      'Debt collector': 'Debt Collection',
      'Company': 'Other', // This could be 'Customer Service' if referring to legitimate company calls
      'Service': 'Customer Service', // Or 'Other' depending on context
      'Non-profit Organization': 'Charity',
      'Survey': 'Survey',
      'Nuisance call': 'Spam Likely',
      'Unsolicited call': 'Spam Likely',
      'Political call': 'Political',
      'Scam call': 'Fraud Scam Likely',
      'Prank call': 'Spam Likely', // Or 'Other'
      'Other': 'Other',
      'NEGATIVE TELEMARKETER': 'Telemarketing', // From previous examples
      'Unknown': 'Unknown',
      'TELEMARKETER': 'Telemarketing',
      'CALL CENTRE': 'Customer Service', // Or 'Telemarketing' if more appropriate
      'FINANCIAL SERVICES': 'Financial',
      'DEBT COLLECTOR': 'Debt Collection',
      'COMPANY': 'Other', // This could be 'Customer Service' if referring to legitimate company calls
      'SERVICE': 'Customer Service', // Or 'Other' depending on context
      'NON-PROFIT ORGANIZATION': 'Charity',
      'SURVEY': 'Survey',
      'NUISANCE CALL': 'Spam Likely',
      'UNSOLICITED CALL': 'Spam Likely',
      'POLITICAL CALL': 'Political',
      'SCAM CALL': 'Fraud Scam Likely',
      'PRANK CALL': 'Spam Likely', // Or 'Other'
      'OTHER': 'Other',
      'NEGATIVE TELEMARKETER': 'Telemarketing', 
      'UNKNOWN': 'Unknown',
      'SILENT CALL': 'Silent call(Voice Clone?)',
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
                    jsonObject.phoneNumber = numberElement.firstChild.nodeValue.trim();

                    // Extract label - targeting the correct span and removing prefixes
                    const labelSpan = numberElement.querySelector('span[style="color:#000"]');
                    if (labelSpan) {
                      const rawLabel = labelSpan.textContent.trim();
                      jsonObject.sourceLabel = rawLabel.replace(/^(POSITIVE|NEGATIVE|NEUTRAL)s*/i, '').trim();
                    }


                    // Extract city and province - targeting the last span
                    const locationSpan = numberElement.querySelector('span:last-of-type');
                    if (locationSpan) {
                      const locationParts = locationSpan.textContent.trim().split(',');
                      jsonObject.city = locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : "";
                      jsonObject.province = ""; // No province information available
                    }

                    console.log('[Iframe-Parser] jsonObject.sourceLabel:', jsonObject.sourceLabel);
                    console.log('[Iframe-Parser] jsonObject.phoneNumber:', jsonObject.phoneNumber);
                    console.log('[Iframe-Parser] jsonObject.city:', jsonObject.city);
                  }

                  // Extract count
                  const infoxElement = doc.querySelector('.infox');
                  console.log('[Iframe-Parser] infoxElement:', infoxElement);
                  if (infoxElement) {
                    const infoxText = infoxElement.textContent;

                    // Check for "Single user" case
                    if (infoxText.includes('Single user rated it as')) {
                      jsonObject.count = 1;
                    } else {
                      // Find all strong elements within infox
                      const strongElements = infoxElement.querySelectorAll('strong');
                      if (strongElements.length >= 2) {
                        // Extract count from the second strong element
                        const countText = strongElements[1].textContent.trim();
                        jsonObject.count = parseInt(countText, 10) || 0;
                      }
                    }
                    console.log('[Iframe-Parser] jsonObject.count:', jsonObject.count);
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
                      if (pageTitle.includes('Phone number:') || pageTitle.includes('Error')) {
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
          const targetSearchUrl = `https://www.shouldianswer.com/phone-number/${encodeURIComponent(phoneNumber)}`;
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