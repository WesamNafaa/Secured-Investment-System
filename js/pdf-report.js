// مولّد التقرير - نظام الاستثمار المُحصّن
function generatePDFReport(state, allocations, portfolio) {
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  var pageW = 210, margin = 15, contentW = pageW - margin * 2;
  var y = 0;

  function addPage() { doc.addPage(); y = 20; }
  function checkPage(need) { if (y + need > 275) addPage(); }
  function drawLine() { doc.setDrawColor(200); doc.line(margin, y, pageW - margin, y); y += 4; }
  function setFont(size, style) { doc.setFont('helvetica', style || 'normal'); doc.setFontSize(size); }
  function fmt(n) { return '$' + Math.round(n).toLocaleString(); }

  // === COVER PAGE — Dark Luxe ===
  doc.setFillColor(7, 10, 18);
  doc.rect(0, 0, pageW, 297, 'F');
  // gold hairline top
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, pageW, 1.2, 'F');

  doc.setFillColor(212, 175, 55);
  doc.roundedRect(pageW / 2 - 25, 50, 50, 50, 8, 8, 'F');
  doc.setTextColor(7, 10, 18);
  setFont(28, 'bold');
  doc.text('SF', pageW / 2, 80, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  setFont(32, 'bold');
  doc.text('Investment Fortified System', pageW / 2, 120, { align: 'center' });

  setFont(16);
  doc.text('Investment Portfolio Report', pageW / 2, 132, { align: 'center' });

  setFont(11);
  doc.setTextColor(180, 190, 200);
  doc.text('Portfolio Analysis Report', pageW / 2, 144, { align: 'center' });

  var now = new Date();
  var dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  setFont(10);
  doc.text('Generated: ' + dateStr, pageW / 2, 160, { align: 'center' });

  doc.setTextColor(150, 160, 170);
  setFont(8);
  doc.text('This report is for informational purposes only.', pageW / 2, 250, { align: 'center' });
  doc.text('Past performance does not guarantee future results.', pageW / 2, 256, { align: 'center' });
  doc.text('All figures are based on historical backtest data.', pageW / 2, 262, { align: 'center' });

  // === PAGE 2: SUMMARY ===
  addPage();
  doc.setTextColor(17, 24, 43);
  setFont(18, 'bold');
  doc.text('Portfolio Summary', margin, y);
  y += 4;
  setFont(10);
  doc.setTextColor(100, 110, 120);
  doc.text('Investment Portfolio Summary', margin, y);
  y += 10;

  drawLine();

  var summaryData = [
    ['Total Capital', fmt(state.capital)],
    ['Risk Allocation', state.risk.safe + '% Safe / ' + state.risk.average + '% Average / ' + state.risk.high + '% High'],
    ['Mode', state.mode === 'estimate' ? 'Estimate (Proportional)' : 'Execute (Minimum-based)'],
    ['Strategies Selected', String(portfolio.count)],
    ['Capital Deployed', fmt(portfolio.totalUsed)],
    ['Unallocated Cash', fmt(portfolio.unallocated)],
    ['', ''],
    ['Weekly Return (Gross)', fmt(portfolio.weeklyGross)],
    ['Weekly Operating Fee', '-' + fmt(portfolio.weeklyGross - portfolio.weeklyNet)],
    ['Weekly Return (Net)', fmt(portfolio.weeklyNet) + ' (' + portfolio.weeklyPct.toFixed(2) + '%)'],
    ['Monthly Return (Gross)', fmt(portfolio.monthlyGross)],
    ['Monthly Operating Fee', '-' + fmt(portfolio.monthlyGross - portfolio.monthlyNet)],
    ['Monthly Return (Net)', fmt(portfolio.monthlyNet) + ' (' + portfolio.monthlyPct.toFixed(2) + '%)'],
    ['Yearly Return (Gross)', fmt(portfolio.yearlyGross)],
    ['Yearly Operating Fee', '-' + fmt(portfolio.yearlyGross - portfolio.yearlyNet)],
    ['Yearly Return (Net)', fmt(portfolio.yearlyNet) + ' (' + portfolio.yearlyPct.toFixed(2) + '%)'],
    ['', ''],
    ['Expected Max Drawdown', '-' + fmt(portfolio.maxDrawdown) + ' (-' + portfolio.maxDrawdownPct.toFixed(2) + '%)'],
  ];

  doc.autoTable({
    startY: y,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [17, 24, 43], textColor: [242, 217, 139], fontSize: 8.5, fontStyle: 'bold', halign: 'left', cellPadding: 2.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 40, 50], cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' }, 1: { cellWidth: contentW - 60 } },
    margin: { left: margin, right: margin },
    styles: { overflow: 'linebreak', cellPadding: 2 },
    didDrawCell: function(data) {
      if (data.section === 'body' && data.row.index === 6 || data.row.index === 11) {
        doc.setDrawColor(200);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });
  y = doc.lastAutoTable.finalY + 10;

  // Operating Fees Box
  checkPage(30);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentW, 22, 3, 3, 'F');
  doc.setDrawColor(200);
  doc.roundedRect(margin, y, contentW, 22, 3, 3, 'S');
  doc.setTextColor(71, 85, 105);
  setFont(9, 'bold');
  doc.text('Operating Fees Deducted:', margin + 4, y + 6);
  setFont(8);
  doc.text('All operating fees: 20% across all risk categories.', margin + 4, y + 12);
  doc.text('All returns shown are NET after fees.', margin + 4, y + 17);
  y += 28;

  // === PAGE 3: STRATEGY TABLE ===
  addPage();
  doc.setTextColor(17, 24, 43);
  setFont(18, 'bold');
  doc.text('Strategy Allocation Details', margin, y);
  y += 4;
  setFont(10);
  doc.setTextColor(100, 110, 120);
  doc.text('Strategy Distribution Details', margin, y);
  y += 10;

  var tableRows = [];
  for (var i = 0; i < allocations.length; i++) {
    var a = allocations[i], r = a.result;
    var catLabel = a.riskCategory === 'safe' ? 'Safe' : a.riskCategory === 'average' ? 'Average' : 'High';
    tableRows.push([
      a.strategy.symbol,
      a.strategy.strategy,
      catLabel,
      '$' + a.allocated.toLocaleString(),
      '$' + Math.round(r.weeklyNet).toLocaleString(),
      '$' + Math.round(r.monthlyNet).toLocaleString(),
      '$' + Math.round(r.yearlyNet).toLocaleString(),
      a.strategy.annualReturnRate.toFixed(2) + '%',
      '$' + Math.round(r.maxDrawdown).toLocaleString(),
      a.strategy.profitFactor.toFixed(2),
      a.strategy.winRate.toFixed(1) + '%',
      a.strategy.dateRange
    ]);
  }

  doc.autoTable({
    startY: y,
    head: [['Symbol', 'Strategy', 'Risk', 'Allocated', 'Weekly', 'Monthly', 'Yearly', 'AR%', 'Max DD', 'PF', 'Win%', 'Period']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [17, 24, 43], textColor: [242, 217, 139], fontSize: 6.5, fontStyle: 'bold', halign: 'center', cellPadding: 1.6, lineWidth: 0.15, lineColor: [212, 175, 55] },
    bodyStyles: { fontSize: 6.2, cellPadding: 1.4, lineWidth: 0.1, lineColor: [230, 232, 235] },
    alternateRowStyles: { fillColor: [252, 250, 242] },
    styles: { overflow: 'linebreak', cellWidth: 'wrap', minCellHeight: 5, valign: 'middle', halign: 'center' },
    tableWidth: contentW,
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 16, halign: 'right' },
      9: { cellWidth: 10, halign: 'center' },
      10: { cellWidth: 12, halign: 'center' },
      11: { cellWidth: 19, halign: 'center', fontSize: 5.8 }
    },
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      if (data.section === 'body') {
        var cat = allocations[data.row.index] ? allocations[data.row.index].riskCategory : '';
        if (cat === 'safe') data.cell.styles.textColor = [14, 159, 110];
        else if (cat === 'average') data.cell.styles.textColor = [217, 119, 6];
        else if (cat === 'high') data.cell.styles.textColor = [220, 38, 38];
      }
    }
  });
  y = doc.lastAutoTable.finalY + 10;

  // === DISCLAIMER PAGE ===
  addPage();
  doc.setTextColor(220, 38, 38);
  setFont(14, 'bold');
  doc.text('IMPORTANT DISCLAIMER', margin, y);
  y += 10;
  drawLine();
  y += 4;

  doc.setTextColor(50, 60, 70);
  setFont(9);
  var disclaimers = [
    'Past performance does not guarantee future results.',
    'All figures shown are based on historical backtest data from 2008-2026.',
    'Historical testing covers major economic crises including:',
    '  - 2008 Global Financial Crisis (Great Recession)',
    '  - 2010-2015 European Sovereign Debt Crisis',
    '  - 2014-2016 Oil Price Collapse',
    '  - 2020-2021 COVID-19 Pandemic Recession',
    '  - 2022-2024 Great Inflation & Interest Rate Crisis',
    '  - 2023 Bank Failures (SVB, Credit Suisse)',
    '  - 2024-2026 Policy Repricing Shocks',
    '',
    'The expected maximum drawdown represents the worst historical',
    'peak-to-trough decline and may occur again in the future.',
    '',
    'Operating fees (20% across all risk categories) are deducted',
    'from displayed returns. Actual returns may vary.',
    '',
    'This report is for informational purposes only and does not',
    'constitute investment advice. Consult a licensed financial',
    'advisor before making any investment decisions.',
    '',
    'Investment Fortified System does not guarantee any returns and is not responsible',
    'for any losses incurred through the use of this information.'
  ];
  for (var i = 0; i < disclaimers.length; i++) {
    checkPage(6);
    doc.text(disclaimers[i], margin, y);
    y += 5;
  }

  // Footer on all pages — Dark Luxe with gold line
  var totalPages = doc.internal.getNumberOfPages();
  for (var p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (p > 1) {
      doc.setFillColor(7, 10, 18);
      doc.rect(0, 287, pageW, 10, 'F');
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 287, pageW, 0.6, 'F');
      doc.setTextColor(242, 217, 139);
      setFont(7);
      doc.text('Investment Fortified System  |  ' + dateStr + '  |  Page ' + p + ' of ' + totalPages, pageW / 2, 293, { align: 'center' });
    }
  }

  doc.save('Investment-Report-' + dateStr + '.pdf');
}
