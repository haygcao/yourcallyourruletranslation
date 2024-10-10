import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:webview_flutter/webview_flutter.dart';

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


  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

   void _initializeWebView() {
    _controller = WebViewController()
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
                print('Plugin loaded:${'pluginId'} ${_loadedPluginId}');
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
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) async {
            print('Page finished loading: $url');
            _jsLogs += 'Page finished loading: $url\n';
            // 在页面加载完成后加载 JS 插件
            //  await _loadPlugin();
          },
        ),
      );

    // 初始化 HTTP 拦截器
  HttpInterceptor().register(_controller);

    _controller.loadRequest(Uri.parse('about:blank'));


    
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

  Future<void> _checkPluginStatus(String pluginId) async { // 修改：添加 pluginId 参数
    try {
      final result = await _controller.runJavaScriptReturningResult('''
        window.checkPluginStatus('$pluginId'); // 修改：传入 pluginId 参数
      ''');

      setState(() {
        _jsLogs += 'Plugin status check result for $pluginId: $result\n'; // 修改：添加 pluginId 信息
      });
    } catch (e) {
      print('Error checking plugin status for $pluginId: $e'); // 修改：添加 pluginId 信息
      setState(() {
        _jsLogs += 'Error checking plugin status for $pluginId: $e\n'; // 修改：添加 pluginId 信息
      });
    }
  }

  Future<void> _queryPhoneInfo() async {
    if (!_isPluginLoaded) { // 修改：检查 _loadedPluginId 是否为空
      setState(() {
        _queryResult =
            'Plugin is not loaded yet. Please load the plugin first.';
        _jsLogs += 'Attempted to query before plugin was loaded\n';
      });
      return;
    }

    String phoneNumber = _phoneNumberController.text;

    try {
      final result = await _controller.runJavaScriptReturningResult('''
        window.plugin['$_loadedPluginId'].generateOutput('$phoneNumber', null, null); // 修改：使用 _loadedPluginId 访问插件方法
      ''');

      setState(() {
        _queryResult = result.toString();
        _jsLogs += 'Query executed, result: $_queryResult\n';
      });
    } catch (e) {
      print('Error querying phone number: $e');
      setState(() {
        _queryResult = 'Error querying phone number: $e';
        _jsLogs += 'Error querying phone number: $e\n';
      });
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
               onPressed: () => _checkPluginStatus(_loadedPluginId ?? ''), // 修改：传入 _loadedPluginId
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
            Expanded(
              child: Network(), // 这里使用你提供的 Network 组件
            ),
          ],
        ),
      ),
    );
  }
}
