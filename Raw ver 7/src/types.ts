export type UserRole =
  | 'admin'               // مدیر ارشد کلینیک
  | 'it_developer'        // کارشناس آی‌تی و توسعه‌دهنده سیستم
  | 'veterinarian'        // دامپزشک
  | 'groomer'             // آرایشگر
  | 'receptionist'        // پذیرش
  | 'cashier'             // صندوقدار
  | 'petshop_purchasing'  // مسئول خرید پت‌شاپ
  | 'petshop_sales'       // مسئول فروش پت‌شاپ
  | 'owner'               // صاحب حیوان
  | 'pet'                 // نقش خود پت (تجربه حسی و سرگرمی پت)
  | 'visitor'             // رهگذر / متقاضی دسترسی ورودی
  | 'third_party_partner'; // همکار بیرونی (داگ‌واکر، پانسیون، فروشنده)

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatar: string;
  phone: string;
  email?: string;
  specialty?: string;
  status: 'active' | 'on_duty' | 'off_duty';
}

export type SpeciesType = 'سگ' | 'گربه' | 'پرنده' | 'خرگوش و جوندگان' | 'سایر و اگزاتیک';
export type GenderType = 'نر' | 'ماده' | 'نر عقیم‌شده' | 'ماده عقیم‌شده';
export type ClinicPresenceStatus = 'not_present' | 'waiting' | 'in_exam' | 'in_boarding' | 'in_grooming' | 'completed';

export interface Pet {
  id: string;
  name: string;
  species: SpeciesType;
  breed: string;
  gender: GenderType;
  birthDate: string;
  ageText: string;
  weightKg: number;
  color: string;
  microchipNumber: string;
  photoUrl: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  allergies: string[];
  statusInClinic: ClinicPresenceStatus;
  checkInTime?: string;
  lastVisitDate: string;
  nextVaccineDate: string;
  nextParasiteDate: string;
  notes: string;
  bloodType?: string;
  isVaccinated: boolean;
  isDemo?: boolean;
  isVerified?: boolean;
}

export interface Owner {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string;
  email: string;
  address: string;
  petIds: string[];
  registeredAt: string;
  totalSpent: number;
  isDemo?: boolean;
  isVerified?: boolean;
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  form: string; // قرص، شربت، آمپول، قطره
  dosage: string; // 250mg, 5ml
  frequency: string; // هر ۸ ساعت، روزی یک بار
  duration: string; // ۵ روز، ۷ روز
  instructions: string; // بعد از غذا با آب فراوان
}

export interface MedicalAttachment {
  id: string;
  title: string;
  type: 'xray' | 'sonography' | 'lab_report' | 'surgery_photo' | 'document';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}

export interface VisitRecord {
  id: string;
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  vetId: string;
  vetName: string;
  date: string;
  time: string;
  chiefComplaint: string; // شرح حال / علت مراجعه
  vitalSigns: {
    temperature: number; // دمای بدن C
    heartRate: number; // ضربان قلب
    respiratoryRate: number; // تنفس
    weightKg: number;
    mucousMembranes?: string; // مخاطات صورتی/رنگ‌پریده
  };
  clinicalFindings: string; // معاینه بالینی
  diagnosis: string; // تشخیص قطعی / تفریقی
  prescription: PrescriptionItem[];
  procedures: string[]; // اقدامات انجام شده (واکسن هاری، پانسمان، جراحی)
  serviceType: 'general_exam' | 'vaccination' | 'surgery' | 'radiology' | 'grooming' | 'lab_test' | 'dental';
  specializedType?: 'surgery' | 'radiology' | 'ultrasound' | 'none';
  documentationStatus: 'none' | 'pending_docs' | 'uploaded' | 'waived_by_admin';
  documentReminderActive: boolean;
  attachments: MedicalAttachment[];
  cost: number;
  isPaid: boolean;
}

export interface ClinicQueueDefinition {
  id: string;
  code: 'surgery' | 'grooming' | 'washing' | 'exam' | 'vaccination' | 'dental' | 'custom';
  title: string;
  description: string;
  requiresDeposit: boolean;
  defaultDepositAmountToman: number;
  avgDurationMinutes: number;
  maxConcurrentCapacity: number;
  assignedStaffRole: UserRole | string;
  assignedStaffName: string;
  color: string;
  isActive: boolean;
  autoSmsReminder: boolean;
}

