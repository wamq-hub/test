// js/services/storage-service.js

// مفاتيح التخزين المحلية (ثابتة)
export const KEYS = Object.freeze({
  requests: 'maintenanceRequests.v1',
  currentUser: 'currentUser.v1',
  systemConfig: 'systemConfig',
  lastSyncAt: 'lastSyncAt.v1'
});

/* ---------------------------------- */
/*             أدوات مساعدة          */
/* ---------------------------------- */

// JSON.parse آمن
function safeParse(json, fallback = null) {
  try { return JSON.parse(json); } catch { return fallback; }
}

// JSON.stringify آمن
function safeStringify(obj, fallback = '') {
  try { return JSON.stringify(obj); } catch { return fallback; }
}

// قراءة قيمة نصّية من LocalStorage
function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

// كتابة قيمة نصّية إلى LocalStorage
function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

// حذف مفتاح من LocalStorage
function lsRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

/* ---------------------------------- */
/*        ترحيل مفاتيح قديمة (اختياري) */
/* ---------------------------------- */

(function migrateLegacyKeys(){
  // currentUser → currentUser.v1
  try {
    const legacy = localStorage.getItem('currentUser');
    if (legacy && !localStorage.getItem(KEYS.currentUser)) {
      localStorage.setItem(KEYS.currentUser, legacy);
      localStorage.removeItem('currentUser');
    }
  } catch {}
})();

/* ---------------------------------- */
/*            المستخدم الحالي         */
/* ---------------------------------- */

export function getCurrentUser() {
  const raw = lsGet(KEYS.currentUser);
  return raw ? safeParse(raw, null) : null;
}

export function setCurrentUser(user) {
  if (!user) {
    lsRemove(KEYS.currentUser);
    return;
  }
  lsSet(KEYS.currentUser, safeStringify(user));
}

export function clearCurrentUser() {
  lsRemove(KEYS.currentUser);
}

export function isLoggedIn() {
  return !!getCurrentUser();
}

/* ---------------------------------- */
/*           كاش الطلبات (اختياري)    */
/* ---------------------------------- */

export function getRequestsCache() {
  const raw = lsGet(KEYS.requests);
  return raw ? safeParse(raw, []) : [];
}

export function setRequestsCache(list) {
  if (!Array.isArray(list)) list = [];
  lsSet(KEYS.requests, safeStringify(list));
}

export function clearRequestsCache() {
  lsRemove(KEYS.requests);
}

/* ---------------------------------- */
/*          إعدادات النظام (Config)   */
/* ---------------------------------- */

export function getSystemConfig() {
  const raw = lsGet(KEYS.systemConfig);
  return raw ? safeParse(raw, null) : null;
}

export function setSystemConfig(cfg) {
  if (!cfg) { lsRemove(KEYS.systemConfig); return; }
  lsSet(KEYS.systemConfig, safeStringify(cfg));
}

export function patchSystemConfig(partial = {}) {
  const base = getSystemConfig() || {};
  const next = deepMerge(base, partial);
  setSystemConfig(next);
  return next;
}

// دمج بسيط لمسارات شائعة
function deepMerge(base, patch) {
  const out = { ...base, ...patch };
  if (base.theme || patch.theme) {
    out.theme = { ...(base.theme || {}), ...(patch.theme || {}) };
  }
  if (base.googleSheets || patch.googleSheets) {
    out.googleSheets = { ...(base.googleSheets || {}), ...(patch.googleSheets || {}) };
  }
  if (base.pages || patch.pages) {
    out.pages = { ...(base.pages || {}), ...(patch.pages || {}) };
  }
  if (base.actions || patch.actions) {
    out.actions = { ...(base.actions || {}), ...(patch.actions || {}) };
  }
  return out;
}

/* ---------------------------------- */
/*          آخر وقت مزامنة           */
/* ---------------------------------- */

export function getLastSyncAt() {
  const raw = lsGet(KEYS.lastSyncAt);
  // نخزّن كـ ISO string؛ نعيد Date أو null
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function setLastSyncAt(date = new Date()) {
  if (!(date instanceof Date)) date = new Date(date);
  lsSet(KEYS.lastSyncAt, date.toISOString());
}

export function clearLastSyncAt() {
  lsRemove(KEYS.lastSyncAt);
}

/* ---------------------------------- */
/*        أدوات عامة إضافية           */
/* ---------------------------------- */

export function clearAllStorageForApp() {
  // يحذف كل المفاتيح التي يعرفها هذا الموديول فقط
  Object.values(KEYS).forEach(lsRemove);
}

export function dumpStorageSnapshot() {
  // مفيد للتصحيح: يعطي لقطة من القيم المخزنة لهذا التطبيق
  return {
    currentUser: getCurrentUser(),
    requests: getRequestsCache(),
    systemConfig: getSystemConfig(),
    lastSyncAt: getLastSyncAt()
  };
}
