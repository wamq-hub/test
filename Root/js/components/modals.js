// ملف: js/components/modals.js
// إنشاء جميع المودالات المستخدمة في الصيانة والسلامة والتقييم

export function createMaintenanceModals(){
  const host = document.body;

  // --- تقرير الفني ---
  if (!document.getElementById('technicianModal')){
    host.insertAdjacentHTML('beforeend', `
      <div class="modal" id="technicianModal" aria-hidden="true"><div class="modal-content">
        <div class="modal-header">
          <h2>🔧 تقرير الفني</h2>
          <button class="close-modal" aria-label="إغلاق" onclick="document.getElementById('technicianModal').classList.remove('active')">&times;</button>
        </div>
        <form id="technicianForm">
          <input type="hidden" id="techRequestId">

          <div class="form-group">
            <label for="technicianName">اسم الفني</label>
            <input type="text" id="technicianName" required>
          </div>

          <div class="form-group">
            <label for="workStatus">حالة العمل</label>
            <select id="workStatus" required>
              <option value="تم الإصلاح">تم الإصلاح</option>
              <option value="جاري الإصلاح">جاري الإصلاح</option>
              <option value="تحت المعالجة">تحت المعالجة</option>
              <option value="يحتاج قطع غيار">يحتاج قطع غيار</option>
            </select>
          </div>

          <div class="form-group">
            <label for="technicianNotes">ملاحظات الفني</label>
            <textarea id="technicianNotes" rows="3" required></textarea>
          </div>

          <div class="form-group">
            <label for="techRepairImage">📷 صورة الإصلاح <small>(إلزامي)</small></label>
            <input type="file" id="techRepairImage" accept="image/*" required>
            <small>تُحفظ مؤقتًا محليًا (Base64) ثم تُرفع أثناء المزامنة.</small>
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn-secondary" type="button" onclick="document.getElementById('technicianModal').classList.remove('active')">إلغاء</button>
            <button class="btn-primary" type="submit">حفظ التقرير</button>
          </div>
        </form>
      </div></div>
    `);
  }

  // --- مراجعة المشرف ---
  if (!document.getElementById('supervisorModal')){
    host.insertAdjacentHTML('beforeend', `
      <div class="modal" id="supervisorModal" aria-hidden="true"><div class="modal-content">
        <div class="modal-header">
          <h2>🧭 مراجعة المشرف</h2>
          <button class="close-modal" aria-label="إغلاق" onclick="document.getElementById('supervisorModal').classList.remove('active')">&times;</button>
        </div>
        <form id="supervisorForm">
          <input type="hidden" id="supRequestId">

          <div class="form-group">
            <label for="supAction">الإجراء</label>
            <select id="supAction" required>
              <option value="assign">تعيين فني</option>
              <option value="approve">اعتماد الإجراء</option>
              <option value="need_review">إرجاع للمراجعة</option>
              <option value="reject">رفض</option>
            </select>
          </div>

          <div class="form-group">
            <label for="supTechnicianName">اسم الفني (عند التعيين)</label>
            <input type="text" id="supTechnicianName" placeholder="مطلوب فقط عند اختيار (تعيين فني)">
          </div>

          <div class="form-group">
            <label for="supNotes">ملاحظات المشرف</label>
            <textarea id="supNotes" rows="3" required></textarea>
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn-secondary" type="button" onclick="document.getElementById('supervisorModal').classList.remove('active')">إلغاء</button>
            <button class="btn-primary" type="submit">حفظ</button>
          </div>
        </form>
      </div></div>
    `);
  }

  // --- تقييم صاحب الطلب (مشترك) ---
  if (!document.getElementById('feedbackModal')){
    host.insertAdjacentHTML('beforeend', `
      <div class="modal" id="feedbackModal" aria-hidden="true"><div class="modal-content">
        <div class="modal-header">
          <h2>⭐ تقييم صاحب الطلب</h2>
          <button class="close-modal" aria-label="إغلاق" onclick="document.getElementById('feedbackModal').classList.remove('active')">&times;</button>
        </div>
        <form id="feedbackForm">
          <input type="hidden" id="fbRequestId">

          <div class="form-group">
            <label for="fbRating">التقييم</label>
            <select id="fbRating" required>
              <option value="5">ممتاز (5)</option>
              <option value="4">جيد جداً (4)</option>
              <option value="3">جيد (3)</option>
              <option value="2">مقبول (2)</option>
              <option value="1">ضعيف (1)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="fbNotes">ملاحظات</label>
            <textarea id="fbNotes" rows="3" placeholder="اختياري"></textarea>
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn-secondary" type="button" onclick="document.getElementById('feedbackModal').classList.remove('active')">إلغاء</button>
            <button class="btn-primary" type="submit">إرسال التقييم</button>
          </div>
        </form>
      </div></div>
    `);
  }
}

