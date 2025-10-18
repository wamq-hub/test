// ملف: js/workflows/maintenance-workflow.js
// مسار الصيانة: صاحب الطلب → مشرف الصيانة → الفني → مشرف الصيانة (تحقق/اعتماد) → تقييم العميل

import { STATUS, generateId } from '../utils/helpers.js';
import { validateNewRequest } from '../utils/validators.js';
import * as storage from '../services/storage-service.js';
import * as sheets from '../services/sheets-service.js';
import { syncQueue } from '../services/sync-service.js';
import { createMaintenanceModals } from '../components/modals.js';
import { setCurrentDateTime, wireImageUpload } from '../components/forms.js';
import { renderSimpleTable, wireTableActions } from '../components/tables.js';

let __cache = { list: [] };

export function initMaintenance(){
  // إنشاء المودالات وربط الحقول الزمنية
  createMaintenanceModals();
  setCurrentDateTime();

  // رفع الصور: صورة الطلب (اختياري) + صورة الفني (إلزامي في التقرير)
  wireImageUpload('#imageUpload', '__uploadedImage');
  wireImageUpload('#techRepairImage', '__techImageB64');

  // ربط النماذج
  document.getElementById('newRequestForm')?.addEventListener('submit', submitNewRequest);
  document.getElementById('technicianForm')?.addEventListener('submit', submitTechnicianReport);
  document.getElementById('supervisorForm')?.addEventListener('submit', submitSupervisorReview);
  document.getElementById('feedbackForm')?.addEventListener('submit', submitClientFeedback);

  // تحميل أولي
  loadAndRender();
}

async function loadAndRender(){
  try{
    const data = await sheets.getRequests();
    __cache.list = (Array.isArray(data)?data:[])
      .filter(r=> r && (r.source==='صيانة' || r.formSource==='صيانة' || r.owner==='صيانة'));
    storage.saveRequests(__cache.list);
  }catch{
    __cache.list = storage.loadRequests();
  }
  renderTable();
}

function renderTable(){
  const cols = [
    {key:'id'},
    {key:'requesterName'},
    {key:'building'},
    {key:'maintenanceType'},
    {key:'faultType'},
    {key:'requestDate'},
    {key:'status'}
  ];
  renderSimpleTable('requestsTbody', __cache.list, cols);
  wireTableActions({
    onOpenTech: openTechnicianModal,
    onOpenSupervisor: openSupervisorModal,
    onOpenFeedback: openFeedbackModal
  });
}

function getById(id){ return __cache.list.find(r=> String(r.id)===String(id)); }
function upsertLocal(model){
  const i = __cache.list.findIndex(r=> String(r.id)===String(model.id));
  if (i>=0) __cache.list[i]=model; else __cache.list.unshift(model);
  storage.saveRequests(__cache.list);
  renderTable();
}

// =====================================================
// إضافة طلب صيانة جديد (تحديث تفاؤلي + مزامنة)
// =====================================================
export function submitNewRequest(e){
  e.preventDefault();
  const f = e.target;
  const data = {
    id: generateId('M-'),
    source:'صيانة',
    formSource:'صيانة',
    owner:'صيانة',
    requestType: f.requestType.value,
    building: f.building.value,
    maintenanceType: f.maintenanceType.value,
    requesterName: f.requesterName.value,
    requestDate: f.requestDate.value,
    requestTime: f.requestTime.value,
    hijriDate: f.hijriDate.value,
    requestDay: f.requestDay.value,
    faultType: f.faultType.value==='أخرى' ? (f.otherFault?.value||'أخرى') : f.faultType.value,
    faultDescription: f.faultDescription.value,
    status: STATUS.WAIT_SUP,
    image: window.__uploadedImage || null
  };

  const errs = validateNewRequest(data);
  if (errs.length){ alert(errs.join('\n')); return; }

  upsertLocal(data);
  const alertBox = document.getElementById('newRequestAlert');
  if (alertBox){ alertBox.textContent='✅ تم إضافة الطلب محليًا وسيتم مزامنته'; alertBox.style.display='inline-flex'; }
  f.reset();
  window.__uploadedImage = null;

  syncQueue.add({ type:'add', data });
}