export interface Appointment {
  id: string;
  appointmentType: 'future_appointment' | 'immediate_service_record';
  queueId?: string;
  queueCode?: string;
  petId: string;
  petName: string;
  petBreed: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  vetId: string;
  vetName: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  status: 'scheduled' | 'checked_in' | 'in_service' | 'completed' | 'cancelled';
  requiresDeposit: boolean;
  depositAmount: number;
  depositStatus: 'none' | 'pending_payment' | 'paid' | 'refunded';
  depositPaymentLink?: string;
  depositPaidAt?: string;
  depositTransactionRef?: string;
  clientRequestedOnline?: boolean;
  operatorApprovalStatus?: 'approved_queued' | 'pending_approval' | 'rejected';
  reminder24hSent: boolean;
  notes: string;
  createdAt: string;
}

export interface RoutineTask {
  id: string;
  title: string;
  type: 'food' | 'medication' | 'vital_check' | 'hygiene' | 'walk';
  scheduledTime: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  photoProofUrl?: string;
  voiceMemoText?: string;
  instructions: string;
}

export interface BoardingRecord {
  id: string;
  petId: string;
  petName: string;
  petSpecies: SpeciesType;
  petBreed: string;
  ownerName: string;
  ownerPhone: string;
  cageNumber: string;
  admittedAt: string;
  dischargePlannedAt: string;
  condition: 'critical' | 'stable' | 'recovering' | 'ready_for_discharge';
  assignedStaffId: string;
  assignedStaffName: string;
  dietPlan: string;
  medicalCareNotes: string;
  routineTasks: RoutineTask[];
  dailyCost: number;
}

export interface StaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  role: UserRole;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  connectionMethod: 'wifi_auto' | 'gps_geofence' | 'manual';
  wifiSsid?: string;
  totalHours: number;
  overtimeHours: number;
  status: 'present' | 'late' | 'on_leave' | 'absent';
  leaveType?: 'hourly' | 'daily' | 'sick';
  monthlyLeaveBalanceHours: number;
}

export interface InvoiceItem {
  id: string;
  title: string;
  category: 'visit' | 'surgery' | 'vaccine' | 'radiology' | 'grooming' | 'medication' | 'boarding' | 'petshop';
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  depositDeductionAmount?: number; // کسر مبلغ بیعانه / پیش‌پرداخت جراحی و رزرو
  depositAppointmentId?: string;
  tax: number;
  finalTotal: number;
  paymentStatus: 'paid' | 'pending' | 'partially_paid';
  paymentMethod: 'pos' | 'cash' | 'card_transfer';
  cashierName: string;
  notes?: string;
}

export interface PrintTemplate {
  id: string;
  code: 'pet_passport' | 'travel_certificate' | 'surgery_consent' | 'anesthesia_waiver' | 'discharge_summary';
  title: string;
  description: string;
  contentHtml: string;
  variables: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'vaccine' | 'surgery' | 'document_pending' | 'manager_task' | 'inpatient_alert' | 'system';
  targetRole: UserRole | 'all';
  createdAt: string;
  isRead: boolean;
  requiresAction: boolean;
  actionStatus?: 'pending' | 'done_by_me' | 'done_by_other';
  actionTakenBy?: string;
  relatedEntityId?: string;
}

export interface VoiceConfirmationState {
  id: string;
  promptText: string;
  actionType: 'record_vaccine' | 'record_visit' | 'create_appointment' | 'order_service' | 'admit_boarding';
  targetPet: {
    id: string;
    name: string;
    breed: string;
    ownerName: string;
  };
  details: {
    serviceName: string;
    medicationName?: string;
    dosage?: string;
    vetName?: string;
    cost?: number;
  };
  options: {
    key: string;
    label: string;
    value: string;
  }[];
}

export interface VisitorCameraSnapshot {
  id: string;
  capturedAt: string;
  imageUrl: string;
  aiDescription: string;
  detectedEntities: {
    personDescription: string;
    petSpecies?: string;
    petBreed?: string;
    petColor?: string;
  };
  matchedPetId?: string;
  matchedPetName?: string;
  matchedOwnerName?: string;
  temporaryBadgeId?: string;
  status: 'identified' | 'unidentified' | 'registered';
}

