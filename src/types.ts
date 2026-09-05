export type UserRole =
  | 'DIRECTOR'        // 시설장 (전체 데이터 조회/승인)
  | 'ADMIN'           // 관리자 (직원·업무·문서 관리)
  | 'SOCIAL_WORKER'   // 사회복지사 (담당 이용인 기록 및 사례관리)
  | 'CARE_WORKER'     // 생활지원 담당자 (생활기록 및 인수인계)
  | 'NURSE'           // 간호/건강 담당 (건강 관련 기록)
  | 'VIEWER';         // 조회 전용 (필요한 자료만 조회)

export type NavMenu =
  | 'TODAY'
  | 'RESIDENTS'
  | 'RECORDS'
  | 'CASE'
  | 'PROGRAMS'
  | 'HANDOVER'
  | 'STAFF'
  | 'DOCUMENTS'
  | 'STATS'
  | 'AI_ASSISTANT';

export interface StaffMember {
  id: string;
  name: string;
  position: string; // 직위/직책 (예: 시설장, 팀장, 선임사회복지사, 주임생활지원원, 전담간호사 등)
  role: UserRole;
  department: string;
  phone: string;
  email: string;
  joinDate: string;
  assignedResidentsCount?: number;
  status: '재직' | '휴직' | '퇴사';
  qualification?: string[];
  bio?: string;
}

export interface Resident {
  id: string;
  name: string;
  age: number;
  gender: '남' | '여';
  roomNumber: string;
  careLevel: string; // 예: 장기요양 1~5등급, 중증/경증
  admissionDate: string;
  guardianName: string;
  guardianPhone: string;
  primaryWorker: string;
  diagnosis: string[];
  keyNeeds: string[];
  recentEmotionScore: number; // 1 to 5
  recentBehaviorAlert: boolean;
  avatarUrl?: string;
  vitalSummary: {
    bloodPressure: string;
    temperature: string;
    pulse: string;
    bloodSugar: string;
  };
}

export interface TimelineEvent {
  id: string;
  residentId: string;
  date: string;
  time: string;
  category: '산책' | '프로그램' | '상담' | '병원' | '가족' | '생활기록' | '특이사항';
  title: string;
  description: string;
  staffName: string;
  badgeColor: string;
}

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  category: '일정' | '프로그램' | '기록' | '행정' | '인수인계';
  assignedTo: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MonthlyTask {
  id: string;
  month: string; // 예: '2026-09'
  title: string;
  completed: boolean;
  category: '사례관리' | '안전/시설' | '보호자소통' | '급여제공계획' | '행정/마감' | '프로그램';
  assignedTo: string;
  dueDate: string;
  targetCount?: number;
  currentCount?: number;
}

export interface ExtractedRecordInfo {
  resident: string;
  time: string;
  activity: string;
  need: string;
  emotion: string;
  interaction: string;
  problemBehavior: string;
  supportProvided: string;
  result: string;
}

export interface DecomposedOutputs {
  livingRecord: string;
  individualSupport: string;
  behaviorEmotion: string;
  handover: string;
  handoverPriority: 'HIGH' | 'MEDIUM' | 'LOW';
  caseManagementNeed: string;
  monthlyStatsCategory: string;
}

export interface WelfareRecord {
  id: string;
  residentId: string;
  residentName: string;
  date: string;
  time: string;
  staffName: string;
  rawInput: string;
  inputMode: 'DIRECT' | 'VOICE' | 'CHECK';
  checkedOptions?: {
    meal: string;
    mood: string;
    activity: string;
    relationship: string;
    specialNote: string;
  };
  extractedInfo: ExtractedRecordInfo;
  outputs: DecomposedOutputs;
  status: 'AI_DRAFT' | 'REVIEWED' | 'OFFICIAL';
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
}

