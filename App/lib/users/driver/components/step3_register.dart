import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../models/driver_register_data.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../../../services/auth_service.dart';
import 'register_widgets.dart';

class Step3Register extends StatefulWidget {
  const Step3Register({
    super.key,
    required this.data,
    required this.onRegister,
  });

  final DriverRegisterData data;
  final VoidCallback onRegister;

  @override
  State<Step3Register> createState() => _Step3RegisterState();
}

class _Step3RegisterState extends State<Step3Register> {
  late final TextEditingController _dbsIdCtrl;
  late final TextEditingController _licenseNumberCtrl;
  bool _isLoading = false;
  String? _errorMessage;

  final _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _dbsIdCtrl =
        TextEditingController(text: widget.data.dbsServiceUpdateId);
    _licenseNumberCtrl = TextEditingController(
      text: widget.data.licenseNumber,
    );
  }

  @override
  void dispose() {
    _dbsIdCtrl.dispose();
    _licenseNumberCtrl.dispose();
    super.dispose();
  }

  // ── File picker ────────────────────────────────────────────────────────────

  Future<void> _pickFile(void Function(PlatformFile f) onPicked) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      withData: false,
      withReadStream: false,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() => onPicked(result.files.first));
    }
  }

  // ── Date picker ────────────────────────────────────────────────────────────

  Future<void> _pickDate(
    DateTime? current,
    void Function(DateTime d) onPicked,
  ) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: current ?? now,
      firstDate: now,
      lastDate: DateTime(now.year + 20),
      helpText: 'Select Expiry Date',
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme:
              const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => onPicked(picked));
  }

  String _fmt(DateTime d) {
    const m = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${d.day} ${m[d.month]} ${d.year}';
  }

  // ── Submit via AuthService ─────────────────────────────────────────────────

  Future<void> _onRegister() async {
    final d = widget.data;
    d.dbsServiceUpdateId = _dbsIdCtrl.text.trim();
    d.licenseNumber = _licenseNumberCtrl.text.trim();

    if (d.companyId.trim().isEmpty) {
      setState(() {
        _errorMessage =
            'Please select a valid company from step 1 before registering.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _authService.driverRegister(
      fullName: d.fullName,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      password: d.password,
      companyId: d.companyId,
      companyName: d.companyName,
      countryCode: d.countryCode,
      mobileNumber: d.mobileNumber,
      residentialAddress: d.residentialAddress,
      emergencyContactName: d.emergencyContactName,
      emergencyContactPhone: d.emergencyContactPhone,
      passportNumber: d.passportNumber,
      rightToWorkCode: d.rightToWorkCode,
      registrationNumber: d.registrationNumber,
      taxiPlateNumber: d.taxiPlateNumber,
      make: d.make,
      model: d.model,
      vehicleColour: d.vehicleColour,
      yearOfFirstRegistration: d.yearOfFirstRegistration,
      licensingType: d.licensingType,
      bodyStyle: d.bodyStyle,
      passengerSeats: d.passengerSeats,
      wheelchairAccessible: d.wheelchairAccessible,
      drivingLicenseFrontPath: d.drivingLicenseFront?.path,
      drivingLicenseBackPath: d.drivingLicenseBack?.path,
      drivingLicenseExpiry: d.drivingLicenseExpiry,
      taxiBadgeFrontPath: d.taxiBadgeFront?.path,
      taxiBadgeBackPath: d.taxiBadgeBack?.path,
      taxiBadgeExpiry: d.taxiBadgeExpiry,
      dbsCertFrontPath: d.dbsCertFront?.path,
      dbsCertBackPath: d.dbsCertBack?.path,
      dbsCertExpiry: d.dbsCertExpiry,
      dbsServiceUpdateId: d.dbsServiceUpdateId,
      safeguardingCertPath: d.safeguardingCert?.path,
      licenseNumber: d.licenseNumber,
      v5DocumentFrontPath: d.v5DocumentFront?.path,
      v5DocumentInsidePath: d.v5DocumentInside?.path,
      motCertificatePath: d.motCertificate?.path,
      motCertificateExpiry: d.motCertificateExpiry,
      taxiLicensePlatePath: d.taxiLicensePlate?.path,
      taxiLicensePlateNumber: d.taxiPlateNumber,
      taxiLicensePlateExpiry: d.taxiLicensePlateExpiry,
      insuranceCertificatePath: d.insuranceCertificate?.path,
      insuranceCertificateExpiry: d.insuranceCertificateExpiry,
      vehiclePhotoPath: d.vehiclePhoto?.path,
    );

    if (!mounted) return;

    if (result.success) {
      setState(() => _isLoading = false);
      widget.onRegister();
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = result.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final d = widget.data;

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
          SizeConfig.hPad, SizeConfig.r(28),
          SizeConfig.hPad, SizeConfig.r(32)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Documents',
            style: TextStyle(
              fontSize: SizeConfig.sp(26),
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'Upload required documents to verify your identity.',
            style: TextStyle(
                fontSize: SizeConfig.sp(14),
                color: AppColors.textMedium),
          ),
          SizedBox(height: SizeConfig.r(24)),

          const RegFieldLabel('License Number *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _licenseNumberCtrl,
            hintText: 'Enter license number',
          ),
          SizedBox(height: SizeConfig.r(20)),

          // ── Driving License ─────────────────────────────────────────────
          const RegFieldLabel('Driving License (Front) *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.drivingLicenseFront,
            onTap: () => _pickFile((f) => d.drivingLicenseFront = f),
          ),
          SizedBox(height: SizeConfig.r(12)),
          const RegFieldLabel('Driving License (Back) *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.drivingLicenseBack,
            onTap: () => _pickFile((f) => d.drivingLicenseBack = f),
          ),
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: d.drivingLicenseExpiry,
            onTap: () => _pickDate(
                d.drivingLicenseExpiry, (dt) => d.drivingLicenseExpiry = dt),
            formatDate: _fmt,
          ),
          SizedBox(height: SizeConfig.r(20)),

          // ── Taxi Badge ──────────────────────────────────────────────────
          const RegFieldLabel('Taxi Badge (Front) *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.taxiBadgeFront,
            onTap: () => _pickFile((f) => d.taxiBadgeFront = f),
          ),
          SizedBox(height: SizeConfig.r(12)),
          const RegFieldLabel('Taxi Badge (Back) *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.taxiBadgeBack,
            onTap: () => _pickFile((f) => d.taxiBadgeBack = f),
          ),
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: d.taxiBadgeExpiry,
            onTap: () => _pickDate(
                d.taxiBadgeExpiry, (dt) => d.taxiBadgeExpiry = dt),
            formatDate: _fmt,
          ),
          SizedBox(height: SizeConfig.r(20)),

          // ── DBS Certificate ─────────────────────────────────────────────
          const RegFieldLabel('DBS Certificate (Front) *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.dbsCertFront,
            onTap: () => _pickFile((f) => d.dbsCertFront = f),
          ),
          SizedBox(height: SizeConfig.r(12)),
          const RegFieldLabel('DBS Certificate (Back) *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.dbsCertBack,
            onTap: () => _pickFile((f) => d.dbsCertBack = f),
          ),
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: d.dbsCertExpiry,
            onTap: () => _pickDate(
                d.dbsCertExpiry, (dt) => d.dbsCertExpiry = dt),
            formatDate: _fmt,
          ),
          SizedBox(height: SizeConfig.r(20)),

          // ── DBS Service Update ID ───────────────────────────────────────
          const RegFieldLabel('DBS Service Update ID (C Number) *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _dbsIdCtrl,
            hintText: 'Enter DBS service update ID',
          ),
          SizedBox(height: SizeConfig.r(20)),

          // ── Derby City Safeguarding Certificate ─────────────────────────
          const RegFieldLabel('Derby City Safeguarding Certificate'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.safeguardingCert,
            onTap: () => _pickFile((f) => d.safeguardingCert = f),
            subLabel: 'Must be less than 3 years old',
          ),
          SizedBox(height: SizeConfig.r(28)),

          // ── Vehicle Information ────────────────────────────────────────
          Text(
            'Vehicle Information',
            style: TextStyle(
              fontSize: SizeConfig.sp(18),
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(14)),

          const RegFieldLabel('V5 Document (Front) *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.v5DocumentFront,
            onTap: () => _pickFile((f) => d.v5DocumentFront = f),
          ),
          SizedBox(height: SizeConfig.r(12)),
          const RegFieldLabel('V5 Document (Inside) *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.v5DocumentInside,
            onTap: () => _pickFile((f) => d.v5DocumentInside = f),
          ),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('MOT Certificate *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.motCertificate,
            onTap: () => _pickFile((f) => d.motCertificate = f),
          ),
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: d.motCertificateExpiry,
            onTap: () => _pickDate(
              d.motCertificateExpiry,
              (dt) => d.motCertificateExpiry = dt,
            ),
            formatDate: _fmt,
          ),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Taxi License Plate *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.taxiLicensePlate,
            onTap: () => _pickFile((f) => d.taxiLicensePlate = f),
          ),
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: d.taxiLicensePlateExpiry,
            onTap: () => _pickDate(
              d.taxiLicensePlateExpiry,
              (dt) => d.taxiLicensePlateExpiry = dt,
            ),
            formatDate: _fmt,
          ),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Insurance Certificate *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.insuranceCertificate,
            onTap: () => _pickFile((f) => d.insuranceCertificate = f),
          ),
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: d.insuranceCertificateExpiry,
            onTap: () => _pickDate(
              d.insuranceCertificateExpiry,
              (dt) => d.insuranceCertificateExpiry = dt,
            ),
            formatDate: _fmt,
          ),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Vehicle Photo *'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.vehiclePhoto,
            onTap: () => _pickFile((f) => d.vehiclePhoto = f),
          ),

          // Error
          if (_errorMessage != null) ...[
            SizedBox(height: SizeConfig.r(16)),
            Text(
              _errorMessage!,
              style: TextStyle(
                  fontSize: SizeConfig.sp(13), color: AppColors.error),
            ),
          ],

          SizedBox(height: SizeConfig.r(36)),

          NextStepButton(
            label: 'Register',
            isLoading: _isLoading,
            onTap: _onRegister,
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload box
// ─────────────────────────────────────────────────────────────────────────────

class UploadBox extends StatelessWidget {
  const UploadBox({
    super.key,
    required this.file,
    required this.onTap,
    this.subLabel,
  });

  final PlatformFile? file;
  final VoidCallback onTap;
  final String? subLabel;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(
            vertical: SizeConfig.r(22), horizontal: SizeConfig.r(16)),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFD),
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          border: Border.all(color: const Color(0xFFD4DEF0), width: 1),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              file != null
                  ? Icons.check_circle_outline
                  : Icons.cloud_upload_outlined,
              color: file != null
                  ? AppColors.success
                  : const Color(0xFFB0BEC5),
              size: SizeConfig.r(30),
            ),
            SizedBox(height: SizeConfig.r(8)),
            Text(
              file != null
                  ? file!.name
                  : (subLabel ?? 'Click to upload or drag and drop'),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: file != null
                    ? AppColors.textMedium
                    : const Color(0xFFB0BEC5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Expiry date chip
// ─────────────────────────────────────────────────────────────────────────────

class ExpiryButton extends StatelessWidget {
  const ExpiryButton({
    super.key,
    required this.date,
    required this.onTap,
    required this.formatDate,
  });

  final DateTime? date;
  final VoidCallback onTap;
  final String Function(DateTime) formatDate;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
            horizontal: SizeConfig.r(14), vertical: SizeConfig.r(10)),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F7FC),
          borderRadius: BorderRadius.circular(SizeConfig.r(8)),
          border: Border.all(color: const Color(0xFFD4DEF0), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.calendar_today_outlined,
                size: SizeConfig.r(16), color: AppColors.textMedium),
            SizedBox(width: SizeConfig.r(8)),
            Text(
              date != null ? formatDate(date!) : 'Expiry Date',
              style: TextStyle(
                fontSize: SizeConfig.sp(14),
                color: date != null
                    ? AppColors.textDark
                    : AppColors.textMedium,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
