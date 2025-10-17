// ===== THEME + EVENTS =====
const THEMES = {
    green: { neon: '#00ff88', rgb: '0,255,136', accent: '#00ff88', bg1: '#000000', bg2: '#0a0a0a', text: '#e6ffe6' },
    red: { neon: '#ff2a6d', rgb: '255,42,109', accent: '#ff0044', bg1: '#0a0003', bg2: '#240008', text: '#ffe6ea' },
    blue: { neon: '#40c9ff', rgb: '64,201,255', accent: '#0066ff', bg1: '#00040a', bg2: '#00131f', text: '#e6f6ff' },
};

const EVENTS = [
    {
        key: 'BAIL',
        title: 'CHAD BAIL COUNTDOWN',
        subtitle: "Jusqu'à la signature du bail",
        // Thursday 23 Oct 2025 16:00 in Paris (CEST = UTC+02)
        target: '2025-10-23T16:00:00+02:00',
        theme: 'red',
        windowDays: 10,
        lines: [
            { from: 7 * 24 * 3600 * 1000, text: "T-<D> jours. Calme, on déroule." },
            { from: 24 * 3600 * 1000, text: "Bientôt la signature du bail !! <D>j <H>h." },
            { from: 0, text: "Aujourd’hui ! <H>h <M>m <S>s restants." },
            { from: -Infinity, text: "✅ Bail signé. Prochaine étape : état des lieux." }
        ]
    },
    {
        key: 'ETAT',
        title: 'CHAD CHECK-IN COUNTDOWN',
        subtitle: "Jusqu’à l’état des lieux",
        // Friday 31 Oct 2025 09:00 in Paris (CET = UTC+01; DST already ended Oct 26)
        target: '2025-10-31T09:00:00+01:00',
        theme: 'blue',
        windowDays: 18,
        lines: [
            { from: 7 * 24 * 3600 * 1000, text: "T-<D> jours. On a encore le temps." },
            { from: 24 * 3600 * 1000, text: "L'état des lieux se rapproche... <D>j <H>h." },
            { from: 0, text: "Aujourd’hui ! <H>h <M>m <S>s restants." },
            { from: -Infinity, text: "✅ ETAT DES LIEUX EFFECTUE. Prochaine étape : LE DEMENAGEMENT !!" }
        ]
    },
    {
        key: 'MOVE',
        title: 'CHAD HOUSE COUNTDOWN',
        subtitle: "Jusqu'au déménagement",
        // Saturday 1 Nov 2025 09:00 in Paris (CET = UTC+01)
        target: '2025-11-01T09:00:00+01:00',
        theme: 'green',
        windowDays: 19,
        lines: [
            { from: 7 * 24 * 3600 * 1000, text: "T-<D> jours. C'est pour très bientôt..." },
            { from: 24 * 3600 * 1000, text: "Dernière ligne droite : <D>j <H>h." },
            { from: 0, text: "Aujourd’hui ! <H>h <M>m <S>s restants." },
            { from: -Infinity, text: "Ton royaume est prêt. Respire, pose tes cartons, et profite du silence. 🏡" }
        ]
    }
];

const MUSICS = [
    { name: "🎵 The Only Thing They Fear Is You", file: "music1.mp3" },
    { name: "🎵 Power Of The Beast", file: "music2.mp3" },
    { name: "🎵 Tondeuse Chan~~", file: "music3.mp3" },
    { name: "🎵 Slash Inferno", file: "music4.mp3" },
    { name: "🎵 Destruction", file: "music5.mp3" },
    { name: "🎵 Chaos", file: "music6.mp3" }
];

let currentIndex = 0; // start on BAIL (red)
let target = new Date(EVENTS[currentIndex].target).getTime();

const el = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    title: document.getElementById('title'),
    subtitle: document.getElementById('subtitle'),
    completion: document.getElementById('completion'),
    ring: document.getElementById('ring'),
    container: document.getElementById('container'),
    footer: document.getElementById('footer'),
    wipe: document.getElementById('wipe'),
    songPicker: document.getElementById('songPicker')
};

const df = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris'
});

// ===== Audio / Visualizer =====
const audio = document.getElementById('audio');
const volume = document.getElementById('volume');
const viz = document.getElementById('viz');
const ctx = viz.getContext('2d');


