// js/components/forms.js
// توحيد وظائف النماذج + إرسال الطلب + قائمة الطلبات + تقييم العميل + شاشة الحجب

import { getCurrentUser } from '../services/storage-service.js';
import { getAppsScriptUrl } from '../config.js';


const QUALITY_ROLES = new Set(['وكيل ضبط الجودة','العميد','مشرف الصيانة','مسؤول السلامة','مسؤول تقنية المعلومات']);


/* ========= أدوات وقت/تاريخ (12 ساعة) ========= */
function pad2(n){ return String(n).padStart(2,'0'); }
function formatTime12hArabic(d){
  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const isPM = h >= 12;
  const suffix = isPM ? 'م' : 'ص';
  h = h % 12; if (h===0) h=12;
  return `${pad2(h)}:${m} ${suffix}`;
}
function formatISODate(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function formatArabicDay(d){
  try { return new Intl.DateTimeFormat('ar-SA',{weekday:'long'}).format(d); }
  catch { return ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()]; }
}
function formatHijri(d){
  try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(d); }
  catch { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic',{day:'numeric',month:'long',year:'numeric'}).format(d); } catch { return ''; } }
}

/* ========= تعبئة/قفل الحقول ========= */
export function setCurrentDateTime(){
  const now = new Date();
  setValue('#requestDate', formatISODate(now), true);
  setValue('#requestTime', formatTime12hArabic(now), true);
  setValue('#requestDay',  formatArabicDay(now), true);
  setValue('#hijriDate',   formatHijri(now), true);
}
export function refreshClock(){
  const now = new Date();
  setValue('#requestTime', formatTime12hArabic(now), true);
}
function setValue(sel, val, lock=false){
  const el = document.querySelector(sel);
  if(!el) return;
  el.value = val;
  if (lock){
    el.readOnly = true; el.setAttribute('aria-readonly','true'); el.style.background='#f9fafb';
  }
}

/* ========= شريط المستخدم + اسم مقدم الطلب ========= */
export function renderUserBar(user){
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  const barEl  = document.getElementById('userBar');
  if (!barEl) return;
  if (user){
    if (nameEl) nameEl.textContent = user.name || user.email || user.id || 'مستخدم';
    if (roleEl) roleEl.textContent = user.role || '';
    barEl.classList.remove('hidden');
  } else {
    if (nameEl) nameEl.textContent = 'غير مسجل';
    if (roleEl) roleEl.textContent = '';
    barEl.classList.add('hidden');
  }
}
export function autofillRequester(user){
  const u = user || getCurrentUser();
  const inp = document.getElementById('requesterName');
  if (!inp || !u) return;
  inp.value = u.name || u.email || u.id || '';
  inp.readOnly = true; inp.setAttribute('aria-readonly','true'); inp.style.background='#f9fafb';
}
export function hydrateRequesterOnLoad(){
  const u = getCurrentUser();
  if (u){ renderUserBar(u); autofillRequester(u); }
  setCurrentDateTime();
}

/* ========= شاشة الحجب ========= */
export function showBlockingOverlay(msg='جاري المعالجة… يرجى الانتظار'){
  const ov  = document.getElementById('blockingOverlay');
  const txt = document.getElementById('blockingOverlayText');
  if (txt) txt.textContent = msg;
  if (ov)  ov.style.display = 'flex';
}
export function hideBlockingOverlay(){
  const ov = document.getElementById('blockingOverlay');
  if (ov) ov.style.display = 'none';
}

/* ========= رفع ملف لصورة (اختياري) ========= */
async function fileToDataURL(file){
  if (!file) return '';
  const buf = await file.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const mime= file.type || 'image/jpeg';
  return `data:${mime};base64,${b64}`;
}