export interface CloudSyncQueueItem {
  id: string;
  recordType: 'visit' | 'pet' | 'invoice' | 'attachment' | 'prescription';
  recordId: string;
  action: 'create' | 'update';
  createdAt: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

// ==========================================
// PET SHOP & SMART COMMERCE EXTENSIONS
// ==========================================

export type PetProductCategory =
  | 'dry_food'       // غذای خشک
  | 'wet_food'       // کنسرو و پوچ
  | 'treats'         // تشویقی و اسنک
  | 'supplements'    // مکمل و مولتی‌ویتامین
  | 'hygiene_care'   // بهداشتی، شامپو و خاک
  | 'accessories'    // قلاده، باکس، اسباب‌بازی
  | 'clinical_diet'; // غذاهای درمانی و رژیمی

export interface MarketPriceData {
  digikalaPrice: number;
  digikalaInStock: boolean;
  torobMinPrice: number;
  torobAvgPrice: number;
  snappfoodPrice: number;
  snappfoodStore: string;
  lastUpdated: string;
}

export interface PetShopProduct {
  id: string;
  barcode: string;
  title: string;
  brand: string;
  category: PetProductCategory;
  targetSpecies: SpeciesType;
  packageWeightGram: number;
  purchasePrice: number;     // قیمت خرید فاکتور
  sellingPrice: number;      // قیمت فروش در کلینیک
  priceToman?: number;       // نام معادل برای دسترسی مستقیم در ماژول‌های فروش
  stockQuantity: number;
  stock?: number;            // نام معادل موجودی
  minStockAlert: number;
  imageUrl: string;
  rating?: number;
  expiryDate?: string;
  batchNumber?: string;
  marketPrices?: MarketPriceData;
  dosageInstructions?: {
    dailyGramsPerWeightKg: { weightRange: string; grams: number }[];
    safetyNotes: string;
    isOverdoseRisk: boolean;
    overdoseGuideline?: string;
  };
  isDemo?: boolean;
  isVerified?: boolean;
}

export interface VideoScannedItem {
  id: string;
  frameIndex: number;
  frameImageUrl: string;
  detectedBarcode: string;
  productName: string;
  brand: string;
  category: PetProductCategory;
  species: SpeciesType;
  confidenceScore: number;
  estimatedPurchasePrice: number;
  marketComparison: MarketPriceData;
  suggestedSellingPrice: number;
  quantity: number;
  isVerified: boolean;
}

export interface SweepVideoAnalysisSession {
  id: string;
  videoFileName: string;
  totalFramesAnalyzed: number;
  detectedItems: VideoScannedItem[];
  scannedAt: string;
  status: 'processing' | 'ready_for_review' | 'confirmed' | 'imported_to_inventory';
}

export interface PetShopCartItem {
  product: PetShopProduct;
  quantity: number;
  discountPercent: number;
  itemTotal: number;
}

export interface LoyaltyMember {
  id: string;
  ownerId: string;
  ownerName: string;
  petName: string;
  phone: string;
  tier: 'bronze' | 'silver' | 'gold' | 'vip';
  points: number;
  totalPurchasesCount: number;
  totalSpentRial: number;
  discountPerkPercent: number;
  lastSpinDate?: string;
}

export interface SpinWheelReward {
  id: string;
  title: string;
  rewardType: 'discount_code' | 'free_treat' | 'vaccine_coupon' | 'bonus_points' | 'none';
  value: string;
  probability: number;
  color: string;
}

export interface CryptoRates {
  usdtToman: number;
  tonToman: number;
  trxToman: number;
  updatedAt: string;
  sourceMarkets: string[];
}

export type MessengerPlatform = 'whatsapp' | 'telegram' | 'bale';

export interface OmnichannelMessagePayload {
  recipientName: string;
  recipientPhone: string;
  platform: MessengerPlatform;
  type: 'invoice' | 'medical_report' | 'nutrition_guide' | 'supplement_safety' | 'personalized_offer';
  title: string;
  formattedBodyText: string;
  mediaUrl?: string;
  sentAt?: string;
  status: 'draft' | 'approved_and_sent' | 'rejected';
}

export interface AIAgentMarketingDraft {
  id: string;
  petId: string;
  petName: string;
  species: SpeciesType;
  ownerName: string;
  ownerPhone: string;
  recommendedProducts: PetShopProduct[];
  reasoning: string;
  generatedMessage: string;
  tone: 'caring' | 'scientific' | 'friendly' | 'festival';
  status: 'pending_operator' | 'approved' | 'edited_and_approved' | 'dismissed';
  operatorFeedbackNotes?: string;
  createdDate: string;
}

export interface AIAgentLearningRule {
  id: string;
  ruleTitle: string;
  description: string;
  weight: number; // اهمیت قانون
  learnedFromAction: string;
  appliedCount: number;
  createdAt: string;
}

// ==========================================
// IT DEVELOPER & COMPACT IDE SUITE TYPES
// ==========================================

export interface DevIdeFile {
  id: string;
  path: string;
  name: string;
  language: 'typescript' | 'javascript' | 'json' | 'sql';
  content: string;
  isReadOnly?: boolean;
}

export interface DevScriptExecutionLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warn' | 'error' | 'success';
  source: string;
  message: string;
}

