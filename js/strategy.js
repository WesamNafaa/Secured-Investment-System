// خوارزمية اختيار الاستراتيجيات - نظام الاستثمار المُحصّن
function getAllowedMax(cat, risk) {
  var others = cat === 'safe' ? risk.average + risk.high :
               cat === 'average' ? risk.safe + risk.high :
               risk.safe + risk.average;
  return Math.max(0, 100 - others);
}
function norm(val, min, max) { var v=(val-min)/(max-min); if(v<0) return 0; if(v>1) return 1; return v; }
function clamp01(v){ return v<0?0:v>1?1:v; }
function scoreStrategy(s, cat) {
  // عوامل أساسية
  var pfNorm = norm(s.profitFactor||0, 1, 2.5);
  var recNorm = norm(s.recoveryFactor||0, 0, 4);
  var ddNorm = 1 - norm(s.maxDD||0, 0, 300000);
  var arNorm = norm(s.annualReturnRate||0, 0, 50);
  // عوامل جديدة — الأقل أفضل يُعكس
  var sharpNorm = norm(s.sharpRatio||0, 0, 2.5);
  var lrCorrNorm = norm(s.lrCorr||0, 95, 100);
  var lrSENorm = 1 - norm(s.lrSE||0, 0, 500);
  var netNorm = 1 - norm(s.maxNetworks||0, 0, 10);
  var lotNorm = 1 - norm(s.maxLot||0, 0, 8);
  var timesNorm = 1 - norm(s.timesAppeared||0, 0, 20);

  if (cat === 'safe'){
    // Safe: الثبات أولاً — sharp + dd + rec أهم
    return 0.18*ddNorm + 0.12*recNorm + 0.12*pfNorm + 0.08*arNorm
         + 0.15*sharpNorm + 0.10*lrCorrNorm + 0.08*lrSENorm
         + 0.07*netNorm + 0.06*lotNorm + 0.04*timesNorm;
  }
  if (cat === 'average'){
    return 0.08*ddNorm + 0.08*recNorm + 0.12*pfNorm + 0.17*arNorm
         + 0.15*sharpNorm + 0.08*lrCorrNorm + 0.05*lrSENorm
         + 0.10*netNorm + 0.10*lotNorm + 0.07*timesNorm;
  }
  // high
  return 0.08*ddNorm + 0.08*recNorm + 0.12*pfNorm + 0.17*arNorm
       + 0.15*sharpNorm + 0.08*lrCorrNorm + 0.05*lrSENorm
       + 0.10*netNorm + 0.10*lotNorm + 0.07*timesNorm;
}
// تفاصيل السكور للمودال
function getScoreBreakdown(s, cat){
  var pfNorm = norm(s.profitFactor||0, 1, 2.5);
  var recNorm = norm(s.recoveryFactor||0, 0, 4);
  var ddNorm = 1 - norm(s.maxDD||0, 0, 300000);
  var arNorm = norm(s.annualReturnRate||0, 0, 50);
  var sharpNorm = norm(s.sharpRatio||0, 0, 2.5);
  var lrCorrNorm = norm(s.lrCorr||0, 95, 100);
  var lrSENorm = 1 - norm(s.lrSE||0, 0, 500);
  var netNorm = 1 - norm(s.maxNetworks||0, 0, 10);
  var lotNorm = 1 - norm(s.maxLot||0, 0, 8);
  var timesNorm = 1 - norm(s.timesAppeared||0, 0, 20);
  var w;
  if(cat==='safe') w={dd:0.18,rec:0.12,pf:0.12,ar:0.08,sharp:0.15,lrCorr:0.10,lrSE:0.08,net:0.07,lot:0.06,times:0.04};
  else w={dd:0.08,rec:0.08,pf:0.12,ar:0.17,sharp:0.15,lrCorr:0.08,lrSE:0.05,net:0.10,lot:0.10,times:0.07};
  return {
    pf:{raw:s.profitFactor,norm:pfNorm,w:w.pf,score:pfNorm*w.pf},
    rec:{raw:s.recoveryFactor,norm:recNorm,w:w.rec,score:recNorm*w.rec},
    dd:{raw:s.maxDD,norm:ddNorm,w:w.dd,score:ddNorm*w.dd},
    ar:{raw:s.annualReturnRate,norm:arNorm,w:w.ar,score:arNorm*w.ar},
    sharp:{raw:s.sharpRatio,norm:sharpNorm,w:w.sharp,score:sharpNorm*w.sharp},
    lrCorr:{raw:s.lrCorr,norm:lrCorrNorm,w:w.lrCorr,score:lrCorrNorm*w.lrCorr},
    lrSE:{raw:s.lrSE,norm:lrSENorm,w:w.lrSE,score:lrSENorm*w.lrSE},
    net:{raw:s.maxNetworks,norm:netNorm,w:w.net,score:netNorm*w.net},
    lot:{raw:s.maxLot,norm:lotNorm,w:w.lot,score:lotNorm*w.lot},
    times:{raw:s.timesAppeared,norm:timesNorm,w:w.times,score:timesNorm*w.times},
    total: scoreStrategy(s,cat)
  };
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
    var equalShareEst = amt / Math.max(1, Math.min(5, affordable.length));
    for (var i = 0; i < affordable.length && chosen.length < 5; i++) {
      var s = affordable[i];
      var symCnt = symbolCount[s.symbol] || 0;
      if (symCnt >= 2) continue;
      if (amt - used < s.depositMin) continue;
      var maxTerminals = Math.floor((amt - used) / s.depositMin);
      if (maxTerminals < 1) continue;
      var terminals, alloc;
      if (mode === 'estimate') {
        var want = Math.max(1, Math.floor(equalShareEst / s.depositMin));
        terminals = Math.min(maxTerminals, want);
        // لو want أقل من 1 بسبب equalShare صغير، استخدم terminal واحد
        if (terminals < 1) terminals = 1;
        alloc = terminals * s.depositMin;
      } else {
        // تنفيذي: 1 تيرمينال لكل استراتيجية، إلا إذا كانت استراتيجية وحيدة قابلة للتمويل
        if (affordable.length === 1) {
          terminals = maxTerminals;
        } else {
          terminals = 1;
        }
        alloc = terminals * s.depositMin;
      }
      // لا تتجاوز الباقي
      if (alloc > (amt - used)) {
        terminals = Math.floor((amt - used) / s.depositMin);
        alloc = terminals * s.depositMin;
      }
      if (terminals < 1 || alloc < s.depositMin) continue;
      chosen.push({ strategy: s, allocated: alloc, terminals: terminals, riskCategory: bk.cat });
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
