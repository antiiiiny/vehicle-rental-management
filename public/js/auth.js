const panels = {
  account: document.getElementById('panel-account'),
  search: document.getElementById('panel-search'),
  bookings: document.getElementById('panel-bookings'),
  inspections: document.getElementById('panel-inspections'),
  reports: document.getElementById('panel-reports'),
  admin: document.getElementById('panel-admin'),
};

function showPanel(name) {
  Object.entries(panels).forEach(([key, el]) => {
    if (el) el.hidden = key !== name;
  });
}

function refreshNav() {
  const user = getUser();
  const statusEl = document.getElementById('user-status');
  const logoutBtn = document.getElementById('nav-logout');
  const bookingsBtn = document.getElementById('nav-bookings');
  const inspectionsBtn = document.getElementById('nav-inspections');
  const reportsBtn = document.getElementById('nav-reports');
  const adminBtn = document.getElementById('nav-admin');

  if (user) {
    statusEl.textContent = `${user.name} (${user.role})`;
    logoutBtn.hidden = false;
    bookingsBtn.hidden = false;
    inspectionsBtn.hidden = !['branch_staff', 'admin'].includes(user.role);
    reportsBtn.hidden = !['branch_staff', 'admin'].includes(user.role);
    adminBtn.hidden = user.role !== 'admin';
  } else {
    statusEl.textContent = 'Not logged in';
    logoutBtn.hidden = true;
    bookingsBtn.hidden = true;
    inspectionsBtn.hidden = true;
    reportsBtn.hidden = true;
    adminBtn.hidden = true;
  }
}

document.getElementById('nav-account')?.addEventListener('click', () => showPanel('account'));
document.getElementById('nav-search')?.addEventListener('click', () => {
  showPanel('search');
  if (typeof loadBranchesInto === 'function') {
    loadBranchesInto(document.getElementById('search-branch'), true);
  }
});

document.getElementById('nav-bookings')?.addEventListener('click', () => {
  showPanel('bookings');
  if (typeof loadCustomerBookings === 'function') {
    loadCustomerBookings();
  }
});

document.getElementById('nav-inspections')?.addEventListener('click', () => {
  showPanel('inspections');
});

document.getElementById('nav-reports')?.addEventListener('click', () => {
  showPanel('reports');
  if (typeof loadReportsDashboard === 'function') {
    loadReportsDashboard();
  }
});

document.getElementById('nav-admin')?.addEventListener('click', () => {
  showPanel('admin');
  if (typeof loadBranchesInto === 'function') {
    loadBranchesInto(document.getElementById('vehicle-branch'), false);
    loadFleet();
  }
});

document.getElementById('nav-logout')?.addEventListener('click', () => {
  clearSession();
  refreshNav();
  showPanel('account');
});

document.getElementById('form-register')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('register-msg');
  msg.textContent = '';
  msg.className = 'msg';
  const form = new FormData(e.target);
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setSession(data.token, data.user);
    msg.textContent = 'Registered! You are now logged in.';
    msg.classList.add('success');
    refreshNav();
    showPanel('search');
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add('error');
  }
});

document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('login-msg');
  msg.textContent = '';
  msg.className = 'msg';
  const form = new FormData(e.target);
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setSession(data.token, data.user);
    msg.textContent = 'Logged in!';
    msg.classList.add('success');
    refreshNav();
    showPanel('search');
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add('error');
  }
});

refreshNav();
showPanel('account');
