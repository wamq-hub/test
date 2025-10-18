// ملف: js/components/tables.js
// مسؤول عن عرض الجداول وربط أزرار الإجراءات

import { getStatusClass }   from '../utils/helpers.js';   // عدّل المسار إن لزم
import { canShowRating }    from './components/forms.js';            // عدّل المسار إن لزم
import { showRequestTimeline } from './components/modals.js';       // عدّل المسار إن لزم

/**
 * عرض جدول بسيط مع عمود إجراءات (المسار + التقييم)
 * @param {string} tbodyId - معرّف tbody
 * @param {Array<object>} items - صفوف الجدول (كائنات)
 * @param {Array<{key:string,label?:string}>} cols - الأعمدة
 */
export function renderSimpleTable(tbodyId, items = [], cols = []) {
  const tb = document.getElementById(tbodyId);
  if (!tb) return;

  if (!Array.isArray(items) || items.length === 0) {
    tb.innerHTML = `<tr><td colspan="${cols.length + 1}" style="text-align:center;color:#6B7280;padding:18px">لا توجد بيانات</td></tr>`;
    return;
  }

  // نرسم الصفوف + نحفظ الـ index لربط الكائن لاحقًا
  tb.innerHTML = items.map((row, idx) => {
    const tds = cols.map(c => {
      const v = row[c.key] ?? '';
      if (c.key === 'status' || c.key === 'الحالة') {
        return `<td><span class="status-badge ${getStatusClass(String(v))}">${escapeHtml(String(v||''))}</span></td>`;
      }
      return `<td>${escapeHtml(String(v))}</td>`;
    }).join('');

    // عمود الإجراءات: زر "المسار" دائم + زر "التقييم" مشروط
    const actHtml = `
      <div class="actions">
        <button class="btn btn-sm btn-outline btn-timeline" data-id="${row.id||row.ID||row.Id||''}">المسار</button>
        ${canShowRating(row) ? `<button class="btn btn-sm btn-primary btn-rate" data-id="${row.id||row.ID||row.Id||''}">⭐ التقييم</button>` : ``}
      </div>
    `;

    return `<tr data-id="${row.id||row.ID||row.Id||''}" data-idx="${idx}">
      ${tds}
      <td class="action-buttons">${actHtml}</td>
    </tr>`;
  }).join('');

  // اربط كائن الصف بكل <tr> لسهولة الوصول له لاحقًا
  tb.querySelectorAll('tr[data-idx]').forEach(tr => {
    const i = Number(tr.getAttribute('data-idx'));
    tr._rowData = items[i]; // مرجع مباشر للكائن
  });
}

/**
 * تفويض الأحداث لجدول "طلباتي" أو أي جدول مشابه
 * - يفتح مودال مسار الطلب عند الضغط على زر "المسار"
 * - يستدعي معالج التقييم أو يطلق حدثًا عامًا إذا لم يُمرَّر معالج
 *
 * @param {string} containerSelector - محدّد عنصر الحاوية (tbody أو الجدول)
 * @param {{ onRate?: (row:object)=>void }} options
 */
export function wireMyRequestsTable(containerSelector = '#myRequestsTable', { onRate } = {}) {
  const box = document.querySelector(containerSelector);
  if (!box) return;

  box.addEventListener('click', (e) => {
    const tlBtn = e.target.closest('.btn-timeline');
    if (tlBtn) {
      const tr = e.target.closest('tr');
      const row = tr?._rowData || null;
      if (row) showRequestTimeline(row);
      return;
    }

    const rateBtn = e.target.closest('.btn-rate');
    if (rateBtn) {
      const tr = e.target.closest('tr');
      const row = tr?._rowData || null;
      if (!row) return;

      if (typeof onRate === 'function') {
        onRate(row); // استدعِ معالج خارجي إن وُجد
      } else {
        // حدث عام ليستمع له مودال التقييم (fallback)
        document.dispatchEvent(new CustomEvent('request:rate', { detail: row }));
      }
    }
  });
}

/**
 * ربط مستمعي الضغط على أزرار الإجراءات (لجداول قديمة تعتمد أزرار تقرير الفني/المشرف/التقييم)
 * يُستخدم عند الحاجة للحفاظ على التوافق الخلفي.
 * @param {{onOpenTech?:Function,onOpenSupervisor?:Function,onOpenFeedback?:Function}} handlers
 */
export function wireTableActions({ onOpenTech, onOpenSupervisor, onOpenFeedback } = {}) {
  document.querySelectorAll('.btn-open-tech').forEach(b => {
    b.addEventListener('click', () => onOpenTech?.(b.dataset.id));
  });
  document.querySelectorAll('.btn-open-sup').forEach(b => {
    b.addEventListener('click', () => onOpenSupervisor?.(b.dataset.id));
  });
  document.querySelectorAll('.btn-open-feedback').forEach(b => {
    b.addEventListener('click', () => onOpenFeedback?.(b.dataset.id));
  });
}

/**
 * إخفاء/إظهار الأزرار في صفوف محددة حسب شرط معيّن
 * مثال الاستخدام: hideActionsWhere(id => !isSupervisor)
 */
export function hideActionsWhere(predicateFn) {
  document.querySelectorAll('tr[data-id]').forEach(tr => {
    const id = tr.getAttribute('data-id');
    if (predicateFn?.(id)) {
      tr.querySelectorAll('.action-buttons .btn, .action-buttons .btn-primary, .action-buttons .btn-secondary')
        .forEach(btn => btn.style.display = 'none');
    }
  });
}

/** حماية نص HTML بسيط */
function escapeHtml(s) {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
