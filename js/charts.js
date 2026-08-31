// مخططات Canvas - نظام الاستثمار المُحصّن
function drawPieChart(canvasId, data) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  var cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 20;
  ctx.clearRect(0, 0, w, h);
  var total = 0;
  for (var i = 0; i < data.length; i++) total += data[i].value;
  if (total === 0) { ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill(); return; }
  var start = -Math.PI / 2;
  for (var i = 0; i < data.length; i++) {
    var slice = (data[i].value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = data[i].color;
    ctx.fill();
    if (slice > 0.15) {
      var mid = start + slice / 2;
      var tx = cx + Math.cos(mid) * r * 0.6;
      var ty = cy + Math.sin(mid) * r * 0.6;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data[i].label + ' ' + Math.round(data[i].value / total * 100) + '%', tx, ty);
    }
    start += slice;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.fillStyle = '#0B1220';
  ctx.font = 'bold 16px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total + '%', cx, cy);
}
function drawBarChart(canvasId, grossData, netData, labels) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  var pad = { top: 30, right: 30, bottom: 50, left: 70 };
  var cw = w - pad.left - pad.right;
  var ch = h - pad.top - pad.bottom;
  var maxVal = 0;
  for (var i = 0; i < grossData.length; i++) {
    if (grossData[i] > maxVal) maxVal = grossData[i];
    if (netData[i] > maxVal) maxVal = netData[i];
  }
  if (maxVal === 0) maxVal = 1;
  maxVal *= 1.15;
  var groupW = cw / labels.length;
  var barW = groupW * 0.3;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (var i = 0; i <= 5; i++) {
    var y = pad.top + ch - (ch * i / 5);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('$' + Math.round(maxVal * i / 5).toLocaleString(), pad.left - 8, y);
  }
  for (var i = 0; i < labels.length; i++) {
    var gx = pad.left + groupW * i + groupW / 2;
    var bh1 = (grossData[i] / maxVal) * ch;
    var bh2 = (netData[i] / maxVal) * ch;
    var x1 = gx - barW - 2;
    var x2 = gx + 2;
    ctx.fillStyle = '#E8CE7B';
    ctx.beginPath(); ctx.roundRect(x1, pad.top + ch - bh1, barW, bh1, [4, 4, 0, 0]); ctx.fill();
    ctx.fillStyle = '#0E9F6E';
    ctx.beginPath(); ctx.roundRect(x2, pad.top + ch - bh2, barW, bh2, [4, 4, 0, 0]); ctx.fill();
    ctx.fillStyle = '#475569'; ctx.font = '12px IBM Plex Sans Arabic'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(labels[i], gx, pad.top + ch + 10);
  }
}