// =====================================================
// فتح المودالات
// =====================================================
function openTechnicianModal(id){
  const r = getById(id); if (!r) return;
  document.getElementById('techRequestId').value = r.id;
  document.getElementById('technicianModal').classList.add('active');
}

function openSupervisorModal(id){
  const r = getById(id); if (!r) return;
  document.getElementById('supRequestId').value = r.id;
  document.getElementById('supervisorModal').classList.add('active');
}

function openFeedbackModal(id){
  const r = getById(id); if (!r) return;
  document.getElementById('fbRequestId').value = r.id;
  document.getElementById('feedbackModal').classList.add('active');
}

// =====================================================
// تقرير الفني (يلزم صورة) → TECH_REVIEW
// =====================================================
export function submitTechnicianReport(e){
  e.preventDefault();
  const f = e.target;
  const id = document.getElementById('techRequestId').value;
  const r = getById(id);
  if (!r){ alert('الطلب غير موجود'); return; }

  if (!window.__techImageB64){
    alert('📷 صورة الإصلاح مطلوبة'); return;
  }

  r.technicianName = document.getElementById('technicianName').value.trim();
  r.workStatus = document.getElementById('workStatus').value;
  r.technicianNotes = document.getElementById('technicianNotes').value.trim();
  r.techImage = window.__techImageB64;
  r.status = STATUS.TECH_REVIEW; // جاري المراجعة لدى المشرف

  upsertLocal(r);
  syncQueue.add({ type:'update', data:r });

  document.getElementById('technicianModal').classList.remove('active');
  f.reset();
  window.__techImageB64 = null;
}

// =====================================================
// مراجعة المشرف (تعيين فني / اعتماد / إعادة للمراجعة / رفض)
// =====================================================
export function submitSupervisorReview(e){
  e.preventDefault();
  const id = document.getElementById('supRequestId').value;
  const action = document.getElementById('supAction').value;
  const techName = document.getElementById('supTechnicianName').value.trim();
  const notes = document.getElementById('supNotes').value.trim();

  const r = getById(id); if (!r){ alert('الطلب غير موجود'); return; }
  r.supervisorNotes = notes;

  if (action==='assign'){
    if (!techName){ alert('يرجى إدخال اسم الفني عند التعيين'); return; }
    r.assignedTechnician = techName;
    r.status = STATUS.ASSIGNED;
  }else if (action==='approve'){
    r.status = STATUS.APPROVED;
  }else if (action==='need_review'){
    r.status = STATUS.NEEDS_REVIEW;
  }else if (action==='reject'){
    r.status = STATUS.REJECTED;
  }

  upsertLocal(r);
  syncQueue.add({ type:'update', data:r });

  document.getElementById('supervisorModal').classList.remove('active');
  e.target.reset();
}

// =====================================================
// تقييم العميل → COMPLETED
// =====================================================
export function submitClientFeedback(e){
  e.preventDefault();
  const id = document.getElementById('fbRequestId').value;
  const rating = document.getElementById('fbRating').value;
  const notes = document.getElementById('fbNotes').value;

  const r = getById(id); if (!r){ alert('الطلب غير موجود'); return; }

  r.clientRating = Number(rating);
  r.clientNotes = notes || '';
  r.status = STATUS.COMPLETED;

  upsertLocal(r);
  syncQueue.add({ type:'update', data:r });

  document.getElementById('feedbackModal').classList.remove('active');
  e.target.reset();
}

