import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:provider/provider.dart';

import '../../../../components/app_button.dart';
import '../../../../components/leave_offline_ui.dart';
import '../../../../providers/connectivity_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../../../providers/leave_provider.dart';

enum _LeaveRequestStep { form, review, success }

class _LeaveRequestData {
  String leaveType;
  DateTime? startDate;
  DateTime? endDate;
  String reason;
  PlatformFile? attachment;

  _LeaveRequestData()
    : leaveType = 'Casual Leave',
      startDate = null,
      endDate = null,
      reason = '',
      attachment = null;

  int? get totalDays {
    if (startDate == null || endDate == null) return null;
    return endDate!.difference(startDate!).inDays + 1;
  }

  String get dateRangeForReview {
    if (startDate == null || endDate == null) return '';
    if (startDate!.year == endDate!.year &&
        startDate!.month == endDate!.month) {
      return '${_monthName(startDate!.month)} ${startDate!.day.toString().padLeft(2, '0')} '
          '- ${_monthName(endDate!.month)} ${endDate!.day.toString().padLeft(2, '0')}, '
          '${endDate!.year}';
    }
    return '${_formatReviewDate(startDate!)} - ${_formatReviewDate(endDate!)}';
  }
}

String _formatInputDate(DateTime date) {
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '${date.year}-$month-$day';
}

String _formatReviewDate(DateTime date) =>
    '${_monthName(date.month)} ${date.day.toString().padLeft(2, '0')}, ${date.year}';

