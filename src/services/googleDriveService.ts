import { AppDataPackage, DriveFileInfo } from '../types';

export const MASTER_FILE_NAME = 'welfareflow_master_data.json';
const REGISTRY_STORAGE_KEY = 'welfareflow_drive_files_registry';
export const SHARED_FOLDER_STORAGE_KEY = 'welfareflow_target_drive_folder_id';

/**
 * Extracts a clean Google Drive Folder or Shared Drive ID from either raw ID or URL
 */
export function extractFolderOrDriveId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];
  return trimmed;
}

export function getTargetDriveFolderId(): string {
  return localStorage.getItem(SHARED_FOLDER_STORAGE_KEY) || '';
}

export function setTargetDriveFolderId(id: string): void {
  const clean = extractFolderOrDriveId(id);
  if (clean) {
    localStorage.setItem(SHARED_FOLDER_STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(SHARED_FOLDER_STORAGE_KEY);
  }
}

/**
 * Registry helpers for files created in Google Drive with drive.file scope
 */
export function getStoredDriveFiles(): DriveFileInfo[] {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredDriveFiles(files: DriveFileInfo[]): void {
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(files));
  } catch (err) {
    console.warn('Failed to persist Drive files registry:', err);
  }
}

export function addOrUpdateStoredDriveFile(file: DriveFileInfo): void {
  const current = getStoredDriveFiles();
  const existingIdx = current.findIndex((f) => f.id === file.id || f.name === file.name);
  if (existingIdx >= 0) {
    current[existingIdx] = { ...current[existingIdx], ...file };
  } else {
    current.unshift(file);
  }
  saveStoredDriveFiles(current);
}

export function removeStoredDriveFile(fileId: string): void {
  const current = getStoredDriveFiles();
  const updated = current.filter((f) => f.id !== fileId);
  saveStoredDriveFiles(updated);
}

export function findStoredDriveFile(fileName: string): DriveFileInfo | null {
  const current = getStoredDriveFiles();
  return current.find((f) => f.name === fileName) || null;
}

/**
 * Searches for a file by name.
 * Uses supportsAllDrives=true to ensure compatibility with Google Shared Drives.
 */
export async function findDriveFile(
  fileName: string,
  accessToken: string
): Promise<DriveFileInfo | null> {
  const registered = findStoredDriveFile(fileName);
  if (!registered) {
    return null;
  }

  // Verify file still exists in Drive using files.get with supportsAllDrives
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${registered.id}?fields=id,name,modifiedTime,size,webViewLink,shared,permissions&supportsAllDrives=true`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const updated: DriveFileInfo = {
        ...registered,
        id: data.id || registered.id,
        name: data.name || registered.name,
        modifiedTime: data.modifiedTime || registered.modifiedTime,
        size: data.size ? `${Math.round(parseInt(data.size, 10) / 1024)} KB` : registered.size,
        webViewLink: data.webViewLink || registered.webViewLink,
        isShared: !!data.shared || registered.isShared,
      };
      addOrUpdateStoredDriveFile(updated);
      return updated;
    } else if (res.status === 404) {
      removeStoredDriveFile(registered.id);
      return null;
    }
  } catch (err) {
    console.info('Drive file verification fallback to registered info:', err);
  }

  return registered;
}

/**
 * Lists all WelfareFlow backup files created by the application in Google Drive.
 */
export async function listDriveBackupFiles(accessToken: string): Promise<DriveFileInfo[]> {
  const registered = getStoredDriveFiles();
  if (registered.length === 0) {
    return [];
  }

  const verifiedFiles: DriveFileInfo[] = [];

  for (const file of registered) {
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${file.id}?fields=id,name,modifiedTime,size,webViewLink,shared&supportsAllDrives=true`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        verifiedFiles.push({
          ...file,
          id: data.id || file.id,
          name: data.name || file.name,
          modifiedTime: data.modifiedTime || file.modifiedTime,
          size: data.size ? `${Math.round(parseInt(data.size, 10) / 1024)} KB` : file.size,
          webViewLink: data.webViewLink || file.webViewLink,
          isShared: !!data.shared || file.isShared,
        });
      } else if (res.status === 404) {
        removeStoredDriveFile(file.id);
      } else {
        verifiedFiles.push(file);
      }
    } catch {
      verifiedFiles.push(file);
    }
  }

  saveStoredDriveFiles(verifiedFiles);
  return verifiedFiles;
}

/**
 * Saves or updates application package to Google Drive / Shared Drive.
 * Supports target folder/shared drive destination via parents array.
 */
