// tellows.js - Refactored to match bd.js structure
(function() {
  // --- Plugin Configuration ---
  const PLUGIN_CONFIG = {
      id: 'tellowsPlugin', // Plugin ID, must be unique
      name: 'Tellows', // Plugin name
      version: '5.5.0', // Adjusted version to match bd.js structure versioning
      description: 'Queries tellows.com for phone number information using an iframe proxy.', // Updated description
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

  // Manual mapping table to map source labels to predefined labels (updated based on tellows.com labels)
  const manualMapping = {
      'Unknown': 'Unknown',
      'Trustworthy number': 'Other', //  Could be mapped to something more specific if you have a "safe" category.
      'Sweepstakes, lottery': 'Spam Likely', //  Or 'Fraud Scam Likely', depending on context
      'Debt collection company': 'Debt Collection',
      'Aggressive advertising': 'Telemarketing', // Or 'Spam Likely'
      'Survey': 'Survey',
      'Harassment calls': 'Spam Likely',  // Or 'Fraud Scam Likely', if threats are involved
      'Cost trap': 'Fraud Scam Likely',
      'Telemarketer': 'Telemarketing',
      'Ping Call': 'Spam Likely', // Often associated with scams
      'SMS spam': 'Spam Likely',
      'Spam Call': 'Spam Likely', // Added, map label extracted "spam call" to predefined "Spam Likely"
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
                      name: "unknown",
                      rate: 0
                  };

                  try {
                      console.log('[Iframe-Parser] Document Object:', doc);

                      const bodyElement = doc.body;
                      console.log('[Iframe-Parser] Body Element:', bodyElement);
                      if (!bodyElement) {
                          console.error('[Iframe-Parser] Error: Could not find body element.');
                          return jsonObject;
                      }

                      // --- Helper Function to find element by text ---
                      function findElementByText(selector, text) {
                          const elements = doc.querySelectorAll(selector);
                          for (const element of elements) {
                              if (element.textContent.includes(text)) {
                                  return element;
                              }
                          }
                          return null;
                      }

                      // 1. Extract Label (Priority 1: Types of call)
                      const typesOfCallElement = findElementByText('b', "Types of call:"); // Find <b> containing the text
                      if (typesOfCallElement) {
                          const nextSibling = typesOfCallElement.nextSibling;
                          if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
                              let labelText = nextSibling.textContent.trim();
                              if (labelText) {
                                  jsonObject.sourceLabel = labelText;
                              }
                          }
                      }

                      // 2. Extract Label (Priority 2: Score Image) - Only if sourceLabel is empty
                      if (!jsonObject.sourceLabel) {
                          const scoreImage = doc.querySelector('a[href*="tellows_score"] img.scoreimage');
                          if (scoreImage) {
                              const altText = scoreImage.alt;
                              const scoreMatch = altText.match(/Scores([789])/); //checks for 7, 8, or 9
                              if (scoreMatch) {
                                  jsonObject.sourceLabel = "Spam Call";
                              }
                          }
                      }

                      // 3. Extract Name (Caller ID)
                      const callerIdElement = doc.querySelector('span.callerId');
                      if (callerIdElement) {
                          jsonObject.name = callerIdElement.textContent.trim();
                      }

                      // 4. Extract Rate and Count (using Ratings)
                      const ratingsElement = findElementByText('strong', "Ratings:"); // More robust way to locate

                      if (ratingsElement) {
                        const spanElement = ratingsElement.querySelector('span');
                        if (spanElement) {
                          const rateValue = parseInt(spanElement.textContent.trim(), 10) || 0;
                          jsonObject.rate = rateValue;
                          jsonObject.count = rateValue;
                        }
                      }

                      // 5. Extract City and Province
                      const cityElement = findElementByText('strong', "City:");
                      if (cityElement) {
                          let nextSibling = cityElement.nextSibling;
                          while (nextSibling) {
                              if (nextSibling.nodeType === Node.TEXT_NODE) {
                                  let cityText = nextSibling.textContent.trim();
                                  // Split by " - " to get "City" and "Country" parts
                                  const parts = cityText.split('-');
                                  if (parts.length > 0) {
                                      jsonObject.city = parts[0].trim(); // The FIRST part is the city
                                      // If there's a second part (countries), handle it
                                      if (parts.length > 1) {
                                          const countries = parts[1].trim().split(',').map(c => c.trim());
                                          jsonObject.province = countries.join(", "); // Join with ", " for multiple countries
                                      }
                                  }
                                  break; // Exit the loop once we've found the city text.
                              }
                              nextSibling = nextSibling.nextSibling;
                          }
                      }

                      // --- Map sourceLabel to predefinedLabel ---
                      let matchedLabel = predefinedLabels.find(label => label.label === jsonObject.sourceLabel)?.label;

                      if (!matchedLabel) {
                        matchedLabel = manualMapping[jsonObject.sourceLabel];
                      }

                      if (!matchedLabel) {
                        matchedLabel = 'Unknown';
                      }
                      jsonObject.predefinedLabel = matchedLabel;

                      // Determine success based on whether a label or count was found
                      jsonObject.success = jsonObject.sourceLabel !== "" || jsonObject.count > 0 || jsonObject.name !== "unknown";

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
                      if (pageTitle.includes('Tellows') || pageTitle.includes('Error')) { // Assuming the title indicates results
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
          const targetSearchUrl = `https://www.tellows.com/num/${encodeURIComponent(phoneNumber)}`; // Updated URL
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