// ملف: js/utils/validators.js
// دوال تحقق بسيطة لنماذج الإدخال

/**
 * تحقّق أساسي لنموذج الطلب/البلاغ
 * يعيد مصفوفة أخطاء (فارغة عند النجاح)
 */
export function validateNewRequest(data){
  const errs = [];

  if (!data.requestType) errs.push('نوع الطلب مطلوب');
  if (!data.building) errs.push('المبنى مطلوب');
  if (!data.maintenanceType) errs.push('نوع الصيانة/التصنيف مطلوب');
  if (!data.requesterName) errs.push('اسم صاحب الطلب مطلوب');

  if (!data.faultType) errs.push('نوع العطل/الملاحظة مطلوب');
  if (!data.faultDescription || String(data.faultDescription).trim().length < 10)
    errs.push('وصف العطل يجب ألا يقل عن 10 أحرف');

  // تواريخ
  if (!data.requestDate) errs.push('التاريخ (ميلادي) مطلوب');
  if (!data.requestTime) errs.push('الوقت مطلوب');

  // حقول إضافية اختيارية يمكن فرضها حسب السياق:
  // مثال: صورة الفني إلزامية لكن ذلك يتحقق في submitTechnicianReport

  return errs;
}

/**
 * تحقّق الحد الأدنى لتقرير الفني
 */
export function validateTechnicianReport({ technicianName, workStatus, technicianNotes, techImage }){
  const errs = [];
  if (!technicianName || technicianName.trim().length < 2) errs.push('اسم الفني مطلوب');
  if (!workStatus) errs.push('حالة العمل مطلوبة');
  if (!technicianNotes || technicianNotes.trim().length < 3) errs.push('ملاحظات الفني مطلوبة');
  if (!techImage) errs.push('صورة الإصلاح مطلوبة');
  return errs;
}

/**
 * تحقّق مراجعة المشرف
 */
export function validateSupervisorReview({ action, technicianName, notes }){
  const errs = [];
  if (!action) errs.push('نوع الإجراء مطلوب');
  if (action === 'assign' && (!technicianName || technicianName.trim().length < 2)){
    errs.push('عند التعيين يجب إدخال اسم الفني');
  }
  if (!notes || notes.trim().length < 2) errs.push('ملاحظات المشرف مطلوبة');
  return errs;
}

/**
 * تحقّق تقييم العميل
 */
export function validateClientFeedback({ rating }){
  const errs = [];
  const n = Number(rating);
  if (!(n >= 1 && n <= 5)) errs.push('الرجاء اختيار تقييم من 1 إلى 5');
  return errs;
}
