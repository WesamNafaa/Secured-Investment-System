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
      var t = a.terminals || 1;
      html += '<tr>';
      html += '<td class="number" style="font-weight:700">' + a.strategy.symbol + ' <button class="info-btn" data-info="' + i + '" title="تفاصيل التقييم" aria-label="تفاصيل">ⓘ</button></td>';
      html += '<td>' + a.strategy.strategy + '</td>';
      html += '<td><span class="risk-badge ' + a.riskCategory + '">' + catLabel + '</span></td>';
      html += '<td class="number">' + a.strategy.lotSize.toFixed(2) + '</td>';
      html += '<td class="number">' + fmt(a.strategy.depositMin) + '</td>';
      html += '<td class="number" style="font-weight:700">' + fmt(a.allocated) + '</td>';
      html += '<td class="number" style="font-weight:800;color:var(--gold)">' + (t>1 ? '×'+t : '×1') + '</td>';
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
      html += '<td colspan="6" style="color:var(--warning);font-weight:700;text-align:center">💰 مبلغ فائض — غير مستخدم</td>';
      html += '<td class="number" style="font-weight:700;color:var(--warning)">—</td>';
      html += '<td class="number" style="font-weight:700;color:var(--warning)">' + fmt(unalloc) + '</td>';
      html += '<td colspan="9" style="color:var(--warning);font-size:0.85em">يُضاف للاحتياطي ويُستخدم عند الأزمات</td>';
      html += '</tr>';
    }
    $('strategy-tbody').innerHTML = html;
    // bind info buttons
    var btns = document.querySelectorAll('.info-btn[data-info]');
    for(var k=0;k<btns.length;k++){
      btns[k].addEventListener('click', (function(idx){
        return function(e){ e.preventDefault(); openScoringModal(allocs[idx]); };
      })(parseInt(btns[k].getAttribute('data-info'),10)));
    }
  }
  function renderMobileCards(allocs, unalloc) {
    var html = '';
    for (var i = 0; i < allocs.length; i++) {
      var a = allocs[i], r = a.result;
      var catLabel = a.riskCategory === 'safe' ? 'آمن' : a.riskCategory === 'average' ? 'متوسط' : 'عالٍ';
      var t = a.terminals || 1;
      html += '<div class="mobile-card">';
      html += '<div class="mobile-card-header"><span class="sym">' + a.strategy.symbol + ' ' + a.strategy.strategy + ' <button class="info-btn" data-minfo="' + i + '" aria-label="تفاصيل">ⓘ</button></span><span class="risk-badge ' + a.riskCategory + '">' + catLabel + '</span></div>';
      html += '<div class="mobile-card-grid">';
      html += '<div><p class="item-label">المخصص</p><p class="item-value number">' + fmt(a.allocated) + '</p></div>';
      html += '<div><p class="item-label">التيرمينال</p><p class="item-value number" style="color:var(--gold)">×' + t + ' <span style="font-size:11px;color:var(--muted)">Lot ' + a.strategy.lotSize.toFixed(2) + ' ثابت</span></p></div>';
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
      html += '<div><p class="item-label">ملاحظة</p><p class="item-value" style="color:var(--warning);font-size:0.85em">احتياطي للأزمات — يُسحب بعد التعافي</p></div>';
      html += '</div></div>';
    }
    $('mobile-strategy-cards').innerHTML = html;
    var mbtns = document.querySelectorAll('.info-btn[data-minfo]');
    for(var k=0;k<mbtns.length;k++){
      mbtns[k].addEventListener('click', (function(idx){
        return function(e){ e.preventDefault(); openScoringModal(allocs[idx]); };
      })(parseInt(mbtns[k].getAttribute('data-minfo'),10)));
    }
  }
  function openScoringModal(alloc){
    if(!alloc) return;
    var s=alloc.strategy, cat=alloc.riskCategory;
    var bd = typeof getScoreBreakdown==='function' ? getScoreBreakdown(s, cat) : null;
    var titleEl=$('modal-scoring-subtitle');
    if(titleEl) titleEl.textContent = s.symbol+' '+s.strategy+' — الفئة '+(cat==='safe'?'الآمنة':cat==='average'?'المتوسطة':'العالية')+' — السكور '+(bd? bd.total.toFixed(4): scoreStrategy(s,cat).toFixed(4));
    var body=$('modal-scoring-body');
    if(!body) return;
    var isSafe = cat==='safe';
    var netThresh = isSafe?7:5;
    var netWarn = s.maxNetworks > netThresh;
    var lotWarn = s.maxLot>1.0;
    var html='';
    html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">';
    html+='<span class="risk-badge '+cat+'">'+(cat==='safe'?'آمن':cat==='average'?'متوسط':'عالٍ')+'</span>';
    html+='<span style="background:var(--gold-soft);border:1px solid var(--line);padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800">التيرمينال ×'+(alloc.terminals||1)+' — Lot '+s.lotSize.toFixed(2)+' ثابت</span>';
    html+='<span style="background:var(--bg-soft);border:1px solid var(--line-2);padding:4px 10px;border-radius:999px;font-size:12px">الاحتياطي الرياضي: '+(s.mathematicalDeposit? '$'+s.mathematicalDeposit.toLocaleString():'—')+'</span>';
    html+='</div>';
    if(bd){
      html+='<div style="overflow:auto;border:1px solid var(--line-2);border-radius:12px">';
      html+='<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:520px">';
      html+='<thead><tr style="background:var(--bg-soft)"><th style="padding:8px;text-align:right">العامل</th><th style="padding:8px">القيمة الخام</th><th style="padding:8px">النورم</th><th style="padding:8px">الوزن</th><th style="padding:8px">المساهمة</th></tr></thead><tbody>';
      var rows=[
        {label:'Profit Factor',v:bd.pf},{label:'Recovery Factor',v:bd.rec},{label:'MaxDD (أقل أفضل)',v:bd.dd},
        {label:'Annual Return Rate',v:bd.ar},{label:'Sharp (Net/StdDev)',v:bd.sharp},{label:'LR Correlation',v:bd.lrCorr},
        {label:'LR Std Error (أقل أفضل)',v:bd.lrSE},{label:'Max Networks (أقل أفضل)',v:bd.net},{label:'Max LOT (أقل أفضل)',v:bd.lot},{label:'Times Appeared (أقل أفضل)',v:bd.times}
      ];
      for(var i=0;i<rows.length;i++){
        var r=rows[i];
        html+='<tr style="border-top:1px solid var(--line-3)"><td style="padding:7px 8px;font-weight:700">'+r.label+'</td><td class="number" style="padding:7px 8px;text-align:center">'+ (typeof r.v.raw==='number'? (r.v.raw%1?r.v.raw.toFixed(2):r.v.raw) : r.v.raw) +'</td><td class="number" style="padding:7px 8px;text-align:center">'+r.v.norm.toFixed(3)+'</td><td class="number" style="padding:7px 8px;text-align:center">'+(r.v.w*100).toFixed(0)+'%</td><td class="number" style="padding:7px 8px;text-align:center;font-weight:800">'+r.v.score.toFixed(4)+'</td></tr>';
      }
      html+='<tr style="background:var(--gold-soft);font-weight:900"><td style="padding:8px" colspan="4">الإجمالي</td><td class="number" style="padding:8px;text-align:center">'+bd.total.toFixed(4)+'</td></tr>';
      html+='</tbody></table></div>';
    }
    html+='<div style="margin-top:12px;display:grid;gap:8px">';
    html+='<div style="background:var(--bg-soft);border:1px solid var(--line-2);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.7">';
    html+='<b>المعايير:</b> أقل Network/LOT/Times = أفضل دائماً. عتبة "جيد": '+(isSafe?'≤7 للآمن':'≤5 للمتوسط/العالي')+' للشبكات. ';
    if(netWarn) html+='<span style="color:var(--warning);font-weight:800">⚠️ الشبكات '+s.maxNetworks+' تتجاوز العتبة — مقبول لكن مع تنبيه.</span> ';
    if(lotWarn) html+='<span style="color:var(--warning);font-weight:800">⚠️ Max LOT '+s.maxLot.toFixed(2)+' مرتفع.</span>';
    html+='</div>';
    if(s.mathematicalDeposit){
      html+='<div style="background:linear-gradient(135deg, var(--gold-soft), transparent);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.7">';
      html+='<b>💰 Mathematical Deposit:</b> $'+s.mathematicalDeposit.toLocaleString()+' — مرجع احتياطي للأزمات (يُحتفظ به جانبياً ويُسحب بعد التعافي). لا يُستخدم في السكور مباشرة.';
      html+='</div>';
    }
    html+='<div style="font-size:11px;color:var(--muted);line-height:1.7">الصيغة المرجعية للـ Math Deposit: <code style="direction:ltr;display:block;background:var(--bg-soft);padding:8px;border-radius:8px;margin-top:6px;overflow:auto">=IF(OR(J5=0,W5=0),"Check Data",(J5*(W5/VALUE(LEFT(C5,4))))+(((2*U5)-VALUE(LEFT(C5,4)))*(W5/VALUE(LEFT(C5,4)))*1000*VLOOKUP(...)))</code></div>';
    html+='</div>';
    body.innerHTML=html;
    var ov=$('modal-scoring');
    if(ov){ ov.classList.add('open'); ov.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
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
    // حالة تحميل CSV
    var btnCalcInit=$('btn-calculate');
    if(btnCalcInit && window._csvLoadPromise){
      btnCalcInit.disabled=true;
      btnCalcInit.innerHTML='<span>⏳</span> جاري تحميل البيانات...';
      window._csvLoadPromise.then(function(){
        btnCalcInit.innerHTML='<span>📊</span> احسب العائد الآن';
        validateAll();
      }).catch(function(){
        btnCalcInit.innerHTML='<span>⚠️</span> فشل التحميل — حدّث الصفحة';
      });
    }
    buildRiskChips('risk-safe-chips', 'safe');
    buildRiskChips('risk-average-chips', 'average');
    buildRiskChips('risk-high-chips', 'high');
    updateRiskUI();
    updateQuickAmounts();
    // ربط إغلاق مودال السكور
    (function(){
      var ov=$('modal-scoring');
      if(!ov) return;
      ov.querySelectorAll('[data-close="scoring"]').forEach(function(el){
        el.addEventListener('click', function(e){ e.preventDefault(); ov.classList.remove('open'); ov.setAttribute('aria-hidden','true'); if(!document.querySelector('.modal-overlay.open')) document.body.style.overflow=''; });
      });
      var bg=ov.querySelector('.modal-backdrop');
      if(bg) bg.addEventListener('click', function(){ ov.classList.remove('open'); ov.setAttribute('aria-hidden','true'); document.body.style.overflow=''; });
    })();
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
