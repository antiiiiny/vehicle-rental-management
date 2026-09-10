const panels = {
  account: document.getElementById('panel-account'),
  search: document.getElementById('panel-search'),
  admin: document.getElementById('panel-admin'),
};

function showPanel(name) {
  Object.entries(panels).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
}

function refreshNav() {
  const user = getUser();
  const statusEl = document.getElementById('user-status');
  const logoutBtn = document.getElementById('nav-logout');
  const adminBtn = document.getElementById('nav-admin');

  if (user) {
    statusEl.textContent = `${user.name} (${user.role})`;
    logoutBtn.hidden = false;
    adminBtn.hidden = user.role !== 'admin';
  } else {
    statusEl.textContent = 'Not logged in';
    logoutBtn.hidden = true;
    adminBtn.hidden = true;
  }
}

document.getElementById('nav-account').addEventListener('click', () => showPanel('account'));
document.getElementById('nav-search').addEventListener('click', () => showPanel('search'));
document.getElementById('nav-admin').addEventListener('click', () => showPanel('admin'));
document.getElementById('nav-logout').addEventListener('click', () => {
  clearSession();
  refreshNav();
  showPanel('account');
});

document.getElementById('form-register').addEventListener('submit', async (e) => {
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

document.getElementById('form-login').addEventListener('submit', async (e) => {
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
