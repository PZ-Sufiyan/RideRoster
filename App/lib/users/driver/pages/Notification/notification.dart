import 'package:flutter/material.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../../../services/driver_notification_service.dart';

/// Notification screen palette — matches the design screenshot.
class _DriverNotificationColors {
  static const Color primary = Color(0xFF0088CC);
  static const Color chipBorder = Color(0xFFE5E7EB);
  static const Color iconBlueBg = Color(0xFFE8F4FC);
  static const Color iconOrange = Color(0xFFF59E0B);
  static const Color iconOrangeBg = Color(0xFFFFF4E5);
  static const Color iconGreen = Color(0xFF10B981);
  static const Color iconGreenBg = Color(0xFFE8F8EF);
  static const Color iconRed = Color(0xFFEF4444);
  static const Color iconRedBg = Color(0xFFFEE2E2);
}

enum _NotificationFilter { all, leaveStatus, message, document, unread }

class DriverNotificationsPage extends StatefulWidget {
  const DriverNotificationsPage({super.key});

  @override
  State<DriverNotificationsPage> createState() =>
      _DriverNotificationsPageState();
}

class _DriverNotificationsPageState extends State<DriverNotificationsPage> {
  final DriverNotificationService _service = DriverNotificationService();

  _NotificationFilter _selectedFilter = _NotificationFilter.all;
  List<DriverNotificationItem> _items = [];
  final Set<String> _selectedIds = {};
  bool _selectionMode = false;
  bool _loading = true;
  String? _error;
  bool _markingRead = false;

  @override
  void initState() {
    super.initState();
    _load();
    _service.subscribeRealtime(_loadSilent);
  }