function populateSongPicker() {
    // Efface et remplit
    el.songPicker.innerHTML = '';
    MUSICS.forEach((t, i) => {
        const opt = document.createElement('option');
        opt.value = t.file;
        opt.textContent = t.name;
        el.songPicker.appendChild(opt);
    });

    // Restaure la dernière sélection si dispo
    const last = localStorage.getItem('chad.song.url');
    if (last && MUSICS.some(t => t.file === last)) {
        el.songPicker.value = last;
    } else if (MUSICS.length) {
        el.songPicker.value = MUSICS[0].file;
    }

    // Si l'audio n'a pas encore été lancé, on ne force pas la lecture.
    // Mais si déjà en lecture, on sync sur le choix courant.
    if (!audio.paused) {
        safeSwitchTo(el.songPicker.value);
    }
}

async function safeSwitchTo(url) {
    try {
        const wasPaused = audio.paused;
        const wasTime = audio.currentTime;
        audio.src = url;
        audio.currentTime = 0;

        if (!wasPaused) {
            await audio.play();
        }
        localStorage.setItem('chad.song.url', url);
    } catch (err) {
        console.error('Switch song failed', err);
    }
}

populateSongPicker();
el.songPicker.addEventListener('change', (e) => {
    safeSwitchTo(e.target.value);
});

function applyRootTheme(th) {
    const root = document.documentElement.style;
    root.setProperty('--neon', th.neon);
    root.setProperty('--neon-rgb', th.rgb);
    root.setProperty('--accent', th.accent);
    root.setProperty('--bg1', th.bg1);
    root.setProperty('--bg2', th.bg2);
    root.setProperty('--text', th.text);
}

function setWipeTheme(th) {
    // style the overlay using its own CSS vars and background
    el.wipe.style.setProperty('--neon', th.neon);
    el.wipe.style.setProperty('--neon-rgb', th.rgb);
    el.wipe.style.setProperty('--bg1', th.bg1);
    el.wipe.style.setProperty('--bg2', th.bg2);
    el.wipe.style.background =
        `radial-gradient(1200px 800px at 50% 50%, var(--bg2), var(--bg1) 70%)`;
}

function switchEvent(next = true) {
    const old = EVENTS[currentIndex];
    currentIndex = (currentIndex + (next ? 1 : -1) + EVENTS.length) % EVENTS.length;
    const ev = EVENTS[currentIndex];

    // prepare wipe visual with target theme
    const th = THEMES[ev.theme];
    setWipeTheme(th);
    void el.wipe.offsetWidth; // reflow
    el.wipe.classList.add('show');

    // after wipe anim ends, actually apply theme + data
    setTimeout(() => {
        applyRootTheme(th);
        setTarget(ev);
        el.wipe.classList.remove('show');
    }, 620); // slightly > CSS 600ms
}

// ===== COUNTDOWN =====
const windowDays = EVENTS[currentIndex].windowDays;
let windowStart = target - windowDays * 24 * 3600 * 1000;

function setTarget(ev) {
    target = new Date(ev.target).getTime();
    el.title.textContent = ev.title;
    el.title.setAttribute('data-text', ev.title);
    el.subtitle.textContent = ev.subtitle;
    el.footer.textContent =
        `🏷️ ${ev.subtitle} — ${df.format(new Date(ev.target))} (heure de Paris)`;
    // progress ring window: last 19 days
    windowStart = target - ev.windowDays * 24 * 3600 * 1000;
}

// init current theme & data
applyRootTheme(THEMES[EVENTS[currentIndex].theme]);
setTarget(EVENTS[currentIndex]);

// ===== helper phrase par EVENT =====
const MS = { d: 24 * 3600 * 1000, h: 3600 * 1000, m: 60 * 1000 };

function formatTokens(text, { d, h, m, s }) {
    return text
        .replace(/<D>/g, d)
        .replace(/<H>/g, h)
        .replace(/<M>/g, m)
        .replace(/<S>/g, s);
}

function pickEventPhrase(eventObj, distMs, parts) {
    const lines = eventObj.lines || [];
    for (const L of lines) {
        if (distMs >= L.from) return formatTokens(L.text, parts);
    }
    // fallback si pas de config
    return eventObj.subtitle || "";
}