export interface AICodingPromptHistory {
  id: string;
  prompt: string;
  generatedCode: string;
  explanation: string;
  targetFile: string;
  applied: boolean;
  timestamp: string;
}

export interface ApiEndpointTestItem {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  headers: Record<string, string>;
  requestBody?: string;
  mockResponse: string;
  status: number;
}

// ==========================================
// LEGACY SQL SERVER DISCOVERY & EXTRACTION TYPES
// ==========================================

export interface LegacySqlServerInstance {
  id: string;
  instanceName: string;
  serverHost: string;
  port: number;
  engineVersion: string;
  authType: 'Windows_NT' | 'SQL_Auth';
  defaultDatabase: string;
  databases: string[];
  status: 'online' | 'standby' | 'auth_required';
  responseTimeMs: number;
  lastPing: string;
}

export interface LegacySqlTableColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  sampleValue?: string;
}

export interface LegacySqlTableSchema {
  tableName: string;
  persianLabel: string;
  rowCount: number;
  description: string;
  targetEntity: 'pets' | 'owners' | 'visits' | 'invoices' | 'petshop_products' | 'unmapped';
  columns: LegacySqlTableColumn[];
}

export interface LegacySqlDatabaseSchema {
  databaseName: string;
  instanceId: string;
  collation: string;
  sizeMb: number;
  tables: LegacySqlTableSchema[];
}

export interface LegacySqlExtractionResult {
  id: string;
  extractedAt: string;
  sourceInstance: string;
  sourceDatabase: string;
  extractedTables: {
    tableName: string;
    targetEntity: string;
    rowCount: number;
    records: any[];
  }[];
  generatedJson: string;
  operatorApprovalStatus: 'pending_review' | 'approved_for_migration' | 'rejected';
  operatorNotes?: string;
}

export interface DatabaseCollectionStats {
  petsCount: number;
  ownersCount: number;
  visitsCount: number;
  appointmentsCount: number;
  boardingCount: number;
  invoicesCount: number;
  productsCount: number;
  attendanceCount: number;
  snapshotsCount: number;
  notificationsCount: number;
  queuesCount: number;
}

// ==========================================
// CLINIC PROFILE & IT SETTINGS
// ==========================================

export interface ClinicDoctorBio {
  id: string;
  name: string;
  title: string; // مثال: متخصص جراحی و بافت نرم، شماره نظام دامپزشکی: ۸۴۹۲
  medicalCode: string;
  specialties: string[];
  photoUrl: string;
  bioText: string;
  isActive: boolean;
}

export interface ClinicStaffBio {
  id: string;
  name: string;
  roleTitle: string; // آرایشگر ارشد، سرپرست پانسیون، تکنسین بیهوشی
  photoUrl: string;
  shortBio: string;
  workingDays: string;
}

export interface ClinicProfileConfig {
  clinicName: string;
  tagline: string;
  phoneNumbers: string[];
  emergencyPhone: string;
  address: string;
  postalCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  workingHours: {
    weekdays: string; // شنبه تا چهارشنبه: ۸:۰۰ الی ۲۳:۰۰
    thursdays: string; // پنج‌شنبه‌ها: ۸:۰۰ الی ۲۱:۰۰
    fridays: string;   // جمعه‌ها و ایام تعطیل (بخش اورژانس ۲۴ ساعته)
  };
  aboutUsText: string;
  logoUrl?: string;
  bannerPhotoUrl?: string;
  doctors: ClinicDoctorBio[];
  staff: ClinicStaffBio[];
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  licenseNumber?: string;
}

