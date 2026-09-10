let currentCancellingBookingId = null;

async function loadAddonsCatalog() {
  const container = document.getElementById('addons-container');
  if (!container) return;
  try {
    const data = await apiFetch('/reports/addons');
    container.innerHTML = '';
    data.addons.forEach((addon) => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `
        <input type="checkbox" name="addons" value="${addon.id}" />
        <span><strong>${addon.name}</strong> (+$${addon.ratePerDay}/day) — <em>${addon.description}</em></span>
      `;
      container.appendChild(label);
    });
  } catch (err) {
    console.error('Failed to load add-ons catalog', err);
  }
}

async function handleBookVehicle(vehicleId) {
  const startDate = document.getElementById('search-start-date').value;
  const endDate = document.getElementById('search-end-date').value;
  const msg = document.getElementById('search-msg');

  if (!startDate || !endDate) {
    alert('Please select both start and end dates before booking.');
    return;
  }

  const selectedAddons = Array.from(
    document.querySelectorAll('#addons-container input[name="addons"]:checked')
  ).map((cb) => cb.value);

  try {
    const data = await apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId,
        startDate,
        endDate,
        addons: selectedAddons,
      }),
    });

    msg.textContent = `Booking created successfully! (Booking ID: ${data.booking._id})`;
    msg.className = 'msg success';

    if (typeof loadCustomerBookings === 'function') {
      loadCustomerBookings();
    }
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'msg error';
  }
}

async function loadCustomerBookings() {
  const table = document.getElementById('bookings-table');
  const tbody = table ? table.querySelector('tbody') : null;
  const msg = document.getElementById('bookings-msg');

  if (!tbody) return;

  try {
    const data = await apiFetch('/reports/customer-history');
    tbody.innerHTML = '';

    const summary = data.summary;
    if (summary) {
      document.getElementById('metric-total-rentals').textContent = summary.totalBookings || 0;
      document.getElementById('metric-completed-trips').textContent = summary.completedBookings || 0;
      document.getElementById('metric-active-bookings').textContent = summary.activeBookings || 0;
      document.getElementById('metric-cancelled-bookings').textContent = summary.cancelledBookings || 0;
      document.getElementById('metric-total-spent').textContent = `$${summary.totalSpent.toFixed(2)}`;
    }

    if (!data.bookings || data.bookings.length === 0) {
      if (msg) msg.textContent = 'No bookings found.';
      return;
    }

    if (msg) msg.textContent = '';

    data.bookings.forEach((b) => {
      const tr = document.createElement('tr');
      const vehicleName = b.vehicleId ? `${b.vehicleId.model} (${b.vehicleId.type})` : 'Vehicle';
      const startStr = new Date(b.startDate).toLocaleDateString();
      const endStr = new Date(b.endDate).toLocaleDateString();

      const addonsStr = b.addons && b.addons.length > 0
        ? b.addons.map((a) => a.name).join(', ')
        : 'None';

      let actionBtn = '-';
      if (b.status === 'reserved') {
        actionBtn = `<button class="btn small danger" onclick="openCancellationModal('${b._id}')">Quote & Cancel</button>`;
      }

      tr.innerHTML = `
        <td><small>${b._id}</small></td>
        <td>${vehicleName}</td>
        <td>${startStr} to ${endStr}</td>
        <td>${b.totalDays}</td>
        <td><small>${addonsStr}</small></td>
        <td><strong>$${(b.finalAmount || b.totalAmount).toFixed(2)}</strong></td>
        <td><span class="tag ${b.status}">${b.status}</span></td>
        <td>${actionBtn}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    if (msg) {
      msg.textContent = err.message;
      msg.className = 'msg error';
    }
  }
}

async function openCancellationModal(bookingId) {
  currentCancellingBookingId = bookingId;
  const modal = document.getElementById('modal-cancel-quote');

  try {
    const data = await apiFetch(`/bookings/${bookingId}/cancellation-quote`);
    const quote = data.quote;

    document.getElementById('quote-tier-msg').textContent = quote.policyTier;
    document.getElementById('quote-hours').textContent = `${quote.hoursUntilStart} hrs`;
    document.getElementById('quote-fee-pct').textContent = `${quote.feePercentage}%`;
    document.getElementById('quote-fee-amt').textContent = `$${quote.cancellationFee.toFixed(2)}`;
    document.getElementById('quote-refund-amt').textContent = `$${quote.refundAmount.toFixed(2)}`;

    modal.hidden = false;
  } catch (err) {
    alert(`Error getting quote: ${err.message}`);
  }
}

document.getElementById('btn-close-quote')?.addEventListener('click', () => {
  document.getElementById('modal-cancel-quote').hidden = true;
  currentCancellingBookingId = null;
});

document.getElementById('btn-confirm-cancel')?.addEventListener('click', async () => {
  if (!currentCancellingBookingId) return;

  try {
    await apiFetch(`/bookings/${currentCancellingBookingId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Cancelled via customer history UI' }),
    });

    alert('Booking cancelled successfully.');
    document.getElementById('modal-cancel-quote').hidden = true;
    currentCancellingBookingId = null;
    loadCustomerBookings();
  } catch (err) {
    alert(`Cancellation failed: ${err.message}`);
  }
});

// Pickup Inspection handler
document.getElementById('form-pickup-inspection')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('pickup-msg');
  msg.textContent = '';
  msg.className = 'msg';
  const form = new FormData(e.target);

  try {
    await apiFetch('/inspections/pickup', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form)),
    });

    msg.textContent = 'Pickup inspection recorded! Booking status updated to picked_up.';
    msg.className = 'msg success';
    e.target.reset();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'msg error';
  }
});

// Return Inspection handler
document.getElementById('form-return-inspection')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('return-msg');
  msg.textContent = '';
  msg.className = 'msg';
  const form = new FormData(e.target);

  try {
    const data = await apiFetch('/inspections/return', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form)),
    });

    msg.textContent = `Return inspection recorded! Total final amount: $${data.booking.finalAmount.toFixed(2)}`;
    msg.className = 'msg success';
    e.target.reset();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'msg error';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadAddonsCatalog();
});
