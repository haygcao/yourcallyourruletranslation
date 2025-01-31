import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:webview_flutter/webview_flutter.dart';
// 引入 Android 平台相关的包
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';

import 'http.dart'; // 导入拦截器
import 'network.dart'; // 导入 Network 组件代码

class TestPage extends StatefulWidget {
  const TestPage({super.key, required this.title});

  final String title;

  @override
  State<TestPage> createState() => _TestPageState();
}

class _TestPageState extends State<TestPage> {
  final TextEditingController _pluginUrlController = TextEditingController(
      text:
          'https://raw.githubusercontent.com/haygcao/test/refs/heads/main/3baidu.js');
  final TextEditingController _phoneNumberController = TextEditingController();
  String _queryResult = '';
  String _jsLogs = '';
  late final WebViewController _controller;
  bool _isPluginLoaded = false;
  String? _loadedPluginId; // 修改：添加 _loadedPluginId 变量，用于存储已加载插件的 ID
  Completer<Map<String, dynamic>?>? _queryCompleter; // 用于传递查询结果
  
  
  
  
  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    //  创建 PlatformWebViewControllerCreationParams 对象
    late final PlatformWebViewControllerCreationParams params;
    if (WebViewPlatform.instance is WebKitWebViewPlatform) {
      params = WebKitWebViewControllerCreationParams(
        allowsInlineMediaPlayback: true,
        mediaTypesRequiringUserAction: const <PlaybackMediaTypes>{},
      );
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    _controller = WebViewController.fromPlatformCreationParams(params)
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'TestPageChannel',
        onMessageReceived: (JavaScriptMessage message) async {
          // 处理来自 JavaScript 的消息
          print('message信息: ${message.message}'); // 打印 JSON 消息的原始内容
          try {
            final jsonData = jsonDecode(message.message);
            print('jsonData打印: $jsonData'); // 输出解析后的 JSON 对象
            print('jsonData type: ${jsonData.runtimeType}');
            print('jsonData[\'type\']: ${jsonData['type']}');
            print('jsonData[\'pluginId\']: ${jsonData['pluginId']}');
            print('_loadedPluginId: $_loadedPluginId');

            if (jsonData['type'] == 'pluginLoaded') {
              print('Plugin loaded打印: ${jsonData['pluginId']}');
              _jsLogs += 'Plugin loaded: ${jsonData['pluginId']}\n';
              setState(() {
                _loadedPluginId = jsonData['pluginId']; // 修改：存储已加载插件的 ID
                print('Plugin loaded:${'pluginId'} $_loadedPluginId');
              });
            } else if (jsonData['type'] == 'pluginReady') {
              print('Plugin ready: ${jsonData['pluginId']}');
              setState(() {
                _isPluginLoaded = true;
              });
              _jsLogs += 'Plugin ready: ${jsonData['pluginId']}\n';
            } else if (jsonData['type'] == 'pluginResult') {
              print('Plugin result: ${jsonData['data']}');
              _jsLogs += 'Plugin result: ${jsonData['data']}\n';
            } else if (jsonData['type'] == 'pluginError') {
              print('Plugin error: ${jsonData['error']}');
              _jsLogs += 'Plugin error: ${jsonData['error']}\n';
            }
          } catch (e) {
            // 如果不是 JSON，则视为普通字符串消息
            print('Received message: ${message.message}');
            _jsLogs += 'Received message: ${message.message}\n';
          }
        },
      )
      ..addJavaScriptChannel(
        'consoleLog', // 添加一个新的 JavaScriptChannel 来接收 console.log
        onMessageReceived: (JavaScriptMessage message) {
          print('JS Console Log: ${message.message}');
          setState(() {
            _jsLogs += 'JS Console Log: ${message.message}\n';
          });
        },
      )
      ..addJavaScriptChannel(
        'consoleWarn', // 添加一个新的 JavaScriptChannel 来接收 console.warn
        onMessageReceived: (JavaScriptMessage message) {
          print('JS Console Warn: ${message.message}');
          setState(() {
            _jsLogs += 'JS Console Warn: ${message.message}\n';
          });
        },
      )
      ..addJavaScriptChannel(
        'consoleError', // 添加一个新的 JavaScriptChannel 来接收 console.error
        onMessageReceived: (JavaScriptMessage message) {
          print('JS Console Error: ${message.message}');
          setState(() {
            _jsLogs += 'JS Console Error: ${message.message}\n';
          });
        },
      )


