import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../providers/auth_provider.dart';
import '../../../services/connectivity_service.dart';
import '../../../services/terms_service.dart';
import '../../driver/pages/dashboard/dashboard.dart';
import '../../PA/pages/dashboard/dashboard.dart';
import 'terms_acceptance_page.dart';

/// Terms & Conditions gate for mobile staff.
///
/// **Session restore** ([blockingCheck] false): dashboard shows immediately;
/// T&C is checked in the background when the server is reachable.
///
/// **Fresh login** ([blockingCheck] true): loading → T&C or dashboard before use.
class StaffTermsGate extends StatefulWidget {
  const StaffTermsGate({
    super.key,
    required this.blockingCheck,
  });

  final bool blockingCheck;

  @override
  State<StaffTermsGate> createState() => _StaffTermsGateState();
}

class _StaffTermsGateState extends State<StaffTermsGate> {
  final TermsService _termsService = TermsService();

  TermsCheckResult? _blockingResult;
  bool _blockingLoading = false;
  bool _blockingCleared = false;

  RequiredTermsPayload? _backgroundTerms;
  StreamSubscription<void>? _reconnectSub;

  @override
  void initState() {
    super.initState();
    if (widget.blockingCheck) {
      _blockingLoading = true;
      _runBlockingCheck();
    } else {
      _reconnectSub = ConnectivityService().onReconnect.listen((_) {
        unawaited(_runBackgroundCheck());
      });
      unawaited(_runBackgroundCheck());
    }
  }

  @override
  void dispose() {
    _reconnectSub?.cancel();
    super.dispose();
  }

  Future<void> _runBlockingCheck() async {
    setState(() {
      _blockingLoading = true;
      _blockingCleared = false;
      _blockingResult = null;
    });

    final result = await _termsService.fetchRequiredTerms(
      policy: TermsFetchPolicy.requireNetwork,
    );
    if (!mounted) return;

    if (!result.required && result.error == null) {
      context.read<AuthProvider>().markTermsCheckCompleted();
    }

    setState(() {
      _blockingResult = result;
      _blockingLoading = false;
      _blockingCleared = !result.required && result.error == null;
    });
  }

  Future<void> _runBackgroundCheck() async {
    if (!mounted) return;
    if (_backgroundTerms != null) return;

    final result = await _termsService.fetchRequiredTerms(
      policy: TermsFetchPolicy.skipWhenOffline,
    );
    if (!mounted) return;

    if (result.error != null) return;
    if (result.required && result.terms != null) {
      setState(() => _backgroundTerms = result.terms);
    }
  }

  void _onTermsAccepted() {
    context.read<AuthProvider>().markTermsCheckCompleted();
    if (widget.blockingCheck) {
      unawaited(_runBlockingCheck());
      return;
    }
    setState(() => _backgroundTerms = null);
    unawaited(_runBackgroundCheck());
  }

  Widget _dashboardForRole(AuthProvider auth) {
    if (auth.isPassengerAssistant) {
      return const PaDashboardPage();
    }
    return const DriverDashboardPage();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (widget.blockingCheck) {
      return _buildBlockingFlow(auth);
    }
    return _buildBackgroundFlow(auth);
  }

  Widget _buildBlockingFlow(AuthProvider auth) {
    if (_blockingLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final result = _blockingResult;
    if (result?.error != null) {
      return Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  result!.error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 15),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _runBlockingCheck,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (result != null && result.required && result.terms != null) {
      return TermsAcceptancePage(
        terms: result.terms!,
        onAccepted: _onTermsAccepted,
      );
    }

    if (_blockingCleared) {
      return _dashboardForRole(auth);
    }

    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }

  Widget _buildBackgroundFlow(AuthProvider auth) {
    if (_backgroundTerms != null) {
      return TermsAcceptancePage(
        terms: _backgroundTerms!,
        onAccepted: _onTermsAccepted,
      );
    }
    return _dashboardForRole(auth);
  }
}