/* ========= إرسال طلب جديد مباشرة إلى GAS ========= */
export function wireNewRequestForm(){
  const form = document.getElementById('newRequestForm');
  if (!form) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    // جمع القيم
    const fd = new FormData(form);
    const user = getCurrentUser();

    const payload = {
      type:            fd.get('requestType') || 'بلاغ صيانة',
      building:        fd.get('building') || '',
      maintenanceType: fd.get('maintenanceType') || '',
      requesterName:   fd.get('requesterName') || (user?.name || ''),
      date:            document.getElementById('requestDate')?.value || '',
      time:            document.getElementById('requestTime')?.value || '',
      hijriDate:       document.getElementById('hijriDate')?.value || '',
      day:             document.getElementById('requestDay')?.value || '',
      faultType:       fd.get('faultType') || '',
      faultDescription:fd.get('faultDescription') || ''
    };

    const file = document.getElementById('imageUpload')?.files?.[0] || null;
    if (file){
      try{ payload.image = await fileToDataURL(file); }catch{}
    }

    const base = getAppsScriptUrl();
    if (!base){ alert('رابط GAS غير مضبوط. تأكد من config.json'); return; }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    showBlockingOverlay('جاري إرسال الطلب… يرجى الانتظار');

    try {
      const res = await fetch(`${base}?action=addRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload)
      });
      const text = await res.text(); let j; try{ j=JSON.parse(text); }catch{ j=null; }

      if (!res.ok || !j) throw new Error(`HTTP ${res.status}`);
      if (j.ok === false || j.success === false) throw new Error(j.message || 'تعذر إضافة الطلب');

      // تنبيه صغير
      const alertEl = document.getElementById('newRequestAlert');
      if (alertEl){
        alertEl.classList.remove('status-progress');
        alertEl.classList.add('status-success');
        alertEl.textContent = 'تم إرسال الطلب بنجاح ✅';
        alertEl.style.display = 'inline-flex';
        setTimeout(()=> alertEl.style.display='none', 3000);
      }

      // إعادة ضبط الحقول + التاريخ/الوقت + اسم المستخدم
      form.reset();
      setCurrentDateTime();
      autofillRequester(user);

      // تحديث قائمة الطلبات للمستخدم مباشرة
      await refreshMyRequests();

    } catch (err){
      alert(err?.message || 'فشل إرسال الطلب');
      console.error('addRequest error:', err);

    } finally {
      hideBlockingOverlay();
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}


/* ========= عرض “طلباتي” للمستخدم ========= */
async function fetchRequestsForUser(){
  const base = getAppsScriptUrl();
  if (!base) throw new Error('GAS URL مفقود');
  const u = getCurrentUser() || {};
  const body = { name: u.name || '', role: u.role || '' };

  const res = await fetch(`${base}?action=getRequests`, {
    method:'POST',
    headers:{ 'Content-Type':'text/plain;charset=UTF-8' },
    body: JSON.stringify(body)
  });
  const txt = await res.text(); let j; try{ j=JSON.parse(txt); }catch{ j=null; }
  if (!res.ok || !j) throw new Error(`HTTP ${res.status}`);
  if (j.ok === false || j.success === false) throw new Error(j.message || 'تعذر جلب الطلبات');

  // 🔒 ضمان “طلباتي” فقط (حتى لو السيرفر أرجع أكثر):
  const mine = (j.data || []).filter(r => String(r['اسم صاحب الطلب']||'').trim() === String(u.name||'').trim());
  return mine;
}

export async function refreshMyRequests(){
  try{
    const rows = await fetchRequestsForUser();
    renderRequestsTable(rows);
  }catch(e){
    console.error('refreshMyRequests:', e);
  }
}

function normalizeStatus(s){
  s = String(s || '').trim();
  // طبيع نفس قيم GAS المحتملة
  const map = {
    'بانتظار تقييم العميل': 'بانتظار تقييم العميل',
    'مكتمل': 'مكتمل',
    'معتمد': 'معتمد',
    // لو عندك حالات أخرى ضفها هنا
  };
  return map[s] || s;
}

function canShowRating(row){
  const status = normalizeStatus(row['الحالة']);
  const rated  = !!row['مستوى الرضا'];
  // اسمح بالتقييم عند "مكتمل" أو "بانتظار تقييم العميل" (اختر اللي تستخدمه)
  return !rated && (status === 'مكتمل' || status === 'بانتظار تقييم العميل');
}

function renderRequestsTable(rows){
  const tb = document.getElementById('requestsTbody'); if (!tb) return;
  tb.innerHTML = '';
  rows.forEach(r => {
    const id = r['رقم الطلب'] || '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${id}</td>
      <td>${r['اسم صاحب الطلب'] || ''}</td>
      <td>${r['المبنى'] || ''}</td>
      <td>${r['نوع الصيانة'] || r['نوع الطلب'] || ''}</td>
      <td>${r['نوع العطل'] || ''}</td>
      <td>${r['التاريخ'] || ''}</td>
      <td>${r['الحالة'] || ''}</td>
      <td style="white-space:nowrap;display:flex;gap:8px">
        ${r['رابط صورة العطل'] ? `<a href="${r['رابط صورة العطل']}" target="_blank" class="btn-secondary">📷</a>` : ''}
        ${canShowRating(r) ? `<button class="btn-primary" data-rate="${id}" title="تقييم">⭐</button>` : ''}
      </td>
    `;
    tb.appendChild(tr);
  });

  // ربط زر التقييم
  tb.querySelectorAll('[data-rate]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      openRatingModal(btn.getAttribute('data-rate'));
    });
  });
}

