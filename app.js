
const K = 'my-life-v02';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const dateKey = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const today = () => dateKey(new Date());

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const weekStart = () => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dateKey(d);
};

const base = {
  water: { daily: {} },

  reminders: [
    ['med1', 'Medicine', 'After breakfast', '11:00'],
    ['med2', 'Medicine', 'After dinner', '22:00'],
    ['m1', 'Mukhwas', '2 spoons', '10:00'],
    ['m2', 'Mukhwas', '2 spoons', '14:00'],
    ['m3', 'Mukhwas', '2 spoons', '18:00'],
    ['m4', 'Mukhwas', '2 spoons', '21:00'],
    ['god', 'Godpapad', '', '16:00']
  ].map(([id, name, note, time]) => ({
    id, name, note, time, enabled: true
  })),

  habits: [
    ['read', 'Reading', true],
    ['econ', 'Economics', true],
    ['vyagh', 'Read to Vyagh', true],
    ['self', 'One thing for me', true],
    ['workout', 'Workout', false]
  ].map(([id, name, active]) => ({
    id, name, active, done: {}
  })),

  rove: [
    ['rj', 'Rove Jungli Instagram', 3],
    ['ro', 'Rove Organics Instagram', 1],
    ['wa', 'WhatsApp Game', 1],
    ['blog', 'Blog', 1],
    ['promo', 'Product Promotion', 4]
  ].map(([id, name, target]) => ({
    id, name, target, done: {}
  })),

  projects: [{
    id: 'hamper',
    name: 'Jungle Rituals Hamper',
    stages: [
      { id: 'photo', name: 'Photography', done: false },
      { id: 'edit', name: 'Edit', done: false },
      { id: 'launch', name: 'Actual launch', done: false }
    ]
  }],

  weeklyNote: {}
};

let s;

try {
  const saved = JSON.parse(localStorage.getItem(K) || '{}');
  s = { ...structuredClone(base), ...saved };
} catch {
  s = structuredClone(base);
}

s.water ||= { daily: {} };
s.water.daily ||= {};
s.reminders ||= [];
s.remindersDone ||= {};
s.habits ||= [];
s.rove ||= [];
s.projects ||= structuredClone(base.projects);
s.weeklyNote ||= {};

const fmtTime = t => {
  if (!t) return '';
  const [hh, mm] = t.split(':').map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return t;
  return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
};

const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}[c]));

const water = () => Number(s.water.daily[today()] || 0);

const isdone = (o, id) =>
  Array.isArray(o?.[today()]) && o[today()].includes(id);

const remdone = id =>
  Array.isArray(s.remindersDone[today()]) &&
  s.remindersDone[today()].includes(id);

const count = r =>
  Array.isArray(r.done?.[weekStart()])
    ? r.done[weekStart()].length
    : 0;

function save() {
  try {
    localStorage.setItem(K, JSON.stringify(s));
    render();
  } catch (err) {
    alert('Could not save changes. Please export a backup and check available browser storage.');
    console.error(err);
  }
}

function tick(o, id) {
  const a = o[today()] || [];
  o[today()] = a.includes(id)
    ? a.filter(x => x !== id)
    : [...a, id];
}

function addwater(n) {
  s.water.daily[today()] = water() + n;
  save();
}