export interface CaseManagementItem {
  id: string;
  residentId: string;
  residentName: string;
  currentStep: number; // 1 to 8: 욕구사정 -> 문제및욕구 -> 강점 -> 목표 -> 지원계획 -> 서비스제공 -> 모니터링 -> 평가
  needsAssessment: string[];
  strengths: string[];
  shortTermGoal: string;
  longTermGoal: string;
  supportPlan: string;
  monitoringNotes: string;
  evaluationSummary: string;
  aiDetectedNeeds30Days: string[];
  lastReviewDate: string;
  assignedWorker: string;
}

export interface ProgramSession {
  sessionNumber: number;
  date: string;
  activityTitle: string;
  attendanceCount: number;
  totalParticipants: number;
  satisfactionScore: number;
  observationNote: string;
}

export interface ProgramItem {
  id: string;
  title: string;
  category: '여가/정서' | '인지/치매예방' | '신체기능회복' | '지역사회적응';
  purpose: string;
  targetResidents: string;
  period: string;
  totalSessions: number;
  completedSessions: number;
  instructor: string;
  staffInCharge: string;
  status: '진행중' | '종료' | '계획중';
  proposalDraft?: string;
  resultReportDraft?: string;
  sessions: ProgramSession[];
}

export interface HandoverResidentNote {
  residentId: string;
  residentName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW'; // 🔴, 🟡, 🟢
  summary: string;
  actionRequired: string;
}

export interface HandoverResidentItem {
  residentId: string;
  residentName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  content: string;
  actionRequired: string;
}

export interface HandoverReport {
  id: string;
  date: string;
  shiftType: string;
  fromWorker: string;
  toWorker: string;
  status: 'DRAFT' | 'REVIEWED' | 'CONFIRMED';
  todayKeyEvents: string[];
  residentItems: HandoverResidentItem[];
  tomorrowSchedule: string[];
}

export interface HandoverDocument {
  id: string;
  date: string;
  shift: string; // '주간조 → 야간조' | '야간조 → 주간조'
  author: string;
  status: 'AI_DRAFT' | 'APPROVED';
  summary: string;
  residentNotes: HandoverResidentNote[];
  facilityNotices: string[];
  approvedBy?: string;
  approvedAt?: string;
}

export interface WelfareDocument {
  id: string;
  title: string;
  type: string;
  targetName: string;
  date: string;
  period: string;
  author: string;
  content: string;
  status: 'AI_DRAFT' | 'APPROVED';
  approvedBy?: string;
}

export interface WelfareDocItem {
  id: string;
  docType: string;
  title: string;
  residentName?: string;
  createdAt: string;
  author: string;
  status: 'AI_DRAFT' | 'OFFICIAL';
  content: string;
}

export interface FacilityStats {
  totalResidents: number;
  totalStaff: number;
  completionRates: {
    livingRecord: number;
    counseling: number;
    program: number;
    handover: number;
  };
  pendingRecordsCount: number;
  abnormalBehaviorAlertCount: number;
  totalProgramSessions: number;
  totalCommunityActivities: number;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AuditArea {
  id: string;
  name: string;
  category: string;
  scoreWeight: string;
  status: '준비완료' | '보완필요' | '미착수';
  requiredDocs: {
    title: string;
    docType: string;
    ready: boolean;
  }[];
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  isShared?: boolean;
  shareRole?: 'reader' | 'writer';
  shareUrl?: string;
  sharedDriveOrFolderId?: string;
}

export interface AppDataPackage {
  version: string;
  updatedAt: string;
  source: string;
  summary: {
    residentCount: number;
    recordCount: number;
    taskCount: number;
  };
  residents: Resident[];
  records: WelfareRecord[];
  tasks: DailyTask[];
  monthlyTasks: MonthlyTask[];
  timeline: TimelineEvent[];
  caseItems: CaseManagementItem[];
  programs: ProgramItem[];
  handover: HandoverReport;
  documents: WelfareDocument[];
  stats?: FacilityStats;
  staff?: StaffMember[];
}

