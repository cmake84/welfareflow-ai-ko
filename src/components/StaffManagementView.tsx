import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Building,
  Shield,
  Award,
  Briefcase,
  Calendar,
  Save,
  AlertCircle,
} from 'lucide-react';
import { StaffMember, UserRole } from '../types';

interface StaffManagementViewProps {
  staffList: StaffMember[];
  onUpdateStaff: (updated: StaffMember) => void;
  onAddStaff: (newStaff: StaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
  onRoleChange?: (role: UserRole) => void;
}

const ROLE_DISPLAY_NAMES: Record<UserRole, { label: string; badge: string }> = {
  DIRECTOR: { label: '시설장 (총괄)', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ADMIN: { label: '관리자 (운영)', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  SOCIAL_WORKER: { label: '사회복지사', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  CARE_WORKER: { label: '생활지원원', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  NURSE: { label: '간호사', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  VIEWER: { label: '조회 전용', badge: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const DEPARTMENT_OPTIONS = [
  '전체 부서',
  '시설운영총괄',
  '복지지원팀',
  '생활지원1팀',
  '생활지원2팀',
  '건강간호팀',
  '행정기획실',
];

const POSITION_SUGGESTIONS = [
  '시설장',
  '사무국장',
  '행정기획팀장',
  '선임 사회복지사',
  '사회복지사',
  '생활지원 주임',
  '생활지원원',
  '전담 간호사',
  '간호조무사',
  '물리치료사',
  '영양사',
  '조리원',
];

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffList,
  onUpdateStaff,
  onAddStaff,
  onDeleteStaff,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('전체 부서');
  const [statusFilter, setStatusFilter] = useState<'ALL' | '재직' | '휴직' | '퇴사'>('ALL');

  // Edit Modal State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isNewStaffModal, setIsNewStaffModal] = useState(false);

  // Form Fields for Editing or Adding
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: '',
    position: '',
    department: '복지지원팀',
    role: 'SOCIAL_WORKER',
    phone: '',
    email: '',
    status: '재직',
    joinDate: new Date().toISOString().slice(0, 10),
    qualification: [],
    bio: '',
  });

  const [formQualInput, setFormQualInput] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick Inline Editing State (inline row click)
  const [quickEditingId, setQuickEditingId] = useState<string | null>(null);
  const [quickName, setQuickName] = useState('');
  const [quickPosition, setQuickPosition] = useState('');

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleStartQuickEdit = (member: StaffMember) => {
    setQuickEditingId(member.id);
    setQuickName(member.name);
    setQuickPosition(member.position);
  };

  const handleSaveQuickEdit = (member: StaffMember) => {
    if (!quickName.trim() || !quickPosition.trim()) {
      alert('이름과 직위를 모두 입력해주세요.');
      return;
    }
    const updated: StaffMember = {
      ...member,
      name: quickName.trim(),
      position: quickPosition.trim(),
    };
    onUpdateStaff(updated);
    setQuickEditingId(null);
    triggerToast(`'${updated.name}' 직원의 이름과 직위가 수정되었습니다.`);
  };

  const handleCancelQuickEdit = () => {
    setQuickEditingId(null);
  };

  const handleOpenEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    setIsNewStaffModal(false);
    setFormData({
      ...member,
    });
    setFormQualInput((member.qualification || []).join(', '));
  };

  const handleOpenNewModal = () => {
    setEditingStaff(null);
    setIsNewStaffModal(true);
    setFormData({
      name: '',
      position: '사회복지사',
      department: '복지지원팀',
      role: 'SOCIAL_WORKER',
      phone: '010-',
      email: '',
      status: '재직',
      joinDate: new Date().toISOString().slice(0, 10),
      qualification: ['사회복지사 1급'],
      bio: '',
    });
    setFormQualInput('사회복지사 1급');
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('직원 이름을 입력해주세요.');
      return;
    }
    if (!formData.position?.trim()) {
      alert('직위/직책을 입력해주세요.');
      return;
    }

    const quals = formQualInput
      .split(',')
      .map((q) => q.trim())
      .filter(Boolean);

    if (isNewStaffModal) {
      const newMember: StaffMember = {
        id: `staff-${Date.now()}`,
        name: formData.name.trim(),
        position: formData.position.trim(),
        department: formData.department || '복지지원팀',
        role: formData.role || 'SOCIAL_WORKER',
        phone: formData.phone?.trim() || '010-0000-0000',
        email: formData.email?.trim() || `${formData.name.trim()}@welfareflow.kr`,
        joinDate: formData.joinDate || new Date().toISOString().slice(0, 10),
        status: (formData.status as any) || '재직',
        qualification: quals,
        bio: formData.bio || '',
      };
      onAddStaff(newMember);
      triggerToast(`새로운 직원 '${newMember.name}'(${newMember.position})이(가) 등록되었습니다.`);
    } else if (editingStaff) {
      const updated: StaffMember = {
        ...editingStaff,
        ...formData,
        name: formData.name.trim(),
        position: formData.position.trim(),
        qualification: quals,
      };
      onUpdateStaff(updated);
      triggerToast(`'${updated.name}' 직원의 정보가 성공적으로 수정되었습니다.`);
    }

    setEditingStaff(null);
    setIsNewStaffModal(false);
  };

  const handleDelete = (member: StaffMember) => {
    if (
      window.confirm(
        `'${member.name}' (${member.position}) 직원을 명단에서 삭제하시겠습니까?\n(웹 서버 및 모든 연결 장치에 실시간 동기화됩니다)`
      )
    ) {
      onDeleteStaff(member.id);
      triggerToast(`'${member.name}' 직원이 삭제되었습니다.`);
    }
  };

  // Filter staff
  const filteredStaff = staffList.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);

    const matchDept = selectedDept === '전체 부서' || m.department === selectedDept;
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;

    return matchSearch && matchDept && matchStatus;
  });

