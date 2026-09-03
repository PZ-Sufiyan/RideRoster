import 'package:flutter/material.dart';
import '../repositories/local_job_repository.dart';
import '../users/auth/pages/choose_account_type.dart';
import '../users/auth/pages/forgot_password.dart';
import '../users/auth/pages/login.dart';
import '../users/auth/pages/register.dart';
import '../users/auth/pages/register_passenger_assistant.dart';
import '../users/driver/pages/dashboard/dashboard.dart';
import '../users/driver/pages/dashboard/vehicle_check_list.dart';
import '../users/driver/pages/job/complete_job.dart';
import '../users/driver/pages/job/job_detail.dart';
import '../users/driver/pages/job/pickup.dart';
import '../users/driver/pages/job/pickup_que.dart';
import '../users/driver/pages/job/requested_jobs.dart';
import '../users/driver/pages/job/route_detail.dart';
import '../users/PA/pages/dashboard/dashboard.dart';
import '../users/PA/pages/profile/profile.dart';
import '../users/PA/pages/profile/edit_profile.dart';
import '../users/PA/pages/notification/notification.dart';
import '../users/PA/pages/job/assigned_job.dart';
import '../users/PA/pages/job/current_job.dart';
import '../users/driver/pages/leave/leave.dart';
import '../users/driver/pages/leave/leave_request_form.dart';
import '../users/PA/pages/leave/pa_leave_page.dart';
import '../users/PA/pages/leave/pa_leave_request_form_page.dart';
import '../users/PA/pages/sos/sos.dart';
import '../users/driver/pages/profile/profile.dart';
import '../users/driver/pages/profile/edit_profile.dart';
import '../users/driver/pages/Notification/notification.dart';
import '../users/driver/pages/sos/sos.dart';

class AppRoutes {
  // Route name constants
  static const String login = '/login';
  static const String forgotPassword = '/forgot-password';
  static const String chooseAccountType = '/choose-account-type';
  static const String driverRegister = '/driver/register';
  static const String passengerAssistantRegister =
      '/passenger-assistant/register';
  static const String driverDashboard = '/driver/dashboard';
  static const String vehicleChecklist = '/driver/vehicle-checklist';
  static const String sos = '/driver/sos';
  static const String driverProfile = '/driver/profile';
  static const String driverEditProfile = '/driver/profile/edit';
  static const String driverNotifications = '/driver/notifications';
  static const String requestedJobs = '/driver/requested-jobs';
  static const String jobDetail = '/driver/job-detail';
  static const String routeDetail = '/driver/route-detail';
  static const String pickupQueue = '/driver/pickup-queue';
  static const String pickupPage = '/driver/pickup';
  static const String completeJob = '/driver/complete-job';
  static const String driverLeave = '/driver/leave';
  static const String driverLeaveRequest = '/driver/leave-request';
  static const String paDashboard = '/pa/dashboard';
  static const String paProfile = '/pa/profile';
  static const String paEditProfile = '/pa/profile/edit';
  static const String paNotifications = '/pa/notifications';
  static const String paCurrentJob = '/pa/current-job';
  static const String paAssignedJobs = '/pa/assigned-jobs';
  static const String paLeave = '/pa/leave';
  static const String paLeaveRequest = '/pa/leave-request';
  static const String paSos = '/pa/sos';

  static Route<dynamic> generateRoute(
    RouteSettings settings, {
    required LocalJobRepository localRepo,
  }) {
    switch (settings.name) {
      case login:
        return MaterialPageRoute(builder: (_) => const LoginPage());

      case forgotPassword:
        return MaterialPageRoute(builder: (_) => const ForgotPasswordPage());

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
        return MaterialPageRoute(
          builder: (_) => VehicleCheckListPage(localRepo: localRepo),
        );

      case sos:
        return MaterialPageRoute(builder: (_) => const SOSPage());

      case driverProfile:
        return MaterialPageRoute(builder: (_) => const DriverProfilePage());

      case driverEditProfile:
        final args = settings.arguments;
        if (args is! DriverEditProfileArgs) {
          return MaterialPageRoute(builder: (_) => const DriverProfilePage());
        }
        return MaterialPageRoute(
          builder: (_) => DriverEditProfilePage(args: args),
        );

      case driverNotifications:
        return MaterialPageRoute(
          builder: (_) => const DriverNotificationsPage(),
        );

      case requestedJobs:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => const RequestedJobsPage(),
        );

      case jobDetail:
        return MaterialPageRoute(builder: (_) => const DriverJobDetailPage());

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

      case paEditProfile:
        final paArgs = settings.arguments;
        if (paArgs is! PaEditProfileArgs) {
          return MaterialPageRoute(builder: (_) => const PaProfilePage());
        }
        return MaterialPageRoute(
          builder: (_) => PaEditProfilePage(args: paArgs),
        );

      case paNotifications:
        return MaterialPageRoute(builder: (_) => const PaNotificationsPage());

      case paCurrentJob:
        return MaterialPageRoute(builder: (_) => const PaCurrentJobPage());

      case paAssignedJobs:
        return MaterialPageRoute(builder: (_) => const PaAssignedJobsPage());

      case paLeave:
        return MaterialPageRoute(builder: (_) => const PaLeavePage());

      case paLeaveRequest:
        return MaterialPageRoute(
          builder: (_) => const PaLeaveRequestFormPage(),
        );

      case paSos:
        return MaterialPageRoute(builder: (_) => const PaSOSPage());

      default:
        return MaterialPageRoute(builder: (_) => const LoginPage());
    }
  }
}
