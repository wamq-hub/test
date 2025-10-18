// ملف: js/services/sheets-service.js
// الاتصال بـ Google Apps Script WebApp (GAS) لإدارة الطلبات + رفع الصور إلى Google Drive

import { loadConfig, getAppsScriptUrl } from '../config.js';

async function call(action, payload = {}) {
  await loadConfig();
  const base = getAppsScriptUrl();
  if (!base) throw new Error('Apps Script URL غير معرّف في config.json');

  const url = `${base}?action=${encodeURIComponent(action)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const t = await res.text().catch(()=>'');
    throw new Error(`GAS HTTP ${res.status} - ${t || 'بدون رسالة'}`);
  }

  let data;
  try { data = await res.json(); }
  catch { throw new Error('استجابة غير صالحة من GAS (ليست JSON)'); }

  if (data && data.ok === false) {
    throw new Error(data.message || 'فشل الإجراء في GAS');
  }
  return data;
}

/**
 * رفع صورة إلى Google Drive عبر GAS
 * @param {string} base64 - بيانات الصورة Base64 بصيغة dataURL (مثل data:image/jpeg;base64,....)
 * @param {{name?: string, folderId?: string}} options
 * @returns {Promise<{fileId:string, webViewLink:string}>}
 */
export async function uploadImage(base64, { name = '', folderId = '' } = {}) {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('base64 مفقود أو غير صالح');
  }
  const resp = await call('uploadImageToDrive', { base64, name, folderId });
  const fileId = resp?.data?.fileId || '';
  const webViewLink = resp?.data?.webViewLink || '';
  if (!fileId) throw new Error('فشل رفع الصورة: لا يوجد fileId في الاستجابة');
  return { fileId, webViewLink };
}

/**
 * جلب كل الطلبات
 * @returns {Promise<Array>}
 */
export async function getRequests() {
  const resp = await call('getRequests', {});
  return resp?.data || [];
}

/**
 * إضافة طلب جديد
 * يدعم حقول صور اختيارية:
 * - imageB64            → تُرفع تلقائيًا ويُحفظ imageDriveId
 * - repairImageB64      → تُرفع تلقائيًا ويُحفظ repairImageDriveId
 * ملاحظة: نحذف حقول *B64 قبل الإرسال النهائي لتقليل حجم الطلب.
 */
export async function addRequest(model) {
  const payload = { ...model };

  // رفع الصور أولاً إن وُجدت
  if (payload.imageB64) {
    const { fileId, webViewLink } = await uploadImage(payload.imageB64, {
      name: `req_${payload.id || Date.now()}_issue.jpg`,
      folderId: payload.imageFolderId || '' // اختياري من config/GAS
    });
    payload.imageDriveId = fileId;
    payload.imageViewUrl = webViewLink;
    delete payload.imageB64;
  }
  if (payload.repairImageB64) {
    const { fileId, webViewLink } = await uploadImage(payload.repairImageB64, {
      name: `req_${payload.id || Date.now()}_repair.jpg`,
      folderId: payload.repairImageFolderId || ''
    });
    payload.repairImageDriveId = fileId;
    payload.repairImageViewUrl = webViewLink;
    delete payload.repairImageB64;
  }

  const resp = await call('addRequest', { request: payload });
  return resp?.data || null;
}

/**
 * تحديث طلب
 * نفس منطق addRequest فيما يخص الصور
 */
export async function updateRequest(model) {
  const payload = { ...model };

  if (payload.imageB64) {
    const { fileId, webViewLink } = await uploadImage(payload.imageB64, {
      name: `req_${payload.id || Date.now()}_issue_update.jpg`,
      folderId: payload.imageFolderId || ''
    });
    payload.imageDriveId = fileId;
    payload.imageViewUrl = webViewLink;
    delete payload.imageB64;
  }
  if (payload.repairImageB64) {
    const { fileId, webViewLink } = await uploadImage(payload.repairImageB64, {
      name: `req_${payload.id || Date.now()}_repair_update.jpg`,
      folderId: payload.repairImageFolderId || ''
    });
    payload.repairImageDriveId = fileId;
    payload.repairImageViewUrl = webViewLink;
    delete payload.repairImageB64;
  }

  const resp = await call('updateRequest', { request: payload });
  return resp?.data || null;
}

/**
 * حذف منطقي
 */
export async function softDeleteRequest(id) {
  const resp = await call('softDeleteRequest', { id });
  return resp?.data || null;
}
