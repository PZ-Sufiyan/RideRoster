import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../providers/auth_provider.dart';
import '../../../services/terms_service.dart';
import '../../driver/pages/dashboard/dashboard.dart';
import '../../PA/pages/dashboard/dashboard.dart';
import 'terms_acceptance_page.dart';

/// Ensures mobile staff accept the latest published Terms & Conditions before
/// showing the dashboard (login, session restore, and deep-linked routes).
class StaffTermsGate extends StatefulWidget {
  const StaffTermsGate({super.key});

  @override
  State<StaffTermsGate> createState() => _StaffTermsGateState();
}

class _StaffTermsGateState extends State<StaffTermsGate> {
  final TermsService _termsService = TermsService();
  TermsCheckResult? _result;
  bool _loading = true;
  bool _cleared = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _cleared = false;
    });

    final result = await _termsService.fetchRequiredTerms();
    if (!mounted) return;

    setState(() {
      _result = result;
      _loading = false;
      _cleared = !result.required && result.error == null;
    });
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

    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final result = _result;
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
                  onPressed: _load,
                  child: const Text('Retry'),
                ),
                TextButton(
                  onPressed: () => auth.logout(),
                  child: const Text('Sign out'),
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
        onAccepted: _load,
      );
    }

    if (_cleared) {
      return _dashboardForRole(auth);
    }

    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
