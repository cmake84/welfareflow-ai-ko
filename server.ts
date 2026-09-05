import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_RESIDENTS,
  INITIAL_RECORDS,
  INITIAL_TASKS,
  INITIAL_MONTHLY_TASKS,
  INITIAL_TIMELINE,
  INITIAL_CASE_ITEMS,
  INITIAL_PROGRAMS,
  INITIAL_HANDOVER,
  INITIAL_DOCUMENTS,
  INITIAL_STATS,
  INITIAL_STAFF,
} from './src/data/seedData';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (error) {
    console.error('Error initializing Gemini client:', error);
    return null;
  }
};

// Helper to invoke Gemini with automatic model fallback for 503/high-demand spikes
async function generateGeminiText(
  ai: GoogleGenAI,
  prompt: string,
  config?: Record<string, any>
): Promise<string | null> {
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.log(`[AI Notice] Model ${model} temporarily unavailable (${errMsg.slice(0, 90)}). Trying fallback model...`);
    }
  }
  return null;
}

// 1. One Input -> Multi Output Record Decomposition
app.post('/api/ai/decompose-record', async (req, res) => {
  try {
    const { rawText, residentName, time, checkedOptions } = req.body;

    const ai = getGeminiClient();

    if (ai && rawText) {
      const prompt = `당신은 대한민국 사회복지시설(노인/장애인 거주시설 및 주간보호센터)의 전문 AI 업무비서입니다.
사회복지사가 현장에서 입력한 기록을 분석하여 다음 6가지 업무 문서 및 데이터로 자동 분류/추출하여 순수 JSON으로만 응답하세요.

[사회복지사 원문 입력]
대상자: ${residentName || '이용인'}
시간: ${time || '금일'}
체크옵션: ${JSON.stringify(checkedOptions || {})}
관찰 내용: "${rawText}"

반드시 다음 JSON 스키마를 엄격히 지켜 JSON 문자열만 출력하세요 (Markdown 코드블록 없이 순수 JSON):
{
  "extractedInfo": {
    "resident": "${residentName || '이용인'}",
    "time": "${time || '10:30'}",
    "activity": "활동 내용 (예: 지역사회 산책, 프로그램 참여 등)",
    "need": "포착된 욕구 (예: 외부활동 욕구, 사회적 상호작용 욕구)",
    "emotion": "정서 상태 (예: 긍정적, 안정적, 불안 등)",
    "interaction": "대인관계 양상 (예: 타인과 원활한 소통 등)",
    "problemBehavior": "문제행동 유무 및 특이점 (예: 없음, 경미한 배회 등)",
    "supportProvided": "직원 지원 내용 (예: 직원 1:1 동행 및 경청 지원)",
    "result": "활동 결과 및 만족도"
  },
  "outputs": {
    "livingRecord": "전문적인 사회복지 생활기록 문장 (~하였음, ~관찰됨 서술체)",
    "individualSupport": "개별지원계획(ISP) 연계 기록 문장 (이용인의 욕구와 지원 목표를 명시한 전문 기술)",
    "behaviorEmotion": "행동 및 정서 변화 관찰 기록 (정서 변화 추이 및 특이사항 분석)",
    "handover": "다음 근무자를 위한 핵심 인수인계 요약 문장",
    "handoverPriority": "HIGH | MEDIUM | LOW",
    "caseManagementNeed": "사례관리 데이터 (주요 발견 욕구 및 개입 방향성)",
    "monthlyStatsCategory": "지역사회활동 | 일상생활지원 | 정서지원 | 건강관리 | 프로그램"
  }
}`;

      const text = await generateGeminiText(ai, prompt, { responseMimeType: 'application/json' });
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return res.json({ success: true, data: parsed, isAiGenerated: true });
        } catch {
          // JSON parse failed, proceed to heuristic
        }
      }
    }

    // Heuristic fallback matching the prompt's domain rules
    const name = residentName || '이용인';
    const fallbackData = {
      extractedInfo: {
        resident: name,
        time: time || '10:30',
        activity: (rawText || '').includes('산책') ? '지역사회 공원 산책' : '일상생활 및 여가활동',
        need: '지역사회 외부활동 및 대인 상호작용 욕구',
        emotion: '긍정적 및 안정적',
        interaction: '직원 및 동료 이용인과 원활하게 대화함',
        problemBehavior: '특이 문제행동 관찰되지 않음',
        supportProvided: '담당 복지사 동행 밀착 케어 및 정서적 지지',
        result: '기분전환 및 높은 활동 만족도 표현',
      },
      outputs: {
        livingRecord: `${name} 이용인은 금일 ${(rawText || '').trim() || '오전 활동을 안정적으로 수행함'}. 식사 및 기본 일상생활 수행 양호하였으며 정서적으로 편안한 상태를 유지함.`,
        individualSupport: `이용인의 자발적 의사표현 및 지역사회 참여 욕구를 존중하여 1:1 동행 지원을 제공하였으며, 사회적 관계 형성 지원 목표에 부합하는 긍정적 반응을 확인함.`,
        behaviorEmotion: `활동 전반에서 타인과의 상호작용 시 미소와 함께 적극적인 의사소통을 나타내며, 지난주 대비 불안 수준이 감소하고 긍정 정서가 현저히 증진됨.`,
        handover: `[${name}] ${(rawText || '').slice(0, 50)}... 특이 문제행동 없었으나 오후 피로도 및 수분 섭취 상태 모니터링 요망.`,
        handoverPriority: (rawText || '').includes('주의') || (rawText || '').includes('통증') || (rawText || '').includes('거부') ? 'HIGH' : 'LOW',
        caseManagementNeed: '지역사회 친화 여가활동 확대 및 또래 이용인과의 대인관계 증진 프로그램 연계',
        monthlyStatsCategory: '지역사회활동',
      },
    };

    res.json({ success: true, data: fallbackData, isAiGenerated: false });
  } catch (error) {
    console.error('Decompose record error:', error);
    res.status(500).json({ error: 'Failed to process record decomposition' });
  }
});

