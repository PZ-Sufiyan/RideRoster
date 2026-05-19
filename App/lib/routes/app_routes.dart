import 'package:flutter/material.dart';
import '../users/auth/pages/choose_account_type.dart';
import '../users/auth/pages/login.dart';
import '../users/auth/pages/register.dart';
import '../users/auth/pages/register_passenger_assistant.dart';
import '../users/driver/pages/dashboard/dashboard.dart';
import '../users/driver/pages/dashboard/vehicle_check_list.dart';
import '../users/driver/pages/job/complete_job.dart';
import '../users/driver/pages/job/pickup.dart';
import '../users/driver/pages/job/pickup_que.dart';
import '../users/driver/pages/job/requested_jobs.dart';
import '../users/driver/pages/job/route_detail.dart';
import '../users/PA/pages/dashboard/dashboard.dart';
import '../users/PA/pages/profile/profile.dart';
import '../users/PA/pages/Notification/Notification.dart';
import '../users/PA/pages/job/assigned_job.dart';
import '../users/PA/pages/job/current_job.dart';
import '../users/driver/pages/leave/leave.dart';
import '../users/driver/pages/leave/leave_request_form.dart';
import '../users/driver/pages/profile/profile.dart';
import '../users/driver/pages/sos/sos.dart';

class AppRoutes {
  // Route name constants
  static const String login = '/login';
  static const String chooseAccountType = '/choose-account-type';
  static const String driverRegister = '/driver/register';
  static const String passengerAssistantRegister =
      '/passenger-assistant/register';
  static const String driverDashboard = '/driver/dashboard';
  static const String vehicleChecklist = '/driver/vehicle-checklist';
  static const String sos = '/driver/sos';
  static const String driverProfile = '/driver/profile';
  static const String requestedJobs = '/driver/requested-jobs';
  static const String routeDetail = '/driver/route-detail';
  static const String pickupQueue = '/driver/pickup-queue';
  static const String pickupPage = '/driver/pickup';
  static const String completeJob = '/driver/complete-job';
  static const String driverLeave = '/driver/leave';
  static const String driverLeaveRequest = '/driver/leave-request';
  static const String paDashboard = '/pa/dashboard';
  static const String paProfile = '/pa/profile';
  static const String paNotifications = '/pa/notifications';
  static const String paCurrentJob = '/pa/current-job';
  static const String paAssignedJobs = '/pa/assigned-jobs';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case login:
        return MaterialPageRoute(builder: (_) => const LoginPage());

      case chooseAccountType:
        return MaterialPageRoute(builder: (_) => const ChooseAccountTypePage());

      case driverRegister:
        return MaterialPageRoute(builder: (_) => const DriverRegisterPage());

      case passengerAssistantRegister:
        return MaterialPageRoute(
          builder: (_) => const RegisterPassengerAssistantPage(),
        );

      case driverDashboard:
        return MaterialPageRoute(builder: (_) => const DriverDashboardPage());

      case vehicleChecklist:
        return MaterialPageRoute(builder: (_) => const VehicleCheckListPage());

      case sos:
        return MaterialPageRoute(builder: (_) => const SOSPage());

      case driverProfile:
        return MaterialPageRoute(builder: (_) => const DriverProfilePage());

      case requestedJobs:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => const RequestedJobsPage(),
        );

      case routeDetail:
        return MaterialPageRoute(builder: (_) => const RouteDetailPage());

      case pickupQueue:
        return MaterialPageRoute(builder: (_) => const PickupQuePage());

      case pickupPage:
        return MaterialPageRoute(builder: (_) => const PickupPage());

      case completeJob:
        return MaterialPageRoute(builder: (_) => const CompleteJobPage());

      case driverLeave:
        return MaterialPageRoute(builder: (_) => const DriverLeavePage());

      case driverLeaveRequest:
        return MaterialPageRoute(builder: (_) => const LeaveRequestFormPage());

      case paDashboard:
        return MaterialPageRoute(builder: (_) => const PaDashboardPage());

      case paProfile:
        return MaterialPageRoute(builder: (_) => const PaProfilePage());

      case paNotifications:
        return MaterialPageRoute(builder: (_) => const PaNotificationsPage());

      case paCurrentJob:
        return MaterialPageRoute(builder: (_) => const PaCurrentJobPage());

      case paAssignedJobs:
        return MaterialPageRoute(builder: (_) => const PaAssignedJobsPage());

      default:
        return MaterialPageRoute(builder: (_) => const LoginPage());
    }
  }
}
