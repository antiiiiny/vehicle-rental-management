async function loadReportsDashboard() {
  try {
    const utilData = await apiFetch('/reports/utilization');
    const summary = utilData.fleetSummary;

    document.getElementById('rep-utilization-rate').textContent = `${summary.utilizationRatePercentage}%`;
    document.getElementById('rep-total-fleet').textContent = summary.totalFleetCount;
    document.getElementById('rep-active-rented').textContent = summary.activeRentedCount;
    document.getElementById('rep-available').textContent = summary.availableCount;
    document.getElementById('rep-maintenance').textContent = summary.maintenanceCount;

    // Popular models table
    const popTableBody = document.querySelector('#table-popular-models tbody');
    if (popTableBody) {
      popTableBody.innerHTML = '';
      if (utilData.popularModels && utilData.popularModels.length > 0) {
        utilData.popularModels.forEach((m) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${m.model}</td><td><strong>${m.bookingCount}</strong></td>`;
          popTableBody.appendChild(tr);
        });
      } else {
        popTableBody.innerHTML = '<tr><td colspan="2">No booking data available.</td></tr>';
      }
    }
  } catch (err) {
    console.error('Failed to load utilization report', err);
  }

  // Load Financial Breakdown (Admin only)
  try {
    const finData = await apiFetch('/reports/financials');
    const fin = finData.summary;

    document.getElementById('fin-base').textContent = `$${fin.totalBaseRevenue.toFixed(2)}`;
    document.getElementById('fin-addons').textContent = `$${fin.totalAddonsRevenue.toFixed(2)}`;
    document.getElementById('fin-damage').textContent = `$${fin.totalDamageFees.toFixed(2)}`;
    document.getElementById('fin-late').textContent = `$${fin.totalLateFees.toFixed(2)}`;
    document.getElementById('fin-cancel').textContent = `$${fin.totalCancellationFees.toFixed(2)}`;
    document.getElementById('fin-refunds').textContent = `$${fin.totalRefundsIssued.toFixed(2)}`;
    document.getElementById('fin-net').textContent = `$${fin.netRevenue.toFixed(2)}`;
  } catch (err) {
    // If user is branch_staff (not admin), financials call returns 403 (expected)
    const finCard = document.getElementById('financial-summary-card');
    if (finCard) {
      finCard.style.opacity = '0.5';
    }
  }
}
