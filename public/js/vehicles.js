async function loadBranchesInto(selectEl, includeAny) {
  try {
    const data = await apiFetch('/branches');
    selectEl.innerHTML = '';
    if (includeAny) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Any';
      selectEl.appendChild(opt);
    }
    data.branches.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b._id;
      opt.textContent = `${b.name} (${b.city})`;
      selectEl.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load branches', err);
  }
}

async function loadFleet() {
  try {
    const data = await apiFetch('/vehicles');
    const tbody = document.querySelector('#fleet-table tbody');
    tbody.innerHTML = '';
    data.vehicles.forEach((v) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.model}</td>
        <td>${v.type}</td>
        <td>${v.branchId ? `${v.branchId.name} (${v.branchId.city})` : '-'}</td>
        <td>${v.perDayRate}</td>
        <td><span class="tag ${v.status}">${v.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load fleet', err);
  }
}

document.getElementById('nav-search').addEventListener('click', () => {
  loadBranchesInto(document.getElementById('search-branch'), true);
});
document.getElementById('nav-admin').addEventListener('click', () => {
  loadBranchesInto(document.getElementById('vehicle-branch'), false);
  loadFleet();
});

document.getElementById('form-search').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('search-msg');
  const table = document.getElementById('search-results');
  msg.textContent = '';
  msg.className = 'msg';
  const form = new FormData(e.target);
  const params = new URLSearchParams(
    Object.fromEntries([...form.entries()].filter(([, v]) => v !== ''))
  );
  try {
    const data = await apiFetch(`/vehicles/available?${params.toString()}`);
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    if (data.vehicles.length === 0) {
      msg.textContent = 'No vehicles available for that search.';
      table.hidden = true;
      return;
    }
    data.vehicles.forEach((v) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.model}</td>
        <td>${v.type}</td>
        <td>${v.branchId ? `${v.branchId.name} (${v.branchId.city})` : '-'}</td>
        <td>${v.perDayRate}</td>
      `;
      tbody.appendChild(tr);
    });
    table.hidden = false;
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add('error');
    table.hidden = true;
  }
});

document.getElementById('form-branch').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('branch-msg');
  msg.textContent = '';
  msg.className = 'msg';
  const form = new FormData(e.target);
  try {
    await apiFetch('/branches', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form)),
    });
    msg.textContent = 'Branch added.';
    msg.classList.add('success');
    e.target.reset();
    loadBranchesInto(document.getElementById('vehicle-branch'), false);
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add('error');
  }
});

document.getElementById('form-vehicle').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('vehicle-msg');
  msg.textContent = '';
  msg.className = 'msg';
  const form = new FormData(e.target);
  try {
    await apiFetch('/vehicles', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form)),
    });
    msg.textContent = 'Vehicle added.';
    msg.classList.add('success');
    e.target.reset();
    loadFleet();
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add('error');
  }
});