export async function refreshMyRequests(){
  try{
    const rows = await fetchRequestsForUser();
    renderRequestsTable(rows);
  }catch(e){
    console.error('refreshMyRequests:', e);
  }
}

/* ========= نافذة التقييم ========= */
function fillStars(n){
  const cont = document.getElementById('rateStars'); if (!cont) return;
  cont.querySelectorAll('span').forEach((s,idx)=>{
    s.textContent = (idx < n) ? '★' : '☆';
  });
}
export function wireRatingModal(){
  const modal = document.getElementById('rateModal');
  const stars = document.getElementById('rateStars');
  const val   = document.getElementById('rateValue');
  const closeBtn  = document.getElementById('rateCloseBtn');
  const cancelBtn = document.getElementById('rateCancelBtn');
  const form  = document.getElementById('rateForm');

  if (stars){
    stars.addEventListener('click', (e)=>{
      const t = e.target.closest('span'); if (!t) return;
      const n = Number(t.dataset.v || '0');
      val.value = String(n); fillStars(n);
    });
  }
  const hide = ()=> { if (modal) modal.style.display='none'; };

  closeBtn?.addEventListener('click', hide);
  cancelBtn?.addEventListener('click', hide);

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const id    = document.getElementById('rateRequestId')?.value || '';
    const rate  = Number(val?.value || '0');
    const notes = document.getElementById('rateNotes')?.value || '';
    if (!id || rate <= 0){ alert('الرجاء اختيار تقييم'); return; }

    try{
      const base = getAppsScriptUrl();
      const payload = {
        id,
        satisfactionLevel: rate,
        clientNotes: notes,
        // لو تبغى تُغلق الطلب بعد تقييم العميل:
        // status: 'مكتمل'
      };
      showBlockingOverlay('جاري حفظ التقييم…');
      const res = await fetch(`${base}?action=updateRequest`, {
        method:'POST',
        headers:{ 'Content-Type':'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload)
      });
      const txt = await res.text(); let j; try{ j=JSON.parse(txt); }catch{ j=null; }
      if (!res.ok || !j) throw new Error(`HTTP ${res.status}`);
      if (j.ok === false || j.success === false) throw new Error(j.message || 'تعذر حفظ التقييم');

      hide(); // أغلق المودال
      await refreshMyRequests(); // تحديث الجدول

    } catch(err){
      alert(err?.message || 'فشل حفظ التقييم');
      console.error('rate error:', err);
    } finally {
      hideBlockingOverlay();
    }
  });
}

