// خوارزمية اختيار الاستراتيجيات - نظام الاستثمار المُحصّن
function getAllowedMax(cat, risk) {
  var others = cat === 'safe' ? risk.average + risk.high :
               cat === 'average' ? risk.safe + risk.high :
               risk.safe + risk.average;
  return Math.max(0, 100 - others);
}
function norm(val, min, max) { return max === min ? 0 : (val - min) / (max - min); }
function scoreStrategy(s, cat) {
  var pfNorm = norm(s.profitFactor, 1, 2.5);
  var recNorm = norm(s.recoveryFactor, 0, 4);
  var ddNorm = 1 - norm(s.maxDD, 0, 300000);
  var arNorm = norm(s.annualReturnRate, 0, 50);
  if (cat === 'safe') return 0.35*ddNorm + 0.25*recNorm + 0.25*pfNorm + 0.15*arNorm;
  if (cat === 'average') return 0.25*ddNorm + 0.25*recNorm + 0.25*pfNorm + 0.25*arNorm;
  return 0.15*ddNorm + 0.20*recNorm + 0.25*pfNorm + 0.40*arNorm;
}
function selectStrategies(capital, risk, mode) {
  var buckets = [
    { cat: 'safe', pct: risk.safe, list: STRATEGIES.safe },
    { cat: 'average', pct: risk.average, list: STRATEGIES.average },
    { cat: 'high', pct: risk.high, list: STRATEGIES.high }
  ];
  var catNames = { safe: 'الآمنة', average: 'المتوسطة', high: 'العالية' };
  var allAlloc = [], warnings = [];
  for (var b = 0; b < buckets.length; b++) {
    var bk = buckets[b];
    if (bk.pct <= 0) continue;
    var amt = Math.round(capital * bk.pct / 100);
    var candidates = bk.list.filter(function(s) { return s.status === 'ok'; });
    if (candidates.length === 0) continue;
    candidates.sort(function(a, b) { return scoreStrategy(b, bk.cat) - scoreStrategy(a, bk.cat); });
    var affordable = candidates.filter(function(s) { return s.depositMin <= amt; });
    var chosen = [], used = 0, symbolCount = {};
    for (var i = 0; i < affordable.length && chosen.length < 5; i++) {
      var s = affordable[i];
      var symCnt = symbolCount[s.symbol] || 0;
      if (symCnt >= 2) continue;
      if (amt - used < s.depositMin) continue;
      var alloc;
      if (mode === 'estimate') {
        var equalShare = amt / Math.max(1, Math.min(5, affordable.length));
        alloc = Math.max(s.depositMin, equalShare);
      } else {
        alloc = s.depositMin;
      }
      alloc = Math.min(alloc, amt - used);
      if (alloc < s.depositMin) continue;
      alloc = Math.round(alloc);
      chosen.push({ strategy: s, allocated: alloc, riskCategory: bk.cat });
      used += alloc;
      symbolCount[s.symbol] = symCnt + 1;
    }
    if (chosen.length === 0 && bk.pct > 0) {
      var minAll = Infinity;
      for (var m = 0; m < candidates.length; m++) {
        if (candidates[m].depositMin < minAll) minAll = candidates[m].depositMin;
      }
      warnings.push('رأس المال المخصص للفئة ' + catNames[bk.cat] + ' ($' + amt.toLocaleString() + ') لا يكفي لأدنى إيداع أي استراتيجية. الحد الأدنى: $' + minAll.toLocaleString());
    } else if (chosen.length === 1 && bk.pct > 0) {
      var unallocCat = amt - used;
      if (unallocCat > 0) {
        warnings.push('فقط استراتيجية واحدة متاحة في الفئة ' + catNames[bk.cat] + ' (' + chosen[0].strategy.symbol + ' ' + chosen[0].strategy.strategy + ' — أدنى إيداع $' + chosen[0].strategy.depositMin.toLocaleString() + '). المبلغ الفائض: $' + unallocCat.toLocaleString());
      }
    }
    allAlloc = allAlloc.concat(chosen);
  }
  return { allocations: allAlloc, warnings: warnings };
}
