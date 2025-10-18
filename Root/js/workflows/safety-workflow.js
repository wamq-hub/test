// ملف: js/workflows/safety-workflow.js
// مسار السلامة: تسجيل بلاغ → مراجعة أولية (اعتماد/إجراءات/تحويل للصيانة/رفض)
//               → (قد يذهب للصيانة ثم يعود) → مراجعة نهائية
//               → خيار "تمت المعالجة من قبل السلامة" لإرسال مباشر للتقييم → تقييم العميل

import { STATUS, generateId } from '../utils/helpers.js';
import { validateNewRequest } from '../utils/validators.js';
import * as storage from '../services/storage-service.js';
import * as sheets from '../services/sheets-service.js';
import { syncQueue } from '../services/sync-service.js';
import { createSafetyModals } from '../components/modals.js';
import { setCurrentDateTime, wireImageUpload } from '../components/forms.js';
import { renderSimpleTable, wireTableActions } from '../components/tables.js';

let __cache = { list: [] };

export function initSafety(){
  createSafetyModals();
  setCurrentDateTime();

  wireImageUpload('#imageUpload', '__uploadedImage');        // صورة البلاغ (اختياري)
  wireImageUpload('#safetyFinalImage', '__safetyFinalB64');  // صورة نهائية (اختياري)

  document.getElementById('newRequestForm')?.addEventListener('submit', submitNewSafety);
  document.getElementById('safetyForm1')?.addEventListener('submit', submitSafetyReview1);
  document.getElementById('safetyForm2')?.addEventListener('submit', submitSafetyReview2);
  document.getElementById('feedbackForm')?.addEventListener('submit', submitClientFeedback);

  loadAndRender();
}

async function loadAndRender(){
  try{
    const data = await sheets.getRequests();
    __cache.list = (Array.isArray(data)?data:[])
      .filter(r=> r && (r.source==='سلامة' || r.formSource==='سلامة' || r.owner==='سلامة'));
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
    onOpenTech: (id)=>alert('هذا الزر غير فعّال في مسار السلامة'),
    onOpenSupervisor: openSafetyPhase,
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
// بلاغ سلامة جديد
// =====================================================
export function submitNewSafety(e){
  e.preventDefault();
  const f = e.target;
  const data = {
    id: generateId('S-'),
    source:'سلامة',
    formSource:'سلامة',
    owner:'سلامة',
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
    status: STATUS.WAIT_SAFETY_1,
    image: window.__uploadedImage || null
  };

  const errs = validateNewRequest(data);
  if (errs.length){ alert(errs.join('\n')); return; }

  upsertLocal(data);
  const alertBox = document.getElementById('newRequestAlert');
  if (alertBox){ alertBox.textContent='✅ أُضيف البلاغ محليًا وسيُزامن'; alertBox.style.display='inline-flex'; }
  f.reset();
  window.__uploadedImage = null;

  syncQueue.add({ type:'add', data });
}

// =====================================================
// فتح المرحلة المناسبة (أولية/نهائية)
// =====================================================
function openSafetyPhase(id){
  const r = getById(id); if (!r) return;
  if (r.status===STATUS.WAIT_SAFETY_1){
    document.getElementById('safetyRequestId1').value = r.id;
    document.getElementById('safetyModal1').classList.add('active');
  }else{
    document.getElementById('safetyRequestId2').value = r.id;
    document.getElementById('safetyModal2').classList.add('active');
  }
}

function openFeedbackModal(id){
  const r = getById(id); if (!r) return;
  document.getElementById('fbRequestId').value = r.id;
  document.getElementById('feedbackModal').classList.add('active');
}

// =====================================================
// مراجعة السلامة (أولية)
// safe / needs_measures → SAFETY_APPROVED_1 (يبقى لدى السلامة)
// to_maintenance → تحويل للصيانة (WAIT_SUP + owner='صيانة')
// rejected → REJECTED
// =====================================================
export function submitSafetyReview1(e){
  e.preventDefault();
  const id = document.getElementById('safetyRequestId1').value;
  const officer = document.getElementById('safetyOfficerName1').value.trim();
  const decision = document.getElementById('safetyDecision1').value;
  const notes = document.getElementById('safetyNotes1').value.trim();

  const r = getById(id); if (!r){ alert('الطلب غير موجود'); return; }

  r.safetyOfficer1 = officer;
  r.safetyNotes1 = notes;

  if (decision==='safe' || decision==='needs_measures'){
    r.status = STATUS.SAFETY_APPROVED_1;
    r.owner = 'سلامة';
  }else if (decision==='to_maintenance'){
    r.status = STATUS.WAIT_SUP;
    r.owner = 'صيانة';
    r.formSource = r.formSource || 'سلامة';
  }else if (decision==='rejected'){
    r.status = STATUS.REJECTED;
  }

  upsertLocal(r);
  syncQueue.add({ type:'update', data:r });

  document.getElementById('safetyModal1').classList.remove('active');
  e.target.reset();
}

// =====================================================
// مراجعة السلامة (نهائية)
// approved_ok/approved_notes → SAFETY_APPROVED_2
// safety_handled → SAFETY_APPROVED_2 + readyForClientFeedback=true
// not_approved → NEEDS_REVIEW
// =====================================================
export function submitSafetyReview2(e){
  e.preventDefault();
  const id = document.getElementById('safetyRequestId2').value;
  const officer = document.getElementById('safetyOfficerName2').value.trim();
  const decision = document.getElementById('safetyDecision2').value;
  const notes = document.getElementById('safetyNotes2').value.trim();
  const r = getById(id); if (!r){ alert('الطلب غير موجود'); return; }

  r.safetyOfficer2 = officer;
  r.safetyNotes2 = notes;
  if (window.__safetyFinalB64) r.safetyFinalImage = window.__safetyFinalB64;

  if (decision==='approved_ok' || decision==='approved_notes'){
    r.status = STATUS.SAFETY_APPROVED_2;
    r.owner = 'سلامة';
  }else if (decision==='safety_handled'){
    r.status = STATUS.SAFETY_APPROVED_2;
    r.owner = 'سلامة';
    r.readyForClientFeedback = true; // تستخدمها الواجهة لإظهار زر تقييم العميل
  }else if (decision==='not_approved'){
    r.status = STATUS.NEEDS_REVIEW;
  }

  upsertLocal(r);
  syncQueue.add({ type:'update', data:r });

  document.getElementById('safetyModal2').classList.remove('active');
  e.target.reset();
  window.__safetyFinalB64 = null;
}

// =====================================================
// تقييم العميل (سلامة) → COMPLETED
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