export function openRatingModal(requestId){
  const modal = document.getElementById('rateModal'); if (!modal) return;
  document.getElementById('rateRequestId').value = requestId;
  document.getElementById('rateValue').value = '0';
  document.getElementById('rateNotes').value = '';
  fillStars(0);
  modal.style.display = 'flex';
}

export function showQualityTabIfAllowed(){
  const u = getCurrentUser() || {};
  const allowed = QUALITY_ROLES.has(u.role);
  const btn = document.querySelector('.nav-tab[data-target="tab-quality"]');
  if (btn) btn.style.display = allowed ? '' : 'none';
}

async function fetchQualityRequests(){
  const base = getAppsScriptUrl();
  if (!base) throw new Error('GAS URL مفقود');

  const u = getCurrentUser() || {};
  const body = { view:'quality', context:'quality-report', name: u.name || '', role: u.role || '' };

  const res = await fetch(`${base}?action=getRequests`, {
    method:'POST',
    headers:{ 'Content-Type':'text/plain;charset=UTF-8' },
    body: JSON.stringify(body)
  });
  const txt = await res.text(); let j; try{ j=JSON.parse(txt); }catch{ j=null; }
  if (!res.ok || !j) throw new Error(`HTTP ${res.status}`);
  if (j.ok === false || j.success === false) throw new Error(j.message || 'تعذر جلب تقارير الجودة');

  return j.data || [];
}

function renderQualityTable(rows){
  const tb = document.getElementById('qualityTbody'); if (!tb) return;
  tb.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r['رقم الطلب']||''}</td>
      <td>${r['نوع الطلب']||''}</td>
      <td>${r['المبنى']||''}</td>
      <td>${r['نوع الصيانة']||r['نوع الطلب']||''}</td>
      <td>${r['اسم صاحب الطلب']||''}</td>
      <td>${r['التاريخ']||''}</td>
      <td>${r['الحالة']||''}</td>
      <td>${r['اسم الفني']||''}</td>
      <td>${r['اسم المشرف']||''}</td>
      <td>${r['مصدر الطلب']||''}</td>
    `;
    tb.appendChild(tr);
  });
  document.getElementById('qualityNoData')?.style.setProperty('display', rows.length ? 'none' : 'block');
}

export async function refreshQualityReport(){
  const rows = await fetchQualityRequests();
  renderQualityTable(rows);
  LAST_QUALITY_ROWS = rows; // يهم التصدير
}

// ====== تصدير Excel-CSV حسب قالب الأعمدة ======
let LAST_QUALITY_ROWS = [];
const QUALITY_EXPORT_HEADERS = [
  'رقم الطلب','نوع الطلب','المبنى','نوع الصيانة','اسم صاحب الطلب','التاريخ','الحالة','اسم الفني','اسم المشرف','مصدر الطلب'
];

function toCSV(rows){
  const escape = (v)=>{
    const s = (v==null?'':String(v));
    // لفّ بالقواس المزدوجة لو فيه فواصل/سطر جديد/علامات اقتباس
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
    return s;
  };
  const header = QUALITY_EXPORT_HEADERS.map(escape).join(',');
  const lines = rows.map(r => QUALITY_EXPORT_HEADERS.map(h => escape(r[h])).join(','));
  // BOM ليفتح في إكسل بالعربي بدون لخبطة ترميز
  return '\ufeff' + [header, ...lines].join('\r\n');
}

export function wireQualityReportSection(){
  const btn = document.getElementById('btnExportQuality');
  if (btn) {
    btn.addEventListener('click', async ()=>{
      try{
        // لو ما فيه بيانات معروضة، نجيبها الآن
        const rows = LAST_QUALITY_ROWS.length ? LAST_QUALITY_ROWS : await fetchQualityRequests();
        if (!rows.length) { alert('لا توجد بيانات للتصدير'); return; }
        const csv = toCSV(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        const ymd = new Date().toISOString().slice(0,10);
        a.href = URL.createObjectURL(blob);
        a.download = `quality_report_${ymd}.csv`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
      }catch(e){
        console.error(e);
        alert('تعذر إنشاء ملف التصدير');
      }
    });
  }
}
