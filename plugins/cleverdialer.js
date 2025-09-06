// Cleverdialer Plugin - Iframe Proxy Solution
(function() {
  // --- Plugin Configuration ---
  const PLUGIN_CONFIG = {
      id: 'cleverdialerPlugin',
      name: 'Cleverdialer (iframe Proxy)',
      version: '5.5.0', // Adopted from bd.js
      description: 'Queries cleverdialer.com for phone number information using an iframe proxy.'
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
      'Agencia de cobranza': 'Debt Collection',
      'Apuestas': 'Other', // Or 'Risk', depending on context
      'Asesoría': 'Other',  // Could be 'Financial', 'Legal', etc. - context-dependent
      'Buzón': 'Other',       // Voicemail
      'Donación': 'Charity',
      'Dudoso': 'Spam Likely', // Dubious
      'Encuesta': 'Survey',
      'Fraude criptográfico': 'Fraud Scam Likely', // Crypto fraud
      'Gastronomia': 'Other', // Hospitality/Food
      'Llamada Ping': 'Spam Likely',  // Ping Call
      'Llamadas recurrentes': 'Spam Likely', // Recurring calls
      'Negocio': 'Other',   // Business - could be 'Customer Service', 'Sales', etc.
      'Phishing': 'Fraud Scam Likely',
      'Prestación de Servicio': 'Customer Service', // Service provision
      'Publicidad': 'Telemarketing', // Advertising = Commercial
      'Salud': 'Medical',
      'Servicio al cliente': 'Customer Service',
      'Soporte': 'Customer Service', // Support
      'Spam': 'Spam Likely',
      'Trampa de costos': 'Fraud Scam Likely', // Cost trap
      'Ventas': 'Telemarketing', // Sales
      'Unknown': 'Unknown',
      'Spam': 'Spam Likely',          // Map 'Spam'
      'Enervante': 'Spam Likely',     // Map 'Enervante'
      'Neutral': 'Unknown',         // Map 'Neutral'
      'Positivo': 'Other',         // Map 'Positivo'
      'Excelente': 'Other',        // Map 'Excelente'
      'BUSINESS': 'Telemarketing',
      'CHARITY': 'Charity',
      'COMMERCIAL': 'Telemarketing', // Or 'Sales', depending on your preference
      'CONTINUOUS_CALLS': 'Spam Likely', // Or 'Robocall', if it fits better
      'COST_TRAP': 'Fraud Scam Likely',
      'COUNSEL': 'Other', // Could be 'Financial', 'Legal', etc. - context-dependent
      'CRYPTO_FRAUD': 'Fraud Scam Likely',
      'CUSTOMER_SERVICE': 'Customer Service',
      'DEBT_COLLECTION_AGENCY': 'Debt Collection',
      'DUBIOUS': 'Spam Likely',
      'HEALTH': 'Medical',
      'HOSPITALITY': 'Other',  // Or 'Takeaway', 'Delivery' (if mostly food-related)
      'MAILBOX': 'Other',     // Voicemail
      'PHISHING': 'Fraud Scam Likely',
      'SILENT_CALL': 'Silent Call Voice Clone',
      'SALES': 'Telemarketing', // Or 'Sales'
      'SERVICE': 'Customer Service', // Could also be just 'Service'
      'SPAM': 'Spam Likely',
      'SUPPORT': 'Customer Service', // Or 'Support'
      'SURVEY': 'Survey',
      'SWEEPSTAKE': 'Other', // Could be 'Risk' if it involves gambling
      'Beratung': 'Other',               // German mappings
      'Crypto Betrug': 'Fraud Scam Likely',
      'Daueranrufe': 'Spam Likely',
      'Dienstleistung': 'Customer Service',
      'Geschäft': 'Other', // Could be more specific
      'Gesundheit': 'Medical',
      'Gewinnspiel': 'Other', // Could be 'Risk'
      'Inkassounternehmen': 'Debt Collection',
      'Kostenfalle': 'Fraud Scam Likely',
      'Kundendienst': 'Customer Service',
      'Mailbox': 'Other',
      'Ping Anruf': 'Spam Likely',
      'Spenden': 'Charity',
      'Support': 'Customer Service',
      'Umfrage': 'Survey',
      'Unseriös': 'Spam Likely',
      'Verkauf': 'Telemarketing',
      'Werbung': 'Telemarketing',
      'Bitte auswählen': 'Unknown'
  };
  // Keywords for determining the 'action' field
   const blockKeywords = [
    // Mapped Predefined Labels (English)
    'Fraud Scam Likely', 'Spam Likely', 'Telemarketing', 'Robocall', 'Debt Collection', 'Risk', 
    'Silent Call Voice Clone', 
    // Source Labels (Spanish)
    'Dudoso', 'Fraude criptográfico', 'Llamada Ping', 'Llamadas recurrentes', 'Phishing', 'Publicidad', 
    'Trampa de costos', 'Ventas', 'Agencia de cobranza', 'Enervante',
    // Source Labels (English from a different source)
    'COMMERCIAL', 'CONTINUOUS_CALLS', 'COST_TRAP', 'CRYPTO_FRAUD', 'DEBT_COLLECTION_AGENCY',
    'DUBIOUS', 'PHISHING', 'SALES',
    // Source Labels (German)
    'Crypto Betrug', 'Daueranrufe', 'Inkassounternehmen', 'Kostenfalle', 'Ping Anruf', 
    'Unseriös', 'Verkauf', 'Werbung',
    // Generic Spam terms
    'Spam'
  ];
  
  const allowKeywords = [
    // Mapped Predefined Labels (English)
    'Delivery', 'Takeaway', 'Ridesharing', 'Insurance', 'Loan', 'Customer Service', 'Bank',
    'Education', 'Medical', 'Charity', 'Survey', 'Ecommerce', 'Recruiter', 'Headhunter',
    'Internet', 'Travel Ticketing', 'Application Software', 'Entertainment', 'Government',
    'Local Services', 'Automotive Industry', 'Car Rental', 'Telecommunication', 'Financial', 'Agent',
    // Source Labels (Spanish)
    'Donación', 'Prestación de Servicio', 'Salud', 'Servicio al cliente', 'Soporte', 'Encuesta',
    // Source Labels (English from a different source)
    'CHARITY', 'CUSTOMER_SERVICE', 'HEALTH', 'SERVICE', 'SUPPORT', 'SURVEY',
    // Source Labels (German)
    'Dienstleistung', 'Gesundheit', 'Kundendienst', 'Spenden', 'Support', 'Umfrage'
  ];

  // --- Constants, State, Logging, and Communication functions - Adopted from bd.js ---
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
   * Implements intelligent name selection based on data-tools and element text content.
   * Contains parsing logic for cleverdialer.com
   */
  function getParsingScript(pluginId, phoneNumberToQuery) {
      return `
          (function() {
              const PLUGIN_ID = '${pluginId}';
              const PHONE_NUMBER = '${phoneNumberToQuery}';
              const manualMapping = ${JSON.stringify(manualMapping)};
              const predefinedLabels = ${JSON.stringify(predefinedLabels)};
              const blockKeywords = ${JSON.stringify(blockKeywords)};
              const allowKeywords = ${JSON.stringify(allowKeywords)};
              let parsingCompleted = false;

              function sendResult(result) {
                  if (parsingCompleted) return;
                  parsingCompleted = true;
                  console.log('[Iframe-Parser] Sending result back to parent:', result);
                  window.parent.postMessage({ type: 'phoneQueryResult', data: { pluginId: PLUGIN_ID, ...result } }, '*');
              }

              function parseContent(doc) {
                  console.log('[Iframe-Parser] Attempting to parse content in document.');
                  const result = {
                      phoneNumber: PHONE_NUMBER, sourceLabel: '', count: 0, province: '', city: '', carrier: '',
                      name: '', predefinedLabel: '', source: PLUGIN_ID, numbers: [], success: false, error: ''
                  };

                  try {
                    // --- Parsing logic from the original cleverdialer.js extractDataFromDOM function ---


                    const bodyElement = doc.body;
                    if (!bodyElement) {
                      console.error('[Iframe-Parser] Error: Could not find body element.');
                      return null;
                    }

                    // --- Priority 1: Label from *FIRST* Recent Comment ---
                    const callTypeCell = doc.querySelector('#comments .container-recent-comments td.callertype'); // Directly get the FIRST td.callertype
                    if (callTypeCell) {
                        const labelText = callTypeCell.textContent.trim();
                        result.sourceLabel = labelText;
                        result.predefinedLabel = manualMapping[labelText] || 'Unknown';
                    }

                    // --- Priority 2: Label and Count from Rating ---
                    if (!result.predefinedLabel) { // Only if Priority 1 didn't find a label
                      const ratingDiv = doc.querySelector('.stars.star-rating .front-stars');
                        if (ratingDiv) {
                            const classValue = ratingDiv.className; // Get the full class name (e.g., "front-stars stars-3")
                            const starMatch = classValue.match(/stars-(\d)/); // Extract the number

                            if (starMatch) {
                                 const starRating = parseInt(starMatch[1], 10);

                                // Extract star rating from text for comparison (more robust)
                                const ratingTextSpan = doc.querySelector('.rating-text span:first-child');
                                if (ratingTextSpan) {
                                    const textRatingMatch = ratingTextSpan.textContent.match(/(\d)\s+de\s+5/);
                                    if (textRatingMatch) {
                                        const textRating = parseInt(textRatingMatch[1], 10);

                                         //Compare ratings
                                        if(starRating === textRating){
                                            // Map star rating to label
                                            if (starRating === 1) {
                                                 result.sourceLabel = 'stars-' + starRating;
                                                result.predefinedLabel = 'Spam Likely';
                                            } else if (starRating === 2) {
                                                result.sourceLabel = 'stars-' + starRating;
                                                result.predefinedLabel = 'Spam Likely'; //"Enervante"
                                            } else if (starRating === 3) {
                                                result.sourceLabel = 'stars-' + starRating;
                                                result.predefinedLabel = 'Unknown'; // "Neutral"
                                            } else if (starRating === 4) {
                                                result.sourceLabel = 'stars-' + starRating;
                                                result.predefinedLabel = 'Other'; //  "Positivo"
                                            } else if (starRating === 5) {
                                                result.sourceLabel = 'stars-' + starRating;
                                                result.predefinedLabel = 'Other';  //"Excelente"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                // --- Extract Count (Handle both numbers and words) ---
                    // --- Extract Count (Primary: Number of Ratings, Fallback: Blocked Count) ---
                    const countSpan = doc.querySelector('.rating-text .nowrap');
                    let count = 0;
                    if (countSpan) {
                        const countText = countSpan.textContent.trim();


                        // Number-word mapping (English, Spanish, German)
                        const wordToNumber = {
                            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
                            'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
                            'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
                            'ein': 1, 'eine': 1, 'einer': 1,'eins':1, 'zwei': 2, 'drei': 3, 'vier': 4, 'fünf': 5,
                            'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10
                        };

                        // Prioritize matching number words
                        const wordMatch = countText.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|ein|eine|einer|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\b/i);
                        if (wordMatch) {
                            count = wordToNumber[wordMatch[1].toLowerCase()] || 0;
                        } else {
                            // If no number word is matched, try matching numbers
                            const numberMatch = countText.match(/(\d+)\s+(Bewertungen|bewertungen|Bewertung|bewertung|ratings|rating|valoraciones|valoración)/i);
                            if (numberMatch) {
                                count = parseInt(numberMatch[1], 10) || 0;
                            }
                        }
                    }

                    // If count is still 0, try to get it from the blocked count (h4)
                    if (count === 0) {
                        const blockedCountH4 = doc.querySelector('.list-element-information .text-blocked');
                        if (blockedCountH4) {
                            const blockedCountText = blockedCountH4.textContent.trim();
                            const blockedNumberMatch = blockedCountText.match(/(\d+)/);
                            if (blockedNumberMatch) {
                                count = parseInt(blockedNumberMatch[1], 10) || 0;
                            }
                        }
                    }

                   result.count = count; // Assign the final count (either primary or fallback)
                    // --- Extract City ---
                // --- Extract City ---
                const cityElement = doc.querySelector('.list-element.list-element-action .list-text h4');
                if (cityElement) {
                    result.city = cityElement.textContent.trim();
                }

                    // --- Set Success Flag ---
                    if (result.predefinedLabel && result.predefinedLabel !== 'Unknown' && result.predefinedLabel !== '') {
                        result.success = true;
                    } else if (result.city) {
                        result.success = true; 
                    }


                   // ▼▼▼ NEW ACTION LOGIC - ADDED AT THE END (NON-DESTRUCTIVE) ▼▼▼
                   // =================================================================
                   if (result.success) {
                       const labelToCheck = result.predefinedLabel || result.sourceLabel;
                       if (labelToCheck) {
                           console.log('[Iframe-Parser] Determining action based on label:', labelToCheck);
                           let determinedAction = 'none';

                           for (const keyword of blockKeywords) {
                               if (labelToCheck.toLowerCase().includes(keyword.toLowerCase())) {
                                   determinedAction = 'block';
                                   break;
                               }
                           }

                           if (determinedAction === 'none') {
                               for (const keyword of allowKeywords) {
                                   if (labelToCheck.toLowerCase().includes(keyword.toLowerCase())) {
                                       determinedAction = 'allow';
                                       break;
                                   }
                               }
                           }
                           
                           result.action = determinedAction;
                           console.log('[Iframe-Parser] Action determined as:', result.action);
                       }
                   }
                   // =================================================================
                   // ▲▲▲ NEW ACTION LOGIC - ADDED AT THE END (NON-DESTRUCTIVE) ▲▲▲

                    console.log('[Iframe-Parser] Final result object:', result);
                    return result;

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
                  if (finalResult && finalResult.success !== false) { // Check for explicit success=false from parseContent
                      sendResult(finalResult);
                  } else {
                      console.error('[Iframe-Parser] Failed to parse content from the page or parsing indicated failure.');
                      sendResult({ success: false, error: finalResult ? finalResult.error : 'Could not parse content from the page.' });
                  }
              }

              console.log('[Iframe-Parser] Parsing script has started execution for phone: ' + PHONE_NUMBER);
              // Add a small delay to allow content to load
              setTimeout(findAndParse, 500);
          })();
      `;
  }

  function initiateQuery(phoneNumber, requestId) {
      log(`Initiating query for '${phoneNumber}' (requestId: ${requestId})`);
      try {
          // Updated target URL for cleverdialer.com
          const targetSearchUrl = `https://www.cleverdialer.com/phonenumber/${phoneNumber}`;
          const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' };
                  // ▼▼▼ 只需修改这里 ▼▼▼
        const originalOrigin = new URL(targetSearchUrl).origin;


          // 1. 将净化规则定义为函数内部的局部常量。
          // 这使得规则与使用它的地方紧密耦合，符合内聚性原则。
          const domPurgeRules = [
              {
                  type: 'remove', 
                  selector: 'script:not([src])',
                  contentMatch: "eval(function(p,a,c,k,e,d)" 
              }
          ];

          // 2. 动态构建净化规则参数字符串。
          // 如果没有规则，则不添加任何参数。
          const purgeRulesParam = domPurgeRules.length > 0 
              ? `&purgeRules=${encodeURIComponent(JSON.stringify(domPurgeRules))}` 
              : '';

          // 3. Append parameters to the proxy URL.
          const proxyUrl = `
              ${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?requestId=${encodeURIComponent(requestId)}&originalOrigin=${encodeURIComponent(originalOrigin)}&targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}${purgeRulesParam}`;;
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

          // Set a timeout for the query
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