function render() {
  const d = new Date();
  const h = d.getHours();

  $('#greeting').textContent =
    h < 12 ? 'Good morning' :
    h < 18 ? 'Good afternoon' : 'Good evening';

  $('#date').textContent = d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  $('#water').textContent = water() >= 1000
    ? (water() / 1000).toFixed(water() % 1000 ? 2 : 0) + ' L'
    : water() + ' ml';

  $('#waterbar').value = Math.min(4000, water());

  const nextHour = Array.from(
    { length: 15 },
    (_, i) => 8 + i
  ).find(x => x > h);

  $('#waterhint').textContent = water() >= 4000
    ? 'Daily goal reached 🌿'
    : 'Next hourly nudge: ' +
      (nextHour === undefined
        ? 'tomorrow 8:00 AM'
        : fmtTime(String(nextHour).padStart(2, '0') + ':00'));

  const allReminders = [...s.reminders].sort((a, b) =>
    (a.time || '').localeCompare(b.time || '')
  );

  const activeReminders = allReminders.filter(r => r.enabled !== false);

  $('#upcoming').innerHTML = activeReminders.map(r => `
    <div class="row">
      <div>
        <b>${esc(r.name)}</b>
        <div class="meta">
          ${fmtTime(r.time)}${r.note ? ' · ' + esc(r.note) : ''}
          ${remdone(r.id) ? ' · Completed today' : ''}
        </div>
      </div>
      <button data-rdone="${esc(r.id)}">
        ${remdone(r.id) ? 'Undo' : 'Mark done'}
      </button>
    </div>
  `).join('') || 'Nothing asking for your attention.';

  $('#todayhabits').innerHTML = s.habits
    .filter(x => x.active)
    .map(x => `
      <div class="row">
        <label>
          <input type="checkbox" data-habit="${esc(x.id)}"
            ${isdone(x.done, x.id) ? 'checked' : ''}>
          ${esc(x.name)}
        </label>
      </div>
    `).join('');

  $('#roveshort').innerHTML = s.rove.map(r => `
    <div class="row">
      <div>
        ${esc(r.name)}
        <div class="meta">${count(r)} of ${r.target} this week</div>
      </div>
      <span class="dots">
        ${'●'.repeat(Math.min(count(r), r.target))}
        ${'○'.repeat(Math.max(0, r.target - count(r)))}
      </span>
    </div>
  `).join('');

  $('#remlist').innerHTML = allReminders.map(r => `
    <div class="row">
      <div>
        <b>${esc(r.name)}</b>
        <div class="meta">
          ${fmtTime(r.time)}${r.note ? ' · ' + esc(r.note) : ''}
          ${r.enabled === false ? ' · Paused' : ''}
          ${remdone(r.id) ? ' · Completed today' : ''}
        </div>
      </div>
      <button data-redit="${esc(r.id)}">Edit</button>
      <button data-rdone="${esc(r.id)}">
        ${remdone(r.id) ? 'Undo' : 'Done'}
      </button>
    </div>
  `).join('');

  $('#habitlist').innerHTML = s.habits.map(x => `
    <div class="row">
      <label>
        <input type="checkbox" data-habit="${esc(x.id)}"
          ${isdone(x.done, x.id) ? 'checked' : ''}
          ${x.active ? '' : 'disabled'}>
        ${esc(x.name)} ${x.active ? '' : '(paused)'}
      </label>
      <button data-hedit="${esc(x.id)}">Edit</button>
    </div>
  `).join('');

  $('#rovelist').innerHTML = s.rove.map(r => `
    <div class="row">
      <div>
        ${esc(r.name)}
        <div class="meta">
          Weekly target · ${count(r)}/${r.target}
          ${r.id === 'promo' ? ' · Aim for alternate days' : ''}
        </div>
      </div>
      <button data-rve="${esc(r.id)}">+ Done</button>
    </div>
  `).join('');

  const completedMedicine = activeReminders.filter(
    r => r.name.toLowerCase() === 'medicine' && remdone(r.id)
  ).length;

  $('#summary').innerHTML = `
    <article>
      <b>Care</b>
      <p>Water: ${Math.round(water() / 4000 * 100)}% today</p>
      <p>Medicine reminders marked done: ${completedMedicine}</p>
    </article>
    <article>
      <b>Me & Vyagh</b>
      ${s.habits.filter(x => x.active).map(x => `
        <p>${esc(x.name)}: ${isdone(x.done, x.id) ? 'done' : 'not yet'}</p>
      `).join('')}
    </article>
    <article>
      <b>Rove</b>
      ${s.rove.map(r => `
        <p>${esc(r.name)}: ${count(r)}/${r.target}</p>
      `).join('')}
    </article>
  `;

  const note = $('#note');
  if (document.activeElement !== note) {
    note.value = s.weeklyNote[weekStart()] || '';
  }

  const project = s.projects[0];
  if (project) {
    const done = project.stages.filter(x => x.done).length;
    $('#projectshort').innerHTML = `
      ${done}/${project.stages.length} stages complete
      <button id="openproject">Open stages</button>
    `;
  } else {
    $('#projectshort').textContent = 'No project added yet.';
  }
}

function dlg(title, html) {
  $('#dlgtitle').textContent = title;
  $('#dlgbody').innerHTML = html;
  $('#dlg').showModal();
}

function reminderForm(r = {}) {
  return `
    <label>Name</label>
    <input id="nm" value="${esc(r.name)}" required>
    <label>Note / instruction</label>
    <input id="nt" value="${esc(r.note)}">
    <label>Time</label>
    <input id="tm" type="time" value="${r.time || '12:00'}" required>
    <label>Status</label>
    <select id="enabled">
      <option value="yes" ${r.enabled !== false ? 'selected' : ''}>Active</option>
      <option value="no" ${r.enabled === false ? 'selected' : ''}>Paused</option>
    </select>
    <button id="saveR" type="button">Save</button>
  `;
}

function habitForm(x = {}) {
  return `
    <label>Name</label>
    <input id="nm" value="${esc(x.name)}" required>
    <label>Status</label>
    <select id="active">
      <option value="yes" ${x.active !== false ? 'selected' : ''}>Active</option>
      <option value="no" ${x.active === false ? 'selected' : ''}>Paused</option>
    </select>
    <button id="saveH" type="button">Save</button>
  `;
}

