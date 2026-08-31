// تطبيق نظام الاستثمار المُحصّن
(function(){
  var state = { capital: 100000, risk: { safe: 50, average: 30, high: 20 }, mode: 'estimate', lastResult: null };
  function $(id) { return document.getElementById(id); }
  function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function fmtPct(n) { return n.toFixed(2) + '%'; }
  function parseNum(s) { return parseInt(s.replace(/[^0-9]/g, ''), 10) || 0; }
  function updateQuickAmounts() {
    var chips = document.querySelectorAll('#quick-amounts .chip');
    for (var i = 0; i < chips.length; i++) {
      var amt = parseInt(chips[i].dataset.amount, 10);
      chips[i].classList.toggle('active', amt === state.capital);
    }
  }
  function updateRiskUI() {
    var total = state.risk.safe + state.risk.average + state.risk.high;
    $('risk-safe-slider').value = state.risk.safe;
    $('risk-average-slider').value = state.risk.average;
    $('risk-high-slider').value = state.risk.high;
    $('risk-safe-value').textContent = state.risk.safe + '%';
    $('risk-average-value').textContent = state.risk.average + '%';
    $('risk-high-value').textContent = state.risk.high + '%';
    $('risk-total').textContent = total + '%';
    var rem = 100 - total;
    $('risk-remaining').textContent = rem === 0 ? '' : 'المتبقي: ' + rem + '%';
    $('risk-total').className = 'risk-total-num ' + (total === 100 ? 'ok' : rem > 0 ? 'warn' : 'err');
    var bar = $('risk-progress-bar');
    bar.style.width = Math.min(total, 100) + '%';
    bar.style.background = total === 100 ? 'var(--success)' : total < 100 ? 'var(--warning)' : 'var(--danger)';
    updateChipStates();
    validateAll();
  }
  function updateChipStates() {
    var maxA = getAllowedMax('average', state.risk);
    var maxH = getAllowedMax('high', state.risk);
    var chipsA = document.querySelectorAll('#risk-average-chips .chip');
    for (var i = 0; i < chipsA.length; i++) {
      var v = parseInt(chipsA[i].dataset.value, 10);
      chipsA[i].classList.toggle('disabled', v > maxA);
      chipsA[i].classList.toggle('active', v === state.risk.average);
    }
    var chipsH = document.querySelectorAll('#risk-high-chips .chip');
    for (var i = 0; i < chipsH.length; i++) {
      var v = parseInt(chipsH[i].dataset.value, 10);
      chipsH[i].classList.toggle('disabled', v > maxH);
      chipsH[i].classList.toggle('active', v === state.risk.high);
    }
    $('risk-average-slider').max = maxA;
    $('risk-high-slider').max = maxH;
    if (state.risk.average > maxA) { state.risk.average = maxA; $('risk-average-slider').value = maxA; }
    if (state.risk.high > maxH) { state.risk.high = maxH; $('risk-high-slider').value = maxH; }
  }
  function validateAll() {
    var total = state.risk.safe + state.risk.average + state.risk.high;
    var capOk = state.capital >= MIN_CAPITAL;
    var riskOk = total === 100;
    var err = '';
    if (!capOk) err = 'رأس المال يجب أن يكون ' + MIN_CAPITAL.toLocaleString() + ' دولار على الأقل.';
    else if (!riskOk) err = 'مجموع نسب المخاطرة يجب أن يساوي 100%. المتبقي: ' + (100 - total) + '%.';
    $('capital-error').textContent = err;
    $('risk-error').textContent = '';
    $('btn-calculate').disabled = !(capOk && riskOk);
  }
  function renderResults(result) {
    $('results-section').style.display = 'block';
    $('table-section').style.display = 'block';
    $('btn-reset').style.display = 'inline-block';
    $('res-weekly').textContent = fmt(result.portfolio.weeklyNet);
    $('res-weekly-pct').textContent = fmtPct(result.portfolio.weeklyPct);
    $('res-weekly-fee').textContent = 'العمولة المقتطعة: -' + fmt(result.portfolio.weeklyGross - result.portfolio.weeklyNet);
    $('res-monthly').textContent = fmt(result.portfolio.monthlyNet);
    $('res-monthly-pct').textContent = fmtPct(result.portfolio.monthlyPct);
    $('res-monthly-fee').textContent = 'العمولة المقتطعة: -' + fmt(result.portfolio.monthlyGross - result.portfolio.monthlyNet);
    $('res-yearly').textContent = fmt(result.portfolio.yearlyNet);
    $('res-yearly-pct').textContent = fmtPct(result.portfolio.yearlyPct);
    $('res-yearly-fee').textContent = 'العمولة المقتطعة: -' + fmt(result.portfolio.yearlyGross - result.portfolio.yearlyNet);
    $('res-drawdown').textContent = '-' + fmt(result.portfolio.maxDrawdown);
    $('res-drawdown-pct').textContent = '-' + fmtPct(result.portfolio.maxDrawdownPct);
    var freqText = '';
    if (state.risk.safe > 0) freqText += '🛡️ مرة كل 18 عاماً';
    if (state.risk.average > 0) freqText += (freqText ? ' · ' : '') + '📈 مرة كل 5 سنوات';
    if (state.risk.high > 0) freqText += (freqText ? ' · ' : '') + '⚡ Hazard — أكثر من مرة خلال 18 عاماً';
    $('res-drawdown-freq').textContent = freqText;
    var fn = $('drawdown-freq-notes');
    if (fn) {
      var safeNote = fn.querySelector('.safe-note');
      var avgNote = fn.querySelector('.avg-note');
      var highNote = fn.querySelector('.high-note');
      if (safeNote) safeNote.style.display = state.risk.safe > 0 ? 'inline-block' : 'none';
      if (avgNote) avgNote.style.display = state.risk.average > 0 ? 'inline-block' : 'none';
      if (highNote) highNote.style.display = state.risk.high > 0 ? 'inline-block' : 'none';
    }
    $('res-total-strategies').textContent = result.portfolio.count;
    $('res-used-capital').textContent = fmt(result.portfolio.totalUsed);
    $('res-unallocated').textContent = fmt(result.portfolio.unallocated);
    $('res-yearly-gross').textContent = fmt(result.portfolio.yearlyGross);
    var wc = $('warnings-container');
    wc.innerHTML = '';
    for (var i = 0; i < result.warnings.length; i++) {
      wc.innerHTML += '<div class="warning-box"><span class="warn-icon">⚠️</span><p>' + result.warnings[i] + '</p></div>';
    }
    drawPieChart('pie-chart', [
      { label: 'آمن', value: state.risk.safe, color: '#0E9F6E' },
      { label: 'متوسط', value: state.risk.average, color: '#D97706' },
      { label: 'عالٍ', value: state.risk.high, color: '#DC2626' }
    ]);
    drawBarChart('bar-chart',
      [result.portfolio.weeklyGross, result.portfolio.monthlyGross, result.portfolio.yearlyGross],
      [result.portfolio.weeklyNet, result.portfolio.monthlyNet, result.portfolio.yearlyNet],
      ['أسبوعي', 'شهري', 'سنوي']
    );
    renderTable(result.allocations, result.portfolio.unallocated);
    renderMobileCards(result.allocations, result.portfolio.unallocated);
    $('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderTable(allocs, unalloc) {
    var html = '';
    for (var i = 0; i < allocs.length; i++) {
      var a = allocs[i], r = a.result;
      var catLabel = a.riskCategory === 'safe' ? 'آمن' : a.riskCategory === 'average' ? 'متوسط' : 'عالٍ';
      html += '<tr>';
      html += '<td class="number" style="font-weight:700">' + a.strategy.symbol + '</td>';
      html += '<td>' + a.strategy.strategy + '</td>';
      html += '<td><span class="risk-badge ' + a.riskCategory + '">' + catLabel + '</span></td>';
      html += '<td class="number">' + a.strategy.lotSize.toFixed(2) + '</td>';
      html += '<td class="number">' + fmt(a.strategy.depositMin) + '</td>';
      html += '<td class="number" style="font-weight:700">' + fmt(a.allocated) + '</td>';
      html += '<td class="number success">' + fmt(r.weeklyNet) + '</td>';
      html += '<td class="number success">' + fmt(r.monthlyNet) + '</td>';
      html += '<td class="number success">' + fmt(r.yearlyNet) + '</td>';
      html += '<td class="number success">' + a.strategy.annualReturnRate.toFixed(2) + '%</td>';
      html += '<td class="number danger">' + fmt(r.maxDrawdown) + '</td>';
      html += '<td class="number">' + a.strategy.profitFactor.toFixed(2) + '</td>';
      html += '<td class="number">' + a.strategy.winRate.toFixed(1) + '%</td>';
      html += '<td class="number muted">' + Math.round(a.strategy.feePct * 100) + '%<br><span class="fee-amount">-' + fmt(r.weeklyGross - r.weeklyNet) + '/w</span></td>';
      html += '<td class="muted">' + a.strategy.dateRange + '</td>';
      html += '</tr>';
    }
    if (unalloc > 0) {
      html += '<tr style="background:rgba(255,193,7,0.08);border-top:2px dashed var(--warning)">';
      html += '<td colspan="5" style="color:var(--warning);font-weight:700;text-align:center">💰 مبلغ فائض — غير مستخدم</td>';
      html += '<td class="number" style="font-weight:700;color:var(--warning)">' + fmt(unalloc) + '</td>';
      html += '<td colspan="9" style="color:var(--warning);font-size:0.85em">يُضاف لرأس المال عند تنفيذ الصفقات الحقيقية</td>';
      html += '</tr>';
    }
    $('strategy-tbody').innerHTML = html;
  }
  function renderMobileCards(allocs, unalloc) {
    var html = '';
    for (var i = 0; i < allocs.length; i++) {
      var a = allocs[i], r = a.result;
      var catLabel = a.riskCategory === 'safe' ? 'آمن' : a.riskCategory === 'average' ? 'متوسط' : 'عالٍ';
      html += '<div class="mobile-card">';
      html += '<div class="mobile-card-header"><span class="sym">' + a.strategy.symbol + ' ' + a.strategy.strategy + '</span><span class="risk-badge ' + a.riskCategory + '">' + catLabel + '</span></div>';
      html += '<div class="mobile-card-grid">';
      html += '<div><p class="item-label">المخصص</p><p class="item-value number">' + fmt(a.allocated) + '</p></div>';
      html += '<div><p class="item-label">أسبوعي صافي</p><p class="item-value number success">' + fmt(r.weeklyNet) + '</p></div>';
      html += '<div><p class="item-label">العمولة المقتطعة</p><p class="item-value number muted">-' + fmt(r.weeklyGross - r.weeklyNet) + '</p></div>';
      html += '<div><p class="item-label">شهري صافي</p><p class="item-value number success">' + fmt(r.monthlyNet) + '</p></div>';
      html += '<div><p class="item-label">سنوي صافي</p><p class="item-value number success">' + fmt(r.yearlyNet) + '</p></div>';
      html += '<div><p class="item-label">نسبة العائد</p><p class="item-value number success">' + a.strategy.annualReturnRate.toFixed(2) + '%</p></div>';
      html += '<div><p class="item-label">أقصى تراجع</p><p class="item-value number danger">' + fmt(r.maxDrawdown) + '</p></div>';
      html += '<div><p class="item-label">PF / Win%</p><p class="item-value number">' + a.strategy.profitFactor.toFixed(2) + ' / ' + a.strategy.winRate.toFixed(1) + '%</p></div>';
      html += '</div></div>';
    }
    if (unalloc > 0) {
      html += '<div class="mobile-card" style="border:2px dashed var(--warning);background:rgba(255,193,7,0.05)">';
      html += '<div class="mobile-card-header"><span class="sym" style="color:var(--warning)">💰 مبلغ فائض — غير مستخدم</span></div>';
      html += '<div class="mobile-card-grid">';
      html += '<div><p class="item-label">المبلغ الفائض</p><p class="item-value number" style="color:var(--warning)">' + fmt(unalloc) + '</p></div>';
      html += '<div><p class="item-label">ملاحظة</p><p class="item-value" style="color:var(--warning);font-size:0.85em">يُضاف لرأس المال عند التنفيذ الفعلي</p></div>';
      html += '</div></div>';
    }
    $('mobile-strategy-cards').innerHTML = html;
  }
  function buildRiskChips(containerId, cat) {
    var c = $(containerId);
    c.innerHTML = '';
    for (var v = 0; v <= 100; v += 5) {
      var btn = document.createElement('button');
      btn.className = 'chip';
      btn.dataset.value = v;
      btn.textContent = v + '%';
      btn.addEventListener('click', (function(cat, val) {
        return function() {
          var max = getAllowedMax(cat, state.risk);
          if (val > max) return;
          state.risk[cat] = val;
          updateRiskUI();
        };
      })(cat, v));
      c.appendChild(btn);
    }
  }
  function init() {
    buildRiskChips('risk-safe-chips', 'safe');
    buildRiskChips('risk-average-chips', 'average');
    buildRiskChips('risk-high-chips', 'high');
    updateRiskUI();
    updateQuickAmounts();
    $('capital-input').addEventListener('input', function() {
      var raw = this.value.replace(/[^0-9]/g, '');
      state.capital = parseInt(raw, 10) || 0;
      if (raw) this.value = parseInt(raw, 10).toLocaleString('en-US');
      updateQuickAmounts();
      validateAll();
    });
    var qchips = document.querySelectorAll('#quick-amounts .chip');
    for (var i = 0; i < qchips.length; i++) {
      qchips[i].addEventListener('click', function() {
        state.capital = parseInt(this.dataset.amount, 10);
        $('capital-input').value = state.capital.toLocaleString('en-US');
        updateQuickAmounts();
        validateAll();
      });
    }
    var sliders = ['safe', 'average', 'high'];
    for (var i = 0; i < sliders.length; i++) {
      (function(cat) {
        $('risk-' + cat + '-slider').addEventListener('input', function() {
          state.risk[cat] = parseInt(this.value, 10);
          updateRiskUI();
        });
      })(sliders[i]);
    }
    var modeBtns = document.querySelectorAll('.mode-btn');
    for (var i = 0; i < modeBtns.length; i++) {
      modeBtns[i].addEventListener('click', function() {
        state.mode = this.dataset.mode;
        for (var j = 0; j < modeBtns.length; j++) modeBtns[j].classList.remove('active');
        this.classList.add('active');
        $('estimate-note').textContent = state.mode === 'estimate' ?
          'النتائج تقديرية لأغراض العرض. التنفيذ الفعلي يعتمد على الحد الأدنى لكل استراتيجية.' :
          'العرض التنفيذي: يراعي الحد الأدنى لكل استراتيجية وقد يترك مبالغ غير مستخدمة.';
      });
    }
    var presets = document.querySelectorAll('.preset');
    for (var i = 0; i < presets.length; i++) {
      presets[i].addEventListener('click', function() {
        var parts = this.dataset.preset.split(',').map(Number);
        state.risk.safe = parts[0]; state.risk.average = parts[1]; state.risk.high = parts[2];
        updateRiskUI();
      });
    }
    $('btn-calculate').addEventListener('click', function() {
      var res = selectStrategies(state.capital, state.risk, state.mode);
      var portfolio = calcPortfolio(res.allocations, state.capital);
      state.lastResult = { portfolio: portfolio, allocations: res.allocations, warnings: res.warnings };
      renderResults(state.lastResult);
    });
    $('btn-reset').addEventListener('click', function() {
      state = { capital: 100000, risk: { safe: 50, average: 30, high: 20 }, mode: 'estimate' };
      $('capital-input').value = '100,000';
      $('results-section').style.display = 'none';
      $('table-section').style.display = 'none';
      $('btn-reset').style.display = 'none';
      updateRiskUI();
      updateQuickAmounts();
      var modeBtns = document.querySelectorAll('.mode-btn');
      for (var j = 0; j < modeBtns.length; j++) modeBtns[j].classList.remove('active');
      modeBtns[0].classList.add('active');
    });
    var faqItems = document.querySelectorAll('.faq-item');
    for (var i = 0; i < faqItems.length; i++) {
      faqItems[i].querySelector('.faq-question').addEventListener('click', function() {
        var item = this.parentElement;
        var wasOpen = item.classList.contains('open');
        var allItems = document.querySelectorAll('.faq-item');
        for (var j = 0; j < allItems.length; j++) allItems[j].classList.remove('open');
        if (!wasOpen) item.classList.add('open');
      });
    }
    // PDF Download buttons
    var pdfBtns = document.querySelectorAll('[data-action="download-pdf"]');
    for (var i = 0; i < pdfBtns.length; i++) {
      pdfBtns[i].addEventListener('click', function() {
        if (!state.lastResult) {
          alert('يرجى حساب النتائج أولاً ثم تحميل التقرير.');
          $('calculator-section').scrollIntoView({ behavior: 'smooth' });
          return;
        }
        generatePDFReport(state, state.lastResult.allocations, state.lastResult.portfolio);
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
