import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../generated/l10n.dart';
import '../../utils/blocked_call_repository.dart';
import 'blocked_calls_chart.dart';

class BlockedCallsPage extends StatefulWidget {
  final BlockedCallRepository repository;

  const BlockedCallsPage({super.key, required this.repository});

  @override
  BlockedCallsPageState createState() => BlockedCallsPageState();
}

class BlockedCallsPageState extends State<BlockedCallsPage> {
  List<BlockedCall> _blockedCalls = [];

  @override
  void initState() {
    super.initState();
    _loadBlockedCalls();
  }

  Future<void> _loadBlockedCalls() async {
    final calls = await widget.repository.getBlockedCalls();
    setState(() {
      _blockedCalls = calls;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(S.of(context).blockedCalls),
      ),
      body: Column(
        children: [
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: BlockedCallsChart(repository: widget.repository),
            ),
          ),
          Expanded(
            flex: 3,
            child: ListView.builder(
              itemCount: _blockedCalls.length,
              itemBuilder: (context, index) {
                final call = _blockedCalls[index];
                return ListTile(
                  title: Text(call.phoneNumber),
                  subtitle: Text(call.timestamp.toString()),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