  const activeCount = staffList.filter((s) => s.status === '재직').length;
  const welfareWorkersCount = staffList.filter(
    (s) => s.role === 'SOCIAL_WORKER' || s.role === 'CARE_WORKER' || s.role === 'NURSE'
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>직원 관리 (Staff Management)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                  총 {staffList.length}명
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                복지시설 직원의 <strong className="text-blue-700 font-semibold">이름</strong>과{' '}
                <strong className="text-blue-700 font-semibold">직위</strong>, 소속 부서 및 시스템 역할을
                수정하고 관리할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-add-new-staff"
            type="button"
            onClick={handleOpenNewModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>신규 직원 등록</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">전체 직원</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{staffList.length}</span>
              <span className="text-xs text-slate-500">명</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">정규 재직 인원</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-600">{activeCount}</span>
              <span className="text-xs text-slate-500">명 정상 근무</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">케어 및 전문 복지인력</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-indigo-600">{welfareWorkersCount}</span>
              <span className="text-xs text-slate-500">명 (복지·생활·간호)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">운영 부서 수</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">5</span>
              <span className="text-xs text-slate-500">개 전담 팀</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="staff-search-input"
              type="text"
              placeholder="직원 이름, 직위, 부서 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="staff-dept-filter"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {(['ALL', '재직', '휴직', '퇴사'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? '전체 상태' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          검색 결과 <strong className="text-slate-700">{filteredStaff.length}</strong>명
        </div>
      </div>

      {/* Staff Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">직원 정보 (이름 / 직위)</th>
                <th className="py-3 px-4">소속 부서</th>
                <th className="py-3 px-4">시스템 역할</th>
                <th className="py-3 px-4">연락처 및 이메일</th>
                <th className="py-3 px-4">보유 자격</th>
                <th className="py-3 px-4">상태</th>
                <th className="py-3 px-4 text-center">직원 수정 / 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    검색 조건에 일치하는 직원이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const isQuick = quickEditingId === member.id;
                  const roleConfig = ROLE_DISPLAY_NAMES[member.role] || {
                    label: member.role,
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Name & Position (Inline Editable or Display) */}
                      <td className="py-3.5 px-4">
                        {isQuick ? (
                          <div className="space-y-1.5 max-w-[220px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-medium">이름:</span>
                              <input
                                id={`quick-name-${member.id}`}
                                type="text"
                                value={quickName}
                                onChange={(e) => setQuickName(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs font-bold text-slate-900 focus:outline-hidden"
                                placeholder="이름"
                                autoFocus
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-medium">직위:</span>
                              <input
                                id={`quick-pos-${member.id}`}
                                type="text"
                                value={quickPosition}
                                onChange={(e) => setQuickPosition(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs text-blue-700 font-medium focus:outline-hidden"
                                placeholder="직위/직책 (예: 선임 사회복지사)"
                              />
                            </div>
                            <div className="flex items-center gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => handleSaveQuickEdit(member)}
                                className="px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3 h-3" />
                                저장
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelQuickEdit}
                                className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-medium hover:bg-slate-300 cursor-pointer"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-100 group-hover:text-blue-800 transition">
                              {member.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{member.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleStartQuickEdit(member)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 transition"
                                  title="이름/직위 빠른 수정"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                                {member.position}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.department}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleConfig.badge}`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-slate-600 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{member.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500">{member.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Qualifications */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {member.qualification && member.qualification.length > 0 ? (
                            member.qualification.map((q, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200"
                              >
                                {q}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            member.status === '재직'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : member.status === '휴직'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            id={`btn-edit-staff-${member.id}`}
                            type="button"
                            onClick={() => handleOpenEditModal(member)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="전체 정보 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>상세 수정</span>
                          </button>
                          <button
                            id={`btn-delete-staff-${member.id}`}
                            type="button"
                            onClick={() => handleDelete(member)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="직원 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {(editingStaff || isNewStaffModal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isNewStaffModal ? '신규 직원 등록' : `'${formData.name}' 직원 정보 수정`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    이름, 직위 및 직무 정보를 수정하면 웹 전체에 실시간 반영됩니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingStaff(null);
                  setIsNewStaffModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    직원 이름 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="modal-staff-name"
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 font-bold"
                    placeholder="예: 이지은"
                  />
                </div>

                {/* 2. Position (Job Title) */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    직위 / 직책 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="modal-staff-position"
                      type="text"
                      required
                      value={formData.position || ''}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      list="position-suggestions"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 font-bold text-blue-700"
                      placeholder="예: 선임 사회복지사, 생활지원 주임"
                    />
                    <datalist id="position-suggestions">
                      {POSITION_SUGGESTIONS.map((pos) => (
                        <option key={pos} value={pos} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Department */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">소속 부서</label>
                  <select
                    id="modal-staff-dept"
                    value={formData.department || '복지지원팀'}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white focus:border-blue-500"
                  >
                    {DEPARTMENT_OPTIONS.filter((d) => d !== '전체 부서').map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* System Role */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">시스템 권한 등급</label>
                  <select
                    id="modal-staff-role"
                    value={formData.role || 'SOCIAL_WORKER'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white focus:border-blue-500"
                  >
                    <option value="DIRECTOR">시설장 (전체 조회 및 최종 결재)</option>
                    <option value="ADMIN">관리자 (인사·행정·문서)</option>
                    <option value="SOCIAL_WORKER">사회복지사 (기록 및 사례관리)</option>
                    <option value="CARE_WORKER">생활지원원 (생활기록 및 인수인계)</option>
                    <option value="NURSE">간호사 (바이탈 및 건강관리)</option>
                    <option value="VIEWER">조회 전용 (평가관)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">연락처 (휴대전화)</label>
                  <input
                    id="modal-staff-phone"
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    placeholder="010-1234-5678"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">이메일 주소</label>
                  <input
                    id="modal-staff-email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    placeholder="name@welfareflow.kr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Status */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">재직 상태</label>
                  <select
                    id="modal-staff-status"
                    value={formData.status || '재직'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white focus:border-blue-500"
                  >
                    <option value="재직">재직 (정상 근무)</option>
                    <option value="휴직">휴직</option>
                    <option value="퇴사">퇴사</option>
                  </select>
                </div>

                {/* Join Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">입사일</label>
                  <input
                    id="modal-staff-join-date"
                    type="date"
                    value={formData.joinDate || ''}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Qualifications */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  보유 자격 / 면허 <span className="text-[10px] text-slate-400 font-normal">(쉼표로 구분)</span>
                </label>
                <input
                  id="modal-staff-qualifications"
                  type="text"
                  value={formQualInput}
                  onChange={(e) => setFormQualInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                  placeholder="예: 사회복지사 1급, 요양보호사 1급, 인권교육 수료"
                />
              </div>

              {/* Bio / Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">주요 담당 업무 소개 및 메모</label>
                <textarea
                  id="modal-staff-bio"
                  rows={2}
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 leading-relaxed"
                  placeholder="담당 업무 및 특이사항 입력..."
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaff(null);
                    setIsNewStaffModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  id="modal-staff-submit"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isNewStaffModal ? '직원 등록 완료' : '수정사항 저장'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