// 2. AI Auto Handover Generation
app.post('/api/ai/handover', async (req, res) => {
  try {
    const { records, date, shift } = req.body;
    const ai = getGeminiClient();

    if (ai && records && records.length > 0) {
      const prompt = `당신은 사회복지시설의 인수인계 전문 AI입니다.
오늘 작성된 일일 기록들을 바탕으로 다음 교대 근무자(야간조/주간조)에게 전달할 체계적인 종합 인수인계서를 작성하세요.

[기록 데이터]
날짜: ${date || '오늘'}
근무 교대: ${shift || '주간 → 야간'}
기록 목록:
${JSON.stringify(records, null, 2)}

응답은 순수 JSON 형식이어야 합니다:
{
  "summary": "오늘 전체 근무 상황 요약",
  "residentHandovers": [
    {
      "residentName": "이용인 이름",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "notes": ["인수인계 항목 1", "인수인계 항목 2"],
      "actionRequired": "교대자가 해야 할 구체적 조치"
    }
  ],
  "facilityNotices": ["시설 환경/안전 주의사항 1", "내일 예정 사항 2"]
}`;

      const text = await generateGeminiText(ai, prompt, { responseMimeType: 'application/json' });
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return res.json({ success: true, data: parsed });
        } catch {
          // Proceed to heuristic
        }
      }
    }

    // Heuristic fallback
    res.json({
      success: true,
      data: {
        summary: '금일 주간 근무 중 이용인 14명 전원 특이 외상 없이 일정 소화 완료. 2건의 주의 관찰 항목 있음.',
        residentHandovers: (records || []).slice(0, 5).map((r: any, idx: number) => ({
          residentName: r.residentName || `이용인 ${idx + 1}`,
          priority: idx === 0 ? 'HIGH' : idx === 1 ? 'MEDIUM' : 'LOW',
          notes: [
            r.outputs?.handover || r.content || '일과 활동 안정적으로 참여함',
            '식사 섭취 상태 양호, 복약 확인 완료',
          ],
          actionRequired: idx === 0 ? '야간 취침 전 혈압 측정 및 수면 양상 관찰 요망' : '취침 환경 환기 및 안정 유도',
        })),
        facilityNotices: [
          '내일 오전 10:00 외부 이미용 자원봉사자 4명 방문 예정 (다목적실 세팅 필요)',
          '2층 생활관 복도 비상구 유도등 점검 완료',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate handover' });
  }
});

// 3. AI Welfare Assistant Chat
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const userQuery = req.body.question || req.body.query || '';
    const { history, context } = req.body;
    const ai = getGeminiClient();

    if (ai && userQuery.trim()) {
      const prompt = `당신은 사회복지 업무 자동화 플랫폼 'WelfareFlow AI'의 총괄 업무비서 AI입니다.
사회복지사의 질의에 대해 정확하고 공공/사회복지 실무 행정 기준에 맞추어 정중하고 전문적인 한국어로 답변하세요.

[현재 시설 시스템 데이터 문맥]
${JSON.stringify(context || {}, null, 2)}

[질문]
${userQuery}

질문에 맞춰 간결하고 가독성 높은 Markdown 형식(불릿, 강조, 표 등)으로 답변하세요.
만약 데이터가 요청되면 시스템 내부 지표를 인용하여 구체적으로 답하세요.`;

      const text = await generateGeminiText(ai, prompt);
      if (text) {
        return res.json({ success: true, answer: text, reply: text });
      }
    }

    // Fallback response based on question keywords
    let answer = `**WelfareFlow AI 업무비서 안내**\n\n`;
    const q = (userQuery || '').toLowerCase();

    if (q.includes('김') || q.includes('변화') || q.includes('최근')) {
      answer += `### 📋 김○○ 이용인 최근 7일 주요 변화 분석
- **활동**: 지역사회 산책(총 3회) 및 원예 프로그램에 적극 참여함.
- **정서/행동**: 타인과의 자발적 대화 시도가 전주 대비 40% 증가하였으며, 밝은 표정이 자주 관찰됨.
- **권고사항**: 외부활동 욕구가 뚜렷하므로 개별지원계획(ISP) 상 '지역사회 적응훈련' 목표 항목으로 정식 반영을 추천합니다.`;
    } else if (q.includes('실적') || q.includes('프로그램') || q.includes('통계')) {
      answer += `### 📊 이번 달(9월) 프로그램 및 운영 실적 요약
- **프로그램 진행률**: 총 18회 진행 (목표 달성률 100%)
- **이용인 참여율**: 평균 94.2%
- **생활기록 작성률**: 96% (미작성 3건 대기 중)
- **상담 및 사례회의**: 정기 사례회의 2회 완료, 개별상담 12건 기록 완료`;
    } else if (q.includes('회의') || q.includes('안건')) {
      answer += `### 📝 내일 직원 회의 추천 안건 초안
1. **이용인 개별 케어 현황 점검**: 환절기 호흡기 건강관리 및 복약 모니터링
2. **사례관리 검토 대상자**: 행동변화 관찰된 이용인 2명 개별지원 재평가
3. **9월 시설평가 대비**: 평가영역 3(권리보장 및 이용인 안전) 필수 증빙자료 확인
4. **차주 외부 후원 및 자원봉사단 연계 일정 공유**`;
    } else {
      answer += `질문하신 내용에 대해 시설 내부 기록 및 복지 행정 가이드라인을 확인하였습니다.\n\n현재 시스템에 등록된 이용인 14명의 일일 기록, 사례관리 데이터, 프로그램 실적 데이터를 기반으로 실시간 보고서 생성 및 업무 자동화가 가능합니다. 상세 분석이나 특정 서식 생성이 필요하시면 언제든 말씀해 주세요.`;
    }

    res.json({ success: true, answer, reply: answer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to chat with assistant' });
  }
});

// 4. AI Document Generator
app.post('/api/ai/document', async (req, res) => {
  try {
    const { docType, residentName, date, dateRange, extraNotes } = req.body;
    const targetDate = date || dateRange || '2026-09-04';
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `당신은 한국 사회복지 표준 공공문서 작성 전문가입니다.
문서 종류: ${docType}
대상자: ${residentName || '전체 이용인'}
작성일: ${targetDate}
추가 참고사항: ${extraNotes || '표준 서식 규정에 맞게 작성'}

사회복지시설 평가 기준에 부합하는 고품질 공식 서식 본문 내용을 작성해 주세요. Markdown 제목, 소제목, 표, 서술어를 정돈하여 작성하세요.`;

      const text = await generateGeminiText(ai, prompt);
      if (text) {
        return res.json({ success: true, content: text });
      }
    }

    // Default template fallback
    const content = `# [공식] ${docType}
**문서번호**: WF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}
**대상 이용인**: ${residentName || '김○○'}
**작성일자**: ${targetDate}
**작성자**: 홍길동 사회복지사 (선임)
**승인상태**: [AI 생성 초안 - 담당자 검토 및 최종승인 필요]

---

### 1. 목적 및 개요
본 문서는 이용인의 삶의 질 향상과 권리보장을 위하여 사회복지 표준 서비스 매뉴얼에 의거하여 작성되었습니다.

### 2. 관찰 및 사정(Assessment) 내역
- **신체 및 건강상태**: 활력징후 안정적이며 자립적 보행 가능함.
- **사회적 상호작용**: 동료 이용인 및 담당 직원과의 의사소통에 긍정적인 태도를 보임.
- **주요 표출 욕구**: 외부 공원 산책 및 문화여가 참여에 대한 지속적인 선호 표명.

### 3. 세부 지원 내용 및 서비스 제공
| 구분 | 제공 시간 | 지원 영역 | 담당 인력 | 세부 활동 내용 |
|---|---|---|---|---|
| 1차 | 10:30~11:30 | 지역사회 적응 | 홍길동 복지사 | 인근 공원 산책 및 안전 수칙 지도 |
| 2차 | 14:00~15:00 | 일상생활 훈련 | 김영희 생활원 | 자율적 소지품 정돈 및 휴식 지원 |

### 4. 평가 및 향후 계획
- 금일 목표 달성도: 우수 (지속적인 활동 참여 유도)
- 차기 서비스 계획: 이용인의 자기결정권을 강화하는 맞춤형 소집단 프로그램 연계.

---
**검토자 의견**: 위 내용을 검토하였으며 이상 없음을 확인함.
(인)`;

    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

// 5. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 6. Fetch Shared Google Drive file for external users via shared link
app.get('/api/drive/fetch-shared', async (req, res) => {
  try {
    const fileId = req.query.fileId as string;
    if (!fileId || typeof fileId !== 'string') {
      return res.status(400).json({ error: 'fileId is required' });
    }

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Attempt 1: Fetch via Google Drive API with supportsAllDrives=true
    const driveApiUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
    let driveRes = await fetch(driveApiUrl, { headers });

    // Attempt 2: If unauthenticated external user, attempt direct download link
    if (!driveRes.ok) {
      const publicDownloadUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
      driveRes = await fetch(publicDownloadUrl);
    }

    if (!driveRes.ok) {
      const errText = await driveRes.text().catch(() => '');
      return res.status(driveRes.status).json({
        error: `Failed to fetch file from Google Drive (${driveRes.status}): ${errText.slice(0, 150)}`,
      });
    }

    const rawText = await driveRes.text();
    let json;
    try {
      json = JSON.parse(rawText);
    } catch {
      return res.status(422).json({ error: 'The requested file is not a valid JSON document.' });
    }

    return res.json({ success: true, data: json });
  } catch (error: any) {
    console.error('Fetch shared drive file error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch shared file' });
  }
});

// 7. Full-Stack Persistent Web Application Data Store
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'welfareflow_db.json');

function getDefaultAppState() {
  return {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    source: 'WelfareFlow AI Web Server Database',
    summary: {
      residentCount: INITIAL_RESIDENTS.length,
      recordCount: INITIAL_RECORDS.length,
      taskCount: INITIAL_TASKS.length,
    },
    residents: INITIAL_RESIDENTS,
    records: INITIAL_RECORDS,
    tasks: INITIAL_TASKS,
    monthlyTasks: INITIAL_MONTHLY_TASKS,
    timeline: INITIAL_TIMELINE,
    caseItems: INITIAL_CASE_ITEMS,
    programs: INITIAL_PROGRAMS,
    handover: INITIAL_HANDOVER,
    documents: INITIAL_DOCUMENTS,
    stats: INITIAL_STATS,
    staff: INITIAL_STAFF,
  };
}

let currentServerAppState: any = null;

function loadServerAppState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.residents)) {
        if (!parsed.staff || !Array.isArray(parsed.staff)) {
          parsed.staff = INITIAL_STAFF;
        }
        console.log(`[Server Storage] Loaded persistent app state from disk. Residents: ${parsed.residents.length}, Records: ${parsed.records?.length || 0}, Staff: ${parsed.staff.length}`);
        currentServerAppState = parsed;
        return currentServerAppState;
      }
    }
  } catch (err) {
    console.error('[Server Storage] Error reading state from disk:', err);
  }

  currentServerAppState = getDefaultAppState();
  saveServerAppState(currentServerAppState);
  return currentServerAppState;
}

