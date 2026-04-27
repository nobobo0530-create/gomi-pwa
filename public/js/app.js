'use strict';

// ── ごみルール: ひがしの一丁目 ─────────────────────────
function nthWeek(d) { return Math.ceil(d.getDate() / 7); }

const TYPES = [
  {
    id: 'burnable',
    label: '燃えるごみ',
    short: '燃える',
    icon: '🔥',
    color: 'burnable',
    schedule: '毎週 月・木',
    match: d => d.getDay() === 1 || d.getDay() === 4,
  },
  {
    id: 'non_burnable',
    label: '燃えないごみ',
    short: '燃えない',
    icon: '🗑️',
    color: 'non-burnable',
    schedule: '第2水曜',
    match: d => d.getDay() === 3 && nthWeek(d) === 2,
  },
  {
    id: 'can',
    label: '資源ごみ（缶）',
    short: '缶',
    icon: '🥫',
    color: 'resource',
    schedule: '第1金曜',
    match: d => d.getDay() === 5 && nthWeek(d) === 1,
  },
  {
    id: 'bottle',
    label: '資源ごみ（びん）',
    short: 'びん',
    icon: '🍾',
    color: 'resource',
    schedule: '第2金曜',
    match: d => d.getDay() === 5 && nthWeek(d) === 2,
  },
  {
    id: 'paper',
    label: '資源ごみ（紙類）',
    short: '紙類',
    icon: '📄',
    color: 'resource',
    schedule: '第3金曜',
    match: d => d.getDay() === 5 && nthWeek(d) === 3,
  },
  {
    id: 'plastic',
    label: '資源ごみ（プラ）',
    short: 'プラ',
    icon: '♻️',
    color: 'resource',
    schedule: '第4金曜',
    match: d => d.getDay() === 5 && nthWeek(d) === 4,
  },
];

