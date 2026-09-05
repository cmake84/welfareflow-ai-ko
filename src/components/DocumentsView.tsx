import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  User,
  Filter,
  Layers,
  Clock,
  Eye,
  Edit3,
} from 'lucide-react';
import { WelfareDocument, Resident } from '../types';

interface DocumentsViewProps {
  documents: WelfareDocument[];
  residents: Resident[];
  onAddDocument: (doc: WelfareDocument) => void;
}

const DOCUMENT_TYPES = [
  '상담기록서',
  '생활기록부',
  '프로그램 계획서',
  '프로그램 결과보고서',
  '사례회의록',
  '개별지원계획서 (ISP)',
  '직원회의록',
  '업무보고서',
  '교육일지',
  '월간 운영보고서',
  '시설장 보고자료',
  '보건복지부 평가자료',
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  residents,
  onAddDocument,
}) => {
  const [selectedDocType, setSelectedDocType] = useState<string>('상담기록서');
  const [selectedResidentName, setSelectedResidentName] = useState<string>('김민수');
  const [dateRange, setDateRange] = useState<string>('2026.09.01 ~ 2026.09.04');
  const [extraPrompt, setExtraPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active view or preview document
  const [activeDoc, setActiveDoc] = useState<WelfareDocument | null>(documents[0] || null);
  const [editableContent, setEditableContent] = useState<string>(activeDoc?.content || '');
  const [filterType, setFilterType] = useState<string>('ALL');

  const [approvalMessage, setApprovalMessage] = useState(false);

  // AI Document Generation (Section 12 Requirement)
  const handleGenerateDoc = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: selectedDocType,
          residentName: selectedResidentName,
          dateRange,
          extraNotes: extraPrompt,
        }),
      });
      const data = await res.json();

      const newDoc: WelfareDocument = {
        id: `doc-${Date.now()}`,
        title: `[공식] ${selectedResidentName} ${selectedDocType}`,
        type: selectedDocType,
        targetName: selectedResidentName,
        date: '2026-09-04',
        period: dateRange,
        author: '이지은 사회복지사',
        content: data.content || `# ${selectedDocType}\n\n- 대상: ${selectedResidentName}\n- 작성일: 2026-09-04\n\nAI가 성공적으로 문서를 생성하였습니다.`,
        status: 'AI_DRAFT',
      };

      onAddDocument(newDoc);
      setActiveDoc(newDoc);
      setEditableContent(newDoc.content);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveDoc = () => {
    if (!activeDoc) return;
    const updated: WelfareDocument = {
      ...activeDoc,
      content: editableContent,
      status: 'APPROVED',
      approvedBy: '정원호 시설장 (최종 결재)',
    };
    onAddDocument(updated);
    setActiveDoc(updated);
    setApprovalMessage(true);
    setTimeout(() => setApprovalMessage(false), 3000);
  };

  const filteredDocs = documents.filter((d) => {
    if (filterType === 'ALL') return true;
    return d.type.includes(filterType);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            문서·보고 자동화 센터
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              12종 사회복지 공문서 AI 원클릭 생성
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            기존에 입력된 생활기록과 상담 데이터를 조합하여 표준 사회복지 보고서 초안을 만들고 즉시 결재 및 인쇄합니다.
          </p>
        </div>
      </div>

      {/* 1. Document Generator Configuration Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            AI 보고서 작성기 (문서 종류 및 대상 선택)
          </h3>
          <span className="text-[11px] text-slate-500">기존 축적 데이터 자동 조합</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">1. 문서 종류 선택</label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">2. 대상자 선택</label>
            <select
              value={selectedResidentName}
              onChange={(e) => setSelectedResidentName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="전체 이용인 (시설 전체)">전체 이용인 (시설 종합)</option>
              {residents.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} ({r.roomNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">3. 분석 기간</label>
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              placeholder="예: 2026.09.01 ~ 2026.09.04"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">4. 특기사항 / 강조 요청</label>
            <input
              type="text"
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder="예: 산책 및 대인관계 긍정적 측면 부각"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            id="generate-document-ai-btn"
            onClick={handleGenerateDoc}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? '기존 기록 종합하여 문서 작성 중...' : 'AI 공문서 초안 즉시 생성'}</span>
          </button>
        </div>
      </div>

      {/* 2. Documents List & Viewer Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Archive List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              공식 문서 보관함 ({documents.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === activeDoc?.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setActiveDoc(doc);
                    setEditableContent(doc.content);
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {doc.type}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        doc.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status === 'APPROVED' ? '최종 결재완료' : 'AI 초안 검토'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{doc.title}</h4>
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>대상: {doc.targetName}</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Document Viewer & Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeDoc ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              {/* Document Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{activeDoc.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      작성자: {activeDoc.author}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    적용 기간: {activeDoc.period} | 대상: {activeDoc.targetName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {approvalMessage && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> 승인 완료!
                    </span>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    title="인쇄 및 PDF 다운로드"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>인쇄/PDF</span>
                  </button>
                  <button
                    id="approve-document-btn"
                    onClick={handleApproveDoc}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[최종 결재 및 승인]</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <span className="font-medium text-slate-700">
                  문서 검토 상태: <strong>{activeDoc.status === 'APPROVED' ? `공식 승인됨 (${activeDoc.approvedBy})` : 'AI 작성 초안 (수정 및 보완 가능)'}</strong>
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> 아래 텍스트 영역에서 직접 수정할 수 있습니다.
                </span>
              </div>

              {/* Editable Content Area */}
              <textarea
                rows={18}
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full text-xs sm:text-sm p-4 rounded-xl border border-slate-300 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
              선택된 문서가 없습니다. 좌측에서 문서를 선택하거나 상단에서 새로 생성하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