String _monthName(int month) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months[month - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

class LeaveRequestFormPage extends StatefulWidget {
  const LeaveRequestFormPage({super.key});

  @override
  State<LeaveRequestFormPage> createState() => _LeaveRequestFormPageState();
}

class _LeaveRequestFormPageState extends State<LeaveRequestFormPage> {
  _LeaveRequestStep _step = _LeaveRequestStep.form;
  final _request = _LeaveRequestData();
  final _reasonController = TextEditingController();
  bool _confirmed = false;
  // Updated: DriverLeaveProvider (typed subclass of LeaveProvider)
  DriverLeaveProvider? _leaveProvider;

  @override
  void initState() {
    super.initState();
    _reasonController.addListener(() {
      _request.reason = _reasonController.text;
      setState(() {});
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _leaveProvider = context.read<DriverLeaveProvider>();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _leaveProvider?.resetSubmit();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    if (!context.watch<ConnectivityProvider>().isOnline) {
      return const LeaveRequestOfflineGate();
    }

    switch (_step) {
      case _LeaveRequestStep.form:
        return _LeaveRequestFormView(
          request: _request,
          reasonController: _reasonController,
          onLeaveTypeChanged: (value) {
            if (value == null) return;
            setState(() => _request.leaveType = value);
          },
          onPickStartDate: () => _pickDate(isStartDate: true),
          onPickEndDate: () => _pickDate(isStartDate: false),
          onPickAttachment: _pickAttachment,
          onContinue: _handleContinue,
        );
      case _LeaveRequestStep.review:
        return _ReviewRequestView(
          request: _request,
          confirmed: _confirmed,
          onConfirmChanged: (value) =>
              setState(() => _confirmed = value ?? false),
          onEdit: () => setState(() => _step = _LeaveRequestStep.form),
          onSubmit: _handleSubmit,
        );
      case _LeaveRequestStep.success:
        return const _LeaveSubmittedView();
    }
  }

  Future<void> _pickDate({required bool isStartDate}) async {
    final initialDate = isStartDate
        ? (_request.startDate ?? DateTime.now())
        : (_request.endDate ?? _request.startDate ?? DateTime.now());
    final firstDate = isStartDate
        ? DateTime.now()
        : (_request.startDate ?? DateTime.now());

    final selectedDate = await showDatePicker(
      context: context,
      initialDate: initialDate.isBefore(firstDate) ? firstDate : initialDate,
      firstDate: firstDate,
      lastDate: DateTime(2035),
    );

    if (selectedDate == null) return;
    setState(() {
      if (isStartDate) {
        _request.startDate = selectedDate;
        if (_request.endDate != null &&
            _request.endDate!.isBefore(selectedDate)) {
          _request.endDate = null;
        }
      } else {
        _request.endDate = selectedDate;
      }
    });
  }

  Future<void> _pickAttachment() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['png', 'jpg', 'jpeg', 'pdf'],
      allowMultiple: false,
    );
    if (result == null || result.files.isEmpty) return;
    setState(() => _request.attachment = result.files.single);
  }

  Future<void> _handleContinue() async {
    if (_request.startDate == null || _request.endDate == null) {
      _showMessage('Please select start and end dates.');
      return;
    }
    if (_reasonController.text.trim().isEmpty) {
      _showMessage('Please enter a reason for leave.');
      return;
    }

    final provider = context.read<DriverLeaveProvider>();
    await provider.checkConflict(
      startDate: _request.startDate!,
      endDate: _request.endDate!,
    );

    if (!mounted) return;

    final conflict = provider.conflictResult;
    if (conflict != null && conflict.hasConflict) {
      await _showAssignedJobsDialog(conflict.affectedJobNames);
    } else {
      setState(() {
        _confirmed = false;
        _step = _LeaveRequestStep.review;
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (!_confirmed) {
      _showMessage('Please confirm the information before submitting.');
      return;
    }

    final provider = context.read<DriverLeaveProvider>();
    await provider.submitRequest(
      leaveType: _request.leaveType,
      startDate: _request.startDate!,
      endDate: _request.endDate!,
      reason: _request.reason,
      attachmentUrl: null,
    );

    if (!mounted) return;

    if (provider.error != null) {
      if (provider.submitErrorIsDateOverlap) {
        await _showDateOverlapDialog(provider.error!);
      } else {
        _showMessage(provider.error!);
      }
      provider.clearError();
      return;
    }

    if (provider.submitSuccess) {
      setState(() => _step = _LeaveRequestStep.success);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _showDateOverlapDialog(String message) async {
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      barrierColor: const Color(0xFF111827).withValues(alpha: 0.72),
      builder: (dialogContext) {
        return Dialog(
          insetPadding: EdgeInsets.symmetric(horizontal: SizeConfig.r(22)),
          backgroundColor: Colors.transparent,
          child: Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(
              SizeConfig.r(28),
              SizeConfig.r(28),
              SizeConfig.r(28),
              SizeConfig.r(24),
            ),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(SizeConfig.r(12)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: SizeConfig.r(26),
                  offset: Offset(0, SizeConfig.r(18)),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: SizeConfig.r(72),
                  height: SizeConfig.r(72),
                  decoration: const BoxDecoration(
                    color: Color(0xFFE8F4FC),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.event_busy_rounded,
                    color: const Color(0xFF0284C7),
                    size: SizeConfig.r(40),
                  ),
                ),
                SizedBox(height: SizeConfig.r(22)),
                Text(
                  'Those dates are already covered',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(18),
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF202631),
                  ),
                ),
                SizedBox(height: SizeConfig.r(14)),
                ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(dialogContext).size.height * 0.4,
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      message,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        height: 1.45,
                        color: const Color(0xFF5E636E),
                      ),
                    ),
                  ),
                ),
                SizedBox(height: SizeConfig.r(26)),
                AppButton(
                  label: 'Got it',
                  height: SizeConfig.r(56),
                  borderRadius: SizeConfig.r(11),
                  fontSize: SizeConfig.sp(15),
                  fontWeight: FontWeight.w800,
                  onPressed: () => Navigator.pop(dialogContext),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _showAssignedJobsDialog(List<String> jobNames) async {
    await showDialog<void>(
      context: context,
      barrierColor: const Color(0xFF111827).withValues(alpha: 0.72),
      builder: (dialogContext) {
        final maxH = MediaQuery.sizeOf(dialogContext).height * 0.72;
        return Dialog(
          insetPadding: EdgeInsets.symmetric(horizontal: SizeConfig.r(22)),
          backgroundColor: Colors.transparent,
          child: Container(
            width: double.infinity,
            padding: EdgeInsets.all(SizeConfig.r(30)),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(SizeConfig.r(12)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: SizeConfig.r(26),
                  offset: Offset(0, SizeConfig.r(18)),
                ),
              ],
            ),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxHeight: maxH),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        width: SizeConfig.r(80),
                        height: SizeConfig.r(80),
                        decoration: const BoxDecoration(
                          color: Color(0xFFFFEFD8),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.warning_amber_rounded,
                          color: const Color(0xFFF97316),
                          size: SizeConfig.r(47),
                        ),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(28)),
                    Text(
                      'Assigned Jobs During Leave',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(18),
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF202631),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(15)),
                    Text(
                      'You have scheduled jobs during this period.\nSubmitting this leave may affect assigned routes.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        height: 1.35,
                        color: const Color(0xFF6F727A),
                      ),
                    ),
                    if (jobNames.isNotEmpty) ...[
                      SizedBox(height: SizeConfig.r(16)),
                      Container(
                        width: double.infinity,
                        padding: EdgeInsets.symmetric(
                          horizontal: SizeConfig.r(16),
                          vertical: SizeConfig.r(12),
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(SizeConfig.r(8)),
                          border: Border.all(color: const Color(0xFFFDBA74)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: jobNames
                              .map(
                                (name) => Padding(
                                  padding: EdgeInsets.symmetric(
                                    vertical: SizeConfig.r(2),
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Icon(
                                        Icons.circle,
                                        size: SizeConfig.r(6),
                                        color: const Color(0xFFF97316),
                                      ),
                                      SizedBox(width: SizeConfig.r(8)),
                                      Expanded(
                                        child: Text(
                                          name,
                                          style: TextStyle(
                                            fontSize: SizeConfig.sp(13),
                                            fontWeight: FontWeight.w600,
                                            color: const Color(0xFF92400E),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ),
                    ],
                    SizedBox(height: SizeConfig.r(24)),
                    AppButton(
                      label: 'Continue & Notify Admin',
                      height: SizeConfig.r(58),
                      borderRadius: SizeConfig.r(11),
                      fontSize: SizeConfig.sp(15),
                      fontWeight: FontWeight.w800,
                      onPressed: () {
                        Navigator.pop(dialogContext);
                        setState(() {
                          _confirmed = false;
                          _step = _LeaveRequestStep.review;
                        });
                      },
                    ),
                    SizedBox(height: SizeConfig.r(14)),
                    AppButton(
                      label: 'Cancel & Edit Dates',
                      height: SizeConfig.r(58),
                      borderRadius: SizeConfig.r(11),
                      fontSize: SizeConfig.sp(15),
                      fontWeight: FontWeight.w800,
                      backgroundColor: const Color(0xFFF4F5F7),
                      textColor: const Color(0xFF202631),
                      onPressed: () => Navigator.pop(dialogContext),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

// ── Form view ─────────────────────────────────────────────────────────────────

class _LeaveRequestFormView extends StatelessWidget {
  final _LeaveRequestData request;
  final TextEditingController reasonController;
  final ValueChanged<String?> onLeaveTypeChanged;
  final VoidCallback onPickStartDate;
  final VoidCallback onPickEndDate;
  final VoidCallback onPickAttachment;
  final VoidCallback onContinue;

  const _LeaveRequestFormView({
    required this.request,
    required this.reasonController,
    required this.onLeaveTypeChanged,
    required this.onPickStartDate,
    required this.onPickEndDate,
    required this.onPickAttachment,
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    // Updated: DriverLeaveProvider (typed subclass of LeaveProvider)
    final isChecking = context.watch<DriverLeaveProvider>().isCheckingConflict;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            const _LeaveRequestAppBar(title: 'Leave Request'),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(
                  SizeConfig.r(30),
                  SizeConfig.r(31),
                  SizeConfig.r(30),
                  SizeConfig.r(22),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _RequiredLabel('Leave Type'),
                    SizedBox(height: SizeConfig.r(9)),
                    Container(
                      height: SizeConfig.r(61),
                      padding: EdgeInsets.symmetric(
                        horizontal: SizeConfig.r(14),
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(SizeConfig.r(12)),
                        border: Border.all(
                          color: const Color(0xFFE1E3E8),
                          width: SizeConfig.r(1),
                        ),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: request.leaveType,
                          isExpanded: true,
                          icon: Icon(
                            Icons.keyboard_arrow_down_rounded,
                            color: const Color(0xFF202631),
                            size: SizeConfig.r(34),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'Casual Leave',
                              child: Text('Casual Leave'),
                            ),
                            DropdownMenuItem(
                              value: 'Emergency Leave',
                              child: Text('Emergency Leave'),
                            ),
                            DropdownMenuItem(
                              value: 'Sick Leave',
                              child: Text('Sick Leave'),
                            ),
                          ],
                          onChanged: onLeaveTypeChanged,
                          style: TextStyle(
                            fontSize: SizeConfig.sp(16),
                            color: const Color(0xFF202631),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(31)),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _RequiredLabel('Start Date'),
                              SizedBox(height: SizeConfig.r(9)),
                              _DateBox(
                                request.startDate == null
                                    ? 'Select date'
                                    : _formatInputDate(request.startDate!),
                                onTap: onPickStartDate,
                                isPlaceholder: request.startDate == null,
                              ),
                            ],
                          ),
                        ),
                        SizedBox(width: SizeConfig.r(19)),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _RequiredLabel('End Date'),
                              SizedBox(height: SizeConfig.r(9)),
                              _DateBox(
                                request.endDate == null
                                    ? 'Select date'
                                    : _formatInputDate(request.endDate!),
                                onTap: onPickEndDate,
                                isPlaceholder: request.endDate == null,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (request.totalDays != null) ...[
                      SizedBox(height: SizeConfig.r(25)),
                      Container(
                        width: double.infinity,
                        height: SizeConfig.r(48),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAF5FC),
                          borderRadius: BorderRadius.circular(SizeConfig.r(12)),
                          border: Border.all(
                            color: const Color(0xFFB8DDED),
                            width: SizeConfig.r(1),
                          ),
                        ),
                        child: Text(
                          'Total: ${request.totalDays} Days',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(14),
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0B8DB5),
                          ),
                        ),
                      ),
                    ],
                    SizedBox(height: SizeConfig.r(31)),
                    const _RequiredLabel('Reason for Leave'),
                    SizedBox(height: SizeConfig.r(9)),
                    SizedBox(
                      height: SizeConfig.r(150),
                      child: TextField(
                        controller: reasonController,
                        maxLength: 250,
                        maxLines: null,
                        expands: true,
                        textAlignVertical: TextAlignVertical.top,
                        decoration: InputDecoration(
                          counterText: '',
                          hintText: 'Briefly explain your reason...',
                          hintStyle: TextStyle(
                            fontSize: SizeConfig.sp(14),
                            color: const Color(0xFFB7BBC3),
                          ),
                          contentPadding: EdgeInsets.fromLTRB(
                            SizeConfig.r(15),
                            SizeConfig.r(17),
                            SizeConfig.r(15),
                            SizeConfig.r(12),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(
                              SizeConfig.r(12),
                            ),
                            borderSide: BorderSide(
                              color: const Color(0xFFE1E3E8),
                              width: SizeConfig.r(1),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(
                              SizeConfig.r(12),
                            ),
                            borderSide: BorderSide(
                              color: const Color(0xFF0284C7),
                              width: SizeConfig.r(1),
                            ),
                          ),
                          fillColor: AppColors.background,
                          filled: true,
                        ),
                        style: TextStyle(
                          fontSize: SizeConfig.sp(14),
                          color: const Color(0xFF202631),
                        ),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(11)),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        '${reasonController.text.length}/250',
                        style: TextStyle(
                          fontSize: SizeConfig.sp(12),
                          color: const Color(0xFF9CA3AF),
                        ),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(30)),
                    Text(
                      'Supporting Document',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF3F4652),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(10)),
                    _UploadBox(
                      attachmentName: request.attachment?.name,
                      onTap: onPickAttachment,
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(
                SizeConfig.r(20),
                SizeConfig.r(19),
                SizeConfig.r(20),
                SizeConfig.r(20),
              ),
              decoration: BoxDecoration(
                color: AppColors.background,
                border: Border(
                  top: BorderSide(
                    color: const Color(0xFFE9EAEE),
                    width: SizeConfig.r(1),
                  ),
                ),
              ),
              child: AppButton(
                label: isChecking ? 'Checking...' : 'Continue',
                height: SizeConfig.r(68),
                borderRadius: SizeConfig.r(11),
                fontSize: SizeConfig.sp(15),
                fontWeight: FontWeight.w800,
                onPressed: isChecking ? null : onContinue,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Review view ───────────────────────────────────────────────────────────────

class _ReviewRequestView extends StatelessWidget {
  final _LeaveRequestData request;
  final bool confirmed;
  final ValueChanged<bool?> onConfirmChanged;
  final VoidCallback onEdit;
  final VoidCallback onSubmit;

  const _ReviewRequestView({
    required this.request,
    required this.confirmed,
    required this.onConfirmChanged,
    required this.onEdit,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    // Updated: DriverLeaveProvider (typed subclass of LeaveProvider)
    final isSubmitting = context.watch<DriverLeaveProvider>().isSubmitting;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            _LeaveRequestAppBar(title: 'Review Request', onBack: onEdit),
            Expanded(
              child: Padding(
                padding: EdgeInsets.fromLTRB(
                  SizeConfig.r(30),
                  SizeConfig.r(30),
                  SizeConfig.r(30),
                  0,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _ReviewCard(request: request),
                      SizedBox(height: SizeConfig.r(35)),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: SizeConfig.r(24),
                            height: SizeConfig.r(24),
                            child: Checkbox(
                              value: confirmed,
                              onChanged: onConfirmChanged,
                              side: BorderSide(
                                color: const Color(0xFF202631),
                                width: SizeConfig.r(1),
                              ),
                              activeColor: const Color(0xFF0284C7),
                              materialTapTargetSize:
                                  MaterialTapTargetSize.shrinkWrap,
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                          SizedBox(width: SizeConfig.r(13)),
                          Expanded(
                            child: Text(
                              'I confirm the above information is accurate.',
                              style: TextStyle(
                                fontSize: SizeConfig.sp(14),
                                height: 1.35,
                                color: const Color(0xFF5E636E),
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: SizeConfig.r(16)),
                    ],
                  ),
                ),
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(
                SizeConfig.r(20),
                SizeConfig.r(19),
                SizeConfig.r(20),
                SizeConfig.r(20),
              ),
              decoration: BoxDecoration(
                color: AppColors.background,
                border: Border(
                  top: BorderSide(
                    color: const Color(0xFFE9EAEE),
                    width: SizeConfig.r(1),
                  ),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: AppButton(
                      label: 'Edit',
                      height: SizeConfig.r(68),
                      borderRadius: SizeConfig.r(11),
                      fontSize: SizeConfig.sp(15),
                      fontWeight: FontWeight.w800,
                      backgroundColor: const Color(0xFFF4F5F7),
                      textColor: const Color(0xFF202631),
                      onPressed: isSubmitting ? null : onEdit,
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(19)),
                  Expanded(
                    child: AppButton(
                      label: isSubmitting ? 'Submitting...' : 'Submit Request',
                      height: SizeConfig.r(68),
                      borderRadius: SizeConfig.r(11),
                      fontSize: SizeConfig.sp(15),
                      fontWeight: FontWeight.w800,
                      onPressed: isSubmitting ? null : onSubmit,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Success view ──────────────────────────────────────────────────────────────

class _LeaveSubmittedView extends StatelessWidget {
  const _LeaveSubmittedView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            SizeConfig.r(40),
            SizeConfig.r(58),
            SizeConfig.r(40),
            SizeConfig.r(40),
          ),
          child: Column(
            children: [
              Container(
                width: SizeConfig.r(122),
                height: SizeConfig.r(122),
                decoration: const BoxDecoration(
                  color: Color(0xFFD8FFE5),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.check_rounded,
                  color: const Color(0xFF20C46B),
                  size: SizeConfig.r(80),
                ),
              ),
              SizedBox(height: SizeConfig.r(43)),
              Text(
                'Leave Request\nSubmitted',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: SizeConfig.sp(22),
                  height: 1.25,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF202631),
                ),
              ),
              SizedBox(height: SizeConfig.r(16)),
              Text(
                'Your request has been sent successfully.\nThe admin will review it and you will\nbe notified shortly.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  height: 1.45,
                  color: const Color(0xFF6F727A),
                ),
              ),
              const Spacer(),
              AppButton(
                label: 'View Leave Status',
                height: SizeConfig.r(70),
                borderRadius: SizeConfig.r(11),
                fontSize: SizeConfig.sp(15),
                fontWeight: FontWeight.w800,
                onPressed: () => Navigator.pop(context),
              ),
              SizedBox(height: SizeConfig.r(16)),
              AppButton(
                label: 'Back to Dashboard',
                height: SizeConfig.r(70),
                borderRadius: SizeConfig.r(11),
                fontSize: SizeConfig.sp(15),
                fontWeight: FontWeight.w800,
                backgroundColor: const Color(0xFFF4F5F7),
                textColor: const Color(0xFF202631),
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    AppRoutes.driverDashboard,
                    (route) => false,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Shared widgets ────────────────────────────────────────────────────────────

class _LeaveRequestAppBar extends StatelessWidget {
  final String title;
  final VoidCallback? onBack;
  const _LeaveRequestAppBar({required this.title, this.onBack});

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
            onPressed: onBack ?? () => Navigator.maybePop(context),
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

class _RequiredLabel extends StatelessWidget {
  final String label;
  const _RequiredLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(
        text: label,
        style: TextStyle(
          fontSize: SizeConfig.sp(14),
          fontWeight: FontWeight.w700,
          color: const Color(0xFF3F4652),
        ),
        children: const [
          TextSpan(
            text: '*',
            style: TextStyle(color: AppColors.error),
          ),
        ],
      ),
    );
  }
}

class _DateBox extends StatelessWidget {
  final String date;
  final VoidCallback onTap;
  final bool isPlaceholder;
  const _DateBox(this.date, {required this.onTap, required this.isPlaceholder});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: SizeConfig.r(62),
        alignment: Alignment.centerLeft,
        padding: EdgeInsets.symmetric(horizontal: SizeConfig.r(15)),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(SizeConfig.r(12)),
          border: Border.all(
            color: const Color(0xFFE1E3E8),
            width: SizeConfig.r(1),
          ),
        ),
        child: Text(
          date,
          style: TextStyle(
            fontSize: SizeConfig.sp(15),
            color: isPlaceholder
                ? const Color(0xFFB7BBC3)
                : const Color(0xFF202631),
          ),
        ),
      ),
    );
  }
}

class _UploadBox extends StatelessWidget {
  final String? attachmentName;
  final VoidCallback onTap;
  const _UploadBox({required this.attachmentName, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final hasAttachment = attachmentName != null && attachmentName!.isNotEmpty;
    return GestureDetector(
      onTap: onTap,
      child: CustomPaint(
        painter: _DashedBorderPainter(
          color: const Color(0xFFE1E3E8),
          radius: SizeConfig.r(12),
        ),
        child: Container(
          width: double.infinity,
          height: SizeConfig.r(162),
          alignment: Alignment.center,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                hasAttachment
                    ? Icons.insert_drive_file_rounded
                    : Icons.cloud_upload_rounded,
                size: SizeConfig.r(56),
                color: const Color(0xFFD1D5DB),
              ),
              SizedBox(height: SizeConfig.r(8)),
              if (hasAttachment)
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: SizeConfig.r(16)),
                  child: Text(
                    attachmentName!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0284A8),
                    ),
                  ),
                )
              else
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: 'Upload a file',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0284A8),
                        ),
                      ),
                      const TextSpan(text: ' or drag and drop'),
                    ],
                  ),
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    color: const Color(0xFF6F727A),
                  ),
                ),
              SizedBox(height: SizeConfig.r(6)),
              Text(
                hasAttachment
                    ? 'Tap to change file'
                    : 'PNG, JPG, PDF up to 5MB',
                style: TextStyle(
                  fontSize: SizeConfig.sp(12),
                  color: const Color(0xFF9CA3AF),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final _LeaveRequestData request;
  const _ReviewCard({required this.request});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(
        SizeConfig.r(25),
        SizeConfig.r(27),
        SizeConfig.r(25),
        SizeConfig.r(26),
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.r(12)),
        border: Border.all(
          color: const Color(0xFFE1E3E8),
          width: SizeConfig.r(1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: SizeConfig.r(5),
            offset: Offset(0, SizeConfig.r(2)),
          ),
        ],
      ),
      child: Column(
        children: [
          _ReviewRow(label: 'Leave Type', value: request.leaveType),
          SizedBox(height: SizeConfig.r(21)),
          _ReviewRow(label: 'Date Range', value: request.dateRangeForReview),
          SizedBox(height: SizeConfig.r(21)),
          _ReviewRow(label: 'Total Days', value: '${request.totalDays} Days'),
          SizedBox(height: SizeConfig.r(28)),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: SizeConfig.r(116),
                child: Text(
                  'Reason',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    color: const Color(0xFF6F727A),
                  ),
                ),
              ),
              Expanded(
                child: Text(
                  request.reason.trim(),
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    height: 1.35,
                    color: const Color(0xFF202631),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(26)),
          Row(
            children: [
              SizedBox(
                width: SizeConfig.r(116),
                child: Text(
                  'Attachment',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    color: const Color(0xFF6F727A),
                  ),
                ),
              ),
              Icon(
                Icons.attach_file_rounded,
                color: const Color(0xFF0284A8),
                size: SizeConfig.r(20),
              ),
              SizedBox(width: SizeConfig.r(4)),
              Expanded(
                child: Text(
                  request.attachment?.name ?? 'No attachment',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0284A8),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  final String label;
  final String value;
  const _ReviewRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: SizeConfig.r(116),
          child: Text(
            label,
            style: TextStyle(
              fontSize: SizeConfig.sp(14),
              color: const Color(0xFF6F727A),
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: SizeConfig.sp(15),
              fontWeight: FontWeight.w800,
              color: const Color(0xFF202631),
            ),
          ),
        ),
      ],
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  final Color color;
  final double radius;
  const _DashedBorderPainter({required this.color, required this.radius});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = SizeConfig.r(1)
      ..style = PaintingStyle.stroke;
    final path = Path()
      ..addRRect(
        RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)),
      );
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = distance + SizeConfig.r(4);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance = next + SizeConfig.r(4);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedBorderPainter old) =>
      old.color != color || old.radius != radius;
}