      // 注册 PluginResultChannel，用于接收查询结果
      ..addJavaScriptChannel(
        'PluginResultChannel',
        onMessageReceived: (JavaScriptMessage message) {
          print(
              'Received message on PluginResultChannel: ${message.message}');
          try {
            final Map<String, dynamic> decodedMessage =
                jsonDecode(message.message);
            if (decodedMessage['type'] == 'pluginResult' &&
                decodedMessage['pluginId'] == _loadedPluginId) {
              final data = Map<String, dynamic>.from(decodedMessage['data']);
              // 使用 _queryCompleter 传递结果
              if (_queryCompleter != null && !_queryCompleter!.isCompleted) {
                _queryCompleter!.complete(data);
              }
            } else if (decodedMessage['type'] == 'pluginError' &&
                decodedMessage['pluginId'] == _loadedPluginId) {
              // 使用 _queryCompleter 传递错误
              if (_queryCompleter != null && !_queryCompleter!.isCompleted) {
                _queryCompleter!.completeError(
                    decodedMessage['error'] ?? 'Unknown error from plugin');
              }
            }
          } catch (e) {
            print('Error processing message on PluginResultChannel: $e');
            // 使用 _queryCompleter 传递错误
            if (_queryCompleter != null && !_queryCompleter!.isCompleted) {
              _queryCompleter!.completeError(e);
            }
          }
        },
      )

      
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) async {
            print('Page finished loading: $url');
            _jsLogs += 'Page finished loading: $url\n';
            // 在页面加载完成后加载 JS 插件
            //  await _loadPlugin();
          },
          // 新增 onWebResourceError 监听
          onWebResourceError: (WebResourceError error) {
            print('Page loading error: ${error.description}');
            _jsLogs += 'Page loading error: ${error.description}\n';
          },
        ),
      );

    // 启用 WebView 的调试模式
    if (_controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(true);
      (_controller.platform as AndroidWebViewController)
          .setMediaPlaybackRequiresUserGesture(false);
    }

    // 初始化 HTTP 拦截器
    HttpInterceptor().register(_controller);

    //_controller.loadRequest(Uri.parse('about:blank'));
  }

  Future<void> _loadPlugin() async {
    String pluginUrl = _pluginUrlController.text;

    try {
      final response = await http.get(Uri.parse(pluginUrl));

      if (response.statusCode == 200) {
        String jsCode = response.body;

        // 执行 JS 代码
        await _controller.runJavaScript(jsCode);

        print('Plugin loading completed from URL: $pluginUrl');
        setState(() {
          _jsLogs += 'Plugin loading completed from URL: $pluginUrl\n';
          _isPluginLoaded = true; // 设置插件加载状态
        });
      } else {
        print('Failed to load plugin from URL: ${response.statusCode}');
        setState(() {
          _queryResult =
              'Failed to load plugin from URL: ${response.statusCode}';
          _jsLogs += 'Failed to load plugin from URL: ${response.statusCode}\n';
        });
      }
    } catch (e) {
      print('Error loading plugin from URL: $e');
      setState(() {
        _queryResult = 'Error loading plugin from URL: $e';
        _jsLogs += 'Error loading plugin from URL: $e\n';
      });
    }
  }

  Future<void> _checkPluginStatus(String pluginId) async {
    // 修改：添加 pluginId 参数
    try {
      final result = await _controller.runJavaScriptReturningResult('''
        window.checkPluginStatus('$pluginId'); // 修改：传入 pluginId 参数
      ''');

      setState(() {
        _jsLogs +=
            'Plugin status check result for $pluginId: $result\n'; // 修改：添加 pluginId 信息
      });
    } catch (e) {
      print(
          'Error checking plugin status for $pluginId: $e'); // 修改：添加 pluginId 信息
      setState(() {
        _jsLogs +=
            'Error checking plugin status for $pluginId: $e\n'; // 修改：添加 pluginId 信息
      });
    }
  }