// maintenance-workflow.js
// === مسار الطلب (Timeline) حسب المصدر والحالة الحالية ===
export function buildRequestTimeline(row = {}) {
  const get = (k) => String(row[k] ?? row[k?.trim?.()] ?? '').trim();
  const src = (get('source') || get('formSource') || get('owner') || get('مصدر الطلب') || '').replace(/\s+/g,'');
  const source = /سلامة/.test(src) ? 'سلامة' : 'صيانة';

  // طبّع نص الحالة
  let status = get('الحالة') || get('status');
  if (typeof normalizeStatusFromSheet === 'function') status = normalizeStatusFromSheet(status);

  const rated = !!get('مستوى الرضا') || !!get('rating');

  // خرائط الحالات → المؤشرات
  const is = (s) => (status||'').includes(s);

  // تعريف الخطوات لكل مسار
  let steps = [];
  if (source === 'صيانة') {
    steps = [
      { key:'user_submit', label:'صاحب الطلب (إنشاء)', test: ()=> is('بانتظار مشرف الصيانة') || is('بانتظار الفني') || is('بانتظار تأكيد مشرف الصيانة') || is('بانتظار تقييم العميل') || is('مكتمل') },
      { key:'supervisor_assign', label:'مشرف الصيانة (تعيين فني)', test: ()=> is('بانتظار الفني') || is('بانتظار تأكيد مشرف الصيانة') || is('بانتظار تقييم العميل') || is('مكتمل') },
      { key:'technician_work', label:'الفني (تنفيذ وإرفاق صورة)', test: ()=> is('بانتظار تأكيد مشرف الصيانة') || is('بانتظار تقييم العميل') || is('مكتمل') },
      { key:'supervisor_confirm', label:'مشرف الصيانة (تأكيد الإجراء)', test: ()=> is('بانتظار تقييم العميل') || is('مكتمل') },
      { key:'client_rate', label:'صاحب الطلب (التقييم)', test: ()=> is('بانتظار تقييم العميل') || is('مكتمل') },
      { key:'done', label:'مكتمل', test: ()=> is('مكتمل') || (is('بانتظار تقييم العميل') && rated) }
    ];
  } else { // سلامة
    // مسارين: معالجة السلامة مباشرة، أو تحويل للصيانة ثم رجوع للسلامة فالعميل
    const wentToMaint = is('بانتظار مشرف الصيانة') || is('بانتظار الفني') || is('بانتظار تأكيد مشرف الصيانة');
    steps = [
      { key:'safety_initial', label:'مشرف السلامة (استلام)', test: ()=> true },
      ...(wentToMaint ? [
        { key:'maint_supervisor', label:'مشرف الصيانة (تعيين فني)', test: ()=> is('بانتظار الفني') || is('بانتظار تأكيد مشرف الصيانة') || is('بانتظار السلامة') || is('بانتظار تقييم العميل') || is('مكتمل') },
        { key:'technician', label:'الفني (تنفيذ وإرفاق صورة)', test: ()=> is('بانتظار تأكيد مشرف الصيانة') || is('بانتظار السلامة') || is('بانتظار تقييم العميل') || is('مكتمل') },
        { key:'maint_confirm', label:'مشرف الصيانة (تأكيد)', test: ()=> is('بانتظار السلامة') || is('بانتظار تقييم العميل') || is('مكتمل') },
        { key:'safety_final', label:'مشرف السلامة (نهائي)', test: ()=> is('بانتظار تقييم العميل') || is('مكتمل') },
      ] : [
        { key:'safety_handled', label:'تمت المعالجة بواسطة السلامة', test: ()=> is('بانتظار تقييم العميل') || is('مكتمل') },
      ]),
      { key:'client_rate', label:'صاحب الطلب (التقييم)', test: ()=> is('بانتظار تقييم العميل') || is('مكتمل') },
      { key:'done', label:'مكتمل', test: ()=> is('مكتمل') || (is('بانتظار تقييم العميل') && rated) }
    ];
  }

  // علِّم active/done حسب الحالة
  const mark = steps.map((st, idx) => {
    const passed = st.test();
    // active = أول خطوة لم تُنجز بعد (أو خطوة "بانتظار تقييم العميل")
    const isWaitingClient = /بانتظار\s*تقييم\s*العميل/.test(status||'');
    const active = isWaitingClient ? st.key==='client_rate'
                 : (!passed && idx>0 && steps[idx-1].test());
    const done = passed && !(active);
    return { ...st, active, done };
  });

  return { source, status, steps: mark };
}
