// 【V5.5.0 Logic Upgrade】 Implements intelligent name selection based on data-tools and element text content.
// Doisjerepondre.fr Phone Query Plugin
(function() {
  // --- Plugin Configuration ---
  const PLUGIN_CONFIG = {
      id: 'doisjerepondrePlugin',
      name: 'Doisjerepondre.fr',
      version: '1.2.0', // Keep original version for now
      description: 'Retrieves information about phone numbers from doisjerepondre.fr.',
  };

  // Predefined label list (adjust based on needs)
  const predefinedLabels = [
    { 'label': 'Fraud Scam Likely' },    { 'label': 'Spam Likely' },
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

  // Manual mapping table (updated based on doisjerepondre.fr labels)
  const manualMapping = {
    'Télévendeur': 'Telemarketing',
    'Centre d\'appel': 'Customer Service', // Or 'Telemarketing' - context dependent
    'Services financiers': 'Financial',
    'Agent de recouvrement': 'Debt Collection',
    'Entreprise': 'Other',  // Could be 'Customer Service' if referring to a legitimate company
    'Service': 'Customer Service', // Or 'Other'
    'Organisation à but non lucratif': 'Charity',
    'Sondage': 'Survey',
    'Appel malveillant': 'Fraud Scam Likely', // More severe than just spam
    'Appel non sollicité': 'Spam Likely',
    'Appel politique': 'Political',
    'Appel d\'arnaque': 'Fraud Scam Likely',
    'Canular téléphonique': 'Spam Likely', // Or 'Other'
    'Autre': 'Other',
    'Inconnu': 'Unknown', // Added, in case you extract "Inconnu" from somewhere else
    'Unknown': 'Unknown',  // Always map 'Unknown' to itself
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
   * Parses the content of the Doisjerepondre.fr page.
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
                  console.log('[Iframe-Parser] Attempting to parse content in document with title:', doc.title);
                  const result = {
                      phoneNumber: PHONE_NUMBER, sourceLabel: '', count: 0, province: '', city: '', carrier: '',
                      name: '', predefinedLabel: '', source: PLUGIN_ID, numbers: [], success: false, error: ''
                  };

                  try {
                      // --- Extract phone number, label, and city ---
                      const numberElement = doc.querySelector('.number');
                      console.log('[Iframe-Parser] numberElement:', numberElement);
                      if (numberElement) {
                        // Extract phone number
                        result.phoneNumber = numberElement.firstChild.nodeValue.trim();

                        // Extract label - targeting the correct span and removing prefixes
                        const labelSpan = numberElement.querySelector('span[style="color:#000"]');
                        if (labelSpan) {
                          const rawLabel = labelSpan.textContent.trim();
                          const cleanedLabel = rawLabel.replace(/^(Négative|Neutre|Positive)s*/i, '').trim();
                          result.sourceLabel = cleanedLabel;      // Store raw (but cleaned) label
                          result.predefinedLabel = manualMapping[cleanedLabel] || 'Unknown';  // Map to predefined label
                          result.success = true; // Indicate success if we found the main number block
                        }

                        // Extract city - targeting the *last* span, handling multiple parts correctly
                          const locationSpan = numberElement.querySelector('span:last-of-type');
                          if (locationSpan) {
                              const locationText = locationSpan.textContent.trim();
                              //  Split by comma and take the *last* part.  Handles cases like "City, Region"
                              const locationParts = locationText.split(',');
                              result.city = locationParts[locationParts.length - 1].trim();
                          }

                        console.log('[Iframe-Parser] result.sourceLabel:', result.sourceLabel);
                        console.log('[Iframe-Parser] result.phoneNumber:', result.phoneNumber);
                        console.log('[Iframe-Parser] result.city:', result.city);
                      }

                      // --- Extract count ---
                      const advancedDiv = doc.querySelector('.advanced');
                          console.log('[Iframe-Parser] advancedDiv:', advancedDiv);
                          if (advancedDiv) {
                              const countStrong = advancedDiv.querySelector('strong:nth-child(2)');
                              console.log('[Iframe-Parser] countStrong:', countStrong);

                              if (countStrong) {
                                  // Try to parse the count directly from the strong element
                                  result.count = parseInt(countStrong.textContent, 10) || 0;

                              } else {
                                   //If strong element not found, check for "Nous avons une" (meaning 1)
                                   const textContent = advancedDiv.textContent;
                                  if (textContent.includes('Nous avons une')) {
                                      result.count = 1;
                                  }
                              }
                          }
                      console.log('[Iframe-Parser] result.count:', result.count);

                      if(result.success) {
                          return result;
                      }

                      console.log('[Iframe-Parser] Could not find the main number element.');
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
              // Give the page a moment to render before parsing
              setTimeout(findAndParse, 500);
          })();
      `;
  }

  function initiateQuery(phoneNumber, requestId) {
      log(`Initiating query for '${phoneNumber}' (requestId: ${requestId})`);
      try {
          const targetSearchUrl = `https://www.doisjerepondre.fr/numero-de-telephone/${phoneNumber}`;
          const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' }; // Using a standard user agent
          const proxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
          log(`Iframe proxy URL: ${proxyUrl}`);
          const iframe = document.createElement('iframe');
          iframe.id = `query-iframe-${requestId}`;
          iframe.style.display = 'none';
          iframe.sandbox = 'allow-scripts allow-same-origin';
          activeIFrames.set(requestId, iframe);
          iframe.onload = function() {
              log(`Iframe loaded for requestId ${requestId}. Posting parsing script.`);
              try {
                  const parsingScript = getParsingScript(PLUGIN_CONFIG.id, phoneNumber);
                   if (iframe.contentWindow) {
                       iframe.contentWindow.postMessage({
                           type: 'executeScript',
                           script: parsingScript
                       }, '*');
                       log(`Parsing script posted to iframe for requestId: ${requestId}`);
                   } else {
                       logError(`Iframe contentWindow not available for requestId ${requestId}`);
                       sendPluginResult({ requestId, success: false, error: 'Iframe contentWindow not available.' });
                       cleanupIframe(requestId);
                   }
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

          // Set a shorter timeout as doisjerepondre.fr is usually fast or fails quickly
          setTimeout(() => {
              if (activeIFrames.has(requestId)) {
                  logError(`Query timeout for requestId: ${requestId}`);
                  sendPluginResult({ requestId, success: false, error: 'Query timed out after 10 seconds' });
                  cleanupIframe(requestId);
              }
          }, 10000); // 10 seconds timeout

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
      // IMPORTANT: Verify the origin of the message if possible. For simplicity here, we are not.
      if (!event.data || event.data.type !== 'phoneQueryResult' || !event.data.data) {
          return;
      }
      if (event.data.data.pluginId !== PLUGIN_CONFIG.id) {
          return;
      }
      let requestId = null;
      // Find the requestId associated with the source iframe
      for (const [id, iframe] of activeIFrames.entries()) {
          if (iframe.contentWindow === event.source) {
              requestId = id;
              break;
          }
      }

      if (requestId) {
          log(`Received result via postMessage for requestId: ${requestId}`);
          const result = { requestId, ...event.data.data };
          delete result.pluginId; // Remove pluginId from the final result object
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

  // Initialize the plugin when the script loads
  initialize();

})();