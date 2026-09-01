// محرك حسابات نظام الاستثمار المُحصّن — يدعم التيرمينال (Lot ثابت 0.10/0.30)
function calcStrategyReturn(strategy, allocatedAmount, terminals) {
  // allocatedAmount = terminals * depositMin — لكن نحتفظ بالباراميتر للتوافق
  var t = terminals || (strategy.depositMin ? Math.max(1, Math.round(allocatedAmount / strategy.depositMin)) : 1);
  // yearlyGross عبر terminals * depositMin * ARR% (مكافئ لـ allocatedAmount * ARR% لكن أوضح للتيرمينال)
  var effectiveAllocated = t * strategy.depositMin;
  // إذا allocatedAmount مختلف (بسبب تقريب)، استخدم الأكبر دقة
  if (allocatedAmount && Math.abs(allocatedAmount - effectiveAllocated) > 1) effectiveAllocated = allocatedAmount;
  var yearlyGross = effectiveAllocated * (strategy.annualReturnRate / 100);
  var ratio = t; // كل تيرمينال = وحدة مخاطرة كاملة (Lot ثابت)
  return {
    weeklyGross: yearlyGross / 52,
    monthlyGross: yearlyGross / 12,
    yearlyGross: yearlyGross,
    maxDrawdown: strategy.maxDD * ratio,
    weeklyNet: (yearlyGross / 52) * (1 - strategy.feePct),
    monthlyNet: (yearlyGross / 12) * (1 - strategy.feePct),
    yearlyNet: yearlyGross * (1 - strategy.feePct)
  };
}
function calcPortfolio(allocations, capital) {
  var totalWeeklyGross = 0, totalMonthlyGross = 0, totalYearlyGross = 0;
  var totalWeeklyNet = 0, totalMonthlyNet = 0, totalYearlyNet = 0;
  var totalMaxDD = 0, totalUsed = 0;
  for (var i = 0; i < allocations.length; i++) {
    var a = allocations[i];
    var r = calcStrategyReturn(a.strategy, a.allocated, a.terminals || 1);
    totalWeeklyGross += r.weeklyGross;
    totalMonthlyGross += r.monthlyGross;
    totalYearlyGross += r.yearlyGross;
    totalWeeklyNet += r.weeklyNet;
    totalMonthlyNet += r.monthlyNet;
    totalYearlyNet += r.yearlyNet;
    totalMaxDD += r.maxDrawdown;
    totalUsed += a.allocated;
    a.result = r;
  }
  return {
    weeklyGross: totalWeeklyGross, monthlyGross: totalMonthlyGross, yearlyGross: totalYearlyGross,
    weeklyNet: totalWeeklyNet, monthlyNet: totalMonthlyNet, yearlyNet: totalYearlyNet,
    weeklyPct: (totalWeeklyNet / capital) * 100,
    monthlyPct: (totalMonthlyNet / capital) * 100,
    yearlyPct: (totalYearlyNet / capital) * 100,
    maxDrawdown: totalMaxDD,
    maxDrawdownPct: (totalMaxDD / capital) * 100,
    totalUsed: totalUsed,
    unallocated: capital - totalUsed,
    count: allocations.length
  };
}
