// إنشاء المودالات حسب الصفحة
export function createMaintenanceModals(){
  const host=document.body;
  if (document.getElementById('technicianModal')) return;
  host.insertAdjacentHTML('beforeend', `
    <div class="modal" id="technicianModal"><div class="modal-content">
      <div class="modal-header"><h2>🔧 تقرير الفني</h2><button class="close-modal" onclick="document.getElementById('technicianModal').classList.remove('active')">&times;</button></div>
      <form id="technicianForm">
        <input type="hidden" id="techRequestId">
        <div class="form-group"><label>اسم الفني</label><input type="text" id="technicianName" required></div>
        <div class="form-group"><label>حالة العمل</label>
          <select id="workStatus" required>
            <option value="تم الإصلاح">تم الإصلاح</option>
            <option value="جاري الإصلاح">جاري الإصلاح</option>
            <option value="تحت المعالجة">تحت المعالجة</option>
            <option value="يحتاج قطع غيار">يحتاج قطع غيار</option>
          </select>
        </div>
        <div class="form-group"><label>ملاحظات الفني</label><textarea id="technicianNotes" required></textarea></div>
        <div class="form-group"><label>📷 صورة الإصلاح (إلزامي)</label>
          <input type="file" id="techRepairImage" accept="image/*" required>
        </div>
        <button class="btn-primary" type="submit">حفظ التقرير</button>
        <button class="btn-secondary" type="button" onclick="document.getElementById('technicianModal').classList.remove('active')">إلغاء</button>
      </form>
    </div></div>
  `);
}

export function createSafetyModals(){
  const host=document.body;
  if (document.getElementById('safetyModal1')) return;
  host.insertAdjacentHTML('beforeend', `
    <div class="modal" id="safetyModal1"><div class="modal-content">
      <div class="modal-header"><h2>🦺 مراجعة السلامة (أولية)</h2><button class="close-modal" onclick="document.getElementById('safetyModal1').classList.remove('active')">&times;</button></div>
      <form id="safetyForm1">
        <input type="hidden" id="safetyRequestId1">
        <div class="form-group"><label>اسم مسؤول السلامة</label><input id="safetyOfficerName1" required></div>
        <div class="form-group"><label>قرار السلامة</label>
          <select id="safetyDecision1" required>
            <option value="آمن للتنفيذ">✅ آمن للتنفيذ</option>
            <option value="يحتاج إجراءات سلامة">⚠️ يحتاج إجراءات سلامة</option>
            <option value="غير آمن - مرفوض">❌ غير آمن - مرفوض</option>
          </select>
        </div>
        <div class="form-group"><label>ملاحظات</label><textarea id="safetyNotes1" required></textarea></div>
        <button class="btn-primary" type="submit">حفظ</button>
        <button class="btn-secondary" type="button" onclick="document.getElementById('safetyModal1').classList.remove('active')">إلغاء</button>
      </form>
    </div></div>
    <div class="modal" id="safetyModal2"><div class="modal-content">
      <div class="modal-header"><h2>🦺 مراجعة السلامة (نهائية)</h2><button class="close-modal" onclick="document.getElementById('safetyModal2').classList.remove('active')">&times;</button></div>
      <form id="safetyForm2">
        <input type="hidden" id="safetyRequestId2">
        <div class="form-group"><label>اسم مسؤول السلامة</label><input id="safetyOfficerName2" required></div>
        <div class="form-group"><label>القرار النهائي</label>
          <select id="safetyDecision2" required>
            <option value="معتمد - العمل مطابق">✅ معتمد - العمل مطابق</option>
            <option value="معتمد مع ملاحظات">⚠️ معتمد مع ملاحظات</option>
            <option value="غير معتمد">❌ غير معتمد</option>
          </select>
        </div>
        <div class="form-group"><label>ملاحظات نهائية</label><textarea id="safetyNotes2" required></textarea></div>
        <button class="btn-primary" type="submit">حفظ</button>
        <button class="btn-secondary" type="button" onclick="document.getElementById('safetyModal2').classList.remove('active')">إلغاء</button>
      </form>
    </div></div>
  `);
}