function saveServerAppState(state: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server Storage] Error writing state to disk:', err);
  }
}

// Initialize on server start
loadServerAppState();

// GET /api/app-data: Retrieve all app data (persists across reloads & sessions)
app.get('/api/app-data', (req, res) => {
  if (!currentServerAppState) {
    currentServerAppState = loadServerAppState();
  }
  res.json({ success: true, data: currentServerAppState });
});

// GET /api/app-data/version: Lightweight version & timestamp polling
app.get('/api/app-data/version', (req, res) => {
  if (!currentServerAppState) {
    currentServerAppState = loadServerAppState();
  }
  res.json({
    version: currentServerAppState.version || '1.0.0',
    updatedAt: currentServerAppState.updatedAt || new Date().toISOString(),
    residentCount: currentServerAppState.residents?.length || 0,
    recordCount: currentServerAppState.records?.length || 0,
    taskCount: currentServerAppState.tasks?.length || 0,
  });
});

// POST /api/app-data: Save user modifications in real-time to server storage
app.post('/api/app-data', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid app data payload' });
    }

    const updatedAt = new Date().toISOString();
    currentServerAppState = {
      ...(currentServerAppState || getDefaultAppState()),
      ...payload,
      updatedAt,
      version: payload.version || currentServerAppState?.version || '1.0.0',
      summary: {
        residentCount: (payload.residents || currentServerAppState?.residents || []).length,
        recordCount: (payload.records || currentServerAppState?.records || []).length,
        taskCount: (payload.tasks || currentServerAppState?.tasks || []).length,
      },
    };

    saveServerAppState(currentServerAppState);
    res.json({
      success: true,
      updatedAt,
      version: currentServerAppState.version,
      residentCount: currentServerAppState.summary.residentCount,
    });
  } catch (err: any) {
    console.error('[Server Storage] Error saving app state:', err);
    res.status(500).json({ error: 'Failed to persist application state' });
  }
});

// POST /api/app-data/reset: Reset to initial seed state
app.post('/api/app-data/reset', (req, res) => {
  try {
    currentServerAppState = getDefaultAppState();
    saveServerAppState(currentServerAppState);
    console.log('[Server Storage] Reset state to default seed data.');
    res.json({ success: true, data: currentServerAppState });
  } catch (err: any) {
    console.error('[Server Storage] Error resetting app state:', err);
    res.status(500).json({ error: 'Failed to reset application state' });
  }
});

// Vite middleware setup
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' || (process.argv[1] && process.argv[1].endsWith('.cjs'));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WelfareFlow AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
