import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

class AjaxStack {
  List<String> requestIds = [];
  HashMap<String, RequestData> requests = HashMap();
  int maxLength = 200;
  List<Function(RequestData?)> listeners = [];

  void notify(RequestData? args) async {
    await Future.delayed(Duration(milliseconds: 10));
    for (var callback in listeners) {
      callback(args);
    }
  }

  List<String> getRequestIds() => requestIds;

  HashMap<String, RequestData> getRequests() => requests;

  RequestData getRequest(String id) => requests[id] ?? RequestData(id: id);

  String formatResponse(dynamic response) {
    if (response != null) {
      if (response is String) {
        try {
          response = jsonDecode(response);
        } catch (e) {
          // 不是 JSON 字符串
        }
      }
      return JsonEncoder.withIndent('  ').convert(response);
    } else {
      return '{}';
    }
  }

  void updateRequest(String id, RequestData data) {
    if (requestIds.length > maxLength) {
      String _id = requestIds.last;
      requestIds.removeLast();
      requests.remove(_id);
    }

    // 使用新数据更新或创建请求
    requests.update(
        id,
        (existing) => existing
          ..index = data.index
          ..host = data.host
          ..url = data.url
          ..status = data.status
          ..method = data.method
          ..costTime = data.costTime
          ..resHeaders = data.resHeaders
          ..reqHeaders = data.reqHeaders
          ..getData = data.getData
          ..postData = data.postData
          ..response = data.response
          ..actived = data.actived
          ..startTime = data.startTime
          ..endTime = data.endTime
          ..responseType = data.responseType
          ..readyState = data.readyState,
        ifAbsent: () => data);

    // 处理不同状态和响应类型
    RequestData item = requests[id]!;

    switch (data.responseType) {
      case '':
      case 'text':
        if (data.response is String) {
          try {
            item.response = formatResponse(data.response);
          } catch (e) {
            item.response = data.response;
          }
        } else if (data.response != null) {
          item.response = data.response.toString();
        }
        break;
      case 'json':
        if (data.response != null) {
          item.response = formatResponse(data.response);
        }
        break;
      default:
        // 处理其他响应类型，例如二进制数据
        // item.response = data.response;
        break;
    }

    if (data.readyState == 0 || data.readyState == 1) {
      item.status = 'Pending';
    } else if (data.readyState == 2 || data.readyState == 3) {
      item.status = 'Loading';
    } else if (data.readyState == 4) {
      // do nothing
    } else {
      item.status = 'Unknown';
    }

    if (!requestIds.contains(id)) {
      requestIds.insert(0, id);
    }

    notify(requests[id]);
  }

  void clearRequests() {
    requestIds.clear();
    requests.clear();
    notify(null);
  }

  void attach(Function(RequestData?) callback) {
    listeners.add(callback);
  }
}

class RequestData {
  String id;
  int index = 0;
  String host = '';
  String url = '';
  String status = '';
  String method = '';
  int costTime = 0; // costTime 类型为 int
  Map<String, String>? resHeaders;
  Map<String, String>? reqHeaders;
  Map<String, String>? getData;
  String? postData;
  dynamic response;
  bool actived = false;
  int startTime = 0;
  int endTime = 0;
  String responseType = '';
  int readyState = 0;

  RequestData({
    required this.id,
    this.index = 0,
    this.host = '',
    this.url = '',
    this.status = '',
    this.method = '',
    this.costTime = 0,
    this.resHeaders,
    this.reqHeaders,
    this.getData,
    this.postData,
    this.response,
    this.actived = false,
    this.startTime = 0,
    this.endTime = 0,
    this.responseType = '',
    this.readyState = 0,
  });
}

class Network extends StatefulWidget {
  const Network({super.key});

  @override
  State<Network> createState() => _NetworkState();
}

class _NetworkState extends State<Network> {
  String? showingId;
  List<String> requestIds = [];
  HashMap<String, RequestData> requests = HashMap();
  String filterValue = '';
  RegExp? regInstance;
  final ScrollController _scrollController = ScrollController();
  TextEditingController _filterController = TextEditingController();

  @override
  void initState() {
    super.initState();
    ajaxStack.attach((currentRequest) {
      setState(() {
        requestIds = ajaxStack.getRequestIds();
        requests = ajaxStack.getRequests();
      });
    });

    // 初始化 HTTP 拦截
    traceNetwork();
  }

  @override
  void dispose() {
    // 清理监听器
    ajaxStack.listeners.clear();
    _filterController.dispose();
    super.dispose();
  }