  @override
  void dispose() {
    _service.unsubscribeRealtime(_loadSilent);
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await _service.fetchNotifications();
      if (!mounted) return;
      setState(() {
        _items = rows;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not load notifications.';
        _loading = false;
      });
    }
  }

  Future<void> _loadSilent() async {
    try {
      final rows = await _service.fetchNotifications();
      if (!mounted) return;
      setState(() => _items = rows);
    } catch (_) {}
  }

  int get _unreadCount => _items.where((n) => n.isUnread).length;

  List<DriverNotificationItem> get _filteredItems {
    switch (_selectedFilter) {
      case _NotificationFilter.leaveStatus:
        return _items.where((n) => n.notificationType == 'leave_status').toList();
      case _NotificationFilter.message:
        return _items.where((n) => n.notificationType == 'message').toList();
      case _NotificationFilter.document:
        return _items.where((n) => n.notificationType == 'document_expiry').toList();
      case _NotificationFilter.unread:
        return _items.where((n) => n.isUnread).toList();
      case _NotificationFilter.all:
        return _items;
    }
  }

  void _exitSelectionMode() {
    setState(() {
      _selectionMode = false;
      _selectedIds.clear();
    });
  }

  Future<void> _markSelectedRead() async {
    if (_selectedIds.isEmpty) return;
    setState(() => _markingRead = true);
    try {
      await _service.markAsRead(_selectedIds);
      await _loadSilent();
      _exitSelectionMode();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not mark notifications as read.')),
      );
    } finally {
      if (mounted) setState(() => _markingRead = false);
    }
  }

  Future<void> _markAllRead() async {
    setState(() => _markingRead = true);
    try {
      await _service.markAllAsRead();
      await _loadSilent();
      _exitSelectionMode();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not mark all as read.')),
      );
    } finally {
      if (mounted) setState(() => _markingRead = false);
    }
  }

  Future<void> _openNotification(DriverNotificationItem item) async {
    if (_selectionMode) {
      setState(() {
        if (_selectedIds.contains(item.id)) {
          _selectedIds.remove(item.id);
          if (_selectedIds.isEmpty) _selectionMode = false;
        } else {
          _selectedIds.add(item.id);
        }
      });
      return;
    }

    if (item.isUnread) {
      try {
        await _service.markAsRead([item.id]);
        await _loadSilent();
      } catch (_) {}
    }

    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (ctx) => _NotificationDetailDialog(item: item),
    );
  }

  void _toggleSelect(DriverNotificationItem item) {
    setState(() {
      _selectionMode = true;
      if (_selectedIds.contains(item.id)) {
        _selectedIds.remove(item.id);
        if (_selectedIds.isEmpty) _selectionMode = false;
      } else {
        _selectedIds.add(item.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final filtered = _filteredItems;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _NotificationsAppBar(
              selectionMode: _selectionMode,
              selectedCount: _selectedIds.length,
              markingRead: _markingRead,
              onBack: () => _goBack(context),
              onMarkAllRead: _unreadCount > 0 && !_selectionMode
                  ? _markAllRead
                  : null,
              onMarkSelectedRead:
                  _selectionMode && _selectedIds.isNotEmpty
                  ? _markSelectedRead
                  : null,
              onCancelSelection: _selectionMode ? _exitSelectionMode : null,
            ),
            if (!_selectionMode) ...[
              _NotificationsSummaryCard(
                unreadCount: _unreadCount,
                totalCount: _items.length,
              ),
              SizedBox(height: SizeConfig.r(16)),
            ],
            _FilterChips(
              selectedFilter: _selectedFilter,
              unreadCount: _unreadCount,
              messageCount:
                  _items.where((n) => n.notificationType == 'message').length,
              leaveCount: _items
                  .where((n) => n.notificationType == 'leave_status')
                  .length,
              documentCount: _items
                  .where((n) => n.notificationType == 'document_expiry')
                  .length,
              onSelected: (f) => setState(() => _selectedFilter = f),
            ),
            SizedBox(height: SizeConfig.r(16)),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                  ? _ErrorState(message: _error!, onRetry: _load)
                  : filtered.isEmpty
                  ? _EmptyState(filter: _selectedFilter)
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: EdgeInsets.symmetric(
                          horizontal: SizeConfig.hPad,
                        ),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          final selected = _selectedIds.contains(item.id);
                          return _NotificationCard(
                            item: item,
                            selected: selected,
                            selectionMode: _selectionMode,
                            onTap: () => _openNotification(item),
                            onLongPress: () => _toggleSelect(item),
                          );
                        },
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _goBack(BuildContext context) {
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
      return;
    }
    Navigator.pushReplacementNamed(context, AppRoutes.driverDashboard);
  }
}

class _NotificationsAppBar extends StatelessWidget {
  final bool selectionMode;
  final int selectedCount;
  final bool markingRead;
  final VoidCallback onBack;
  final VoidCallback? onMarkAllRead;
  final VoidCallback? onMarkSelectedRead;
  final VoidCallback? onCancelSelection;

  const _NotificationsAppBar({
    required this.selectionMode,
    required this.selectedCount,
    required this.markingRead,
    required this.onBack,
    this.onMarkAllRead,
    this.onMarkSelectedRead,
    this.onCancelSelection,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(8),
        vertical: SizeConfig.r(10),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: markingRead ? null : onBack,
            icon: Icon(
              Icons.arrow_back,
              color: AppColors.textDark,
              size: SizeConfig.r(22),
            ),
          ),
          Expanded(
            child: Text(
              selectionMode ? '$selectedCount selected' : 'Notifications',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(17),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
          ),
          if (selectionMode) ...[
            TextButton(
              onPressed: markingRead ? null : onCancelSelection,
              child: Text(
                'Cancel',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textMedium,
                ),
              ),
            ),
            if (onMarkSelectedRead != null)
              TextButton(
                onPressed: markingRead ? null : onMarkSelectedRead,
                child: Text(
                  markingRead ? '…' : 'Mark read',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    fontWeight: FontWeight.w600,
                    color: _DriverNotificationColors.primary,
                  ),
                ),
              )
            else
              SizedBox(width: SizeConfig.r(48)),
          ] else if (onMarkAllRead != null)
            IconButton(
              onPressed: markingRead ? null : onMarkAllRead,
              tooltip: 'Mark all as read',
              icon: markingRead
                  ? SizedBox(
                      width: SizeConfig.r(20),
                      height: SizeConfig.r(20),
                      child: const CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(
                      Icons.done_all,
                      color: AppColors.textDark,
                      size: SizeConfig.r(22),
                    ),
            )
          else
            SizedBox(width: SizeConfig.r(48)),
        ],
      ),
    );
  }
}

class _NotificationsSummaryCard extends StatelessWidget {
  final int unreadCount;
  final int totalCount;

