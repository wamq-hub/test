// ملف: js/utils/converters.js
// محوّلات بين نماذج الواجهة والشيت + تطبيع النصوص القادمة من الشيت

import { STATUS } from './helpers.js';


/**
 * تطبيع حالات السلامة الطويلة القادمة من الشيت إلى النسخة المختصرة
 * يحافظ على النص كما هو إذا لم يجد مطابقة.
 */

export const SHEET_HEADERS = [
  'رقم الطلب','نوع الطلب','المبنى','نوع الصيانة','اسم صاحب الطلب','الوقت','التاريخ','التاريخ الهجري','اليوم',
  'نوع العطل','وصف العطل',
  'صورة العطل (DriveId)','رابط صورة العطل',
  'الفني المعيّن','اسم الفني','حالة العمل','ملاحظات الفني',
  'اسم المشرف','قرار المشرف','ملاحظات المشرف',
  'تم الإصلاح','مستوى الرضا','ملاحظات العميل',
  'الحالة','تاريخ الإنشاء'
];
export function modelToArabicRow(m){
  return {
    'رقم الطلب': m.id,
    'نوع الطلب': m.type || m.requestType || '',
    'المبنى': m.building || '',
    'نوع الصيانة': m.maintenanceType || '',
    'اسم صاحب الطلب': m.requesterName || '',
    'الوقت': m.time || '',
    'التاريخ': m.date || '',
    'التاريخ الهجري': m.hijriDate || '',
    'اليوم': m.day || '',
    'نوع العطل': m.faultType || '',
    'وصف العطل': m.faultDescription || '',
    'صورة العطل (DriveId)': m.imageDriveId || '',
    'رابط صورة العطل': m.imageViewUrl || (m.imageDriveId ? driveIdToViewUrl(m.imageDriveId) : (m.imageUrl || '')),
    'الفني المعيّن': m.assignedTechnicianName || '',
    'اسم الفني': m.technicianName || '',
    'حالة العمل': m.workStatus || '',
    'ملاحظات الفني': m.technicianNotes || '',
    'اسم المشرف': m.supervisorName || '',
    'قرار المشرف': m.supervisorDecision || '',
    'ملاحظات المشرف': m.supervisorNotes || '',
    'تم الإصلاح': m.isFixed || '',
    'مستوى الرضا': m.satisfactionLevel || '',
    'ملاحظات العميل': m.clientNotes || '',
    'الحالة': m.status || '',
    'تاريخ الإنشاء': m.createdAt || ''
  };
}

export function normalizeStatusFromSheet(s = '') {
  s = String(s).trim();
  const map = {
    'بانتظار مشرف الصحة والسلامة المهنية (أولية)': STATUS.WAIT_SAFETY_1,
    'معتمد من مشرف الصحة والسلامة المهنية (أولية)': STATUS.SAFETY_APPROVED_1,
    'بانتظار مشرف الصحة والسلامة المهنية (نهائية)': STATUS.WAIT_SAFETY_2,
    'معتمد من مشرف الصحة والسلامة المهنية (نهائية)': STATUS.SAFETY_APPROVED_2,

    // بعض الصيغ الشائعة
    'بانتظار السلامة (أولية)': STATUS.WAIT_SAFETY_1,
    'معتمد من السلامة (أولية)': STATUS.SAFETY_APPROVED_1,
    'بانتظار السلامة (نهائية)': STATUS.WAIT_SAFETY_2,
    'معتمد من السلامة (نهائية)': STATUS.SAFETY_APPROVED_2
  };

  // مطابقة كاملة أو احتواء
  for (const [k, v] of Object.entries(map)) {
    if (s === k || s.includes(k)) return v;
  }
  return s;
}

/**
 * تحويل صف/كائن قادم من الشيت → نموذج داخلي موحّد
 * (ضع هنا أي إعادة تسمية أعمدة مطلوبة من GAS إن وجدت)
 */
export function mapSheetRowToModel(row = {}) {
  const m = { ...row };

  // تطبيع الحالة
  if (m.status) m.status = normalizeStatusFromSheet(m.status);

  // أسماء أعمدة قد تأتي بأحرف إنجليزية من الشيت (أمثلة)
  if (m.request_type && !m.requestType) m.requestType = m.request_type;
  if (m.request_date && !m.requestDate) m.requestDate = m.request_date;

  // ضمان وجود حقول أساسية
  m.id = m.id || m.ID || '';
  m.source = m.source || m.formSource || '';
  m.owner = m.owner || m.source || '';
  return m;
}

/**
 * تحويل نموذج الواجهة (من النماذج) → نموذج الحفظ (GAS)
 * (هنا عادةً لا نحتاج أي تغيير لكن نتركها للاتساق)
 */
export function mapUiToModel(data = {}) {
  const out = { ...data };
  return out;
}

/**
 * تحويل نموذج داخلي → صف مناسب للشيت (إن أردت إعادة تسمية مفاتيح)
 * مثال يوضح أين تضع أي تغييرات أسماء أعمدة
 */
export function mapModelToSheet(model = {}) {
  const row = { ...model };
  // أمثلة لإعادة التسمية إن تطلّب سكربت GAS ذلك
  // row.request_type = model.requestType;
  // row.request_date = model.requestDate;
  return row;
}
