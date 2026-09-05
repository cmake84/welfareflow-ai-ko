import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Clock,
  HardDrive,
  FileJson,
  X,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Sparkles,
  Share2,
  Copy,
  FolderPlus,
  Link,
  Check,
  FolderGit2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppDataPackage, DriveFileInfo } from '../types';
import {
  saveAppDataToDrive,
  loadAppDataFromDrive,
  listDriveBackupFiles,
  deleteDriveFile,
  getStoredDriveFiles,
  createShareableLink,
  fetchSharedAppData,
  getTargetDriveFolderId,
  setTargetDriveFolderId,
  MASTER_FILE_NAME,
} from '../services/googleDriveService';
import { googleSignIn, logoutGoogle } from '../services/googleDriveAuth';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthLogout: () => void;
  currentAppData: AppDataPackage;
  onRestoreData: (restoredData: AppDataPackage) => void;
  autoDriveSync: boolean;
  onToggleAutoDriveSync: (enabled: boolean) => void;
  lastSyncTime?: string | null;
  onSyncCompleted?: (time: string) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accessToken,
  onAuthSuccess,
  onAuthLogout,
  currentAppData,
  onRestoreData,
  autoDriveSync,
  onToggleAutoDriveSync,
  lastSyncTime,
  onSyncCompleted,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Shared Drive / Folder Target State
  const [targetFolderInput, setTargetFolderInput] = useState<string>(() => getTargetDriveFolderId());
  const [isFolderConfigSaved, setIsFolderConfigSaved] = useState(false);

  // Sharing Link Modal State
  const [shareDialogFile, setShareDialogFile] = useState<DriveFileInfo | null>(null);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string>('');
  const [generatedWebViewLink, setGeneratedWebViewLink] = useState<string>('');
  const [isCopying, setIsCopying] = useState(false);
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  // Open Shared Link Directly State
  const [manualShareInput, setManualShareInput] = useState('');
  const [isManualLoading, setIsManualLoading] = useState(false);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Fetch drive files when modal opens and token is available
  useEffect(() => {
    if (isOpen && accessToken) {
      loadFilesList();
    }
    if (isOpen) {
      setTargetFolderInput(getTargetDriveFolderId());
    }
  }, [isOpen, accessToken]);

  const loadFilesList = async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const files = await listDriveBackupFiles(accessToken);
      setDriveFiles(files);
    } catch (err: any) {
      console.info('Drive files listing notice:', err);
      const localFiles = getStoredDriveFiles();
      setDriveFiles(localFiles);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const res = await googleSignIn();
      if (res && res.user && res.accessToken) {
        onAuthSuccess(res.user, res.accessToken);
        setStatusMessage({
          type: 'success',
          text: `구글 계정(${res.user.email})과 성공적으로 연동되었습니다.`,
        });
        const files = await listDriveBackupFiles(res.accessToken);
        setDriveFiles(files);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      console.error('Login error:', err);
      setStatusMessage({
        type: 'error',
        text: `구글 로그인 오류: ${err.message || '권한 요청이 취소되었습니다.'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logoutGoogle();
      onAuthLogout();
      setDriveFiles([]);
      setStatusMessage({
        type: 'info',
        text: '구글 계정 연동이 해제되었습니다. 로컬 저장 모드로 전환됩니다.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `로그아웃 실패: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save Target Shared Drive / Folder ID
  const handleSaveTargetFolder = () => {
    setTargetDriveFolderId(targetFolderInput);
    setIsFolderConfigSaved(true);
    setStatusMessage({
      type: 'success',
      text: targetFolderInput.trim()
        ? '구글 공유 드라이브/폴더 대상이 설정되었습니다. 이후 저장되는 데이터는 해당 위치에 저장됩니다.'
        : '저장 대상 위치가 기본 내 드라이브로 초기화되었습니다.',
    });
    setTimeout(() => setIsFolderConfigSaved(false), 3000);
  };

  // 1. Save Current App Data to Drive (Overwriting Master File)
  const promptSaveToDrive = () => {
    if (!accessToken) return;

    setConfirmDialog({
      isOpen: true,
      title: '구글 드라이브 데이터 동기화',
      description: `현재 작업 중인 전체 복지 데이터(이용인 ${currentAppData.residents.length}명, 기록 ${currentAppData.records.length}건, 업무 ${currentAppData.tasks.length}건)를 구글 드라이브 마스터 파일('${MASTER_FILE_NAME}')에 저장(동기화)하시겠습니까?`,
      confirmLabel: '드라이브에 저장',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setIsLoading(true);
          const fileInfo = await saveAppDataToDrive(currentAppData, accessToken, MASTER_FILE_NAME);
          await loadFilesList();
          const nowStr = new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          if (onSyncCompleted) onSyncCompleted(nowStr);
          setStatusMessage({
            type: 'success',
            text: `구글 드라이브에 성공적으로 동기화되었습니다 (${fileInfo.name}, ${fileInfo.size || ''}).`,
          });
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: `저장 실패: ${err.message}`,
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // 2. Save Timestamped Snapshot Archive
  const promptCreateSnapshot = () => {
    if (!accessToken) return;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
    const snapshotFileName = `welfareflow_backup_${dateStr}_${timeStr}.json`;

    setConfirmDialog({
      isOpen: true,
      title: '시점별 백업 스냅샷 별도 생성',
      description: `현재 상태를 보존하기 위해 '${snapshotFileName}' 별도 백업 파일을 구글 드라이브에 생성하시겠습니까?`,
      confirmLabel: '스냅샷 생성',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setIsLoading(true);
          await saveAppDataToDrive(currentAppData, accessToken, snapshotFileName);
          await loadFilesList();
          setStatusMessage({
            type: 'success',
            text: `백업 스냅샷 '${snapshotFileName}'이 생성되었습니다.`,
          });
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: `스냅샷 생성 실패: ${err.message}`,
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // 3. Restore Data from Drive with Confirmation
  const promptRestoreFromDrive = (fileName: string) => {
    if (!accessToken) return;

    setConfirmDialog({
      isOpen: true,
      title: '구글 드라이브에서 데이터 복원',
      description: `구글 드라이브의 '${fileName}' 데이터를 현재 화면에 불러옵니다. 현재 로컬 브라우저의 미저장 작업 내역이 해당 파일 데이터로 대체됩니다. 계속하시겠습니까?`,
      confirmLabel: '데이터 불러오기(복원)',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setIsLoading(true);
          const loaded = await loadAppDataFromDrive(accessToken, fileName);
          if (!loaded) {
            throw new Error(`드라이브에서 '${fileName}' 파일을 찾을 수 없습니다.`);
          }
          onRestoreData(loaded.data);
          const nowStr = new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          if (onSyncCompleted) onSyncCompleted(nowStr);
          setStatusMessage({
            type: 'success',
            text: `구글 드라이브에서 데이터(이용인 ${loaded.data.residents?.length || 0}명, 기록 ${loaded.data.records?.length || 0}건)를 성공적으로 불러왔습니다.`,
          });
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: `불러오기 실패: ${err.message}`,
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // 4. Delete Drive File with Confirmation
  const promptDeleteFile = (file: DriveFileInfo) => {
    if (!accessToken) return;

    setConfirmDialog({
      isOpen: true,
      title: '구글 드라이브 백업 파일 삭제',
      description: `구글 드라이브에서 '${file.name}' 파일을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: '파일 삭제',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setIsLoading(true);
          await deleteDriveFile(file.id, accessToken);
          await loadFilesList();
          setStatusMessage({
            type: 'info',
            text: `'${file.name}' 파일이 삭제되었습니다.`,
          });
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: `삭제 실패: ${err.message}`,
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // 5. Generate Shareable Link for External Users
  const handleOpenShareDialog = async (file: DriveFileInfo) => {
    if (!accessToken) return;
    setShareDialogFile(file);
    setIsSharingLoading(true);
    try {
      const { shareUrl, webViewLink } = await createShareableLink(file.id, accessToken, 'reader');
      setGeneratedShareUrl(shareUrl);
      setGeneratedWebViewLink(webViewLink);
      await loadFilesList();
    } catch (err: any) {
      console.error('Failed to create shareable link:', err);
      // Fallback URL
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const appShareUrl = `${origin}${pathname}?driveFileId=${file.id}`;
      setGeneratedShareUrl(appShareUrl);
      setGeneratedWebViewLink(`https://drive.google.com/file/d/${file.id}/view?usp=sharing`);
    } finally {
      setIsSharingLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    } catch {
      // Fallback copy
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    }
  };

  // 6. Open Shared File by Direct URL / File ID
  const handleLoadManualShare = async () => {
    if (!manualShareInput.trim()) return;

    let targetId = manualShareInput.trim();
    // Parse URL parameter driveFileId= or /d/ID
    const paramMatch = targetId.match(/[?&]driveFileId=([a-zA-Z0-9_-]+)/);
    if (paramMatch && paramMatch[1]) {
      targetId = paramMatch[1];
    } else {
      const dMatch = targetId.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (dMatch && dMatch[1]) {
        targetId = dMatch[1];
      }
    }

    try {
      setIsManualLoading(true);
      setStatusMessage(null);
      const restored = await fetchSharedAppData(targetId, accessToken);
      onRestoreData(restored);
      setStatusMessage({
        type: 'success',
        text: `공유된 구글 드라이브 데이터(이용인 ${restored.residents?.length || 0}명, 기록 ${restored.records?.length || 0}건)를 성공적으로 불러왔습니다.`,
      });
      setManualShareInput('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `공유 파일 불러오기 실패: ${err.message}`,
      });
    } finally {
      setIsManualLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                구글 드라이브 & 공유드라이브 클라우드 연동
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                  Shared Drive & Link Share
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                실시간 데이터를 내 계정 또는 공유 드라이브에 저장하고, 링크로 외부 이용자와 안전하게 공유합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <Cloud className="w-4 h-4 shrink-0 text-blue-600" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* Account Card */}
          {!currentUser ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 text-center space-y-4">
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-sm font-bold text-slate-800">
                  구글 계정을 연동하여 클라우드 저장 및 공유를 시작하세요
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  개인 드라이브 또는 시설 구글 공유드라이브(Team Drive)에 데이터를 보관하고,
                  외부 이용자에게 전달할 수 있는 전용 열람 링크를 생성할 수 있습니다.
                </p>
              </div>

              {/* Official Google Sign-In Styled Button per skill specifications */}
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition hover:shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>Google 계정으로 로그인하여 드라이브 연동</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {currentUser.displayName ? currentUser.displayName[0] : 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      {currentUser.displayName || '구글 사용자'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> 연동됨
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{currentUser.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-600 text-xs font-medium transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>연동 해제</span>
                </button>
              </div>
            </div>
          )}

          {/* Target Google Shared Drive / Folder Setting */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  구글 공유 드라이브(Shared Drive) 또는 폴더 대상 지정
                </span>
              </div>
              {getTargetDriveFolderId() && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  공유 폴더 저장 모드
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              기관의 공용 구글 공유드라이브 URL이나 폴더 ID를 입력하면, 모든 실시간 데이터와 백업이 해당 공유드라이브에 저장됩니다. (비워둘 시 개인 내 드라이브에 저장)
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={targetFolderInput}
                onChange={(e) => setTargetFolderInput(e.target.value)}
                placeholder="예: https://drive.google.com/drive/folders/1aBc... 또는 폴더 ID"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={handleSaveTargetFolder}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition flex items-center gap-1"
              >
                {isFolderConfigSaved ? <Check className="w-3.5 h-3.5" /> : null}
                <span>적용</span>
              </button>
            </div>
          </div>

          {/* Sync Settings & Quick Actions (Available when authenticated) */}
          {currentUser && (
            <div className="space-y-4">
              {/* Auto Sync Toggle & Status */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      실시간 구글 드라이브 자동 저장 (Auto-Sync)
                    </span>
                    {autoDriveSync ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {autoDriveSync
                      ? '데이터 수정 시 브라우저뿐만 아니라 구글 드라이브에도 자동으로 실시간 보관됩니다.'
                      : '필요할 때 수동으로 드라이브에 동기화합니다.'}
                  </p>
                  {lastSyncTime && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>최근 동기화: {lastSyncTime}</span>
                    </div>
                  )}
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDriveSync}
                    onChange={(e) => onToggleAutoDriveSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Main Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={promptSaveToDrive}
                  disabled={isLoading || !accessToken}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>지금 구글 드라이브에 저장 (최신화)</span>
                </button>

                <button
                  type="button"
                  onClick={() => promptRestoreFromDrive(MASTER_FILE_NAME)}
                  disabled={isLoading || !accessToken}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>구글 드라이브에서 불러오기 (복원)</span>
                </button>
              </div>

              {/* Secondary Action: Create Archive Snapshot & Quick Link Share */}
              <div className="flex items-center justify-between pt-1">
                {driveFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenShareDialog(driveFiles[0])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                  >
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>실시간 데이터 외부 공유 링크 생성</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={promptCreateSnapshot}
                  disabled={isLoading || !accessToken}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition ml-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>시점별 백업 스냅샷 별도 저장</span>
                </button>
              </div>

              {/* Existing Drive Backup Files List */}
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                    저장된 드라이브 파일 목록 ({driveFiles.length}건)
                  </h5>
                  <button
                    type="button"
                    onClick={loadFilesList}
                    disabled={isLoading}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
                    title="새로고침"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {driveFiles.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    구글 드라이브에 아직 저장된 백업 파일이 없습니다.
                    <br />
                    위의 <span className="font-semibold text-blue-600">'지금 구글 드라이브에 저장'</span> 버튼을 눌러 첫 저장을 시작해 보세요.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 px-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileJson className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 truncate">
                                {file.name}
                              </span>
                              {file.isShared && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-100 text-indigo-700">
                                  공유됨
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              수정일:{' '}
                              {file.modifiedTime
                                ? new Date(file.modifiedTime).toLocaleString('ko-KR')
                                : '정보 없음'}{' '}
                              {file.size && `(${file.size})`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenShareDialog(file)}
                            className="p-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="외부 이용자 공유 링크 생성"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>공유</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => promptRestoreFromDrive(file.name)}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                          >
                            불러오기
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDeleteFile(file)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Open Shared Link from External User Section */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                외부에서 전달받은 구글 드라이브 공유 링크 직접 열기
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              다른 이용자나 시설로부터 공유받은 웹 앱 링크 또는 구글 드라이브 파일 링크를 붙여넣으면 즉시 데이터를 불러옵니다.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualShareInput}
                onChange={(e) => setManualShareInput(e.target.value)}
                placeholder="예: https://.../?driveFileId=1X9... 또는 구글 드라이브 파일 링크"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={handleLoadManualShare}
                disabled={isManualLoading || !manualShareInput.trim()}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isManualLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudDownload className="w-3.5 h-3.5" />
                )}
                <span>데이터 열기</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            데이터는 구글 드라이브 및 공유 드라이브에 안전하게 보관되며 링크를 통해 외부와 협업할 수 있습니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            닫기
          </button>
        </div>
      </div>

      {/* Shareable Link Modal Dialog */}
      {shareDialogFile && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    외부 이용자 공유 링크 생성 완료
                  </h4>
                  <span className="text-[11px] text-slate-400">{shareDialogFile.name}</span>
                </div>
              </div>
              <button
                onClick={() => setShareDialogFile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              아래 링크를 공유받은 외부 이용자(동료 사회복지사, 시설 관리자, 외부 점검관 등)는
              별도의 복잡한 설치 없이 브라우저에서 링크 클릭 한 번으로 이 복지 데이터를 즉시 열람할 수 있습니다.
            </p>

            {isSharingLoading ? (
              <div className="py-6 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">구글 드라이브 공유 권한 설정 중...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. App Direct View Link */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    외부 이용자 전용 웹 앱 바로가기 링크 (추천)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedShareUrl}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedShareUrl)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                    >
                      {isCopying ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopying ? '복사됨!' : '링크 복사'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Direct Google Drive Web Link */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    구글 드라이브 원본 파일 링크
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedWebViewLink}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-mono text-[11px]"
                    />
                    <a
                      href={generatedWebViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1 shrink-0"
                    >
                      <span>드라이브에서 열기</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShareDialogFile(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">{confirmDialog.title}</h4>
                <p className="text-xs text-slate-500">작업 전 내용을 확인해 주세요.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs transition ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