// ==========================================
// STAFF TIPPING / EIDI LEDGER
// ==========================================

export interface StaffTipLedgerEntry {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  petName: string;
  ownerName: string;
  targetStaffId: string;
  targetStaffName: string;
  targetStaffRole: string; // آرایشگر، کمک جراح، شستشو، نظافت، پذیرش
  tipAmountToman: number;
  tipType: 'tip' | 'eidi' | 'bonus';
  customerNote?: string;
  paymentStatus: 'paid_with_invoice' | 'settled_to_staff';
  createdAt: string;
}

// ==========================================
// STAFF PURCHASE & CREDIT LIMITS
// ==========================================

export interface StaffPurchasePrivilege {
  staffId: string;
  staffName: string;
  role: UserRole;
  discountPercent: number; // درصد تخفیف پرسنلی (مثلاً ۲۰٪)
  isEnabled: boolean;
  allowCreditPurchase: boolean; // خرید نسیه پرسنلی
  creditLimitToman: number; // سقف مجاز اعتبار (مثلاً ۵ میلیون تومان)
  gracePeriodDays: number; // بازه زمان تنفس (مثلاً ۳۰ روز)
  currentDebtToman: number; // بدهی فعلی نسیه
  lastPurchaseDate?: string;
}

// ==========================================
// RBAC DYNAMIC ACCESS MATRIX
// ==========================================

export interface RolePermissionRule {
  role: UserRole;
  allowedTabs: string[];
  canAccessCashier: boolean;
  canAccessPetShop: boolean;
  canAccessMedicalRecords: boolean;
  canAccessSurgerySuite: boolean;
  canAccessGroomingSuite: boolean;
  canAccessReports: boolean;
  canAccessItDevSuite: boolean;
  customOverrides: {
    permissionKey: string;
    grantedBy: string;
    grantedAt: string;
    reason: string;
    isTemporary: boolean;
    expiresAt?: string;
  }[];
}

export interface AccessMatrixSecurityAlert {
  id: string;
  role: UserRole;
  targetUserName?: string;
  permissionGranted: string;
  grantedBy: string;
  timestamp: string;
  status: 'active_alert' | 'revoked' | 'silenced';
  managerNotes?: string;
}

export interface RoleAccessMatrix {
  rules: RolePermissionRule[];
  alerts: AccessMatrixSecurityAlert[];
}

export interface AccessAuditLog {
  id: string;
  timestamp: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  status: 'allowed' | 'denied' | 'temporary_override';
}

export interface OwnerConsentPolicy {
  policyId: string;
  title: string;
  description: string;
  isRequiredForGrooming: boolean;
  isRequiredForPhotography: boolean;
  sampleConsentText: string;
}

export type SurgeryVitalsRecord = {
  time: string;
  heartRate: number;
  spo2: number;
  etco2: number;
  systolicBp: number;
  bodyTempC: number;
  isAlarm: boolean;
};

export type SurgeryVoiceCommandLog = SurgeryVoiceMemoLog;
export type SurgeryPhotoLog = SurgeryPhotoRecord;

// ==========================================
// TOKEN-TO-SCRIPT OPTIMIZER
// ==========================================

export interface TokenOptimizationRule {
  id: string;
  flowName: string; // نام فرآیند، مثلاً: "دسته‌بندی نژاد و رژیم غذایی"
  patternDescription: string;
  callsCountBeforeHardening: number;
  savedTokensEstimate: number;
  hardenedScriptCode: string;
  status: 'draft_proposal' | 'approved_by_it' | 'active_runtime';
  approvedBy?: string;
  approvedAt?: string;
  executionLogs: {
    timestamp: string;
    inputSample: string;
    result: string;
    durationMs: number;
  }[];
}

// ==========================================
// PET SHOP SUPPLIERS & MDI TABS
// ==========================================

export interface PetShopSupplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
  channels: {
    platform: 'telegram' | 'whatsapp' | 'bale';
    channelHandleOrUrl: string;
    lastPriceUpdateDate: string;
    recentQuotesCount: number;
  }[];
  suppliedCategories: PetProductCategory[];
  totalPurchasedToman: number;
  currentBalanceToman: number; // بستانکاری تامین‌کننده
  paymentTerms: string; // نقدی، چک ۳۰ روزه، امانی
  notes: string;
}