  const _NotificationsSummaryCard({
    required this.unreadCount,
    required this.totalCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.fromLTRB(
        SizeConfig.hPad,
        SizeConfig.r(8),
        SizeConfig.hPad,
        0,
      ),
      padding: EdgeInsets.all(SizeConfig.r(16)),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFF0284C7).withValues(alpha: 0.12),
            _DriverNotificationColors.iconBlueBg,
          ],
        ),
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(
          color: const Color(0xFF0284C7).withValues(alpha: 0.22),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: SizeConfig.r(48),
            height: SizeConfig.r(48),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(SizeConfig.r(12)),
            ),
            child: Icon(
              Icons.notifications_active_outlined,
              color: const Color(0xFF0284C7),
              size: SizeConfig.r(26),
            ),
          ),
          SizedBox(width: SizeConfig.r(14)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  unreadCount > 0
                      ? '$unreadCount unread alert${unreadCount == 1 ? '' : 's'}'
                      : 'You\'re all caught up',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(16),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(6)),
                Text(
                  totalCount > 0
                      ? '$totalCount total notification${totalCount == 1 ? '' : 's'} — leave updates, messages, and documents.'
                      : 'New leave updates, messages, and document alerts will appear here.',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    height: 1.4,
                    color: AppColors.textMedium,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  final _NotificationFilter selectedFilter;
  final int unreadCount;
  final int messageCount;
  final int leaveCount;
  final int documentCount;
  final ValueChanged<_NotificationFilter> onSelected;

  const _FilterChips({
    required this.selectedFilter,
    required this.unreadCount,
    required this.messageCount,
    required this.leaveCount,
    required this.documentCount,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Row(
        children: [
          _FilterChip(
            label: 'All',
            isSelected: selectedFilter == _NotificationFilter.all,
            onTap: () => onSelected(_NotificationFilter.all),
          ),
          SizedBox(width: SizeConfig.r(10)),
          _FilterChip(
            label: 'Leave Status',
            badge: leaveCount > 0 ? '$leaveCount' : null,
            isSelected: selectedFilter == _NotificationFilter.leaveStatus,
            onTap: () => onSelected(_NotificationFilter.leaveStatus),
          ),
          SizedBox(width: SizeConfig.r(10)),
          _FilterChip(
            label: 'Message',
            badge: messageCount > 0 ? '$messageCount' : null,
            isSelected: selectedFilter == _NotificationFilter.message,
            onTap: () => onSelected(_NotificationFilter.message),
          ),
          SizedBox(width: SizeConfig.r(10)),
          _FilterChip(
            label: 'Document',
            badge: documentCount > 0 ? '$documentCount' : null,
            isSelected: selectedFilter == _NotificationFilter.document,
            onTap: () => onSelected(_NotificationFilter.document),
          ),
          SizedBox(width: SizeConfig.r(10)),
          _FilterChip(
            label: 'Unread',
            badge: unreadCount > 0 ? '$unreadCount' : null,
            isSelected: selectedFilter == _NotificationFilter.unread,
            onTap: () => onSelected(_NotificationFilter.unread),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final String? badge;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    this.badge,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: SizeConfig.r(16),
          vertical: SizeConfig.r(8),
        ),
        decoration: BoxDecoration(
          color: isSelected ? _DriverNotificationColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(SizeConfig.r(20)),
          border: isSelected
              ? null
              : Border.all(color: _DriverNotificationColors.chipBorder),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AppColors.textMedium,
              ),
            ),
            if (badge != null) ...[
              SizedBox(width: SizeConfig.r(6)),
              Container(
                width: SizeConfig.r(18),
                height: SizeConfig.r(18),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withValues(alpha: 0.25)
                      : const Color(0xFFF3F4F6),
                  shape: BoxShape.circle,
                ),
                child: Text(
                  badge!,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(10),
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : AppColors.textMedium,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final DriverNotificationItem item;
  final bool selected;
  final bool selectionMode;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _NotificationCard({
    required this.item,
    required this.selected,
    required this.selectionMode,
    required this.onTap,
    required this.onLongPress,
  });

  ({IconData icon, Color iconColor, Color iconBg}) get _style {
    if (item.notificationType == 'document_expiry') {
      return (
        icon: Icons.description_outlined,
        iconColor: _DriverNotificationColors.iconOrange,
        iconBg: _DriverNotificationColors.iconOrangeBg,
      );
    }
    if (item.notificationType == 'message') {
      return (
        icon: Icons.chat_bubble_outline,
        iconColor: _DriverNotificationColors.primary,
        iconBg: _DriverNotificationColors.iconBlueBg,
      );
    }
    final status = (item.leaveStatus ?? '').toLowerCase();
    if (status == 'approved') {
      return (
        icon: Icons.check_circle_outline,
        iconColor: _DriverNotificationColors.iconGreen,
        iconBg: _DriverNotificationColors.iconGreenBg,
      );
    }
    if (status == 'rejected') {
      return (
        icon: Icons.cancel_outlined,
        iconColor: _DriverNotificationColors.iconRed,
        iconBg: _DriverNotificationColors.iconRedBg,
      );
    }
    return (
      icon: Icons.event_busy_outlined,
      iconColor: _DriverNotificationColors.iconOrange,
      iconBg: _DriverNotificationColors.iconOrangeBg,
    );
  }

  @override
  Widget build(BuildContext context) {
    final style = _style;
    final time = formatNotificationRelativeTime(item.createdAt);

    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        margin: EdgeInsets.only(bottom: SizeConfig.r(12)),
        padding: EdgeInsets.all(SizeConfig.r(16)),
        decoration: BoxDecoration(
          color: selected
              ? _DriverNotificationColors.iconBlueBg.withValues(alpha: 0.35)
              : AppColors.background,
          borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
          border: selected
              ? Border.all(color: _DriverNotificationColors.primary, width: 1.5)
              : null,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: SizeConfig.r(8),
              offset: Offset(0, SizeConfig.r(2)),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (selectionMode) ...[
              Icon(
                selected ? Icons.check_circle : Icons.circle_outlined,
                color: selected
                    ? _DriverNotificationColors.primary
                    : AppColors.textLight,
                size: SizeConfig.r(22),
              ),
              SizedBox(width: SizeConfig.r(10)),
            ],
            Container(
              width: SizeConfig.r(44),
              height: SizeConfig.r(44),
              decoration: BoxDecoration(color: style.iconBg, shape: BoxShape.circle),
              child: Icon(style.icon, color: style.iconColor, size: SizeConfig.r(22)),
            ),
            SizedBox(width: SizeConfig.r(12)),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: TextStyle(
                            fontSize: SizeConfig.sp(14),
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                          ),
                        ),
                      ),
                      SizedBox(width: SizeConfig.r(8)),
                      Text(
                        time,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(11),
                          fontWeight: FontWeight.w500,
                          color: item.isUnread
                              ? _DriverNotificationColors.primary
                              : AppColors.textLight,
                        ),
                      ),
                      if (item.isUnread) ...[
                        SizedBox(width: SizeConfig.r(6)),
                        Container(
                          width: SizeConfig.r(8),
                          height: SizeConfig.r(8),
                          margin: EdgeInsets.only(top: SizeConfig.r(4)),
                          decoration: const BoxDecoration(
                            color: _DriverNotificationColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                  SizedBox(height: SizeConfig.r(6)),
                  Text(
                    item.body,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(12),
                      color: AppColors.textMedium,
                      fontWeight: FontWeight.w400,
                      height: 1.4,
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

class _NotificationDetailDialog extends StatelessWidget {
  final DriverNotificationItem item;

  const _NotificationDetailDialog({required this.item});

  @override
  Widget build(BuildContext context) {
    final isMessage = item.notificationType == 'message';
    final isLeave = item.notificationType == 'leave_status';
    final isDocument = item.notificationType == 'document_expiry';

    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
      ),
      title: Text(
        item.title,
        style: TextStyle(
          fontSize: SizeConfig.sp(16),
          fontWeight: FontWeight.w700,
        ),
      ),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isMessage) ...[
              Text(
                item.fullMessage,
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  color: AppColors.textMedium,
                  height: 1.5,
                ),
              ),
            ],
            if (isLeave) ...[
              if (item.leaveType != null)
                _DetailRow(label: 'Leave type', value: item.leaveType!),
              if (item.leaveStatus != null)
                _DetailRow(
                  label: 'Status',
                  value: item.leaveStatus!.toUpperCase(),
                ),
              Text(
                item.body,
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  color: AppColors.textMedium,
                  height: 1.5,
                ),
              ),
              if (item.adminNotes != null) ...[
                SizedBox(height: SizeConfig.r(12)),
                Text(
                  'Admin note',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(11),
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                  ),
                ),
                SizedBox(height: SizeConfig.r(4)),
                Text(
                  item.adminNotes!,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    color: AppColors.textDark,
                    height: 1.5,
                  ),
                ),
              ],
            ],
            if (isDocument) ...[
              if (item.documentName != null)
                _DetailRow(label: 'Document', value: item.documentName!),
              if (item.expiryDate != null)
                _DetailRow(label: 'Expiry date', value: item.expiryDate!),
              if (item.reminderLabel != null)
                _DetailRow(label: 'Reminder', value: item.reminderLabel!),
              Text(
                item.fullMessage,
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  color: AppColors.textMedium,
                  height: 1.5,
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Close'),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: SizeConfig.r(8)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: SizeConfig.r(88),
            child: Text(
              label,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.textLight,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final _NotificationFilter filter;

  const _EmptyState({required this.filter});

  @override
  Widget build(BuildContext context) {
    String message = 'No notifications yet.';
    if (filter == _NotificationFilter.unread) {
      message = 'No unread notifications.';
    } else if (filter == _NotificationFilter.message) {
      message = 'No messages yet.';
    } else if (filter == _NotificationFilter.leaveStatus) {
      message = 'No leave status updates yet.';
    } else if (filter == _NotificationFilter.document) {
      message = 'No document expiry notices yet.';
    }

    return Center(
      child: Padding(
        padding: EdgeInsets.all(SizeConfig.r(24)),
        child: Text(
          message,
          style: TextStyle(
            fontSize: SizeConfig.sp(14),
            color: AppColors.textLight,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(message, style: TextStyle(color: AppColors.textMedium)),
          SizedBox(height: SizeConfig.r(12)),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
