// ملف: js/services/sync-service.js
// طابور مزامنة بسيط مع إعادة محاولة (Retry) وتخزين محلي

import * as sheets from './sheets-service.js';

const QKEY = 'syncQueue.v1';

function loadQ() {
  try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); }
  catch { return []; }
}
function saveQ(q) {
  try { localStorage.setItem(QKEY, JSON.stringify(q || [])); }
  catch {}
}

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 800; // تأخير تزايدي بسيط

function wait(ms){ return new Promise(res=> setTimeout(res, ms)); }

export const syncQueue = {
  q: loadQ(),
  processing: false,

  /** إضافة عملية إلى الطابور: { type:'add'|'update'|'delete', data, meta? } */
  add(op) {
    this.q.push({
      id: Date.now() + Math.random(),
      type: op.type,
      data: op.data,
      attempts: 0,
      lastError: null
    });
    saveQ(this.q);
    this.process(); // ابدأ فورًا
  },

  /** بدء المعالجة إن لم تكن قيد التشغيل */
  async process() {
    if (this.processing || this.q.length === 0) return;
    this.processing = true;

    let index = 0;
    while (index < this.q.length) {
      const item = this.q[index];

      try {
        await this._execute(item);
        // نجحت → احذف من الطابور
        this.q.splice(index, 1);
        saveQ(this.q);
      } catch (err) {
        item.attempts += 1;
        item.lastError = String(err?.message || err || 'Unknown error');

        if (item.attempts >= MAX_ATTEMPTS) {
          // تخطينا الحد → إزالة مع تسجيل آخر خطأ
          console.warn('Sync dropped:', item);
          this.q.splice(index, 1);
          saveQ(this.q);
        } else {
          // انتظر قليلاً (تزايدي) ثم أعد المحاولة في دورة لاحقة
          saveQ(this.q);
          const delay = BASE_DELAY_MS * item.attempts;
          await wait(delay);
          // لا نزيد index هنا حتى نعيد المحاولة على نفس العنصر
          continue;
        }
      }
    }

    this.processing = false;
  },

  async _execute(item) {
    if (item.type === 'add') {
      await sheets.addRequest(item.data);
    } else if (item.type === 'update') {
      await sheets.updateRequest(item.data);
    } else if (item.type === 'delete') {
      const id = item.data?.id;
      if (!id) throw new Error('لا يوجد id لعملية الحذف');
      await sheets.softDeleteRequest(id);
    } else {
      throw new Error(`نوع عملية غير مدعوم: ${item.type}`);
    }
  }
};

// إعادة محاولة تلقائية عند عودة الاتصال
window.addEventListener('online', () => syncQueue.process());

// محاولة عند فتح/تنشيط التبويب
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncQueue.process();
});

// حفظ آمن قبل الإغلاق (لا نمنع الإغلاق؛ فقط نحفظ الطابور)
window.addEventListener('beforeunload', () => saveQ(syncQueue.q));