function updateCountdown() {
    const now = Date.now();
    const dist = target - now;

    // clamp pour l'affichage si passé
    const d = Math.max(0, Math.floor(dist / (MS.d)));
    const h = Math.max(0, Math.floor((dist % MS.d) / MS.h));
    const m = Math.max(0, Math.floor((dist % MS.h) / MS.m));
    const s = Math.max(0, Math.floor((dist % MS.m) / 1000));

    el.days.textContent = d.toString().padStart(2, '0');
    el.hours.textContent = h.toString().padStart(2, '0');
    el.minutes.textContent = m.toString().padStart(2, '0');
    el.seconds.textContent = s.toString().padStart(2, '0');

    // Progress ring (bloqué à 100% si event passé)
    const progressRaw = (now - windowStart) / (target - windowStart);
    const progress = Math.max(0, Math.min(1, progressRaw));
    el.ring.style.setProperty('--progress', (progress * 100).toFixed(3) + '%');
    el.completion.textContent = (dist <= 0)
        ? 'Complété - 100.0000 %'
        : 'Complétion - ' + (progress * 100).toFixed(4) + ' %';

    // Phrase dynamique depuis l'EVENT actif
    const ev = EVENTS[currentIndex];
    const phrase = pickEventPhrase(ev, dist, { d, h, m, s });
    // J’utilise le sous-titre existant comme zone d’affichage
    if (el.subtitle) el.subtitle.textContent = phrase;

    // Si event passé, on coupe juste l'effet "shake" ; on NE détruit PAS le DOM
    if (dist <= 0) {
        document.body.classList.remove('shake');
    }
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ===== UI: full screen & switching =====
document.getElementById('fsBtn').addEventListener('click', () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
        elem.requestFullscreen?.() || elem.webkitRequestFullscreen?.();
    } else {
        document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
});
document.getElementById('nextEvent').addEventListener('click', () => switchEvent(true));

window.addEventListener('keydown', (e) => {
    if (e.key === 'f') document.getElementById('fsBtn').click();
    if (e.key === 'ArrowRight') switchEvent(true);
    if (e.key === 'ArrowLeft') switchEvent(false);
    if (e.key === 'ArrowUp') { volume.value = Math.min(1, parseFloat(volume.value) + 0.05); volume.dispatchEvent(new Event('input')); }
    if (e.key === 'ArrowDown') { volume.value = Math.max(0, parseFloat(volume.value) - 0.05); volume.dispatchEvent(new Event('input')); }
});

let AC, source, analyser, data, rafId;
let bassEnergy = 0, lastShake = 0;
let neonRGB = getComputedStyle(document.documentElement).getPropertyValue('--neon-rgb').trim();

function resizeCanvas() {
    viz.width = window.innerWidth;
    viz.height = Math.floor(window.innerHeight * 0.28);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

volume.addEventListener('input', () => {
    audio.volume = parseFloat(volume.value);
});
audio.volume = parseFloat(volume.value);

function loopViz() {
    rafId = requestAnimationFrame(loopViz);
    if (!analyser) return;

    analyser.getByteFrequencyData(data);

    ctx.clearRect(0, 0, viz.width, viz.height);
    const n = 128;
    const step = Math.floor(data.length / n);
    const w = viz.width / n;

    // refresh neonRGB (theme may change)
    neonRGB = getComputedStyle(document.documentElement).getPropertyValue('--neon-rgb').trim();

    for (let i = 0; i < n; i++) {
        const val = data[i * step] / 255;
        const h = val * viz.height;
        const x = i * w;
        const y = viz.height - h;
        ctx.fillStyle = `rgba(${neonRGB},${0.25 + val * 0.65})`;
        ctx.fillRect(x, y, w * 0.9, h);
    }

    const sampleRate = AC?.sampleRate || 44100;
    const binHz = sampleRate / analyser.fftSize;
    const bassBins = Math.max(1, Math.floor(150 / binHz));
    let sum = 0;
    for (let i = 0; i < bassBins && i < data.length; i++) sum += data[i];
    const level = sum / (bassBins * 255);

    bassEnergy = bassEnergy * 0.85 + level * 0.15;
    const scale = 1 + bassEnergy * 0.08;
    document.querySelectorAll('.unit').forEach(u => {
        u.style.transform = `scale(${scale})`;
    });

    const glow = 20 + bassEnergy * 60;
    el.title.style.textShadow = `0 0 ${glow}px var(--neon), 0 0 ${glow * 2}px var(--neon)`;

    const now = performance.now();
    if (level > 0.45 && now - lastShake > 220) {
        document.body.classList.add('shake');
        lastShake = now;
        setTimeout(() => document.body.classList.remove('shake'), 250);
    }
}

// switch to current selected audio source
audio.src = el.songPicker.value;