export async function saveAppDataToDrive(
  data: AppDataPackage,
  accessToken: string,
  customFileName: string = MASTER_FILE_NAME,
  targetFolderId?: string
): Promise<DriveFileInfo> {
  const jsonContent = JSON.stringify(data, null, 2);
  const sizeStr = `${Math.round(jsonContent.length / 1024)} KB`;
  const folderId = targetFolderId || getTargetDriveFolderId();

  // 1. Check if the file was previously created by the app
  const existingFile = findStoredDriveFile(customFileName);

  if (existingFile) {
    // 2. Try updating existing file content with supportsAllDrives=true
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media&supportsAllDrives=true`;
    const updateRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonContent,
    });

    if (updateRes.ok) {
      const nowIso = new Date().toISOString();
      const updatedFile: DriveFileInfo = {
        ...existingFile,
        id: existingFile.id,
        name: existingFile.name,
        modifiedTime: nowIso,
        size: sizeStr,
        webViewLink: existingFile.webViewLink,
      };
      addOrUpdateStoredDriveFile(updatedFile);
      return updatedFile;
    } else if (updateRes.status === 404) {
      removeStoredDriveFile(existingFile.id);
    } else {
      const errText = await updateRes.text();
      throw new Error(`구글 드라이브 파일 업데이트 실패 (${updateRes.status}): ${errText}`);
    }
  }

  // 3. Create file metadata with supportsAllDrives=true and optional shared drive parent
  const createUrl = 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true';
  const metadataBody: Record<string, any> = {
    name: customFileName,
    mimeType: 'application/json',
    description: 'WelfareFlow AI 복지시설 이용인 및 업무 마스터 데이터',
  };

  if (folderId) {
    metadataBody.parents = [folderId];
  }

  const metadataRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadataBody),
  });

  if (!metadataRes.ok) {
    const errText = await metadataRes.text();
    throw new Error(`구글 드라이브 파일 생성 실패 (${metadataRes.status}): ${errText}`);
  }

  const created = await metadataRes.json();

  // 4. Upload media content into the newly created file
  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${created.id}?uploadType=media&supportsAllDrives=true`;
  const uploadRes = await fetch(uploadUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: jsonContent,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`구글 드라이브 데이터 업로드 실패 (${uploadRes.status}): ${errText}`);
  }

  const nowIso = new Date().toISOString();
  const fileInfo: DriveFileInfo = {
    id: created.id,
    name: customFileName,
    modifiedTime: nowIso,
    size: sizeStr,
    sharedDriveOrFolderId: folderId || undefined,
  };

  addOrUpdateStoredDriveFile(fileInfo);
  return fileInfo;
}

/**
 * Loads application package from Google Drive
 */
export async function loadAppDataFromDrive(
  accessToken: string,
  fileName: string = MASTER_FILE_NAME
): Promise<{ data: AppDataPackage; fileInfo: DriveFileInfo } | null> {
  const fileInfo = await findDriveFile(fileName, accessToken);
  if (!fileInfo) {
    return null;
  }

  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileInfo.id}?alt=media&supportsAllDrives=true`;
  const res = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      removeStoredDriveFile(fileInfo.id);
      return null;
    }
    const errText = await res.text();
    throw new Error(`구글 드라이브 데이터 다운로드 실패: ${errText}`);
  }

  const rawJson = await res.text();
  const parsedData = JSON.parse(rawJson) as AppDataPackage;

  return {
    data: parsedData,
    fileInfo,
  };
}

/**
 * Creates shareable link permission on Google Drive file so anyone with the link can view.
 * Enables external users to access the app data package via shared link.
 */
export async function createShareableLink(
  fileId: string,
  accessToken: string,
  role: 'reader' | 'writer' = 'reader'
): Promise<{ shareUrl: string; webViewLink: string }> {
  // POST to Drive Permissions API with supportsAllDrives=true
  const permUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`;
  const permRes = await fetch(permUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: role,
      type: 'anyone',
      allowFileDiscovery: false,
    }),
  });

  if (!permRes.ok) {
    const errText = await permRes.text();
    throw new Error(`공유 권한 설정 실패 (${permRes.status}): ${errText}`);
  }

  // Fetch updated webViewLink
  let webViewLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  try {
    const getUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink&supportsAllDrives=true`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (getRes.ok) {
      const data = await getRes.json();
      if (data.webViewLink) webViewLink = data.webViewLink;
    }
  } catch (err) {
    console.info('WebViewLink fetch fallback:', err);
  }

  // Construct Web App Direct Access Link with driveFileId query parameter
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const appShareUrl = `${origin}${pathname}?driveFileId=${fileId}`;

  // Update registry
  const files = getStoredDriveFiles();
  const existingIdx = files.findIndex((f) => f.id === fileId);
  if (existingIdx >= 0) {
    files[existingIdx].isShared = true;
    files[existingIdx].shareRole = role;
    files[existingIdx].shareUrl = appShareUrl;
    files[existingIdx].webViewLink = webViewLink;
    saveStoredDriveFiles(files);
  }

  return { shareUrl: appShareUrl, webViewLink };
}

/**
 * Fetches shared application package from Google Drive for external users who opened a shared link.
 * Uses the server proxy endpoint (/api/drive/fetch-shared) or direct Google API fallback.
 */
export async function fetchSharedAppData(
  fileId: string,
  accessToken?: string | null
): Promise<AppDataPackage> {
  // 1. Try server proxy endpoint to handle CORS and public access smoothly
  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const res = await fetch(`/api/drive/fetch-shared?fileId=${encodeURIComponent(fileId)}`, { headers });
    if (res.ok) {
      const resJson = await res.json();
      if (resJson && resJson.data) {
        return resJson.data as AppDataPackage;
      }
    }
  } catch (err) {
    console.warn('Server proxy fetch failed, attempting client direct fetch:', err);
  }

  // 2. If user is signed in with Google, use Google Drive API directly
  if (accessToken) {
    const directUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
    const directRes = await fetch(directUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (directRes.ok) {
      return (await directRes.json()) as AppDataPackage;
    }
  }

  // 3. Fallback direct download link
  const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const fallbackRes = await fetch(fallbackUrl);
  if (fallbackRes.ok) {
    return (await fallbackRes.json()) as AppDataPackage;
  }

  throw new Error('공유된 구글 드라이브 데이터에 접근할 수 없습니다. 파일 링크가 올바르고 공유 권한이 활성화되어 있는지 확인해 주세요.');
}

/**
 * Delete a file in Google Drive / Shared Drive
 */
export async function deleteDriveFile(fileId: string, accessToken: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const errText = await res.text();
    throw new Error(`구글 드라이브 파일 삭제 실패: ${errText}`);
  }

  removeStoredDriveFile(fileId);
}