export interface PetShopMdiTabItem {
  id: string;
  title: string;
  tabType: 'sales_customer' | 'purchase_order' | 'supplier_channel_finder' | 'stock_ledger' | 'marketing_broadcast';
  customerOrSupplierName?: string;
  cartItems?: PetShopCartItem[];
  purchaseItems?: {
    productTitle: string;
    barcode: string;
    category: PetProductCategory;
    supplierId: string;
    quantity: number;
    unitCostToman: number;
  }[];
  selectedSupplierId?: string;
  activeChannelFilter?: 'all' | 'telegram' | 'whatsapp' | 'bale';
  isDirty: boolean;
}

// ==========================================
// GROOMING SUITE & STYLE GALLERY
// ==========================================

export interface GroomingStyleModel {
  id: string;
  title: string;
  species: SpeciesType;
  breed: string;
  styleCategory: 'teddy_cut' | 'lion_cut' | 'hygienic_trim' | 'summer_shave' | 'show_cut';
  imageUrl: string;
  description: string;
  difficultyLevel: 'آسان' | 'متوسط' | 'تخصصی';
  estimatedDurationMin: number;
  recommendedTools: string[];
}

export interface GroomingPortfolioItem {
  id: string;
  groomerId: string;
  groomerName: string;
  petId: string;
  petName: string;
  breed: string;
  ownerName: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  serviceTitle: string;
  completedDate: string;
  ownerConsentStatus: 'approved_by_owner' | 'pending_consent' | 'declined';
  managerPolicyStatus: 'approved' | 'pending_manager' | 'declined';
  showInPublicGallery: boolean;
}

export interface GroomingQueueStep {
  stepId: string;
  title: string;
  isDone: boolean;
  notes?: string;
}

// ==========================================
// SURGERY & OR SUITE (VOICE & EMERGENCY)
// ==========================================

export interface SurgeryPhotoRecord {
  id: string;
  caption: string;
  photoUrl: string;
  stage: 'pre_op' | 'induction' | 'incision' | 'organ_view' | 'suturing' | 'post_op';
  timestamp: string;
}

export interface SurgeryVoiceMemoLog {
  id: string;
  speakerRole: 'surgeon' | 'assistant_surgeon' | 'anesthetist';
  rawCommandText: string;
  isStartedWithListenKeyword: boolean; // آیا با «گوش_کن» شروع شده؟
  isEndedWithFinishedKeyword: boolean; // آیا با «تمام» خاتمه یافته؟
  cleanTranscript: string;
  actionDetected?: string;
  timestamp: string;
}

export interface SurgeryOperationSession {
  id: string;
  appointmentId: string;
  petId: string;
  petName: string;
  petSpecies: SpeciesType;
  petBreed: string;
  weightKg: number;
  ownerName: string;
  surgeonId: string;
  surgeonName: string;
  assistantName: string;
  anesthetistName: string;
  surgeryType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'morning_queued' | 'anesthesia_prep' | 'in_operation' | 'suturing' | 'recovery' | 'completed';
  preOpChecklist: {
    fastingConfirmed: boolean;
    bloodWorkVerified: boolean;
    consentSigned: boolean;
    depositPaid: boolean;
    anesthesiaProtocol: string;
  };
  vitalsMonitoring: {
    time: string;
    heartRate: number;
    spo2: number;
    etco2: number;
    systolicBp: number;
    bodyTempC: number;
    isAlarm: boolean;
  }[];
  photos: SurgeryPhotoRecord[];
  voiceLogs: SurgeryVoiceMemoLog[];
  emergencyForceMajeureActive: boolean;
  emergencyProtocolNotes?: string;
  finalSurgeonReport: string;
  startTime?: string;
  endTime?: string;
}

// ==========================================
// KNOWLEDGE BASE (پایگاه دانش تخصصی)
// ==========================================

