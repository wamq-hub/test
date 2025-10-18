// js/app.js
import { loadConfig } from './config.js';
import * as storage from './services/storage-service.js';
import { handleLoginSubmit, bootstrapUserFromCache, logout } from './auth.js';
import {
  hydrateRequesterOnLoad,
  wireNewRequestForm,
  refreshMyRequests,
  wireRatingModal,
  showQualityTabIfAllowed,
  refreshQualityReport,
  wireQualityReportSection
} from './components/forms.js';

/** يربط التبويبات مرة واحدة فقط */
function wireTabs() {
  if (window.__tabsBound) return;      // حارس يمنع التكرار
  window.__tabsBound = true;

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.nav-tab');
    if (!btn) return;

    const targetId = btn.dataset.target; // 'tab-list' | 'tab-quality'

    // تفعيل الزر المختار
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // إظهار القسم المطلوب
    document.querySelectorAll('.tab-content').forEach(sec => (sec.style.display = 'none'));
    document.getElementById(targetId)?.style.setProperty('display', 'block');

    // تحميل بيانات التبويب
    try {
      if (targetId === 'tab-list') {
        await refreshMyRequests();      // “طلباتي” فقط
      } else if (targetId === 'tab-quality') {
        await refreshQualityReport();   // كل الطلبات (للأدوار العليا)
      }
    } catch (err) {
      console.error('Tab load error:', err);
    }
  });
}

function showLogin() {
  document.getElementById('loginScreen')?.classList.remove('hidden');
  document.getElementById('mainContainer')?.classList.add('hidden');
  document.getElementById('userBar')?.classList.add('hidden');
}

function showMain() {
  document.getElementById('loginScreen')?.classList.add('hidden');
  document.getElementById('mainContainer')?.classList.remove('hidden');
  document.getElementById('userBar')?.classList.remove('hidden');
}

function pad2(n){ return String(n).padStart(2,'0'); }
function formatTime12hArabic(d){
  let h = d.getHours(), m = pad2(d.getMinutes());
  const isPM = h >= 12; const suffix = isPM ? 'م' : 'ص';
  h = h % 12; if (h === 0) h = 12;
  return `${pad2(h)}:${m} ${suffix}`;
}
function formatISODate(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function formatArabicDay(d){ try { return new Intl.DateTimeFormat('ar-SA',{weekday:'long'}).format(d); } catch { return ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()]; } }
function formatHijri(d){
  try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day:'numeric', month:'long', year:'numeric' }).format(d); }
  catch { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day:'numeric', month:'long', year:'numeric' }).format(d); } catch { return ''; } }
}

function autofillBasicsLock() {
  const dateEl  = document.getElementById('requestDate');
  const timeEl  = document.getElementById('requestTime');
  const dayEl   = document.getElementById('requestDay');
  const hijriEl = document.getElementById('hijriDate');
  const now = new Date();

  if (dateEl){ dateEl.value = formatISODate(now); dateEl.readOnly = true; dateEl.setAttribute('aria-readonly','true'); dateEl.style.background='#f9fafb'; dateEl.addEventListener('keydown', e=>e.preventDefault()); dateEl.addEventListener('beforeinput', e=>e.preventDefault()); }
  if (timeEl){ timeEl.value = formatTime12hArabic(now); timeEl.readOnly = true; timeEl.setAttribute('aria-readonly','true'); timeEl.style.background='#f9fafb'; }
  if (dayEl) { dayEl.value  = formatArabicDay(now);     dayEl.readOnly = true; dayEl.setAttribute('aria-readonly','true'); dayEl.style.background='#f9fafb'; }
  if (hijriEl){ hijriEl.value = formatHijri(now);       hijriEl.readOnly = true; hijriEl.setAttribute('aria-readonly','true'); hijriEl.style.background='#f9fafb'; }
}

function keepBasicsFresh() {
  const timeEl = document.getElementById('requestTime');
  const dateEl = document.getElementById('requestDate');
  const dayEl  = document.getElementById('requestDay');
  const hijriEl= document.getElementById('hijriDate');

  setInterval(() => {
    const now = new Date();
    if (timeEl) timeEl.value = formatTime12hArabic(now);
    const todayIso = formatISODate(now);
    if (dateEl && dateEl.value !== todayIso) {
      dateEl.value = todayIso;
      if (dayEl)   dayEl.value   = formatArabicDay(now);
      if (hijriEl) hijriEl.value = formatHijri(now);
    }
  }, 30_000);

  const form = document.getElementById('newRequestForm');
  if (form) {
    form.addEventListener('submit', () => {
      const now = new Date();
      if (dateEl)  dateEl.value  = formatISODate(now);
      if (timeEl)  timeEl.value  = formatTime12hArabic(now);
      if (dayEl)   dayEl.value   = formatArabicDay(now);
      if (hijriEl) hijriEl.value = formatHijri(now);
    });
  }
}

async function boot() {
  try { await loadConfig(); }
  catch (err) {
    console.error('فشل تحميل config.json', err);
    alert('تعذر تحميل ملف الإعدادات (config.json). تأكد من المسار والصلاحيات.');
  }

  const user = storage.getCurrentUser();
  if (user) showMain(); else showLogin();

  showQualityTabIfAllowed();   // يظهر تبويب تقارير الجودة للأدوار العليا
  wireQualityReportSection();  // يربط زر تصدير التقارير
  wireTabs();                  // ✅ ربط التبويبات هنا فقط
}

document.addEventListener('DOMContentLoaded', async () => {
  await boot();

  bootstrapUserFromCache();
  hydrateRequesterOnLoad();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      await handleLoginSubmit(e);
      if (storage.getCurrentUser()) showMain();
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  }

  autofillBasicsLock();
  keepBasicsFresh();

  wireNewRequestForm();
  refreshMyRequests(); // أول تحميل لتبويب “طلباتي”
});