// ── Helpers ───────────────────────────────────────
function norm(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

function getGarbage(date) {
  const d = norm(date);
  return TYPES.filter(t => t.match(d));
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

const DOW    = ['日','月','火','水','木','金','土'];
const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function fDate(d) {
  return `${d.getMonth()+1}月${d.getDate()}日（${DOW[d.getDay()]}）`;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Data ──────────────────────────────────────────
function nextPickups(fromDate, count = 3) {
  const res = [];
  const d = norm(fromDate);
  d.setDate(d.getDate() + 1);
  for (let i = 0; i < 90 && res.length < count; i++) {
    const g = getGarbage(d);
    if (g.length > 0) res.push({ date: new Date(d), types: g });
    d.setDate(d.getDate() + 1);
  }
  return res;
}

function weekDays(baseDate) {
  const d = norm(baseDate);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1)); // back to Monday
  return Array.from({ length: 14 }, () => {
    const day = { date: new Date(d), types: getGarbage(d) };
    d.setDate(d.getDate() + 1);
    return day;
  });
}

function monthDays(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);

  const d = new Date(first);
  const startDow = first.getDay();
  d.setDate(d.getDate() - (startDow === 0 ? 6 : startDow - 1));

  const endDate = new Date(last);
  const endDow = last.getDay();
  if (endDow !== 0) endDate.setDate(endDate.getDate() + (7 - endDow));

  const days = [];
  while (d <= endDate) {
    days.push({ date: new Date(d), types: getGarbage(d), inMonth: d.getMonth() === month });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// ── State ─────────────────────────────────────────
const S = {
  view: 'home',
  calYear:  new Date().getFullYear(),
  calMonth: new Date().getMonth(),
};

// ── Render: Home ──────────────────────────────────
function renderHome() {
  const now   = new Date();
  const today = getGarbage(now);
  const nexts = nextPickups(now, 2);
  const week  = weekDays(now);

  // Today card
  let todayCard;
  if (today.length > 0) {
    const t = today[0];
    todayCard = `<div class="today-card ${esc(t.color)}">
      <div class="today-icon">${esc(t.icon)}</div>
      <div class="today-main-label">${esc(t.label)}</div>
      <div class="today-sub">今日出せます</div>
    </div>`;
  } else {
    todayCard = `<div class="today-card none">
      <div class="today-icon">✓</div>
      <div class="today-main-label">ごみの日では<br>ありません</div>
      <div class="today-sub">収集はありません</div>
    </div>`;
  }

  // Next pickups
  const nextHtml = nexts.map(p => {
    const t = p.types[0];
    return `<div class="next-card ${esc(t.color)}">
      <div class="next-icon">${esc(t.icon)}</div>
      <div class="next-info">
        <div class="next-date">${fDate(p.date)}</div>
        <div class="next-label">${esc(t.label)}</div>
      </div>
    </div>`;
  }).join('');

  // Week strip
  const weekHtml = week.map(day => {
    const isToday = isSameDay(day.date, now);
    const isPast  = day.date < norm(now) && !isToday;
    const g = day.types;
    const cls = g.length > 0 ? g[0].color : '';
    return `<div class="week-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}">
      <div class="week-dow">${DOW[day.date.getDay()]}</div>
      <div class="week-num">${day.date.getDate()}</div>
      ${g.length > 0
        ? `<div class="week-gc-icon">${esc(g[0].icon)}</div>
           <div class="week-label-sm ${esc(cls)}">${esc(g[0].short)}</div>`
        : `<div class="week-gc-none">—</div>`}
    </div>`;
  }).join('');

  return `<div class="home-view">
    <div class="app-header">
      <div class="header-area">ひがしの一丁目</div>
      <div class="header-date">${fDate(now)}</div>
    </div>

    <div class="section">
      <div class="section-title">今日のごみ</div>
      ${todayCard}
    </div>

    <div class="section">
      <div class="section-title">次のごみの日</div>
      <div class="next-list">${nextHtml}</div>
    </div>

    <div class="section">
      <div class="section-title">2週間の予定</div>
      <div class="week-strip">${weekHtml}</div>
    </div>

    <div class="section">
      <button class="cal-btn" id="btn-calendar">📅　カレンダーを見る</button>
    </div>
  </div>`;
}

// ── Render: Calendar ──────────────────────────────
function renderCalendar() {
  const now    = new Date();
  const days   = monthDays(S.calYear, S.calMonth);
  const label  = `${S.calYear}年${MONTHS[S.calMonth]}`;

  const gridHtml = days.map(day => {
    const isToday = isSameDay(day.date, now);
    const g = day.types;
    const cls = g.length > 0 ? g[0].color : '';
    return `<div class="cal-day ${day.inMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}">
      <div class="cal-date">${day.date.getDate()}</div>
      ${g.length > 0 && day.inMonth
        ? `<div class="cal-dot ${esc(cls)}"></div>
           <div class="cal-day-label ${esc(cls)}">${esc(g[0].short)}</div>`
        : ''}
    </div>`;
  }).join('');

  const legend = [
    { cls: 'burnable',     label: '燃えるごみ',   schedule: '毎週 月・木' },
    { cls: 'non-burnable', label: '燃えないごみ',  schedule: '第2水曜' },
    { cls: 'resource',     label: '資源ごみ（缶・びん・紙類・プラ）', schedule: '毎週金曜' },
  ];

  return `<div class="cal-view">
    <div class="cal-header">
      <button class="back-btn" id="btn-home">← ホーム</button>
      <h2 class="cal-month">${label}</h2>
      <div class="cal-nav">
        <button class="nav-btn" id="btn-prev">‹</button>
        <button class="nav-btn" id="btn-next">›</button>
      </div>
    </div>

    <div class="cal-grid-wrap">
      <div class="cal-dow-row">
        ${['月','火','水','木','金','土','日'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}
      </div>
      <div class="cal-grid">${gridHtml}</div>
    </div>

    <div class="cal-legend">
      <div class="legend-title">ごみの種類</div>
      <div class="legend-items">
        ${legend.map(l => `<div class="legend-item">
          <div class="legend-dot ${l.cls}"></div>
          <span class="legend-item-text">${esc(l.label)}</span>
          <span class="legend-schedule">${esc(l.schedule)}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ── Render ────────────────────────────────────────
function render() {
  document.getElementById('app').innerHTML =
    S.view === 'home' ? renderHome() : renderCalendar();
  bind();
}

// ── Events ────────────────────────────────────────
function bind() {
  const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
  on('btn-calendar', () => { S.view = 'calendar'; render(); });
  on('btn-home',     () => { S.view = 'home';     render(); });

  // 今日のセルをスクロールで中央に表示
  if (S.view === 'home') {
    setTimeout(() => {
      document.querySelector('.week-day.today')?.scrollIntoView({
        behavior: 'instant', block: 'nearest', inline: 'center',
      });
    }, 30);
  }
  on('btn-prev', () => {
    S.calMonth--;
    if (S.calMonth < 0)  { S.calMonth = 11; S.calYear--; }
    render();
  });
  on('btn-next', () => {
    S.calMonth++;
    if (S.calMonth > 11) { S.calMonth = 0;  S.calYear++; }
    render();
  });
}

// ── Notifications ─────────────────────────────────
async function initNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    setTimeout(async () => {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') startNotifTimer();
    }, 2000);
  } else if (Notification.permission === 'granted') {
    startNotifTimer();
  }
}

function startNotifTimer() {
  let lastFired = '';
  setInterval(() => {
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    if (m > 2) return; // fire in first 3 min of the hour
    const key = `${now.toDateString()}-${h}`;
    if (lastFired === key) return;
    lastFired = key;

    if (h === 7) {
      const g = getGarbage(now);
      if (g.length > 0) {
        const t = g[0];
        new Notification(`${t.icon} 今日は${t.label}の日です`, {
          body: `回収日です。忘れずに出しましょう！`,
        });
      }
    }
    if (h === 20) {
      const tom = new Date(now);
      tom.setDate(tom.getDate() + 1);
      const g = getGarbage(tom);
      if (g.length > 0) {
        const t = g[0];
        new Notification(`${t.icon} 明日は${t.label}の日です`, {
          body: `明日の朝までに出しておきましょう！`,
        });
      }
    }
  }, 30000);
}

// ── Init ──────────────────────────────────────────
function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  initNotifications();
  render();
}

init();
