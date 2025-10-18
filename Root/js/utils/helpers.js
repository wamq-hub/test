// ملف: js/utils/helpers.js
// ثوابت مشتركة + أدوات مساعدة للتواريخ/الحالات/المزامنة/المعرّفات

// ---- الأدوار الشائعة (اختياري استخدامها في الواجهات) ----
export const ROLES = Object.freeze({
  QUALITY_MANAGER: 'وكيل ضبط الجودة',
  SUPERVISOR: 'مشرف الصيانة',
  TECHNICIAN: 'فني الصيانة',
  EMPLOYEE: 'موظف',
  DEAN: 'العميد',
  SAFETY_OFFICER: 'مسؤول السلامة',
  DEPT_HEAD: 'رئيس القسم',
  IT: 'تقنية المعلومات'
});

// ---- الحالات الموحّدة عبر النظام ----
export const STATUS = Object.freeze({
  // صيانة
  WAIT_SUP: 'بانتظار المشرف',
  ASSIGNED: 'محوّل للفني',
  TECH_REVIEW: 'جاري المراجعة',
  NEEDS_REVIEW: 'يحتاج مراجعة',
  APPROVED: 'معتمد',
  COMPLETED: 'مكتمل',
  REJECTED: 'مرفوض',
  NOT_FIXED: 'غير مكتمل',
  CANCELED: 'ملغي',
  DELETED: 'محذوف',

  // سلامة
  WAIT_SAFETY_1: 'بانتظار السلامة (أولية)',
  SAFETY_APPROVED_1: 'معتمد من السلامة (أولية)',
  WAIT_SAFETY_2: 'بانتظار السلامة (نهائية)',
  SAFETY_APPROVED_2: 'معتمد من السلامة (نهائية)'
});

// ---- تحويل ميلادي → تمثيل هجري تقريبي (عرض فقط) ----
export function toHijri(gd){
  // ملاحظة: تقريب مبسّط للعرض وليس تقويماً فلكياً دقيقاً.
  const d = new Date(gd);
  const y = d.getFullYear(), m = d.getMonth()+1, day = d.getDate();
  const hy = Math.floor((y - 622) * 1.030684);
  const hm = (Math.floor((m + (day/30)) * 1.030684) % 12) || 12;
  const hd = (Math.floor((day * 1.030684) % 30)) || 1;
  const names = ['محرم','صفر','ربيع الأول','ربيع الثاني','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
  return `${hd} ${names[hm-1]} ${hy}هـ`;
}

// ---- اسم اليوم بالعربية ----
export function getArabicDay(date){
  const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  return days[new Date(date).getDay()];
}

// ---- مولّد معرفات بشرط بادئة ----
export function generateId(prefix='M-'){
  const n = Math.floor(100000 + Math.random()*900000);
  return `${prefix}${n}`;
}

// ---- شارة الحالة (CSS class) بحسب نص الحالة ----
export function getStatusClass(s=''){
  s = String(s).trim();
  if (['محذوف'].includes(s)) return 'status-deleted';
  if (['مرفوض','غير مكتمل','ملغي'].includes(s)) return 'status-rejected';
  if (['مكتمل','معتمد من السلامة (نهائية)'].includes(s)) return 'status-completed';
  if ([
    'محوّل للفني','جاري المراجعة','يحتاج مراجعة','معتمد',
    'بانتظار السلامة (نهائية)','معتمد من السلامة (أولية)'
  ].includes(s)) return 'status-progress';
  return 'status-pending';
}

// ---- مؤشر المزامنة العام (#syncIndicator / #syncText) ----
export function showSyncIndicator(state='syncing', text='...', autoHide=true){
  const el = document.getElementById('syncIndicator');
  const txt = document.getElementById('syncText');
  if (!el || !txt) return;
  el.classList.add('show');
  el.classList.remove('success','error','syncing');
  el.classList.add(state);     // syncing | success | error
  el.style.display = 'flex';
  txt.textContent = text;
  if (autoHide){
    const timeout = state==='success' ? 1200 : (state==='error' ? 1600 : 2000);
    setTimeout(()=>{ el.classList.remove('show'); el.style.display='none'; }, timeout);
  }
}
// == روابط عرض صور Google Drive ==
export function driveIdToViewUrl(id){
  if (!id) return '';
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
}
export function driveIdToCdnUrl(id){
  if (!id) return '';
  // يعمل عادةً كـ CDN سريع للصور (قد يختلف حسب المنطقة/الصلاحيات)
  return `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w1600-h1600`;
}
