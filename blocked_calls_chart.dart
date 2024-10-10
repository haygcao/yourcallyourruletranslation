import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../generated/l10n.dart';
import '../../utils/blocked_call_repository.dart';

class BlockedCallsChart extends StatefulWidget {
  final BlockedCallRepository repository;

  const BlockedCallsChart({super.key, required this.repository});

  @override
  BlockedCallsChartState createState() => BlockedCallsChartState();
}

class BlockedCallsChartState extends State<BlockedCallsChart> {
  List<BarChartGroupData> _weeklyData = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final calls = await widget.repository.getBlockedCalls();
    final now = DateTime.now();
    final weekDates = List.generate(7, (index) => now.subtract(Duration(days: index)));

    setState(() {
      _weeklyData = weekDates.asMap().entries.map((entry) {
        final index = entry.key;
        final date = entry.value;
        final count = calls.where((call) =>
          call.timestamp.year == date.year &&
          call.timestamp.month == date.month &&
          call.timestamp.day == date.day
        ).length;

        return BarChartGroupData(
          x: index,
          barRods: [BarChartRodData(toY: count.toDouble())],
        );
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
  return OrientationBuilder(
    builder: (context, orientation) {
      final mediaQuery = MediaQuery.of(context);

      // 根据屏幕方向和宽度设置 cardWidth 和 cardHeight
      final chartWidth = (orientation == Orientation.portrait 
          ? (mediaQuery.size.width < 600
              ? mediaQuery.size.width * 0.95
              : mediaQuery.size.width < 1000
                  ? mediaQuery.size.width * 0.8
                  : mediaQuery.size.width * 0.6)
          : (mediaQuery.size.width < 900
              ? mediaQuery.size.width * 0.8
              : mediaQuery.size.width * 0.6));
      final chartHeight = chartWidth * (mediaQuery.size.width < 600 ? 0.4 : 0.3);
    
    return Column(
      children: [
        SizedBox(
            width: chartWidth, // 应用计算的宽度
            height: chartHeight, // 应用计算的高度
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: _weeklyData.isEmpty ? 1 : null,
              barTouchData: BarTouchData(enabled: false),
              titlesData: FlTitlesData(
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (double value, TitleMeta meta) {
                      switch (value.toInt()) {
                        case 0: return Text(S.of(context).today);
                        case 1: return Text('1d ago');
                        case 3: return Text('3d ago');
                        case 6: return Text('1w ago');
                        default: return const Text('');
                      }
                    },
                  ),
                ),
                leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              borderData: FlBorderData(show: false),
              barGroups: _weeklyData.reversed.toList(),
            ),
          ),
        ),
        Text(S.of(context).weeklyBlockedCallsSummary, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
       ],
      );
    },
  );
}


}