document.addEventListener('click', e => {
  const viewButton = e.target.closest('[data-view]');

  if (viewButton) {
    $$('.view').forEach(x =>
      x.classList.toggle('hidden', x.id !== viewButton.dataset.view)
    );

    $$('[data-view]').forEach(x => {
      x.classList.toggle('active', x === viewButton);
      x.style.background = x === viewButton ? '#d9ef8b' : '';
    });
    return;
  }

  const addButton = e.target.closest('[data-add]');
  if (addButton) addwater(Number(addButton.dataset.add));

  if (e.target.id === 'other') {
    const n = prompt('Amount of water in ml?');
    if (n && Number.isFinite(+n) && +n > 0) addwater(+n);
  }

  const doneButton = e.target.closest('[data-rdone]');
  if (doneButton) {
    const id = doneButton.dataset.rdone;
    const a = s.remindersDone[today()] || [];

    s.remindersDone[today()] = a.includes(id)
      ? a.filter(x => x !== id)
      : [...a, id];

    save();
  }

  if (e.target.id === 'addrem') {
    dlg('Add reminder', reminderForm());

    $('#saveR').onclick = () => {
      const name = $('#nm').value.trim();
      const time = $('#tm').value;
      if (!name || !time) {
        alert('Please enter a reminder name and time.');
        return;
      }

      s.reminders.push({
        id: uid(),
        name,
        note: $('#nt').value.trim(),
        time,
        enabled: $('#enabled').value === 'yes'
      });

      save();
      $('#dlg').close();
    };
  }

  const editReminder = e.target.closest('[data-redit]');
  if (editReminder) {
    const r = s.reminders.find(x => x.id === editReminder.dataset.redit);
    if (!r) return;

    dlg('Edit reminder', reminderForm(r));

    $('#saveR').onclick = () => {
      const name = $('#nm').value.trim();
      const time = $('#tm').value;

      if (!name || !time) {
        alert('Please enter a reminder name and time.');
        return;
      }

      Object.assign(r, {
        name,
        note: $('#nt').value.trim(),
        time,
        enabled: $('#enabled').value === 'yes'
      });

      save();
      $('#dlg').close();
    };
  }

  if (e.target.id === 'addhabit') {
    dlg('Add habit', habitForm());

    $('#saveH').onclick = () => {
      const name = $('#nm').value.trim();
      if (!name) {
        alert('Please enter a habit name.');
        return;
      }

      s.habits.push({
        id: uid(),
        name,
        active: $('#active').value === 'yes',
        done: {}
      });

      save();
      $('#dlg').close();
    };
  }

  const editHabit = e.target.closest('[data-hedit]');
  if (editHabit) {
    const x = s.habits.find(y => y.id === editHabit.dataset.hedit);
    if (!x) return;

    dlg('Edit habit', habitForm(x));

    $('#saveH').onclick = () => {
      const name = $('#nm').value.trim();
      if (!name) {
        alert('Please enter a habit name.');
        return;
      }

      x.name = name;
      x.active = $('#active').value === 'yes';

      save();
      $('#dlg').close();
    };
  }

  const roveButton = e.target.closest('[data-rve]');
  if (roveButton) {
    const r = s.rove.find(x => x.id === roveButton.dataset.rve);
    if (!r) return;

    if (r.id === 'promo' && r.lastDoneDate) {
      const last = new Date(r.lastDoneDate + 'T12:00:00');
      const current = new Date(today() + 'T12:00:00');
      const days = Math.round((current - last) / 86400000);

      if (days === 0) {
        alert('Product promotion is already recorded for today.');
        return;
      }

      if (days < 2) {
        alert('Keep product promotion to alternate days. You can record it tomorrow.');
        return;
      }
    }

    r.done ||= {};
    r.done[weekStart()] ||= [];
    r.done[weekStart()].push(uid());

    if (r.id === 'promo') r.lastDoneDate = today();

    save();
  }

  if (e.target.id === 'openproject') {
    const p = s.projects[0];
    if (!p) return;

    dlg(p.name, p.stages.map(st => `
      <div class="row">
        <label>
          <input type="checkbox" data-stage="${esc(st.id)}"
            ${st.done ? 'checked' : ''}>
          ${esc(st.name)}
        </label>
      </div>
    `).join(''));
  }

  if (e.target.id === 'savenote') {
    s.weeklyNote[weekStart()] = $('#note').value;
    save();
    alert('Reflection saved locally.');
  }

  if (e.target.id === 'export') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(s, null, 2)], {
        type: 'application/json'
      })
    );
    a.download = 'my-life-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }
});

document.addEventListener('change', e => {
  if (e.target.matches('[data-habit]')) {
    const x = s.habits.find(y => y.id === e.target.dataset.habit);
    if (!x) return;

    tick(x.done, x.id);
    save();
  }

  if (e.target.matches('[data-stage]')) {
    const p = s.projects[0];
    const stage = p?.stages.find(
      x => x.id === e.target.dataset.stage
    );
    if (!stage) return;

    stage.done = e.target.checked;
    save();
  }
});

$$('[data-view]').forEach((x, i) => {
  x.style.background = i === 0 ? '#d9ef8b' : '';
  x.classList.toggle('active', i === 0);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);
}

render();
