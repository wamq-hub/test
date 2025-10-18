// ملف: js/config.js
// تحميل وضبط الإعدادات العامة من config.json + أدوات مساعدة للوصول للقيم

let CONFIG_CACHE = null;

/**
 * تحميل ملف الإعدادات config.json مرة واحدة وتخزينه في الذاكرة المحلية
 * يعيد كائن الإعدادات نفسه في الاستدعاءات اللاحقة.
 */
// js/config.js (فقط داخل loadConfig)
// js/config.js

export async function loadConfig() {
  if (CONFIG_CACHE) return CONFIG_CACHE;

  // نحمّل من المسار الجديد: js/workflows/config.json
  // نبني الرابط اعتماداً على عنوان الصفحة الحالي لتفادي مشاكل المسارات.
  const url = new URL('js/config.json', document.baseURI).toString();

  let res;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch (err) {
    throw new Error(
      `تعذر الاتصال لتحميل config.json\n` +
      `URL: ${url}\n` +
      `السبب: ${String(err)}\n` +
      `ملاحظة: شغّل الموقع عبر سيرفر محلي (Live Server/localhost) وليس file://`
    );
  }

  if (!res.ok) {
    const ct = res.headers.get('content-type') || '-';
    const body = await res.text().catch(() => '');
    throw new Error(
      `تعذر تحميل config.json\n` +
      `URL: ${url}\n` +
      `HTTP ${res.status}\n` +
      `Content-Type: ${ct}\n` +
      `مقتطف الاستجابة: ${body.slice(0,200)}`
    );
  }

  let cfg;
  try {
    cfg = await res.clone().json();
  } catch {
    const text = await res.text().catch(() => '');
    throw new Error(
      `الاستجابة ليست JSON صالحًا\n` +
      `URL: ${url}\n` +
      `مقتطف: ${text.slice(0,200)}`
    );
  }

  CONFIG_CACHE = cfg;

  // تخزين محلي وتطبيق الثيم
  try { localStorage.setItem('systemConfig', JSON.stringify(cfg)); } catch {}
  applyTheme(cfg?.theme);
  if (cfg?.googleSheets?.appsScriptUrl) {
    try { localStorage.setItem('appsScriptUrl', cfg.googleSheets.appsScriptUrl); } catch {}
  }
  return CONFIG_CACHE;
}

/**
 * الحصول على الإعدادات فورًا من الذاكرة أو من localStorage
 * (لا يقوم بتحميل الشبكة).
 */
export function getConfigSnapshot() {
  if (CONFIG_CACHE) return CONFIG_CACHE;
  try {
    const raw = localStorage.getItem('systemConfig');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * تطبيق سمة الألوان على :root
 */
export function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  if (theme.primaryColor)   root.style.setProperty('--tvtc-primary', theme.primaryColor);
  if (theme.secondaryColor) root.style.setProperty('--tvtc-secondary', theme.secondaryColor);
  if (theme.accentColor)    root.style.setProperty('--tvtc-accent', theme.accentColor);
}

/**
 * الحصول على رابط نشر Google Apps Script (الـ Web App)
 * يأخذ الأولوية من الذاكرة ثم config.json المخزَّن محليًا.
 */
export function getAppsScriptUrl() {
  const fromLS = localStorage.getItem('appsScriptUrl');
  if (fromLS) return fromLS;
  const snap = getConfigSnapshot();
  return snap?.googleSheets?.appsScriptUrl || '';
}

/**
 * تحديث الإعدادات في الذاكرة والـ localStorage (لا يكتب على الملف)
 * مفيد عند تبديل بيئة أو تحديث رابط GAS من الواجهة.
 */
export function updateConfigPatch(patch = {}) {
  const current = getConfigSnapshot() || {};
  const next = deepMerge(current, patch);
  CONFIG_CACHE = next;
  try { localStorage.setItem('systemConfig', JSON.stringify(next)); } catch (_) {}
  if (next?.googleSheets?.appsScriptUrl) {
    try { localStorage.setItem('appsScriptUrl', next.googleSheets.appsScriptUrl); } catch (_) {}
  }
  if (next?.theme) applyTheme(next.theme);
  return next;
}

/**
 * دمج بسيط (shallow + لبعض المسارات الشائعة)
 */
function deepMerge(base, patch) {
  const out = { ...base, ...patch };
  // دمج theme
  if (base.theme || patch.theme) {
    out.theme = { ...(base.theme || {}), ...(patch.theme || {}) };
  }
  // دمج googleSheets
  if (base.googleSheets || patch.googleSheets) {
    out.googleSheets = { ...(base.googleSheets || {}), ...(patch.googleSheets || {}) };
  }
  // دمج pages
  if (base.pages || patch.pages) {
    out.pages = { ...(base.pages || {}), ...(patch.pages || {}) };
  }
  // دمج actions
  if (base.actions || patch.actions) {
    out.actions = { ...(base.actions || {}), ...(patch.actions || {}) };
  }
  return out;
}
