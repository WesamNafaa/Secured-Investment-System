// محرك حسابات نظام الاستثمار المُحصّن
function calcStrategyReturn(strategy, allocatedAmount) {
  var yearlyGross = allocatedAmount * (strategy.annualReturnRate / 100);
  var ratio = allocatedAmount / strategy.depositMin;
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
    var r = calcStrategyReturn(allocations[i].strategy, allocations[i].allocated);
    totalWeeklyGross += r.weeklyGross;
    totalMonthlyGross += r.monthlyGross;
    totalYearlyGross += r.yearlyGross;
    totalWeeklyNet += r.weeklyNet;
    totalMonthlyNet += r.monthlyNet;
    totalYearlyNet += r.yearlyNet;
    totalMaxDD += r.maxDrawdown;
    totalUsed += allocations[i].allocated;
    allocations[i].result = r;
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
