// Baidu Phone Query Plugin - Iframe Proxy Solution
(function() {
  // --- Plugin Configuration ---
  const PLUGIN_CONFIG = {
      id: 'baiduPhoneNumberPlugin',
      name: 'Baidu Phone Lookup (iframe Proxy)',
      version: '5.5.0', // Final version with intelligent name selection
      description: 'Queries Baidu for phone number information using an iframe proxy. Intelligently selects the best name from multiple sources.'
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
      '中介': 'Agent', '房产中介': 'Agent', '违规催收': 'Debt Collection', '快递物流': 'Delivery',
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

  /**
   * 【V5.5.0 逻辑升级】
   * Implements intelligent name selection based on data-tools and element text content.
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
                      const mainContainer = doc.querySelector('.result-op.c-container.new-pmd, .c-container[mu], #results, #content_left');
                      if (!mainContainer) {
                          console.log('[Iframe-Parser] Could not find primary result container in this document.');
                          return null;
                      }
                      
                      console.log('[Iframe-Parser] Found result container. Now parsing for data...');

                      // --- NEW: Extract potential name from data-tools attribute first ---
                      let dataToolsName = '';
                      const dataToolsEl = mainContainer.querySelector('.c-tools[data-tools]');
                      if (dataToolsEl) {
                          try {
                              const dataToolsObj = JSON.parse(dataToolsEl.dataset.tools);
                              if (dataToolsObj && dataToolsObj.title) {
                                  dataToolsName = dataToolsObj.title.split(',')[0].trim();
                                  console.log('[Iframe-Parser] Found alternative name in data-tools:', dataToolsName);
                              }
                          } catch (e) {
                              console.log('[Iframe-Parser] Could not parse data-tools attribute.');
                          }
                      }

                      // --- STRATEGY 1: Official/Company Number Card ---
                      const companyCardMulti = mainContainer.querySelector('div.ms_company_number_2oq_O');
                      const companyCardSingle = mainContainer.querySelector('div.title-top_2-DW0');
                      
                      if (companyCardMulti) {
                          console.log('[Iframe-Parser] Found multi-number company card (e.g., Pinduoduo).');
                          const officialTitle = companyCardMulti.querySelector('h3.c-title a');
                          if (officialTitle) {
                              result.sourceLabel = officialTitle.textContent.trim();
                          }
                          const phoneEntries = companyCardMulti.querySelectorAll('div.tell-list_2FE1Z');
                          phoneEntries.forEach(entry => {
                              const numberEl = entry.querySelector('.list-num_3MoU1');
                              const nameEl = entry.querySelector('.list-title_22Pkn');
                              if (numberEl && nameEl) {
                                  const numberText = numberEl.textContent.replace(/\\D/g, '');
                                  if (numberText === PHONE_NUMBER) {
                                      result.name = nameEl.textContent.trim();
                                      result.success = true;
                                  }
                                  result.numbers.push({ number: numberEl.textContent.trim(), name: nameEl.textContent.trim() });
                              }
                          });
                      } else if (companyCardSingle) {
                           const titleEl = companyCardSingle.querySelector('.cc-title_31ypU');
                           if(titleEl) {
                              console.log('[Iframe-Parser] Found single-number company/official card (e.g., Taobao).');
                              result.name = titleEl.textContent.trim().split(/\\s+/)[0];
                              result.numbers.push({ number: PHONE_NUMBER, name: 'Main' });
                              result.success = true;
                           }
                      }

                      // 【NEW LOGIC】 Compare and choose the longer name if dataToolsName exists
                      if (result.success && dataToolsName && dataToolsName.length > result.name.length) {
                          console.log('[Iframe-Parser] Overwriting name "' + result.name + '" with longer one from data-tools: "' + dataToolsName + '"');
                          result.name = dataToolsName;
                      }

                      // Set predefinedLabel based on the final name
                      if (result.success && (result.name.includes('客服') || (result.sourceLabel && result.sourceLabel.includes('客服')))) {
                         result.predefinedLabel = 'Customer Service';
                      }
                      
                      // --- STRATEGY 2: Marked Number Card (Spam/Telemarketing etc.) ---
                      if (!result.success) {
                          console.log('[Iframe-Parser] No official card found, checking for marked number card.');
                          const labelEl = mainContainer.querySelector('.op_mobilephone_label, .cc-title_31ypU');
                          if (labelEl) {
                              result.sourceLabel = labelEl.textContent.replace(/标记：|标记为：|网络收录仅供参考/, '').trim().split(/\\s+/)[0];
                              if (result.sourceLabel) {
                                  console.log('[Iframe-Parser] Found marked number card with label:', result.sourceLabel);
                                  result.count = 1; 
                                  const locationEl = mainContainer.querySelector('.op_mobilephone_location, .cc-row_dDm_G');
                                  if (locationEl) {
                                      const locText = locationEl.textContent.replace(/归属地：/, '').trim();
                                      const [province, city, carrier] = locText.split(/\\s+/);
                                      result.province = province || ''; result.city = city || ''; result.carrier = carrier || '';
                                  }
                                  result.success = true;
                              }
                          }
                      }

                      // --- FINAL LABEL MAPPING (applies to marked numbers) ---
                      if (result.success && !result.predefinedLabel && result.sourceLabel) {
                          for (const key in manualMapping) {
                              if (result.sourceLabel.includes(key)) { 
                                  result.predefinedLabel = manualMapping[key]; 
                                  break; 
                              }
                          }
                      }

                      if(result.success) {
                          return result;
                      }
                      
                      console.log('[Iframe-Parser] No specific card structure matched.');
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
          const targetSearchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(phoneNumber)}&ie=utf-8`;
          const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36' };
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