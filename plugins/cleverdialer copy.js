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
   * 【V5.5.0 逻辑升级】
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
                    const jsonObject = {
                      count: 0,
                      sourceLabel: "",
                      province: "",
                      city: "",
                      carrier: "",
                      phoneNumber: PHONE_NUMBER,
                      name: "Unknown"
                    };

                    const bodyElement = doc.body;
                    if (!bodyElement) {
                      console.error('[Iframe-Parser] Error: Could not find body element.');
                      return null;
                    }

                    // --- Priority 1: Label from *FIRST* Recent Comment ---
                    const callTypeCell = doc.querySelector('#comments .container-recent-comments td.callertype'); // Directly get the FIRST td.callertype
                    if (callTypeCell) {
                        const labelText = callTypeCell.textContent.trim();
                        jsonObject.sourceLabel = labelText;
                        jsonObject.predefinedLabel = manualMapping[labelText] || 'Unknown';
                    }

                    // --- Priority 2: Label and Count from Rating ---
                    if (!jsonObject.predefinedLabel) { // Only if Priority 1 didn't find a label
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
                                                 jsonObject.sourceLabel = 'stars-' + starRating;
                                                jsonObject.predefinedLabel = 'Spam Likely';
                                            } else if (starRating === 2) {
                                                jsonObject.sourceLabel = 'stars-' + starRating;
                                                jsonObject.predefinedLabel = 'Spam Likely'; //"Enervante"
                                            } else if (starRating === 3) {
                                                jsonObject.sourceLabel = 'stars-' + starRating;
                                                jsonObject.predefinedLabel = 'Unknown'; // "Neutral"
                                            } else if (starRating === 4) {
                                                 jsonObject.sourceLabel = 'stars-' + starRating;
                                                jsonObject.predefinedLabel = 'Other'; //  "Positivo"
                                            } else if (starRating === 5) {
                                                 jsonObject.sourceLabel = 'stars-' + starRating;
                                                jsonObject.predefinedLabel = 'Other';  //"Excelente"
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


                        // 数字单词映射 (英语, 西班牙语, 德语)
                        const wordToNumber = {
                            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
                            'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
                            'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
                            'ein': 1, 'eine': 1, 'einer': 1,'eins':1, 'zwei': 2, 'drei': 3, 'vier': 4, 'fünf': 5,
                            'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10
                        };

                        // 优先尝试匹配数字单词
                        const wordMatch = countText.match(/(one|two|three|four|five|six|seven|eight|nine|ten|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|ein|eine|einer|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)/i);
                        if (wordMatch) {
                            count = wordToNumber[wordMatch[1].toLowerCase()] || 0;
                        } else {
                            // 如果没有匹配到数字单词, 尝试匹配数字
                            const numberMatch = countText.match(/(\d+)\s+(Bewertungen|bewertungen|Bewertung|bewertung|ratings|rating|valoraciones|valoración)/i);
                            if (numberMatch) {
                                count = parseInt(numberMatch[1], 10) || 0;
                            }
                        }
                    }

                    // 如果 count 仍然是 0, 尝试从 blocked count (h4) 获取
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

                   jsonObject.count = count; // Assign the final count (either primary or fallback)
                    // --- Extract City ---
                // --- Extract City ---
                const cityElement = doc.querySelector('.list-element.list-element-action .list-text h4');
                if (cityElement) {
                    jsonObject.city = cityElement.textContent.trim();
                }

                    console.log('[Iframe-Parser] Final jsonObject:', jsonObject);
                    return jsonObject;

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

 
 
// 【最终的、采纳了您简化建议的版本】
function initiateQuery(phoneNumber, requestId) {
    log(`[Intercepted Mode] Initiating query for '${phoneNumber}'`);
    try {
        // --- 您的原始逻辑：定义 targetSearchUrl 和 proxyUrl ---
        const targetSearchUrl = `https://www.cleverdialer.com/phonenumber/${phoneNumber}`;
        const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36' };
        const proxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
        
        // --- 中间数据处理层开始 ---

        // 【核心修改】直接在您原始的 proxyUrl 基础上拼接 proxy_mode
        const proxyFetchUrl = `${proxyUrl}&proxy_mode=fetch`;
        
        log(`[Intercepted Mode] Fetching HTML from: ${proxyFetchUrl}`);
        
        fetch(proxyFetchUrl)
            .then(response => response.text())
            .then(html => {
                log('[Intercepted Mode] HTML fetched. Sanitizing...');
                let cleanHtml = html;
                
                // 执行所有清洗工作
                const frameBusterPattern = /<script>eval\(function\(p,a,c,k,e,d\){.*?}\)<\/script>/is;
                cleanHtml = cleanHtml.replace(frameBusterPattern, '');
                
                const baseTag = `<base href="${new URL(targetSearchUrl).origin}/">`;
                cleanHtml = cleanHtml.replace(/<head.*?>/i, `$&${baseTag}`);
                
                log('[Intercepted Mode] HTML Sanitized.');

                // 将清洗后的HTML字符串转换为一个临时的 Blob URL
                const blob = new Blob([cleanHtml], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);

                // --- 中间数据处理层结束 ---

                // --- 现在，我们回到您原始的、经典的 initiateQuery 逻辑 ---
                
                const iframe = document.createElement('iframe');
                iframe.id = `query-iframe-${requestId}`;
                iframe.style.display = 'none';
                iframe.sandbox = 'allow-scripts allow-same-origin'; // 保留您原始的 sandbox
                activeIFrames.set(requestId, iframe);

                iframe.onload = function() {
                    log(`[Intercepted Mode] Iframe loaded from Blob URL. Posting parsing script.`);
                    URL.revokeObjectURL(blobUrl); 
                    
                    try {
                        const parsingScript = getParsingScript(PLUGIN_CONFIG.id, phoneNumber);
                        // 【核心】使用您原始的 postMessage 通信机制
                        iframe.contentWindow.postMessage({
                            type: 'executeScript',
                            script: parsingScript
                        }, '*');
                    } catch (e) {
                        logError(`Error posting script to iframe:`, e);
                        sendPluginResult({ requestId, success: false, error: `postMessage failed: ${e.message}` });
                        cleanupIframe(requestId);
                    }
                };
                
                // 您的原始 onerror 逻辑
                iframe.onerror = function() {
                    logError(`Iframe error for requestId ${requestId}`);
                    URL.revokeObjectURL(blobUrl); 
                    sendPluginResult({ requestId, success: false, error: 'Iframe loading failed.' });
                    cleanupIframe(requestId);
                };

                document.body.appendChild(iframe);
                
                // 【核心】最终还是调用 iframe.src，但指向我们处理过的安全数据
                iframe.src = blobUrl;

            })
            .catch(error => {
                logError(`[Intercepted Mode] Fetch/Sanitize failed:`, error);
                sendPluginResult({ requestId, success: false, error: `Query failed: ${error.message}` });
                // 这里不需要 cleanupIframe，因为 iframe 可能还没创建
            });

    } catch (error) {
        logError(`[Intercepted Mode] Error in setup:`, error);
        sendPluginResult({ requestId, success: false, error: `Query setup failed: ${error.message}` });
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