export type KnowledgeCategory =
  | 'database_migration'
  | 'security_rbac'
  | 'pricing_services'
  | 'ui_ux_philosophy'
  | 'automation_scripts'
  | 'clinical_workflows';

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  contentMarkdown: string;
  tags: string[];
  authorRole: UserRole;
  authorName: string;
  aiGeneratedOrEnhanced: boolean;
  consultationPersona?: string; // نقش ایجنت در مباحثه: معماری نرم‌افزار، امنیت، پایگاه داده و غیره
  isApprovedByIT: boolean;
  allowedRoles: UserRole[]; // دسترسی تعیین شده صرفاً توسط کارشناس آی‌تی
  updatedAt: string;
  relatedCodeSnippet?: string;
  keyDecisions: string[];
}

// ==========================================
// LEGACY PRICING & MIGRATION EXTRACTION
// ==========================================

export interface LegacyServicePriceItem {
  id: string;
  code: string;
  title: string;
  category: 'service' | 'petshop_product' | 'medication' | 'lab_test' | 'surgery';
  transactionCountInLegacy: number; // دفعات کاربرد در سیستم سابق (فرکانس)
  isActiveCurrent: boolean; // آیا در جریان و فعال است؟
  latestPrice: number; // آخرین قیمت ثبت شده
  averagePrice: number; // میانگین وزنی قیمت تراکنش‌ها
  selectedStrategy: 'latest' | 'average' | 'custom';
  chosenPrice: number; // قیمت نهایی انتخابی کارشناس آی‌تی
  legacyUnit: string;
  cleansedStatus: 'pending' | 'cleansed' | 'migrated';
  suggestedTariffDifferencePercent?: number;
  notes?: string;
}

// ==========================================
// IT EXPERT ACTIONABLE TODO / CHECKLIST
// ==========================================

export interface ITTaskTodoItem {
  id: string;
  title: string;
  category: 'migration' | 'database' | 'security' | 'pricing' | 'automation' | 'ui_ux';
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
  assignedTo: string;
  dueDate: string;
  description: string;
  actionRoute?: string;
  aiRecommendation?: string;
}

// ==========================================
// MULTI-PULSE INSPECTION ENGINES & SCRIPTING
// ==========================================

export interface PulseInspectionEngine {
  id: string;
  name: string;
  pulseInterval: 'minute' | 'hourly' | 'daily' | 'on_error';
  pulseIntervalDisplay: string;
  status: 'running' | 'paused' | 'triggered';
  lastRunTime: string;
  nextRunTime: string;
  scriptCode: string;
  description: string;
  targetArea: 'error_logs' | 'security_rbac' | 'db_integrity' | 'pricing_audit';
  generatedReportsCount: number;
}

export interface InspectionIncidentReport {
  id: string;
  engineId: string;
  engineName: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  analysis: string;
  suggestedDebugPrompt: string;
  autoFixScriptSnippet?: string;
  resolved: boolean;
}

// ==========================================
// SNAPP PET TAXI DISPATCH
// ==========================================

export interface SnappPetTaxiRequest {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  ownerPhone: string;
  pickupAddress: string;
  pickupCoordinates?: { lat: number; lng: number };
  destinationAddress: string; // کلینیک مهرگان
  isForAnotherPerson: boolean; // درخواست برای دیگری
  passengerMobileGivenToSnapp: string;
  hasPetCarrierBox: boolean; // با باکس / بدون باکس
  accompanyingHuman: boolean; // با مسافر / بدون مسافر (صرفاً جابجایی حیوان)
  driverSpecialInstructionText: string; // توضیحات ویژه راننده اسنپ
  snappRideType: 'snapp_eco' | 'snapp_plus' | 'snapp_box';
  estimatedCostToman: number;
  tripStatus: 'draft' | 'dispatching' | 'driver_assigned' | 'arrived_pickup' | 'on_the_way_to_clinic' | 'arrived_clinic' | 'cancelled';
  driverName?: string;
  driverVehiclePlate?: string;
  driverPhone?: string;
  driverEtaMinutes?: number;
  createdAt: string;
}

export type DeploymentMode = 'lan_windows' | 'vps_ubuntu' | 'cloud_hosted';

export interface DeploymentConfig {
  mode: DeploymentMode;
  serverIp: string;
  domain: string;
  port: number;
  databaseType: 'embedded_json' | 'postgresql' | 'sqlite';
  postgresUri: string;
  lanSubnet: string;
  autoSyncIntervalMinutes: number;
  useSsl: boolean;
  activeInterface: string;
  status: 'online' | 'reconnecting' | 'error';
  lastReloadedAt: string;
  connectedClientsCount: number;
}



