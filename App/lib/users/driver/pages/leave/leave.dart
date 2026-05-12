import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../components/app_button.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../../../providers/driver_leave_provider.dart';
import '../../../../users/driver/models/driver_leave_model.dart';

class DriverLeavePage extends StatefulWidget {
  const DriverLeavePage({super.key});

  @override
  State<DriverLeavePage> createState() => _DriverLeavePageState();
}

class _DriverLeavePageState extends State<DriverLeavePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DriverLeaveProvider>().loadLeaveData();
    });
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            const _LeaveAppBar(title: 'Apply for Leave'),
            Expanded(
              child: Padding(
                padding: EdgeInsets.fromLTRB(
                  SizeConfig.r(30),
                  SizeConfig.r(31),
                  SizeConfig.r(30),
                  SizeConfig.r(28),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Consumer<DriverLeaveProvider>(
                        builder: (context, provider, _) {
                          if (provider.isLoading) {
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          }

                          return SingleChildScrollView(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Request time off from assigned duties',
                                  style: TextStyle(
                                    fontSize: SizeConfig.sp(14),
                                    fontWeight: FontWeight.w400,
                                    color: const Color(0xFF74777F),
                                  ),
                                ),
                                SizedBox(height: SizeConfig.r(32)),
                                _LeaveSummaryCard(
                                  pending: provider.pendingCount,
                                  rejected: provider.rejectedCount,
                                  approved: provider.approvedCount,
                                ),
                                SizedBox(height: SizeConfig.r(31)),
                                Text(
                                  'Leave History',
                                  style: TextStyle(
                                    fontSize: SizeConfig.sp(17),
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF202631),
                                  ),
                                ),
                                SizedBox(height: SizeConfig.r(20)),
                                if (provider.history.isEmpty)
                                  _EmptyHistory()
                                else
                                  _LeaveHistoryList(history: provider.history),
                                SizedBox(height: SizeConfig.r(16)),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(12)),
                    AppButton(
                      label: 'Request Leave',
                      height: SizeConfig.r(70),
                      borderRadius: SizeConfig.r(12),
                      fontSize: SizeConfig.sp(15),
                      fontWeight: FontWeight.w700,
                      onPressed: () async {
                        await Navigator.pushNamed(
                          context,
                          AppRoutes.driverLeaveRequest,
                        );
                        // Refresh when returning from the form
                        if (mounted && context.mounted) {
                          context.read<DriverLeaveProvider>().loadLeaveData(
                            silent: true,
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyHistory extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: SizeConfig.r(40)),
        child: Column(
          children: [
            Icon(
              Icons.event_busy_rounded,
              size: SizeConfig.r(48),
              color: const Color(0xFFCBCDD4),
            ),
            SizedBox(height: SizeConfig.r(14)),
            Text(
              'No leave requests yet',
              style: TextStyle(
                fontSize: SizeConfig.sp(14),
                color: const Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── History list ──────────────────────────────────────────────────────────────

class _LeaveHistoryList extends StatelessWidget {
  final List<DriverLeaveRequest> history;

  const _LeaveHistoryList({required this.history});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: history.map((req) {
        final style = _statusStyle(req.status);
        return _LeaveHistoryCard(
          title: req.leaveType,
          date: req.dateRangeLabel,
          status: _statusLabel(req.status),
          statusColor: style.$1,
          statusBg: style.$2,
          adminComment: req.adminNotes,
        );
      }).toList(),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  }

  // Returns (text color, background color)
  (Color, Color) _statusStyle(String status) {
    switch (status) {
      case 'approved':
        return (const Color(0xFF2EAC59), const Color(0xFFE8FFF0));
      case 'rejected':
        return (const Color(0xFFC9434F), const Color(0xFFFFE8ED));
      default:
        return (const Color(0xFFC58A12), const Color(0xFFFFF7C8));
    }
  }
}

// ── Leave history page ────────────────────────────────────────────────────────

class LeaveHistoryPage extends StatelessWidget {
  const LeaveHistoryPage({super.key});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            const _LeaveAppBar(title: 'Leave History'),
            Expanded(
              child: Consumer<DriverLeaveProvider>(
                builder: (context, provider, _) {
                  if (provider.isLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (provider.history.isEmpty) {
                    return _EmptyHistory();
                  }
                  return SingleChildScrollView(
                    padding: EdgeInsets.fromLTRB(
                      SizeConfig.r(30),
                      SizeConfig.r(30),
                      SizeConfig.r(30),
                      SizeConfig.r(30),
                    ),
                    child: _LeaveHistoryList(history: provider.history),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── App bar ───────────────────────────────────────────────────────────────────

class _LeaveAppBar extends StatelessWidget {
  final String title;

  const _LeaveAppBar({required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: SizeConfig.r(74),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(
          bottom: BorderSide(
            color: const Color(0xFFE9EAEE),
            width: SizeConfig.r(1),
          ),
        ),
      ),
      child: Row(
        children: [
          SizedBox(width: SizeConfig.r(8)),
          IconButton(
            onPressed: () => Navigator.maybePop(context),
            icon: Icon(
              Icons.arrow_back,
              color: const Color(0xFF39404A),
              size: SizeConfig.r(30),
            ),
          ),
          SizedBox(width: SizeConfig.r(2)),
          Text(
            title,
            style: TextStyle(
              fontSize: SizeConfig.sp(17),
              fontWeight: FontWeight.w800,
              color: const Color(0xFF202631),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Summary card ──────────────────────────────────────────────────────────────

class _LeaveSummaryCard extends StatelessWidget {
  final int pending;
  final int rejected;
  final int approved;

  const _LeaveSummaryCard({
    required this.pending,
    required this.rejected,
    required this.approved,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(26),
        vertical: SizeConfig.r(23),
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.r(12)),
        border: Border.all(
          color: const Color(0xFFE9EAEE),
          width: SizeConfig.r(1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: SizeConfig.r(5),
            offset: Offset(0, SizeConfig.r(2)),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _LeaveSummaryItem(
              value: '$pending',
              label: 'Pending',
              color: const Color(0xFFE77D12),
            ),
          ),
          _SummaryDivider(),
          Expanded(
            child: _LeaveSummaryItem(
              value: '$rejected',
              label: 'Rejected',
              color: const Color(0xFFC9434F),
            ),
          ),
          _SummaryDivider(),
          Expanded(
            child: _LeaveSummaryItem(
              value: '$approved',
              label: 'Approved',
              color: const Color(0xFF20BE63),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: SizeConfig.r(1),
      height: SizeConfig.r(65),
      color: const Color(0xFFE9EAEE),
    );
  }
}

class _LeaveSummaryItem extends StatelessWidget {
  final String value;
  final String label;
  final Color color;

  const _LeaveSummaryItem({
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: SizeConfig.sp(22),
            height: 1,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        SizedBox(height: SizeConfig.r(11)),
        Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(12),
            fontWeight: FontWeight.w400,
            color: const Color(0xFF6F727A),
          ),
        ),
      ],
    );
  }
}

// ── History card ──────────────────────────────────────────────────────────────

class _LeaveHistoryCard extends StatelessWidget {
  final String title;
  final String date;
  final String status;
  final Color statusColor;
  final Color statusBg;
  final String? adminComment;

  const _LeaveHistoryCard({
    required this.title,
    required this.date,
    required this.status,
    required this.statusColor,
    required this.statusBg,
    this.adminComment,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: SizeConfig.r(20)),
      padding: EdgeInsets.fromLTRB(
        SizeConfig.r(20),
        SizeConfig.r(21),
        SizeConfig.r(20),
        SizeConfig.r(20),
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.r(12)),
        border: Border.all(
          color: const Color(0xFFE9EAEE),
          width: SizeConfig.r(1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: SizeConfig.r(5),
            offset: Offset(0, SizeConfig.r(2)),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(16),
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF202631),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(5)),
                    Text(
                      date,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        fontWeight: FontWeight.w400,
                        color: const Color(0xFF6F727A),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: SizeConfig.r(13),
                  vertical: SizeConfig.r(8),
                ),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(SizeConfig.r(20)),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          if (adminComment != null && adminComment!.isNotEmpty) ...[
            SizedBox(height: SizeConfig.r(16)),
            Container(
              width: double.infinity,
              padding: EdgeInsets.fromLTRB(
                SizeConfig.r(18),
                SizeConfig.r(16),
                SizeConfig.r(14),
                SizeConfig.r(16),
              ),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF0F2),
                borderRadius: BorderRadius.circular(SizeConfig.r(8)),
                border: Border(
                  left: BorderSide(
                    color: AppColors.error,
                    width: SizeConfig.r(4),
                  ),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Admin Comment:',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFFD14956),
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(8)),
                  Text(
                    adminComment!,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      height: 1.35,
                      fontWeight: FontWeight.w400,
                      color: const Color(0xFF565A64),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