  void clearRequests() {
    ajaxStack.clearRequests();
  }

  Widget _buildListHeader() {
    int count = requests.length;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
          ),
          child: Row(
            children: [
              Expanded(
                flex: 3,
                child: Text(
                  '($count) Host',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Expanded(
                flex: 1,
                child: Text(
                  'Method',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Expanded(
                flex: 1,
                child: Text(
                  'Status',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              SizedBox(
                width: 90,
                child: Text(
                  'Time/Retry',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _filterController,
                  decoration: const InputDecoration(
                    hintText: '输入过滤条件...',
                    border: InputBorder.none,
                  ),
                  onSubmitted: (value) {
                    setState(() {
                      filterValue = value;
                      regInstance = RegExp(filterValue, caseSensitive: false);
                    });
                  },
                ),
              ),
              IconButton(
                onPressed: () {
                  setState(() {
                    filterValue = '';
                    _filterController.clear();
                    regInstance = null;
                  });
                },
                icon: const Icon(Icons.close),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void copy2cURL(RequestData item) {
    String headerStr = '';
    if (item.reqHeaders != null) {
      item.reqHeaders!.forEach((key, value) {
        headerStr += " -H '$key: $value'";
      });
    }
    String cURL = "curl -X ${item.method} '${item.url}' $headerStr";
    if (item.method == 'POST' && item.postData != null) {
      cURL += " --data-binary '${item.postData}'";
    }
    Clipboard.setData(ClipboardData(text: cURL));
  }

  void retryFetch(RequestData item) async {
    var headers = item.reqHeaders;
    var body = item.postData;

    switch (item.method) {
      case 'GET':
        await http.get(Uri.parse(item.url), headers: headers);
        break;
      case 'POST':
        await http.post(Uri.parse(item.url), headers: headers, body: body);
        break;
      // 其他请求方法...
    }
  }

  Widget _buildListItem(RequestData item) {
    if (filterValue.isNotEmpty &&
        regInstance != null &&
        !regInstance!.hasMatch(item.url)) {
      return const SizedBox.shrink();
    }
    return Column(
      children: [
        GestureDetector(
          onTap: () {
            setState(() {
              showingId = showingId == item.id ? null : item.id;
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
              color: showingId == item.id
                  ? Colors.yellow.shade100
                  : (int.tryParse(item.status) ?? 200) >= 400
                      ? Colors.red.shade100
                      : Colors.transparent,
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: Text(
                    '(${item.index}) ${item.host}',
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Text(item.method),
                ),
                Expanded(
                  flex: 1,
                  child: Text(item.status),
                ),
                SizedBox(
                  width: 90,
                  child: TextButton(
                    onPressed: () => retryFetch(item),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      backgroundColor: Colors.grey.shade200,
                    ),
                    child: Text(item.costTime.toString() + " ms"),
                  ),
                ),
              ],
            ),
          ),
        ),
        if (showingId == item.id)
          Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Operate',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                TextButton(
                  onPressed: () => copy2cURL(item),
                  child: const Text('[ Copy cURL to clipboard ]'),
                ),
                TextButton(
                  onPressed: () {
                    Clipboard.setData(
                        ClipboardData(text: item.response.toString()));
                  },
                  child: const Text('[ Copy response to clipboard ]'),
                ),
                const Text(
                  'General',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                _buildDetailRow('URL:', item.url),
                _buildDetailRow('startTime:', item.startTime.toString()),
                _buildDetailRow('endTime:', item.endTime.toString()),
                if (item.reqHeaders != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Request Header',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      ...item.reqHeaders!.entries
                          .map((entry) =>
                              _buildDetailRow(entry.key + ':', entry.value))
                          .toList(),
                    ],
                  ),
                if (item.resHeaders != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Response Header',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      ...item.resHeaders!.entries
                          .map((entry) =>
                              _buildDetailRow(entry.key + ':', entry.value))
                          .toList(),
                    ],
                  ),
                if (item.getData != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Query String Parameters',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      ...item.getData!.entries
                          .map((entry) =>
                              _buildDetailRow(entry.key + ':', entry.value))
                          .toList(),
                    ],
                  ),
                if (item.postData != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Form Data',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(item.postData!),
                    ],
                  ),
                const Text(
                  'Response',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(item.response?.toString() ?? ''),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text('$label '),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

/*
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Network'),
        actions: [
          IconButton(
            onPressed: clearRequests,
            icon: const Icon(Icons.delete),
          ),
        ],
      ),
      body: requestIds.isNotEmpty
          ? ListView.builder(
              controller: _scrollController,
              itemCount: requestIds.length,
              itemBuilder: (context, index) {
                String requestId = requestIds[index];
                return _buildListItem(requests[requestId]!);
              },
            )
          : const Center(child: Text('Loading...')),
    );
  }
}
*/
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Network'),
        actions: [
          IconButton(
            onPressed: clearRequests,
            icon: const Icon(Icons.delete),
          ),
        ],
      ),
      body: requestIds.isNotEmpty
          ? ListView.builder(
              controller: _scrollController,
              itemCount: requestIds.length + 1, // 增加一个头部 item
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _buildListHeader(); // 在头部显示 _buildListHeader
                } else {
                  String requestId = requestIds[index - 1]; // 调整索引
                  return _buildListItem(requests[requestId]!);
                }
              },
            )
          : const Center(child: Text('Loading...')),
    );
  }
}

// 全局 AjaxStack 实例
final ajaxStack = AjaxStack();

// 用于拦截 HTTP 请求的函数
void traceNetwork() {
  HttpOverrides.global = MyHttpOverrides();
}

class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback =
          (X509Certificate cert, String host, int port) => true;
  }

  http.Client getClient() {
    return MyHttpClient();
  }
}

class MyHttpClient implements http.Client {
  final http.Client _client = http.Client();

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    String id = _generateUniqueId();
    int startTime = DateTime.now().millisecondsSinceEpoch;

