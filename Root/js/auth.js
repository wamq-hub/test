// js/auth.js
import { loadConfig, getAppsScriptUrl } from './config.js';
import { setCurrentUser, getCurrentUser } from './services/storage-service.js';
import { autofillRequester, renderUserBar } from './components/forms.js';

/** نداء موحّد لـ GAS (يتجنّب preflight باستخدام text/plain) */
async function callGAS(action, data = {}) {
  
  await loadConfig();
  const base = getAppsScriptUrl();
  if (!base) throw new Error('Apps Script URL غير معرف في الإعدادات');

  const url = `${base}?action=${encodeURIComponent(action)}&cb=${Date.now()}`;
  // Debug: show resolved base and final url to help diagnose failed fetch / CORS / config issues
  console.debug('[auth] callGAS:', { action, base, url });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(data ?? {})
  });

  if (!res.ok) {
    const t = await res.text().catch(()=> '');
    console.error('[auth] callGAS non-ok response:', { status: res.status, body: t });
    throw new Error(`فشل الاتصال بالخادم (${res.status}) ${t || ''}`.trim());
  }
  let json;
  try { json = await res.json(); }
  catch { throw new Error('الاستجابة ليست JSON صالحة'); }
  return json;
}

/** تحميل المستخدم من التخزين المحلي وعرضه */
export function bootstrapUserFromCache() {
  const u = getCurrentUser();
  renderUserBar(u);
  if (u) autofillRequester(u);
  return u;
}

/** تسجيل دخول بالرقم الوظيفي/كلمة المرور */
/** تسجيل دخول بالرقم الوظيفي/كلمة المرور */
export async function handleLoginSubmit(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();

  const idEl = document.getElementById('loginEmployeeId');
  const pwEl = document.getElementById('loginPassword');
  const btn  = document.getElementById('loginBtn');

  const id = (idEl?.value || '').trim();
  const password = (pwEl?.value || '').trim();

  if (!id || !password) {
    alert('فضلاً أدخل الرقم الوظيفي وكلمة المرور');
    return;
  }
  if (btn) btn.disabled = true;

  try {
    // ✅ استخدم نفس الأسماء التي يَقبلها السكربت (id, password)
    const resp = await callGAS('login', { id, password });

    if (!resp?.ok || !resp.user) {
      throw new Error(resp?.message || 'فشل تسجيل الدخول');
    }

    // خزّن المستخدم محليًا وحدّث الواجهة
    setCurrentUser(resp.user);
    renderUserBar(resp.user);
    autofillRequester(resp.user);

    // أظهر المحتوى الرئيسي
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('mainContainer')?.classList.remove('hidden');
    document.getElementById('userBar')?.classList.remove('hidden');

    return resp.user; // (اختياري) لو حبيت تستفيد منها لاحقًا
  } catch (e) {
    alert(e?.message || 'تعذر تسجيل الدخول');
  } finally {
    if (btn) btn.disabled = false;
  }
}


/** تسجيل خروج */
export function logout() {
  try { setCurrentUser(null); } catch {}
  renderUserBar(null);
  const inp = document.getElementById('requesterName');
  if (inp) { inp.value = ''; inp.readOnly = false; inp.removeAttribute('aria-readonly'); }
  document.getElementById('mainContainer')?.classList.add('hidden');
  document.getElementById('userBar')?.classList.add('hidden');
  document.getElementById('loginScreen')?.classList.remove('hidden');
}