export function createSafetyModals(){
  const host = document.body;

  // --- مراجعة السلامة (أولية) ---
  if (!document.getElementById('safetyModal1')){
    host.insertAdjacentHTML('beforeend', `
      <div class="modal" id="safetyModal1" aria-hidden="true"><div class="modal-content">
        <div class="modal-header">
          <h2>🦺 مراجعة السلامة (أولية)</h2>
          <button class="close-modal" aria-label="إغلاق" onclick="document.getElementById('safetyModal1').classList.remove('active')">&times;</button>
        </div>
        <form id="safetyForm1">
          <input type="hidden" id="safetyRequestId1">

          <div class="form-group">
            <label for="safetyOfficerName1">اسم مسؤول السلامة</label>
            <input id="safetyOfficerName1" required>
          </div>

          <div class="form-group">
            <label for="safetyDecision1">قرار السلامة</label>
            <select id="safetyDecision1" required>
              <option value="safe">✅ آمن للتنفيذ</option>
              <option value="needs_measures">⚠️ يحتاج إجراءات سلامة</option>
              <option value="to_maintenance">🔧 تحويل للصيانة</option>
              <option value="rejected">❌ غير آمن - مرفوض</option>
            </select>
          </div>

          <div class="form-group">
            <label for="safetyNotes1">ملاحظات</label>
            <textarea id="safetyNotes1" rows="3" required></textarea>
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn-secondary" type="button" onclick="document.getElementById('safetyModal1').classList.remove('active')">إلغاء</button>
            <button class="btn-primary" type="submit">حفظ</button>
          </div>
        </form>
      </div></div>
    `);
  }

  // --- مراجعة السلامة (نهائية) ---
  if (!document.getElementById('safetyModal2')){
    host.insertAdjacentHTML('beforeend', `
      <div class="modal" id="safetyModal2" aria-hidden="true"><div class="modal-content">
        <div class="modal-header">
          <h2>🦺 مراجعة السلامة (نهائية)</h2>
          <button class="close-modal" aria-label="إغلاق" onclick="document.getElementById('safetyModal2').classList.remove('active')">&times;</button>
        </div>
        <form id="safetyForm2">
          <input type="hidden" id="safetyRequestId2">

          <div class="form-group">
            <label for="safetyOfficerName2">اسم مسؤول السلامة</label>
            <input id="safetyOfficerName2" required>
          </div>

          <div class="form-group">
            <label for="safetyDecision2">القرار النهائي</label>
            <select id="safetyDecision2" required>
              <option value="approved_ok">✅ معتمد - العمل مطابق</option>
              <option value="approved_notes">⚠️ معتمد مع ملاحظات</option>
              <option value="safety_handled">🧰 تمت المعالجة من قبل السلامة (إرسال مباشر للتقييم)</option>
              <option value="not_approved">❌ غير معتمد</option>
            </select>
          </div>

          <div class="form-group">
            <label for="safetyFinalImage">📷 صورة تنفيذ/معالجة السلامة <small>(اختياري)</small></label>
            <input type="file" id="safetyFinalImage" accept="image/*">
          </div>

          <div class="form-group">
            <label for="safetyNotes2">ملاحظات نهائية</label>
            <textarea id="safetyNotes2" rows="3" required></textarea>
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn-secondary" type="button" onclick="document.getElementById('safetyModal2').classList.remove('active')">إلغاء</button>
            <button class="btn-primary" type="submit">حفظ</button>
          </div>
        </form>
      </div></div>
    `);
  }

  // --- تقييم صاحب الطلب (مشترك) ---
  if (!document.getElementById('feedbackModal')){
    // قد يكون قد تم إنشاؤه من createMaintenanceModals؛ نتأكد قبل الإنشاء
    host.insertAdjacentHTML('beforeend', `
      <div class="modal" id="feedbackModal" aria-hidden="true"><div class="modal-content">
        <div class="modal-header">
          <h2>⭐ تقييم صاحب الطلب</h2>
          <button class="close-modal" aria-label="إغلاق" onclick="document.getElementById('feedbackModal').classList.remove('active')">&times;</button>
        </div>
        <form id="feedbackForm">
          <input type="hidden" id="fbRequestId">

          <div class="form-group">
            <label for="fbRating">التقييم</label>
            <select id="fbRating" required>
              <option value="5">ممتاز (5)</option>
              <option value="4">جيد جداً (4)</option>
              <option value="3">جيد (3)</option>
              <option value="2">مقبول (2)</option>
              <option value="1">ضعيف (1)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="fbNotes">ملاحظات</label>
            <textarea id="fbNotes" rows="3" placeholder="اختياري"></textarea>
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn-secondary" type="button" onclick="document.getElementById('feedbackModal').classList.remove('active')">إلغاء</button>
            <button class="btn-primary" type="submit">إرسال التقييم</button>
          </div>
        </form>
      </div></div>
    `);
  }
}