    RequestData requestData = RequestData(
      id: id,
      method: request.method,
      url: request.url.toString(),
      host: request.url.host,
      reqHeaders: request.headers,
      startTime: startTime,
    );

    if (request is http.Request && request.body.isNotEmpty) {
      requestData.postData = request.body;
    }

    ajaxStack.updateRequest(id, requestData);

    http.StreamedResponse response;
    try {
      response = await _client.send(request);
    } catch (e) {
      int endTime = DateTime.now().millisecondsSinceEpoch;
      requestData
        ..readyState = 4
        ..status = 'Error'
        ..endTime = endTime
        ..costTime = endTime - startTime
        ..response = e.toString();
      ajaxStack.updateRequest(id, requestData);
      rethrow;
    }

    int endTime = DateTime.now().millisecondsSinceEpoch;

    requestData
      ..readyState = 4
      ..status = response.statusCode.toString()
      ..resHeaders = response.headers
      ..endTime = endTime
      ..costTime = endTime - startTime;

    if (response.headers['content-type']?.contains('application/json') ==
        true) {
      requestData.responseType = 'json';
      requestData.response = await response.stream.bytesToString();
    } else if (response.headers['content-type']?.contains('text/plain') ==
        true) {
      requestData.responseType = 'text';
      requestData.response = await response.stream.bytesToString();
    } else {
      requestData.responseType = 'binary';
      requestData.response = await response.stream.toBytes(); // 获取二进制数据
    }

    ajaxStack.updateRequest(id, requestData);

    return response;
  }

  @override
  void close() {
    _client.close();
  }

  String _generateUniqueId() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }

  // 实现 Client 接口中缺失的方法
  @override
  Future<http.Response> head(Uri url, {Map<String, String>? headers}) {
    return _client.head(url, headers: headers);
  }

  @override
  Future<http.Response> get(Uri url, {Map<String, String>? headers}) {
    return _client.get(url, headers: headers);
  }

  @override
  Future<http.Response> post(Uri url,
      {Map<String, String>? headers, Object? body, Encoding? encoding}) {
    return _client.post(url, headers: headers, body: body, encoding: encoding);
  }

  @override
  Future<http.Response> put(Uri url,
      {Map<String, String>? headers, Object? body, Encoding? encoding}) {
    return _client.put(url, headers: headers, body: body, encoding: encoding);
  }

  @override
  Future<http.Response> patch(Uri url,
      {Map<String, String>? headers, Object? body, Encoding? encoding}) {
    return _client.patch(url, headers: headers, body: body, encoding: encoding);
  }

  @override
  Future<http.Response> delete(Uri url,
      {Map<String, String>? headers, Object? body, Encoding? encoding}) {
    return _client.delete(url,
        headers: headers, body: body, encoding: encoding);
  }

  @override
  Future<String> read(Uri url, {Map<String, String>? headers}) {
    return _client.read(url, headers: headers);
  }

  @override
  Future<Uint8List> readBytes(Uri url, {Map<String, String>? headers}) {
    return _client.readBytes(url, headers: headers);
  }
}