/*
Future<void> _queryPhoneInfo() async {
  if (!_isPluginLoaded) {
    setState(() {
      _queryResult = 'Plugin is not loaded yet. Please load the plugin first.';
      _jsLogs += 'Attempted to query before plugin was loaded\n';
    });
    return;
  }

  String phoneNumber = _phoneNumberController.text;

  try {
    // 获取 JS 函数的返回值
    final result = await _controller.runJavaScriptReturningResult(
      'window.plugin["$_loadedPluginId"].generateOutput("$phoneNumber", null, null)'
    );

print("Result type from JS: ${result.runtimeType}");
print("Result from JS: ${result}");

    // 判断 result 的类型并相应地处理
    if (result is List) {
      // 如果是列表，则遍历并格式化每个结果
      String formattedResult = '';
      for (var item in result) {
        if (item is Map) {
          formattedResult += 'Count: ${item['count'] ?? ''}\n'
              'Source Label: ${item['sourceLabel'] ?? ''}\n'
              'Province: ${item['province'] ?? ''}\n'
              'City: ${item['city'] ?? ''}\n'
              'Carrier: ${item['carrier'] ?? ''}\n'
              'PhoneNumber: ${item['phoneNumber'] ?? ''}\n\n';
        }
      }
      setState(() {
        _queryResult = formattedResult;
        _jsLogs += 'Query executed, result: $_queryResult\n';
      });
    } else if (result is Map) {
      // 如果是单个映射，则直接格式化结果
      setState(() {
        _queryResult = 'Count: ${result['count'] ?? ''}\n'
            'Source Label: ${result['sourceLabel'] ?? ''}\n'
            'Province: ${result['province'] ?? ''}\n'
            'City: ${result['city'] ?? ''}\n'
            'Carrier: ${result['carrier'] ?? ''}\n'
            'PhoneNumber: ${result['phoneNumber'] ?? ''}';
        _jsLogs += 'Query executed, result: $_queryResult\n';
      });
    } else {
      // 如果 result 既不是 List 也不是 Map，则输出错误
      setState(() {
        _queryResult = 'Error: Unexpected result format';
        _jsLogs += 'Error: Unexpected result format\n';
      });
    }
  } catch (e) {
    print('Error querying phone number: $e');
    setState(() {
      _queryResult = 'Error querying phone number: $e';
      _jsLogs += 'Error querying phone number: $e\n';
    });
  }
}
*/



Future<Map<String, dynamic>?> _queryPhoneInfo() async {
  if (!_isPluginLoaded) {
    setState(() {
      _queryResult = 'Plugin is not loaded yet. Please load the plugin first.';
      _jsLogs += 'Attempted to query before plugin was loaded\n';
    });
    return null;
  }

  String phoneNumber = _phoneNumberController.text;
  
  // 每次调用 _queryPhoneInfo 时都创建一个新的 Completer
  _queryCompleter = Completer<Map<String, dynamic>?>();



  // 执行查询
    // 将 pluginId 传递给 JavaScript 端
    await _controller.runJavaScript('''
(function(pluginId) {
  // 调用插件的 generateOutput 函数
  if (window.plugin && window.plugin[pluginId]) {
    window.plugin[pluginId].generateOutput("$phoneNumber", null, null);
  } else {
    console.error('Plugin not found or not loaded:', pluginId);
  }
})('$_loadedPluginId');
''');

  // 等待查询结果或超时
    try {
      final result = await _queryCompleter!.future.timeout(const Duration(seconds: 6));
      if (result is Map) {
        setState(() {
        _queryResult = 'Count: ${result?['count'] ?? ''}\n'
            'Source Label: ${result?['sourceLabel'] ?? ''}\n'
            'Province: ${result?['province'] ?? ''}\n'
            'City: ${result?['city'] ?? ''}\n'
            'Carrier: ${result?['carrier'] ?? ''}\n'
            'PhoneNumber: ${result?['phoneNumber'] ?? ''}';
        _jsLogs += 'Query executed, result: $_queryResult\n';
      });
    } else {
      setState(() {
        _queryResult = 'Error: Unexpected result format';
        _jsLogs += 'Error: Unexpected result format\n';
      });
    }
    return result;
  } catch (e) {
    print('Error or timeout waiting for result from JavaScript: $e');
    setState(() {
      _queryResult = 'Error: Timeout or other error';
      _jsLogs += 'Error: Timeout or other error\n';
    });
    return null;
  } 
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            TextField(
              controller: _pluginUrlController,
              decoration: const InputDecoration(hintText: 'Enter plugin URL'),
            ),
            ElevatedButton(
              onPressed: _loadPlugin,
              child: const Text('Load Plugin'),
            ),
            TextField(
              controller: _phoneNumberController,
              decoration: const InputDecoration(hintText: 'Enter phone number'),
            ),
            ElevatedButton(
              onPressed: _queryPhoneInfo,
              child: const Text('Query'),
            ),
            ElevatedButton(
              // onPressed: _checkPluginStatus,
              onPressed: () => _checkPluginStatus(
                  _loadedPluginId ?? ''), // 修改：传入 _loadedPluginId
              child: const Text('Check Plugin Status'),
            ),
            Text('Query Result: $_queryResult',
                style: const TextStyle(fontSize: 16.0)),
            const SizedBox(height: 16.0),
            Expanded(
              child: SingleChildScrollView(
                child: Text('JS Logs:\n$_jsLogs',
                    style: const TextStyle(fontSize: 14.0)),
              ),
            ),
            Expanded(
              child: WebViewWidget(controller: _controller),
            ),
            // 添加 Network 组件
            const Expanded(
              child: Network(), // 这里使用你提供的 Network 组件
            ),
          ],
        ),
      ),
    );
  }
}
