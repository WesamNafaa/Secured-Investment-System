// نظام الاستثمار المُحصّن — محمّل CSV كمصدر وحيد (vanilla, بدون third-party)
// يتطلب تشغيل عبر http server (لا يعمل من file://)
var STRATEGIES = { safe: [], average: [], high: [] };
var MIN_CAPITAL = 5000;
var _csvLoadPromise = null;

(function(){
  var CSV_URL = 'docs/نظام الاستثمار المُحصّن - إحصاء التشغيل العملياتي (2008-2026) - الأصول والتحليل والنتائج - قدرة الثبات والنمو.csv';

  function parseLine(line){
    var out=[], cur='', inQ=false;
    for(var i=0;i<line.length;i++){
      var c=line[i];
      if(c==='"'){
        if(inQ && line[i+1]==='"'){ cur+='"'; i++; }
        else inQ=!inQ;
      } else if(c===',' && !inQ){ out.push(cur); cur=''; }
      else cur+=c;
    }
    out.push(cur);
    for(var k=0;k<out.length;k++){
      var s=out[k].trim();
      if(s.length>=2 && s[0]==='"' && s[s.length-1]==='"') s=s.slice(1,-1);
      out[k]=s.trim();
    }
    return out;
  }
  function toNum(v){
    if(v==null||v==='') return 0;
    var s=String(v).replace(/[$%\s,]/g,'').replace(/٫/g,'.').trim();
    // handle Arabic comma
    var n=parseFloat(s);
    return isNaN(n)?0:n;
  }
  function toInt(v){ return Math.round(toNum(v)); }

  function showCsvError(msg){
    // سيُنشئ مودال خطأ حديث إذا لم يكن موجوداً
    var existing=document.getElementById('modal-csv-error');
    if(!existing){
      var html='<div class="modal-overlay" id="modal-csv-error" aria-hidden="true">'
        +'<div class="modal-backdrop" data-close="csv-error"></div>'
        +'<div class="modal-box" role="dialog" aria-modal="true" style="max-width:560px">'
        +'<button class="modal-close" data-close="csv-error" aria-label="إغلاق">×</button>'
        +'<div class="modal-header"><div class="modal-icon" style="background:var(--danger-soft);color:var(--danger)">⚠️</div><div><h3>تعذّر تحميل بيانات الاستراتيجيات</h3><p class="modal-subtitle" style="color:var(--muted)">CSV هو المصدر الوحيد — يتطلب سيرفر محلي</p></div></div>'
        +'<div class="modal-body"><p id="csv-error-msg" style="font-size:13px;line-height:1.8;color:var(--muted)"></p>'
        +'<div style="background:var(--bg-soft);border:1px solid var(--line-2);border-radius:10px;padding:12px;margin-top:12px;font-family:monospace;font-size:12px;direction:ltr;text-align:left">python -m http.server -d simofunds-webapp<br>npx serve simofunds-webapp</div></div>'
        +'<div class="modal-footer"><button class="btn-calc-gold" data-close="csv-error">فهمت</button></div></div></div>';
      document.body.insertAdjacentHTML('beforeend', html);
      // bind close
      var ov=document.getElementById('modal-csv-error');
      ov.querySelectorAll('[data-close="csv-error"]').forEach(function(el){
        el.addEventListener('click', function(e){ e.preventDefault(); ov.classList.remove('open'); ov.setAttribute('aria-hidden','true'); document.body.style.overflow=''; });
      });
      ov.querySelector('.modal-backdrop').addEventListener('click', function(){ ov.classList.remove('open'); document.body.style.overflow=''; });
    }
    var msgEl=document.getElementById('csv-error-msg');
    if(msgEl) msgEl.textContent=msg;
    var ov=document.getElementById('modal-csv-error');
    ov.classList.add('open'); ov.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }

  function buildId(cat, symbol, strat){
    var prefix=cat==='safe'?'safe':cat==='average'?'avg':'high';
    return prefix+'-'+symbol.toLowerCase()+'-'+String(strat).toLowerCase();
  }

  _csvLoadPromise = fetch(CSV_URL).then(function(r){
    if(!r.ok) throw new Error('HTTP '+r.status+' — '+r.statusText);
    return r.arrayBuffer();
  }).then(function(buf){
    // decode UTF-8 with BOM handling
    var text=new TextDecoder('utf-8').decode(buf);
    if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
    var lines=text.split(/\r?\n/);
    var buckets={ safe:[], average:[], high:[] };
    var currentBucket=null; // 'safe' | 'average' | 'high'
    var headerMap=null;

    for(var i=0;i<lines.length;i++){
      var raw=lines[i];
      if(!raw || !raw.trim()) continue;
      // skip decorative first line
      if(raw.indexOf('Symbols, Strategies')!==-1) continue;
      var cols=parseLine(raw);
      // detect header row
      if(cols[0]==='symbol' && cols[1]==='strategies'){
        // map header indices (robust if order changes)
        headerMap={};
        for(var h=0;h<cols.length;h++) headerMap[cols[h].trim()]=h;
        // decide bucket by Suggested usage text not yet known, use position: first header -> safe, second -> average, third -> high
        if(buckets.safe.length===0 && buckets.average.length===0 && buckets.high.length===0){
          currentBucket='safe';
        } else if(buckets.safe.length>0 && buckets.average.length===0){
          currentBucket='average';
        } else {
          currentBucket='high';
        }
        continue;
      }
      if(!currentBucket) continue;
      // row must have symbol
      var sym=(cols[0]||'').trim();
      if(!sym || sym==='symbol') continue;
      var stratVal=(cols[1]||'').trim();
      var status=(cols[6]||'').trim().toLowerCase();
      if(status && status!=='ok') continue;

      // indices fixed per spec (31 cols) but use headerMap if present
      var idx = function(name, fallback){ return headerMap && headerMap[name]!=null ? headerMap[name] : fallback; };

      var lotSize = toNum(cols[idx('Lot size',22)]);
      var mathDeposit = toInt(cols[idx('Mathematical Deposit',23)]);
      var depositMin = toInt(cols[idx('Deposite',24)]);
      // fallback if Deposite empty use Mathematical
      if(depositMin===0) depositMin=mathDeposit;

      var maxDD = toInt(cols[idx('One time Max DD',25)]);
      var revenue = toInt(cols[idx('Revenue $',26)]);
      var revWeek = toNum(cols[idx('Revenue per Week $',27)]);
      var revMonth = toNum(cols[idx('Revenue per Month $',28)]);
      var revYear = toNum(cols[idx('Revenue per Year $',29)]);
      var arrRaw = cols[idx('Annual Return Rate',30)]||'0';
      var annualReturnRate = toNum(arrRaw);

      var profitFactor = toNum(cols[idx('Profit factor',11)]);
      var recoveryFactor = toNum(cols[idx('Recovery factor',12)]);
      var winRate = toNum(cols[idx('Won %',13)]);
      var workingHours = toInt(cols[idx('Working hours',7)]);
      var trades = toInt(cols[idx('Trades',8)]);
      var maxDDbt = toInt(cols[idx('Max Draw Down $',9)]);
      var revBt = toInt(cols[idx('Revenue $',10)]);
      var dateRange = (cols[idx('Date range',5)]||'').trim();
      var sharpRatio = toNum(cols[idx('Net Profit � Standard Deviation of Volatility',16)]);
      // header may have corrupted char, fallback to index 16
      if(sharpRatio===0) sharpRatio=toNum(cols[16]);
      var lrCorr = toNum(cols[idx('Consistent Growth Across All Business Days',17)]);
      if(lrCorr===0) lrCorr=toNum(cols[17]);
      var lrSE = toNum(cols[idx('Volatility Around the Growth Line $',18)]);
      if(lrSE===0) lrSE=toNum(cols[18]);
      var maxNetworks = toInt(cols[idx('Max trading networks',19)]);
      if(maxNetworks===0) maxNetworks=toInt(cols[19]);
      var maxLot = toNum(cols[idx('Max used LOT',20)]);
      if(maxLot===0) maxLot=toNum(cols[20]);
      var timesAppeared = toInt(cols[idx('Number of times appeared',21)]);
      if(timesAppeared===0) timesAppeared=toInt(cols[21]);

      var symbolUpper = sym.toUpperCase();
      var stratNorm = stratVal||'1';
      var id = buildId(currentBucket, symbolUpper, stratNorm);

      var obj={
        id:id,
        symbol:symbolUpper,
        strategy:stratNorm,
        dateRange:dateRange,
        status:'ok',
        lotSize:lotSize,
        depositMin:depositMin,
        mathematicalDeposit:mathDeposit,
        maxDD:maxDD,
        revenue:revenue,
        revenuePerWeek:revWeek,
        revenuePerMonth:revMonth,
        revenuePerYear:revYear,
        profitFactor:profitFactor,
        recoveryFactor:recoveryFactor,
        winRate:winRate,
        backtestMaxDD:maxDDbt,
        backtestRevenue:revBt,
        workingHours:workingHours,
        trades:trades,
        annualReturnRate:annualReturnRate,
        feePct:0.20,
        // جديدة
        sharpRatio:sharpRatio,
        lrCorr:lrCorr,
        lrSE:lrSE,
        maxNetworks:maxNetworks,
        maxLot:maxLot,
        timesAppeared:timesAppeared
      };
      buckets[currentBucket].push(obj);
    }

    STRATEGIES.safe = buckets.safe;
    STRATEGIES.average = buckets.average;
    STRATEGIES.high = buckets.high;
    window.STRATEGIES = STRATEGIES;
    // dispatch event
    document.dispatchEvent(new CustomEvent('strategies-loaded', {detail: STRATEGIES}));
    return STRATEGIES;
  }).catch(function(err){
    console.error('[csv-loader] failed', err);
    // keep STRATEGIES empty so UI shows error
    var msg = 'فشل تحميل CSV: '+(err && err.message ? err.message : 'غير معروف')+' — تأكد أنك تشغّل الموقع عبر سيرفر محلي (http) وليس file://';
    // defer show until DOM ready
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded', function(){ showCsvError(msg); });
    } else {
      showCsvError(msg);
    }
    throw err;
  });

  // expose promise
  window._csvLoadPromise = _csvLoadPromise;
  window._showCsvError = showCsvError;
})();