// modals.js
import { buildRequestTimeline } from './workflows/maintenance-workflow.js';

export function showRequestTimeline(row){
  const data = buildRequestTimeline(row);
  const modal = ensureTimelineModal(); // أنشئ/أحضر المودال
  const body = modal.querySelector('.timeline-body');
  body.innerHTML = renderTimelineHTML(data);

  // افتح المودال
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');

  // إغلاق
  modal.querySelector('.timeline-close').onclick = ()=> {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  };
  modal.addEventListener('click',(e)=>{
    if(e.target===modal) modal.querySelector('.timeline-close').click();
  });
}

function renderTimelineHTML({source,status,steps}){
  const badge = source==='سلامة' ? '<span class="src-badge src-safety">🦺 سلامة</span>'
                                 : '<span class="src-badge src-maint">🛠️ صيانة</span>';
  const items = steps.map(s=>`
    <li class="tl-item ${s.done?'done':''} ${s.active?'active':''}">
      <div class="tl-dot"></div>
      <div class="tl-content">
        <div class="tl-title">${s.label}</div>
        <div class="tl-sub">${s.active?'(الخطوة الحالية)':''}</div>
      </div>
    </li>
  `).join('');

  return `
    <div class="tl-header">
      ${badge}
      <span class="tl-status">الحالة الحالية: <b>${status||'-'}</b></span>
    </div>
    <ol class="timeline">${items}</ol>
  `;
}

function ensureTimelineModal(){
  let modal = document.getElementById('timelineModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'timelineModal';
  modal.className = 'timeline-modal';
  modal.innerHTML = `
    <div class="timeline-dialog">
      <button class="timeline-close" aria-label="Close">×</button>
      <div class="timeline-body"></div>
    </div>
  `;
  document.body.appendChild(modal);

  // CSS خفيف
  const style = document.createElement('style');
  style.textContent = `
    .timeline-modal{position:fixed;inset:0;background:rgba(0,0,0,.35);display:none;z-index:1000}
    .timeline-dialog{background:#fff;max-width:680px;margin:6vh auto;padding:20px 22px;border-radius:14px;position:relative}
    .timeline-close{position:absolute;top:8px;left:10px;border:0;background:transparent;font-size:26px;cursor:pointer}
    .src-badge{display:inline-block;margin-inline-end:10px;padding:.15rem .5rem;border-radius:999px;font-size:.85rem}
    .src-safety{background:#E6F1EC;color:#006341;border:1px solid #9fd3c2}
    .src-maint{background:#FFF5E6;color:#C38E00;border:1px solid #f1d293}
    .tl-header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
    .tl-status{color:#1F2937}
    .timeline{list-style:none;margin:10px 0 0;padding:0;border-inline-start:3px solid #E5E7EB}
    .tl-item{position:relative;padding:12px 12px 12px 22px;margin-inline-start:10px}
    .tl-item .tl-dot{position:absolute;inset-inline-start:-11px;top:18px;width:14px;height:14px;border-radius:50%;background:#E5E7EB;border:2px solid #CBD5E1}
    .tl-item.done .tl-dot{background:#00A287;border-color:#00A287}
    .tl-item.active .tl-dot{background:#C8A55C;border-color:#C8A55C}
    .tl-title{font-weight:600}
    .tl-sub{font-size:.85rem;color:#6B7280}
  `;
  document.head.appendChild(style);
  return modal;
}
