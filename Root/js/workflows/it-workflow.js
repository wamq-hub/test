// ملف: js/workflows/it-workflow.js
// مسار الدعم الفني: رئيس القسم → تقنية المعلومات → رئيس القسم → تقييم صاحب الطلب

import { generateId } from '../utils/helpers.js';
import * as storage from '../services/storage-service.js';
import * as sheets from '../services/sheets-service.js';
import { syncQueue } from '../services/sync-service.js';
import { renderSimpleTable, wireTableActions } from '../components/tables.js';

let __cache = { list: [] };

export function initIT(){
  // يفترض وجود #newRequestForm في صفحة مسار IT حين تُفعّل
  document.getElementById('newRequestForm')?.addEventListener('submit', submitNewIT);
  loadAndRender();
}

async function loadAndRender(){
  try{
    const data = await sheets.getRequests();
    __cache.list = (Array.isArray(data)?data:[])
      .filter(r => r && (r.source==='دعم فني' || r.formSource==='دعم فني' || r.owner==='دعم فني' || r.owner==='رئيس القسم'));
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
    onOpenTech: approveByDeptHead,         // الخطوة الأولى: رئيس القسم يعتمد
    onOpenSupervisor: processByIT,         // ثم IT ينفذ
    onOpenFeedback: finalDeptHeadThenFB    // ثم تأكيد رئيس القسم → تقييم
  });
}

function getById(id){ return __cache.list.find(r=> String(r.id)===String(id)); }
function upsertLocal(model){
  const i = __cache.list.findIndex(r=> String(r.id)===String(model.id));
  if (i>=0) __cache.list[i]=model; else __cache.list.unshift(model);
  storage.saveRequests(__cache.list);
  renderTable();
}

// إنشاء طلب IT جديد (بسيط)
export function submitNewIT(e){
  e.preventDefault();
  const f=e.target;
  const r={
    id: generateId('I-'),
    source:'دعم فني',
    formSource:'دعم فني',
    owner:'رئيس القسم',
    requesterName:f.requesterName?.value,
    building:f.building?.value,
    maintenanceType:f.maintenanceType?.value,
    faultType:f.faultType?.value,
    faultDescription:f.faultDescription?.value,
    requestDate:f.requestDate?.value,
    requestTime:f.requestTime?.value,
    status:'بانتظار رئيس القسم'
  };
  upsertLocal(r);
  syncQueue.add({ type:'add', data:r });
  f.reset?.();
}

// رئيس القسم يعتمد ثم يحول إلى تقنية المعلومات
function approveByDeptHead(id){
  const r=getById(id); if(!r) return;
  if (r.owner!=='رئيس القسم'){ alert('الطلب ليس لدى رئيس القسم'); return; }
  r.status='محوّل إلى تقنية المعلومات';
  r.owner='دعم فني';
  upsertLocal(r);
  syncQueue.add({ type:'update', data:r });
}

// تقنية المعلومات تنفذ وتعيده إلى رئيس القسم للتأكيد
function processByIT(id){
  const r=getById(id); if(!r) return;
  if (r.owner!=='دعم فني'){ alert('الطلب ليس لدى تقنية المعلومات'); return; }
  r.status='تم التنفيذ - بانتظار تأكيد رئيس القسم';
  r.owner='رئيس القسم';
  upsertLocal(r);
  syncQueue.add({ type:'update', data:r });
}

// رئيس القسم يؤكد ثم يرسل لتقييم صاحب الطلب
function finalDeptHeadThenFB(id){
  const r=getById(id); if(!r) return;
  if (r.owner!=='رئيس القسم'){ alert('الطلب ليس لدى رئيس القسم'); return; }
  r.status='بانتظار تقييم العميل';
  r.owner='صاحب الطلب';
  upsertLocal(r);
  syncQueue.add({ type:'update', data:r });
}
