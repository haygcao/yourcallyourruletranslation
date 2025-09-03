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

 
 // cleverdialer.js
// 这是一个独立的、完整的函数，可以直接替换您JS插件中的同名函数。

function initiateQuery(phoneNumber, requestId) {
    log(`Initiating query for '${phoneNumber}'`);
    try {
        // --- 准备阶段: 定义所有需要的 URL 和头部 ---
        // 目标网站的URL
        const targetSearchUrl = `https://www.cleverdialer.com/phonenumber/${phoneNumber}`;
        // 加载主文档时使用的HTTP头部
        const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36' };
        // 第一次加载 iframe 时使用的代理 URL
        const initialProxyUrl = `${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?targetUrl=${encodeURIComponent(targetSearchUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;

        // --- Iframe 创建阶段 ---
        const iframe = document.createElement('iframe');
        iframe.id = `query-iframe-${requestId}`;
        iframe.style.display = 'none';
        
        // 【关键 Sandbox 配置】
        // - 'allow-scripts': 允许我们的注入脚本和网站原始脚本运行。
        // - 'allow-same-origin': 允许我们的脚本修改 iframe 内部的原生 API (如 fetch)，这在严格沙箱中可能受限。
        // 警告是正常的，因为我们正在创建一个强大的中间层来完全控制 iframe。
        iframe.sandbox = 'allow-scripts allow-same-origin';

        activeIFrames.set(requestId, iframe);

        // --- Iframe 加载完成后的核心逻辑 ---
        iframe.onload = function() {
            log(`Iframe loaded. Injecting the Ultimate Interceptor & Parser...`);

            // 这个脚本将作为我们的“JS中间层”，在 iframe 内部运行
            const ultimateInterceptorScript = `
                (function() {
                    // 防止重复注入
                    if (window.ultimateInterceptorActive) return;
                    window.ultimateInterceptorActive = true;
                    
                    console.log('[JS-Layer] Activating...');
                    
                    const targetOrigin = new URL('${targetSearchUrl}').origin; // "https://www.cleverdialer.com"
                    const proxyTemplateUrl = \`${PROXY_SCHEME}://${PROXY_HOST}${PROXY_PATH_FETCH}?targetUrl=\`;

                    // ======================================================================================
                    // == Part 1: URL Rewriter (针对静态资源) ==
                    // 目标: HTML中所有写死的相对路径资源 (如 <script src="/js/...">, <link href="/css/...">)
                    // 行为: 将它们的 src/href 属性，从 "/js/..." 重写为 "https://proxy.../?targetUrl=https://site.com/js/..."
                    // ======================================================================================
                    const urlResolver = document.createElement('a');
                    document.querySelectorAll('link[href], script[src], img[src], a[href]').forEach(el => {
                        const attr = el.hasAttribute('href') ? 'href' : 'src';
                        const originalValue = el.getAttribute(attr);
                        
                        if (originalValue && !originalValue.startsWith('data:') && !originalValue.startsWith('${PROXY_SCHEME}')) {
                            urlResolver.href = originalValue;
                            const absoluteUrl = urlResolver.href;
                            
                            if (absoluteUrl.startsWith(targetOrigin)) {
                                const newProxyUrl = proxyTemplateUrl + encodeURIComponent(absoluteUrl);
                                el.setAttribute(attr, newProxyUrl);
                            }
                        }
                    });
                    console.log('[JS-Layer] SUCCESS: Static resource URLs rewritten.');

                    // ======================================================================================
                    // == Part 2: Fetch Interceptor (针对动态 JS 请求) ==
                    // 目标: Phonenumber.js 内部发起的 fetch('/api/token') 等请求
                    // 行为: 劫持 fetch 函数，将请求的 URL 包装成代理 URL 再发出
                    // ======================================================================================
                    const originalFetch = window.fetch;
                    window.fetch = function(resource, options) {
                        let requestUrl = resource instanceof Request ? resource.url : String(resource);
                        const absoluteUrl = new URL(requestUrl, document.baseURI).toString();
                        
                        // 【您的保护层逻辑】
                        // 只要请求发往目标域名，就无条件通过代理
                        if (absoluteUrl.startsWith(targetOrigin)) {
                            console.log('[JS-Layer] Intercepted fetch to:', absoluteUrl);
                            const proxiedFetchUrl = proxyTemplateUrl + encodeURIComponent(absoluteUrl);
                            
                            if (resource instanceof Request) {
                                // 如果是 Request 对象，需要基于它创建一个新的
                                const newRequest = new Request(proxiedFetchUrl, resource);
                                return originalFetch.call(this, newRequest);
                            }
                            return originalFetch.call(this, proxiedFetchUrl, options);
                        }
                        
                        // 对于非目标域名的请求(如谷歌分析)，直接放行
                        return originalFetch.apply(this, arguments);
                    };
                    console.log('[JS-Layer] SUCCESS: Dynamic fetch calls intercepted.');
                    
                    // ======================================================================================
                    // == Part 3: Sanitizer (作为双重保险) ==
                    // 目标: HTML中内联的 frame-busting eval 脚本
                    // 行为: 在它有机会执行前，将其从 DOM 中物理移除
                    // ======================================================================================
                     document.querySelectorAll('script').forEach(s => {
                        if (s.textContent.includes('eval(function(p,a,c,k,e,d)')) {
                            s.remove();
                            console.log('[JS-Layer] SUCCESS: Inline frame-buster script removed.');
                        }
                    });
                })();
            `;
            
            // 最终的解析脚本
            const parsingScript = getParsingScript(PLUGIN_CONFIG.id, phoneNumber);

            // --- 注入执行 ---
            setTimeout(() => {
                try {
                    // 第一步：注入我们的“中间层”，它会立刻开始重写和劫持
                    this.contentWindow.postMessage({ type: 'executeScript', script: ultimateInterceptorScript }, '*');
                    
                    // 第二步：给予足够的时间让所有子资源(CSS,JS,图片)通过被重写的URL重新加载
                    setTimeout(() => {
                        log('All sub-resources should be re-proxied now. Injecting parser.');
                        // 第三步：注入解析脚本，此时页面是完整的、干净的
                        this.contentWindow.postMessage({ type: 'executeScript', script: parsingScript }, '*');
                    }, 1500); // 这个延迟是为了等待被代理的子资源加载完成

                } catch (e) {
                    logError(`Error injecting scripts into iframe:`, e);
                    sendPluginResult({ requestId, success: false, error: `Injection failed: ${e.message}` });
                    cleanupIframe(requestId);
                }
            }, 500); // 这个延迟是为了等待 iframe 内部的 Receiver 准备就绪
        };
        
        iframe.onerror = function() {
             logError(`Iframe loading failed for requestId ${requestId}`);
             sendPluginResult({ requestId, success: false, error: 'Iframe loading failed.' });
             cleanupIframe(requestId);
        };

        // --- 启动加载 ---
        document.body.appendChild(iframe);
        iframe.src = initialProxyUrl;
        
    } catch (error) {
        logError(`Error in setup:`, error);
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
