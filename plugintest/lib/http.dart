import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:webview_flutter/webview_flutter.dart';

import 'network.dart'; // 导入你的 Network 组件代码

/*
class HttpInterceptor {
  static final HttpInterceptor _instance = HttpInterceptor._internal();

  factory HttpInterceptor() {
    return _instance;
  }

  HttpInterceptor._internal();

  void register(WebViewController controller) {
    controller.addJavaScriptChannel(
      'FlutterChannel', // 唯一的 JavaScript 通道
      onMessageReceived: (JavaScriptMessage message) async {
        // 接收 JS 插件发送的 XMLHttpRequest 请求信息
        final requestData = jsonDecode(message.message);
        final method = requestData['method'] as String;
        final url = requestData['url'] as String;
        final headers = (requestData['headers'] as Map<String, dynamic>).cast<String, String>();
        final body = requestData['body'] as String?;



print('Received message from JavaScript: ${message.message}'); // 输出接收到的消息
        print("拦截到 XMLHttpRequest 请求:");
        print("Method: $method");
        print("URL: $url");
        print("Headers: $headers");
        print("Body: $body");

        // 记录请求信息 (发送前)
        String id = _generateUniqueId();
        int startTime = DateTime.now().millisecondsSinceEpoch;
        RequestData requestInfo = RequestData(
          id: id,
          method: method,
          url: url,
          host: Uri.parse(url).host,
          reqHeaders: headers,
          startTime: startTime,
          postData: body,
          readyState: 1, // 设置 readyState 为 1，表示请求已打开
        );
        ajaxStack.updateRequest(id, requestInfo);

        // 发送 HTTP 请求
        final response = await _sendHttpRequest(method, url, headers, body);

        // 更新请求信息 (接收响应后)
        int endTime = DateTime.now().millisecondsSinceEpoch;
        requestInfo
          ..readyState = 4 // 设置 readyState 为 4，表示请求已完成
          ..status = response.statusCode.toString()
          ..resHeaders = response.headers
          ..endTime = endTime
          ..costTime = endTime - startTime
          ..response = response.body; // 直接获取响应体

        ajaxStack.updateRequest(id, requestInfo);

        print("收到响应:");
        print("Status Code: ${response.statusCode}");
        print("Response Body: ${response.body}");

      // 将响应发送回 JS 插件
        controller.runJavaScript('''
          window.postMessage({
            type: 'xhrResponse',
            response: ${jsonEncode({
              'status': response.statusCode,
              'statusText': response.reasonPhrase,
              'responseText': response.body,
              'headers': response.headers,
            })}
          }, '*');
        ''');
      },
    );
  }

    /*
        // 将响应发送回 JS 插件
        controller.runJavaScript('''
          window.dispatchEvent(new CustomEvent('xhrResponse', {
            detail: {
              type: 'xhrResponse',
              response: ${jsonEncode({
                'status': response.statusCode,
                'responseText': response.body,
              })}
            }
          }));
        ''');
      },
    );
  }
*/

  Future<http.Response> _sendHttpRequest(
      String method, String url, Map<String, String> headers, String? body) async {
    switch (method) {
      case 'GET':
        return await http.get(Uri.parse(url), headers: headers);
      case 'POST':
        return await http.post(Uri.parse(url), headers: headers, body: body);
      // ... 处理其他 HTTP 方法
      default:
        throw Exception('Unsupported HTTP method: $method');
    }
  }

  String _generateUniqueId() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }
}

*/

class HttpInterceptor {
  static final HttpInterceptor _instance = HttpInterceptor._internal();

  factory HttpInterceptor() {
    return _instance;
  }

  HttpInterceptor._internal();

  void register(WebViewController controller) {
    controller.addJavaScriptChannel(
      'FlutterChannel', // 唯一的 JavaScript 通道
      onMessageReceived: (JavaScriptMessage message) async {
        print('http拦截的${message.message}'); // 打印 JSON 消息的原始内容
        // 接收 JS 插件发送的 XMLHttpRequest 请求信息
        final requestData = jsonDecode(message.message);

        //  获取或生成 requestId
        final requestId = requestData['requestId'] ?? _generateUniqueId();

        final method = requestData['method'] as String;
        final url = requestData['url'] as String;
        final headers = (requestData['headers'] as Map<String, dynamic>)
            .cast<String, String>();
        final body = requestData['body'] as String?;
        final pluginId = requestData['pluginId'] as String?; // 获取插件 ID

        print('Received message from JavaScript: ${message.message}');
        print("拦截到 XMLHttpRequest 请求:");
        print("Method: $method");
        print("URL: $url");
        print("Headers: $headers");
        print("Body: $body");
        print("Plugin ID: $pluginId");

        // 记录请求信息 (发送前)
        String id = _generateUniqueId();
        int startTime = DateTime.now().millisecondsSinceEpoch;
        RequestData requestInfo = RequestData(
          id: id,
          method: method,
          url: url,
          host: Uri.parse(url).host,
          reqHeaders: headers,
          startTime: startTime,
          postData: body,
          readyState: 1, // 设置 readyState 为 1，表示请求已打开
        );
        ajaxStack.updateRequest(id, requestInfo);

//requestId 放到headers 里面去
   //     final modifiedHeaders = Map<String, String>.from(headers);

   //     modifiedHeaders['requestId'] = requestId;

        // 发送 HTTP 请求
        final response = await _sendHttpRequest(method, url, headers, body);

        // 更新请求信息 (接收响应后)
        int endTime = DateTime.now().millisecondsSinceEpoch;
        requestInfo
          ..readyState = 4 // 设置 readyState 为 4，表示请求已完成
          ..status = response.statusCode.toString()
          ..resHeaders = response.headers
          ..endTime = endTime
          ..costTime = endTime - startTime
          ..response = response.body; // 直接获取响应体

        ajaxStack.updateRequest(id, requestInfo);

        print("收到响应:");
        print("Status Code: ${response.statusCode}");
        print('response.body.length: ${response.body.length}');
        print('response.bodyBytes.length: ${response.bodyBytes.length}');
        print('response.body type: ${response.body.runtimeType}');
        print('response.bodyBytes type: ${response.bodyBytes.runtimeType}');
        debugPrint("Response Body: ${response.body}");
        print(
            "Response Body: ${utf8.decode(response.bodyBytes)}"); // 将 response.bodyBytes 转换为字符串
        print('Before dispatching event: xhrResponse_$pluginId'); // 确认发送前有执行

        // 将响应发送回指定的 JS 插件
        // 准备发送给 JS 的数据
        final eventData = {
          'type': 'xhrResponse_$pluginId',
          'detail': {
            'response': {
              'status': response.statusCode,
              'statusText': response.reasonPhrase,
              'responseText': response.body,
              'headers': response.headers,
            },
            'requestId': requestId,
          },
        };

        print('Posting message to JS with data: ${jsonEncode(eventData)}');
        // 使用 window.postMessage 发送消息
        final jsCode = '''
        window.postMessage(${jsonEncode(eventData)}, '*');
      ''';

        await controller.runJavaScript(jsCode);
      },
    );
  }

  Future<http.Response> _sendHttpRequest(String method, String url,
      Map<String, String> headers, String? body) async {
    switch (method) {
      case 'GET':
        return await http.get(Uri.parse(url), headers: headers);
      case 'POST':
        return await http.post(Uri.parse(url), headers: headers, body: body);
      // ... 处理其他 HTTP 方法
      default:
        throw Exception('Unsupported HTTP method: $method');
    }
  }

  String _generateUniqueId() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }
}
