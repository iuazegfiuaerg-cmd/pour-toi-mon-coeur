/* =========================================================================
   FICHIER : app.js
   Logique interactive + moteur d'ARG (jeu de piste).
   JS Vanilla ES6 — aucun framework, aucune dépendance.

   SOMMAIRE
     1.  CONFIG          ← C'EST ICI QUE TU PERSONNALISES TOUS LES TEXTES
     2.  Secrets encodés
     3.  État sauvegardé (localStorage)
     4.  Utilitaires
     5.  Son (Web Audio, aucun fichier externe)
     6.  Décor (fond, pétales)
     7.  Chrome (nav, sigils, toasts)
     8.  ÉNIGME 1 — Le Chemin Doré        (index.html)
     9.  Galerie + ÉNIGME 2 — L'Objet Quantique (galerie.html)
     10. Bouquet + ÉNIGME 3 — La Recette Secrète (bouquet.html)
     11. Le Portail (méta-puzzle)
     12. La Finale cosmique
     13. Démarrage
   ========================================================================= */
'use strict';

/* =========================================================================
   1. CONFIG — TOUT CE QUE TU DOIS PERSONNALISER EST ICI
   ========================================================================= */
const CONFIG = {

  /* METTRE SON PRÉNOM ICI */
  prenom: 'Mon Amour',

  /* METTRE TON PRÉNOM ICI (signature de la lettre d'accueil) */
  moi: 'moi',

  /* --- Message affiché quand elle valide un bouquet normal --- */
  bouquet: {
    titre: 'Commande enregistrée',
    /* {bouquet} sera remplacé automatiquement par sa composition */
    /* METTRE LE MESSAGE D'AMOUR DE CONFIRMATION ICI */
    message:
      "C'est noté : {bouquet}. " +
      "Je n'ai pas de camionnette, pas de tablier, et aucune idée de comment " +
      "on tient un sécateur — mais je te promets que ce bouquet-là existera pour de vrai. " +
      "En attendant, sache que je t'aurais offert le champ entier si on m'avait laissé faire."
  },

  /* --- LA FINALE : la vraie lettre, découverte après le méta-puzzle --- */
  finale: {
    onglet: 'Tu as trouvé la porte ✦',
    eyebrow: 'Coordonnées acceptées · Portail ouvert',
    titre: 'Tu as trouvé',
    sousTitre: 'Je savais que ce serait toi. Je l\'ai toujours su.',

    /* METTRE LA VRAIE LETTRE D'ANNIVERSAIRE ICI (un élément = un paragraphe) */
    lettre: [
      "Si tu lis ceci, c'est que tu n'as pas seulement ouvert un site : tu l'as <em>fouillé</em>. " +
      "Tu as suivi des entailles que personne n'aurait remarquées, tu as arrêté de bouger " +
      "assez longtemps pour qu'une photo accepte de te parler, et tu as composé un bouquet " +
      "impossible juste pour voir ce qui se passerait. Bon je t'ai aidée un peu, mais pas trop. Tu as trouvé la porte, et tu es entrée.",

      "C'est exactement pour ça que je t'aime. Parce que tu ne te contentes pas de juste lire tu fouilles et te voila maintenant devant ce massage la",

      "J'ai passé des heures à cacher trois secrets dans un site que tu aurais pu simplement " +
      "regarder et fermer. J'ai pris le risque que tu ne trouves jamais. Et tu as trouvé. " +
      "Alors voilà ce que je voulais te dire, à l'abri, là où personne d'autre n'ira jamais lire :",

      "Tu es la meilleure chose qui me soit arrivée. Pas la plus simple, pas la plus calme, " +
      "la meilleure. Je veux grandire, te voire passer les meilleures années de ta vie avec moi myriam. Joyeux anniversaire, mon coeur. Le monde a beaucoup de chance " +
      "de t'avoir. Moi encore plus."
    ],

    /* METTRE TA SIGNATURE ICI */
    signature: 'Anas ton prince charmant',

    /* METTRE LE CADEAU FINAL ICI */
    cadeau: {
      icone: '🎁',
      titre: 'Ton cadeau',
      texte:
        "1 Rue des Pertuisanes, 34000 Montpellier"
    },

    badge: 'Trois secrets · Une porte · Une seule personne'
  }
};


/* =========================================================================
   2. SECRETS ENCODÉS
   Les valeurs sont encodées en base64 (btoa) PUIS inversées, pour qu'un
   « Inspecter l'élément » ne les livre pas en clair.
   ========================================================================= */
const _E = [
  'BZ1TOJVRQV1U',  // [0] le mot de passe
  'yMDN'           // [1] la fréquence
];
const _flip = s => s.split('').reverse().join('');
const _secret = i => atob(_flip(_E[i]));

/* Signature base64 de la combinaison florale qui déclenche l'anomalie.
   Actuellement : 9 Roses Bleues + Feuille d'Or  (9 = vos 9 mois).
   Pour changer la recette, encode "fleur|couleur|quantité|emballage"
   avec btoa() dans la console. Ex. : btoa('lys|noir|3|tulle')          */
const _RECIPE = 'cm9zZXxibGV1fDl8b3I=';


/* =========================================================================
   3. ÉTAT SAUVEGARDÉ
   ========================================================================= */
const STORE_KEY = 'arg.anniversaire.v1';
const DEFAULTS = { sun: false, freq: false, pass: false, ascended: false };

/* ---------------------------------------------------------------------
   OÙ L'AVANCEMENT EST STOCKÉ — sessionStorage, et c'est voulu.

   → La progression suit bien d'une page à l'autre dans le même onglet
     (indispensable : sans ça, le méta-puzzle serait infaisable, puisqu'il
      faut cumuler les trois clés trouvées sur trois pages différentes).

   → Mais TOUT est remis à zéro dès que l'onglet est fermé. Chaque nouvelle
     visite du site repart donc de zéro, énigmes comprises.

   Si un jour tu veux au contraire que l'avancement soit gardé pour de bon,
   remplace les 3 "sessionStorage" ci-dessous par "localStorage".
   --------------------------------------------------------------------- */

let S = (() => {
  try { return Object.assign({}, DEFAULTS, JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}')); }
  catch (e) { return Object.assign({}, DEFAULTS); }
})();

function persist() {
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* mode privé */ }
}

/* Petite trappe de secours pour TOI, si tu veux repartir de zéro sans
   fermer l'onglet : ouvre la console du navigateur et tape   resetARG()   */
window.resetARG = function () {
  try { sessionStorage.removeItem(STORE_KEY); } catch (e) {}
  location.reload();
};


/* =========================================================================
   4. UTILITAIRES
   ========================================================================= */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Éclaircit (p > 0) ou assombrit (p < 0) une couleur hexadécimale. */
function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const target = p < 0 ? 0 : 255, a = Math.abs(p);
  r = Math.round((target - r) * a + r);
  g = Math.round((target - g) * a + g);
  b = Math.round((target - b) * a + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}


/* =========================================================================
   5. SON — synthétisé à la volée, aucun .mp3 à fournir
   ========================================================================= */
const Sound = (() => {
  let ctx = null;

  function get() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(o) {
    const c = get(); if (!c) return;
    const t0 = c.currentTime + (o.delay || 0);
    const dur = o.dur || 1;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(o.gain || 0.12, t0 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    prime() { get(); },
    /** Petit clic quand une rune s'allume */
    tick() { tone({ freq: 880, dur: 0.14, gain: 0.05, type: 'triangle' }); },
    /** Clé Solaire trouvée */
    chime() {
      [528, 660, 792, 1056].forEach((f, i) =>
        tone({ freq: f, dur: 1.9 - i * 0.15, gain: 0.1, delay: i * 0.13 }));
    },
    /** L'objet quantique se révèle : un vrai 432 Hz */
    quantum() {
      tone({ freq: 216, dur: 3.2, gain: 0.07 });
      tone({ freq: 432, dur: 3.0, gain: 0.09, delay: 0.1 });
      tone({ freq: 648, dur: 2.2, gain: 0.04, delay: 0.35 });
    },
    /** Anomalie florale */
    glitch() {
      tone({ freq: 180, glide: 42, dur: 1.5, gain: 0.1, type: 'sawtooth' });
      tone({ freq: 1400, glide: 90, dur: 0.9, gain: 0.05, type: 'square', delay: 0.12 });
      tone({ freq: 96, dur: 2.4, gain: 0.08, type: 'triangle', delay: 0.4 });
    },
    /** Le portail s'ouvre */
    portal() { tone({ freq: 220, glide: 660, dur: 1.4, gain: 0.09, type: 'triangle' }); },
    /** Mauvaise clé */
    deny() { tone({ freq: 150, glide: 80, dur: 0.35, gain: 0.09, type: 'square' }); },
    /** Ascension : grand accord */
    ascend() {
      [130.8, 196, 261.6, 329.6, 392, 523.25, 659.3].forEach((f, i) =>
        tone({ freq: f, dur: 6.5 - i * 0.4, gain: 0.075, delay: i * 0.22 }));
    }
  };
})();


/* =========================================================================
   6. DÉCOR — fond animé + pétales/étoiles flottantes
   ========================================================================= */
function initDecor() {
  const bg = document.createElement('div');
  bg.className = 'bg'; bg.setAttribute('aria-hidden', 'true');

  const grain = document.createElement('div');
  grain.className = 'bg-grain'; grain.setAttribute('aria-hidden', 'true');

  const petals = document.createElement('div');
  petals.className = 'petals'; petals.setAttribute('aria-hidden', 'true');

  document.body.prepend(petals, grain, bg);

  if (REDUCED) return;

  const tones = ['#f9c9d9', '#dcc9f5', '#c6e2f8', '#ffd9c4', '#fff3d6'];
  const total = window.innerWidth < 640 ? 13 : 22;

  for (let i = 0; i < total; i++) {
    const p = document.createElement('span');
    const isStar = Math.random() < 0.38;
    p.className = 'petal' + (isStar ? ' is-star' : '');
    const size = isStar ? 2 + Math.random() * 3 : 7 + Math.random() * 11;
    const col = tones[(Math.random() * tones.length) | 0];
    p.style.cssText =
      'left:' + (Math.random() * 100).toFixed(2) + '%;' +
      'width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;' +
      'background:' + col + ';color:' + col + ';' +
      '--dx:' + (Math.random() * 170 - 85).toFixed(0) + 'px;' +
      '--o:' + (0.28 + Math.random() * 0.45).toFixed(2) + ';' +
      'animation-duration:' + (14 + Math.random() * 17).toFixed(1) + 's;' +
      'animation-delay:-' + (Math.random() * 26).toFixed(1) + 's;';
    petals.appendChild(p);
  }
}


/* =========================================================================
   7. CHROME — navigation, prénoms, sigils, toasts
   ========================================================================= */
function initChrome() {
  /* Thème « fusionné » si le portail a déjà été franchi */
  if (S.ascended) document.documentElement.classList.add('ascended');

  /* Prénoms */
  $$('[data-nom]').forEach(el => { el.textContent = CONFIG.prenom; });
  $$('[data-nom-moi]').forEach(el => { el.textContent = CONFIG.moi; });

  /* Lien de nav actif */
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('.nav-link').forEach(a => {
    const target = (a.getAttribute('href') || '').toLowerCase();
    if (target === here) a.classList.add('is-active');
  });

  /* Zone des toasts */
  const tz = document.createElement('div');
  tz.className = 'toast-zone'; tz.id = 'toastZone';
  tz.setAttribute('aria-live', 'polite');
  document.body.appendChild(tz);

  /* Amorce le moteur audio au premier geste (politique des navigateurs) */
  const prime = () => Sound.prime();
  window.addEventListener('pointerdown', prime, { once: true });
  window.addEventListener('keydown', prime, { once: true });

  renderSigils();
  updateMystere();
}

function toast(msg) {
  const zone = $('#toastZone'); if (!zone) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  zone.appendChild(t);
  setTimeout(() => t.remove(), 5200);
}

const SIGILS = [
  { key: 'sun',  glyph: '☀' },
  { key: 'freq', glyph: '◎' },
  { key: 'pass', glyph: '✵' }
];

function renderSigils() {
  const host = $('#sigils');
  if (host) {
    host.innerHTML = SIGILS.map(s =>
      '<span class="sigil' + (S[s.key] ? ' is-found' : '') + '" data-sigil="' + s.key + '">' +
      s.glyph + '</span>').join('');
  }
  const pixel = $('#pixelSecret');
  if (pixel) pixel.classList.toggle('is-live', !!S.sun);
  updateMystere();
}

function updateMystere() {
  const found = [S.sun, S.freq, S.pass].filter(Boolean).length;

  const counter = $('[data-mystere-compteur]');
  if (counter) counter.textContent = S.ascended ? 'Portail ouvert ✦' : found + ' / 3';

  const text = $('[data-mystere-texte]');
  if (text) {
    text.textContent =
      S.ascended ? "Tu as tout trouvé. Le point lumineux, en bas à droite, te ramènera là-bas." :
      found === 0 ? "Il y a autre chose ici. Je ne dirai pas où." :
      found === 1 ? "Tu as trouvé quelque chose. Ce n'était que le premier." :
      found === 2 ? "Deux sur trois. Tu brûles." :
                    "Trois clés. Il ne manque plus qu'une porte.";
  }
}


/* =========================================================================
   8. ÉNIGME 1 — LE CHEMIN DORÉ  (index.html)
   Code : ↑ ↑ ↓ →   au clavier, ou en glissant le doigt sur mobile.
   ========================================================================= */
function initPuzzleGoldenPath() {
  const band = $('#runeBand');
  if (!band) return;                       /* pas sur la page d'accueil */

  const runes = $$('.rune', band);
  const CODE = runes.map(r => r.dataset.rune);   /* le code vient du HTML */
  let idx = 0;

  const light = n => runes.forEach((r, i) => r.classList.toggle('is-lit', i < n));

  if (S.sun) { light(runes.length); return; }    /* déjà résolu */

  function feed(dir) {
    if (S.sun) return;
    if (dir === CODE[idx]) {
      idx++;
      light(idx);
      if (idx < CODE.length) Sound.tick();
      else unlock();
    } else {
      idx = (dir === CODE[0]) ? 1 : 0;
      light(idx);
    }
  }

  function unlock() {
    S.sun = true; persist();
    light(runes.length);
    Sound.chime();
    renderSigils();
    toast('☀ Clé Solaire trouvée. Quelque chose s\'est allumé plus bas.');
    /* on attire discrètement l'œil vers le pied de page */
    const pixel = $('#pixelSecret');
    if (pixel) setTimeout(() => pixel.scrollIntoView({ behavior: 'smooth', block: 'end' }), 1400);
  }

  /* --- Clavier --- */
  window.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key && e.key.indexOf('Arrow') === 0) feed(e.key);
  });

  /* --- Tactile : mêmes directions, au doigt --- */
  let sx = 0, sy = 0, st = 0;
  window.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    sx = t.clientX; sy = t.clientY; st = Date.now();
  }, { passive: true });

  window.addEventListener('touchend', e => {
    if (Date.now() - st > 900) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 55) return;
    feed(ax > ay ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft')
                 : (dy > 0 ? 'ArrowDown'  : 'ArrowUp'));
  }, { passive: true });
}


/* =========================================================================
   9. GALERIE + ÉNIGME 2 — L'OBJET QUANTIQUE  (galerie.html)
   ========================================================================= */
function initGallery() {
  const gallery = $('#gallery');
  if (!gallery) return;

  /* --- Emplacements vides élégants tant qu'aucune photo n'est fournie --- */
  $$('.frame-inner', gallery).forEach(inner => {
    const img = $('img', inner);
    if (!img) return;

    const ph = document.createElement('div');
    ph.className = 'ph';
    ph.innerHTML =
      '<span aria-hidden="true">✚</span>' +
      '<div>' + (img.getAttribute('src') || '') + '</div>' +
      '<div style="opacity:.55">glisse ta photo ici</div>';
    inner.prepend(ph);   /* en dessous du voile quantique */

    const fail = () => inner.classList.add('is-missing');
    const ok   = () => { if (img.naturalWidth > 0) inner.classList.remove('is-missing'); };

    img.addEventListener('error', fail);
    img.addEventListener('load', ok);
    if (img.complete) { img.naturalWidth > 0 ? ok() : fail(); }
  });

  /* --- Visionneuse plein écran --- */
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML =
    '<button class="close" aria-label="Fermer">✕</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(box);

  const boxImg = $('img', box), boxCap = $('figcaption', box);
  const closeBox = () => box.classList.remove('is-open');

  gallery.addEventListener('click', e => {
    const inner = e.target.closest('.frame-inner');
    if (!inner || inner.classList.contains('is-missing')) return;
    const img = $('img', inner);
    const cap = $('figcaption', inner.closest('.frame'));
    boxImg.src = img.currentSrc || img.src;
    boxImg.alt = img.alt || '';
    boxCap.textContent = cap ? cap.textContent.trim() : '';
    box.classList.add('is-open');
  });

  box.addEventListener('click', e => {
    if (e.target === box || e.target.closest('.close')) closeBox();
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeBox(); });

  /* ------------------------------------------------------------------
     ÉNIGME 2 : si plus rien ne bouge pendant 5 secondes, le dernier
     cadre se met à exister.
     ------------------------------------------------------------------ */
  const frame = $('#frameQuantum');
  const veil  = $('#quantumVeil');
  if (!frame || !veil) return;

  /* le texte n'existe nulle part dans le HTML : il est fabriqué ici */
  $('b', veil).textContent = "La fréquence de l'univers est " + _secret(1);

  if (S.freq) { frame.classList.add('is-awake'); return; }   /* déjà trouvé */

  const IDLE = 5000;
  let timer = null;

  function reveal() {
    frame.classList.add('is-awake');
    if (S.freq) return;
    S.freq = true; persist();
    Sound.quantum();
    renderSigils();
    toast('◎ Une photo a cessé de faire semblant. Retiens ce nombre.');
  }

  function rearm() {
    if (S.freq) return;
    frame.classList.remove('is-awake');
    clearTimeout(timer);
    timer = setTimeout(reveal, IDLE);
  }

  ['mousemove', 'touchstart', 'touchmove', 'scroll', 'keydown', 'wheel', 'click']
    .forEach(ev => window.addEventListener(ev, rearm, { passive: true }));

  rearm();
}


/* =========================================================================
   10. BOUQUET + ÉNIGME 3 — LA RECETTE SECRÈTE  (bouquet.html)
   ========================================================================= */

const FLOWER_META = {
  rose:       { n: ['Rose', 'Roses'],             g: 'f' },
  tulipe:     { n: ['Tulipe', 'Tulipes'],         g: 'f' },
  lys:        { n: ['Lys', 'Lys'],                g: 'm' },
  marguerite: { n: ['Marguerite', 'Marguerites'], g: 'f' },
  orchidee:   { n: ['Orchidée', 'Orchidées'],     g: 'f' }
};

const COLOR_META = {
  rouge: { hex: '#e0243f', label: 'Rouge', adj: { m: ['rouge', 'rouges'],   f: ['rouge', 'rouges'] } },
  blanc: { hex: '#fdf7f2', label: 'Blanc', adj: { m: ['blanc', 'blancs'],   f: ['blanche', 'blanches'] } },
  bleu:  { hex: '#4a7ef0', label: 'Bleu',  adj: { m: ['bleu', 'bleus'],     f: ['bleue', 'bleues'] } },
  rose:  { hex: '#ff8fb1', label: 'Rose',  adj: { m: ['rose', 'roses'],     f: ['rose', 'roses'] } },
  jaune: { hex: '#ffcf3f', label: 'Jaune', adj: { m: ['jaune', 'jaunes'],   f: ['jaune', 'jaunes'] } },
  noir:  { hex: '#2f2739', label: 'Noir',  adj: { m: ['noir', 'noirs'],     f: ['noire', 'noires'] } }
};

const WRAP_META = {
  kraft: { label: 'Papier Kraft',      a: '#d9b183', b: '#a8814f', ribbon: '#8d6a3f', alpha: 1    },
  satin: { label: 'Ruban Satin',       a: '#fbd3de', b: '#e08fac', ribbon: '#d9718f', alpha: 1    },
  tulle: { label: 'Tulle Transparent', a: '#ffffff', b: '#dcd6ea', ribbon: '#cfc6e0', alpha: 0.55 },
  or:    { label: "Feuille d'Or",      a: '#fbe7b4', b: '#c9963f', ribbon: '#b07f2c', alpha: 1    }
};

/* --- Formes de pétales --------------------------------------------------- */
/** Pétale pointant vers le haut, partant de l'origine. */
function petalPath(w, h) {
  return 'M0 0 C ' + (-w) + ' ' + (-h * 0.36) + ', ' + (-w * 0.6) + ' ' + (-h * 0.86) + ', 0 ' + (-h) +
         ' C ' + (w * 0.6) + ' ' + (-h * 0.86) + ', ' + w + ' ' + (-h * 0.36) + ', 0 0 Z';
}

/** Couronne de n pétales identiques autour de l'origine. */
function ring(n, d, fill, opt) {
  opt = opt || {};
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i + (opt.offset || 0);
    out += '<path d="' + d + '" fill="' + fill + '"' +
           (opt.stroke ? ' stroke="' + opt.stroke + '" stroke-width="' + (opt.sw || 0.5) + '"' : '') +
           ' transform="rotate(' + a.toFixed(1) + ')"/>';
  }
  return out;
}

const FLOWER_SHAPES = {
  rose(r, c) {
    const d1 = shade(c, -0.16), d2 = shade(c, -0.32), l1 = shade(c, 0.24);
    return ring(6, petalPath(r * 0.62, r * 1.0), l1, { stroke: d2, sw: Math.max(0.3, r * 0.028) }) +
           ring(6, petalPath(r * 0.5, r * 0.74), c, { offset: 30 }) +
           ring(5, petalPath(r * 0.4, r * 0.5), d1, { offset: 14 }) +
           '<circle r="' + (r * 0.17).toFixed(2) + '" fill="' + d2 + '"/>' +
           '<path d="M' + (-r * 0.13).toFixed(2) + ' 0 A ' + (r * 0.13).toFixed(2) + ' ' +
           (r * 0.13).toFixed(2) + ' 0 1 1 ' + (r * 0.1).toFixed(2) + ' ' + (-r * 0.06).toFixed(2) +
           '" fill="none" stroke="' + l1 + '" stroke-width="' + Math.max(0.5, r * 0.055).toFixed(2) +
           '" stroke-linecap="round" opacity=".85"/>';
  },

  tulipe(r, c) {
    const d = shade(c, -0.22), l = shade(c, 0.2);
    return '<g transform="translate(0,' + (r * 0.52).toFixed(2) + ')">' +
           '<path d="' + petalPath(r * 0.72, r * 1.05) + '" fill="' + d + '" transform="rotate(-31)"/>' +
           '<path d="' + petalPath(r * 0.72, r * 1.05) + '" fill="' + d + '" transform="rotate(31)"/>' +
           '<path d="' + petalPath(r * 0.82, r * 1.18) + '" fill="' + c + '"/>' +
           '<path d="' + petalPath(r * 0.4, r * 0.82) + '" fill="' + l + '" opacity=".7"/>' +
           '</g>';
  },

  lys(r, c) {
    const d = shade(c, -0.26), l = shade(c, 0.28);
    let out = ring(6, petalPath(r * 0.4, r * 1.12), c, { stroke: d, sw: Math.max(0.3, r * 0.026) });
    out += ring(3, petalPath(r * 0.15, r * 0.7), l, { offset: 60 });
    for (let i = 0; i < 5; i++) {
      const a = (72 * i - 90) * Math.PI / 180;
      const x = (Math.cos(a) * r * 0.5).toFixed(2), y = (Math.sin(a) * r * 0.5).toFixed(2);
      const x2 = (Math.cos(a) * r * 0.58).toFixed(2), y2 = (Math.sin(a) * r * 0.58).toFixed(2);
      out += '<line x1="0" y1="0" x2="' + x + '" y2="' + y + '" stroke="' + d +
             '" stroke-width="' + Math.max(0.4, r * 0.045).toFixed(2) + '" stroke-linecap="round"/>' +
             '<circle cx="' + x2 + '" cy="' + y2 + '" r="' + Math.max(0.7, r * 0.09).toFixed(2) +
             '" fill="#e2a14a"/>';
    }
    return out;
  },

  marguerite(r, c) {
    const d = shade(c, -0.2);
    return ring(14, petalPath(r * 0.2, r * 1.05), c, { stroke: d, sw: Math.max(0.25, r * 0.02) }) +
           '<circle r="' + (r * 0.3).toFixed(2) + '" fill="#f6c944"/>' +
           '<circle r="' + (r * 0.3).toFixed(2) + '" fill="none" stroke="#cf9a1d" stroke-width="' +
           Math.max(0.35, r * 0.03).toFixed(2) + '"/>' +
           '<circle r="' + (r * 0.15).toFixed(2) + '" fill="#dda522"/>';
  },

  orchidee(r, c) {
    const d = shade(c, -0.34), l = shade(c, 0.3), lip = shade(c, -0.14);
    return '<path d="' + petalPath(r * 0.52, r * 1.0) + '" fill="' + c + '" transform="rotate(-33)"/>' +
           '<path d="' + petalPath(r * 0.52, r * 1.0) + '" fill="' + c + '" transform="rotate(33)"/>' +
           '<path d="' + petalPath(r * 0.6, r * 0.94) + '" fill="' + l + '" transform="rotate(-104)"/>' +
           '<path d="' + petalPath(r * 0.6, r * 0.94) + '" fill="' + l + '" transform="rotate(104)"/>' +
           '<path d="' + petalPath(r * 0.78, r * 0.9) + '" fill="' + lip + '" transform="rotate(180)"/>' +
           '<ellipse rx="' + (r * 0.17).toFixed(2) + '" ry="' + (r * 0.23).toFixed(2) + '" fill="' + d + '"/>' +
           '<circle cy="' + (r * 0.05).toFixed(2) + '" r="' + (r * 0.08).toFixed(2) + '" fill="#ffe9a8"/>';
  }
};

/** Construit tout le SVG du bouquet à partir de l'état courant. */
function buildBouquet(st) {
  const C = COLOR_META[st.color];
  const W = WRAP_META[st.wrap];
  const base = C.hex;

  const cx = 210, cy = 194, neckY = 322, baseY = 500;
  const n = st.count;

  const spread = Math.min(136, 24 + Math.sqrt(n) * 25);
  const fr = Math.max(11.5, Math.min(42, 46 - n * 0.66));
  const GA = Math.PI * (3 - Math.sqrt(5));

  /* --- positions des têtes (spirale de Fermat, très naturel) --- */
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : Math.sqrt((i + 0.6) / n);
    const a = i * GA + 1.1;
    pts.push({
      x: cx + Math.cos(a) * t * spread * 1.10,
      y: cy + Math.sin(a) * t * spread * 0.80,
      r: fr * (1 - 0.14 * t),
      rot: Math.sin(i * 2.3) * 18
    });
  }
  pts.sort((p, q) => p.y - q.y);   /* les fleurs basses passent devant */

  /* --- défs --- */
  const defs =
    '<defs>' +
      '<linearGradient id="gTige" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#84b56e"/><stop offset="1" stop-color="#48713f"/></linearGradient>' +
      '<linearGradient id="gFeuille" x1="0" y1="1" x2="0" y2="0">' +
        '<stop offset="0" stop-color="#4f7a44"/><stop offset="1" stop-color="#8cbd75"/></linearGradient>' +
      '<linearGradient id="gWrapA" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + shade(W.a, 0.12) + '"/>' +
        '<stop offset="0.5" stop-color="' + W.a + '"/>' +
        '<stop offset="1" stop-color="' + W.b + '"/></linearGradient>' +
      '<linearGradient id="gWrapB" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#ffffff" stop-opacity=".65"/>' +
        '<stop offset="1" stop-color="' + W.a + '" stop-opacity=".1"/></linearGradient>' +
      '<radialGradient id="gHalo" cx="50%" cy="42%" r="55%">' +
        '<stop offset="0" stop-color="' + shade(base, 0.55) + '" stop-opacity=".38"/>' +
        '<stop offset="1" stop-color="' + base + '" stop-opacity="0"/></radialGradient>' +
    '</defs>';

  /* --- halo doux derrière la tête du bouquet --- */
  const halo = '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (spread * 1.5).toFixed(0) +
               '" ry="' + (spread * 1.2).toFixed(0) + '" fill="url(#gHalo)"/>';

  /* --- feuillage --- */
  const angles = [150, 30, 176, 4, 120, 60, 96];
  const leafCount = Math.min(angles.length, 3 + Math.round(n / 9));
  let leaves = '';
  for (let i = 0; i < leafCount; i++) {
    const deg = angles[i];
    const a = deg * Math.PI / 180;
    const lx = cx + Math.cos(a) * spread * 1.02;
    const ly = cy + Math.sin(a) * spread * 0.8;
    leaves += '<g transform="translate(' + lx.toFixed(1) + ',' + ly.toFixed(1) +
              ') rotate(' + (deg + 90).toFixed(0) + ')">' +
              '<path d="' + petalPath(fr * 0.5, fr * 1.6) + '" fill="url(#gFeuille)" opacity=".9"/></g>';
  }

  /* --- tiges --- */
  let stems = '';
  pts.forEach((p, i) => {
    const ctrlX = cx + (p.x - cx) * 0.32;
    const ctrlY = (p.y + neckY) / 2;
    const endX = cx + (i % 2 ? 4 : -4);
    stems += '<path d="M' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) +
             ' Q' + ctrlX.toFixed(1) + ' ' + ctrlY.toFixed(1) + ' ' + endX + ' ' + (baseY - 26) +
             '" fill="none" stroke="url(#gTige)" stroke-width="' +
             Math.max(1.6, fr * 0.11).toFixed(2) + '" stroke-linecap="round" opacity=".95"/>';
  });

  /* --- emballage --- */
  const op = W.alpha;
  const wrapG =
    '<g opacity="' + op + '">' +
      '<path d="M' + (cx - 94) + ' ' + (neckY - 28) + ' L' + (cx + 94) + ' ' + (neckY - 28) +
        ' L' + (cx + 31) + ' ' + (baseY - 4) + ' L' + (cx - 31) + ' ' + (baseY - 4) + ' Z" ' +
        'fill="url(#gWrapA)" stroke="' + W.b + '" stroke-opacity=".35" stroke-width="1"/>' +
      '<path d="M' + (cx - 94) + ' ' + (neckY - 28) + ' L' + cx + ' ' + (neckY + 8) +
        ' L' + (cx - 31) + ' ' + (baseY - 4) + ' Z" fill="url(#gWrapB)" opacity=".7"/>' +
      '<path d="M' + (cx + 94) + ' ' + (neckY - 28) + ' L' + cx + ' ' + (neckY + 8) +
        ' L' + (cx + 31) + ' ' + (baseY - 4) + ' Z" fill="' + W.b + '" opacity=".22"/>' +
      (st.wrap === 'or'
        ? '<path d="M' + (cx - 72) + ' ' + (neckY - 10) + ' L' + (cx + 40) + ' ' + (baseY - 20) +
          ' L' + (cx + 60) + ' ' + (baseY - 26) + ' L' + (cx - 50) + ' ' + (neckY - 16) +
          ' Z" fill="#fff8e2" opacity=".45"/>'
        : '') +
    '</g>';

  /* --- nœud --- */
  const ribY = neckY + 62;
  const knot = shade(W.ribbon, -0.16);
  const bow =
    '<g transform="translate(' + cx + ',' + ribY + ')">' +
      '<path d="M-46 -10 Q0 8 46 -10 L44 10 Q0 26 -44 10 Z" fill="' + W.ribbon + '"/>' +
      '<path d="M-4 0 C-34 -22 -56 -14 -50 4 C-46 20 -18 15 -4 4 Z" fill="' + W.ribbon + '"/>' +
      '<path d="M4 0 C34 -22 56 -14 50 4 C46 20 18 15 4 4 Z" fill="' + W.ribbon + '"/>' +
      '<path d="M-3 5 C-11 26 -19 34 -25 45 L-11 41 C-6 31 -2 19 -1 9 Z" fill="' + knot + '" opacity=".9"/>' +
      '<path d="M3 5 C11 26 19 34 25 45 L11 41 C6 31 2 19 1 9 Z" fill="' + knot + '" opacity=".9"/>' +
      '<ellipse rx="8" ry="6.5" fill="' + knot + '"/>' +
    '</g>';

  /* --- fleurs --- */
  const shape = FLOWER_SHAPES[st.flower] || FLOWER_SHAPES.rose;
  let flowers = '';
  pts.forEach(p => {
    flowers += '<g transform="translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) +
               ') rotate(' + p.rot.toFixed(1) + ')">' + shape(p.r, base) + '</g>';
  });

  const shadow = '<ellipse cx="' + cx + '" cy="' + (baseY + 4) +
                 '" rx="62" ry="10" fill="#3a2b4d" opacity=".13"/>';

  return '<svg viewBox="0 0 420 520" xmlns="http://www.w3.org/2000/svg" role="presentation">' +
         defs + halo + leaves + stems + shadow + wrapG + bow + flowers + '</svg>';
}

function initBouquet() {
  const stage = $('#stage');
  if (!stage) return;                       /* pas sur la page bouquet */

  const recap   = $('#recap');
  const order   = $('#orderCard');
  const anomaly = $('#anomalyCard');
  const range   = $('#qtyRange');
  const num     = $('#qtyNum');
  const hint    = $('#qtyHint');
  const cName   = $('#colorName');
  const panel   = $('.panel');

  const st = { flower: 'rose', color: 'rose', count: 12, wrap: 'kraft' };

  const HINTS = [
    [1, 1,  'Une seule. La bonne.'],
    [2, 5,  'Discret, et juste.'],
    [6, 12, 'Une belle brassée.'],
    [13, 24, 'Généreux. Très généreux.'],
    [25, 39, 'Déraisonnable — donc parfait.'],
    [40, 50, 'Il va falloir un vase plus grand.']
  ];

  function label() {
    const F = FLOWER_META[st.flower], C = COLOR_META[st.color];
    const plural = st.count > 1 ? 1 : 0;
    return {
      fleur: F.n[plural],
      couleur: C.adj[F.g][plural],
      emballage: WRAP_META[st.wrap].label
    };
  }

  function render() {
    stage.innerHTML = buildBouquet(st);

    const L = label();
    recap.innerHTML = '<span>' + st.count + '</span> ' + L.fleur + ' <span>' + L.couleur +
                      '</span> · <span>' + L.emballage + '</span>';

    cName.textContent = COLOR_META[st.color].label;
    const h = HINTS.find(x => st.count >= x[0] && st.count <= x[1]);
    hint.textContent = h ? h[2] : '';

    /* toute modification referme les messages précédents */
    order.classList.remove('is-open');
    anomaly.classList.remove('is-open');
  }

  /* --- Sélecteurs (chips + pastilles de couleur) --- */
  panel.addEventListener('click', e => {
    const btn = e.target.closest('[data-value]');
    if (!btn) return;
    const group = btn.parentElement.dataset.group;
    if (!group || !(group in st)) return;

    Array.from(btn.parentElement.children).forEach(c =>
      c.setAttribute('aria-pressed', c === btn ? 'true' : 'false'));

    st[group] = btn.dataset.value;
    render();
  });

  /* --- Quantité : curseur ↔ champ numérique --- */
  const setCount = v => {
    let x = parseInt(v, 10);
    if (isNaN(x)) x = 1;
    x = Math.max(1, Math.min(50, x));
    st.count = x;
    range.value = x;
    num.value = x;
    render();
  };
  range.addEventListener('input', e => setCount(e.target.value));
  num.addEventListener('input',  e => setCount(e.target.value));
  num.addEventListener('blur',   e => setCount(e.target.value));

  /* --- Validation --- */
  $('#validateBtn').addEventListener('click', () => {
    const signature = btoa(st.flower + '|' + st.color + '|' + st.count + '|' + st.wrap);

    /* ============ ÉNIGME 3 : la combinaison impossible ============ */
    if (signature === _RECIPE) { anomalieFlorale(anomaly, order); return; }

    /* ------------ commande normale ------------ */
    const L = label();
    const composition = st.count + ' ' + L.fleur.toLowerCase() + ' ' + L.couleur +
                        ', emballé' + (st.count > 1 ? 's' : '') + ' dans du ' + L.emballage.toLowerCase();

    anomaly.classList.remove('is-open');
    order.innerHTML =
      '<span class="seal" aria-hidden="true">💌</span>' +
      '<h3>' + CONFIG.bouquet.titre + '</h3>' +
      '<p>' + CONFIG.bouquet.message.replace('{bouquet}', composition) + '</p>';
    order.classList.add('is-open');
    Sound.tick();
    order.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  render();
}

/** ÉNIGME 3 — glitch + message système livrant le mot de passe. */
function anomalieFlorale(anomaly, order) {
  const root = document.documentElement;
  order.classList.remove('is-open');

  root.classList.add('is-glitching');
  Sound.glitch();
  setTimeout(() => root.classList.remove('is-glitching'), 2100);

  const lines = [
    ['err', '▚▚ SURCHARGE TEMPORELLE ▚▚'],
    ['',    '&gt; analyse_composition( ) …'],
    ['err', '&gt; ANOMALIE FLORALE DÉTECTÉE'],
    ['',    '&gt; cette combinaison ne devrait pas exister.'],
    ['',    '&gt; un fragment s\'est détaché du réel :'],
    ['key', _secret(0)],
    ['ok',  '&gt; conserve-le. Il ouvre quelque chose. <span class="cursor"></span>']
  ];

  /* Les lignes sont AJOUTÉES une par une (effet terminal) plutôt que
     masquées puis animées : chaque ligne est visible dès son insertion,
     donc le mot de passe s'affiche même sans aucune animation CSS. */
  anomaly.innerHTML = '';
  anomaly.classList.add('is-open');

  lines.forEach((l, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      if (l[0]) div.className = l[0];
      div.innerHTML = l[1];
      anomaly.appendChild(div);
      if (i === lines.length - 1) {
        anomaly.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, REDUCED ? 0 : 600 + i * 340);
  });

  if (!S.pass) {
    S.pass = true; persist();
    setTimeout(() => {
      renderSigils();
      toast('✵ Anomalie enregistrée. Retiens ce mot.');
    }, 3200);
  }
}


/* =========================================================================
   11. LE PORTAIL — le méta-puzzle
   ========================================================================= */
function initPortal() {
  const pixel = $('#pixelSecret');
  if (!pixel) return;

  const portal = document.createElement('div');
  portal.className = 'portal';
  portal.innerHTML =
    '<button class="portal-close" type="button" aria-label="Fermer">✕</button>' +
    '<div class="portal-card" role="dialog" aria-modal="true" aria-labelledby="portalTitle">' +
      '<span class="glyph" aria-hidden="true">✵</span>' +
      '<h2 id="portalTitle">Le Portail</h2>' +
      '<p class="sub">Deux clés. Rien d\'autre.</p>' +
      '<div class="portal-field">' +
        '<label for="pFreq">Fréquence de l\'univers</label>' +
        '<input id="pFreq" type="text" inputmode="numeric" autocomplete="off" placeholder="— — —">' +
      '</div>' +
      '<div class="portal-field">' +
        '<label for="pPass">Mot de passe</label>' +
        '<input id="pPass" type="text" autocomplete="off" spellcheck="false" placeholder="— — — — — — — — —">' +
      '</div>' +
      '<button class="btn btn-primary" type="button" id="pGo">Ouvrir</button>' +
      '<p class="portal-msg" id="pMsg" aria-live="polite"></p>' +
    '</div>';
  document.body.appendChild(portal);

  const fFreq = $('#pFreq', portal);
  const fPass = $('#pPass', portal);
  const msg   = $('#pMsg', portal);

  const close = () => portal.classList.remove('is-open');
  const open = () => {
    portal.classList.add('is-open');
    msg.textContent = '';
    Sound.portal();
    setTimeout(() => fFreq.focus(), 420);
  };

  function attempt() {
    const okFreq = fFreq.value.trim() === _secret(1);
    const okPass = fPass.value.trim().toUpperCase() === _secret(0);

    if (okFreq && okPass) {
      msg.style.color = '#9dffc9';
      msg.textContent = 'Alignement confirmé.';
      setTimeout(startFinale, 700);
      return;
    }

    msg.style.color = '';
    msg.textContent =
      (!okFreq && !okPass) ? 'Rien ne résonne. Les deux clés sont ailleurs.'
      : !okFreq            ? 'La fréquence est fausse. Une photo la connaît.'
                           : 'Ce mot n\'ouvre rien. Les fleurs en savent plus.';
    Sound.deny();
    portal.classList.add('is-wrong');
    setTimeout(() => portal.classList.remove('is-wrong'), 620);
  }

  $('#pGo', portal).addEventListener('click', attempt);
  [fFreq, fPass].forEach(inp =>
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); }));

  $('.portal-close', portal).addEventListener('click', close);
  portal.addEventListener('click', e => { if (e.target === portal) close(); });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && portal.classList.contains('is-open')) close();
  });

  /* Le pixel n'est cliquable qu'avec la Clé Solaire (classe posée par renderSigils) */
  pixel.addEventListener('click', () => {
    if (!S.sun) return;
    if (S.ascended) { startFinale(); return; }   /* déjà franchi : accès direct */
    open();
  });
}


/* =========================================================================
   12. LA FINALE COSMIQUE
   ========================================================================= */
function startFinale() {
  S.ascended = true; persist();
  Sound.ascend();

  const flash = document.createElement('div');
  flash.className = 'flash';
  document.body.appendChild(flash);

  setTimeout(renderCosmos, REDUCED ? 60 : 400);
  setTimeout(() => flash.remove(), 1700);
}

function renderCosmos() {
  const F = CONFIG.finale;
  const root = document.documentElement;

  root.classList.remove('ascended');
  root.classList.add('cosmos-mode');
  document.title = F.onglet;

  /* Le DOM est effacé : les trois pages n'existent plus, il n'y a que ça. */
  document.body.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.className = 'cosmos-stars';
  document.body.appendChild(canvas);

  const veil = document.createElement('div');
  veil.className = 'cosmos-veil';
  veil.setAttribute('aria-hidden', 'true');
  document.body.appendChild(veil);

  const main = document.createElement('main');
  main.className = 'cosmos-content';
  main.innerHTML =
    '<p class="cosmos-eyebrow">' + F.eyebrow + '</p>' +
    '<h1 class="cosmos-title">' + F.titre + '</h1>' +
    '<p class="cosmos-sub">' + F.sousTitre + '</p>' +
    '<article class="cosmos-letter">' +
      F.lettre.map(p => '<p>' + p + '</p>').join('') +
      '<span class="signature">' + F.signature + '</span>' +
    '</article>' +
    '<section class="cosmos-gift">' +
      '<span class="icon" aria-hidden="true">' + F.cadeau.icone + '</span>' +
      '<h3>' + F.cadeau.titre + '</h3>' +
      '<p>' + F.cadeau.texte + '</p>' +
    '</section>' +
    '<p class="cosmos-badge">✦ ' + F.badge + '</p>' +
    '<div class="cosmos-actions">' +
      '<a class="btn btn-primary" href="index.html">Redescendre sur Terre</a>' +
      '<button class="btn" type="button" id="cosmosTop">Relire depuis le début</button>' +
    '</div>';
  document.body.appendChild(main);

  /* Apparition en cascade. La classe .is-in porte l'état final :
     même si la transition ne se joue pas, le contenu devient visible. */
  Array.from(main.children).forEach((el, i) => {
    setTimeout(() => el.classList.add('is-in'), REDUCED ? 0 : 250 + i * 350);
  });

  const top = $('#cosmosTop');
  if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  window.scrollTo(0, 0);
  startStarfield(canvas);
}

/** Ciel étoilé animé sur <canvas>. */
function startStarfield(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, stars = [], shooting = [];

  function makeStar() {
    const roll = Math.random();
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      phase: Math.random() * 6.283,
      speed: Math.random() * 0.022 + 0.004,
      vy: Math.random() * 0.05 + 0.008,
      tint: roll < 0.1 ? 'or' : roll < 0.2 ? 'violet' : 'blanc'
    };
  }

  function resize() {
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(340, (w * h) / 4600));
    stars = [];
    for (let i = 0; i < count; i++) stars.push(makeStar());
  }

  function paint() {
    ctx.clearRect(0, 0, w, h);

    for (const s of stars) {
      s.phase += s.speed;
      s.y += s.vy;
      if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
      const a = 0.35 + 0.65 * Math.abs(Math.sin(s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.fillStyle =
        s.tint === 'or'     ? 'rgba(255,214,150,' + a.toFixed(3) + ')' :
        s.tint === 'violet' ? 'rgba(206,172,255,' + a.toFixed(3) + ')' :
                              'rgba(255,255,255,' + a.toFixed(3) + ')';
      ctx.fill();
    }

    if (Math.random() < 0.004 && shooting.length < 2) {
      shooting.push({
        x: Math.random() * w * 0.75, y: Math.random() * h * 0.45,
        vx: 5 + Math.random() * 4, vy: 1.6 + Math.random() * 1.8, life: 1
      });
    }
    for (let i = shooting.length - 1; i >= 0; i--) {
      const t = shooting[i];
      t.x += t.vx; t.y += t.vy; t.life -= 0.013;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x - t.vx * 13, t.y - t.vy * 13);
      ctx.strokeStyle = 'rgba(255,255,255,' + Math.max(0, t.life * 0.75).toFixed(3) + ')';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      if (t.life <= 0 || t.x > w + 60 || t.y > h + 60) shooting.splice(i, 1);
    }

    requestAnimationFrame(paint);
  }

  resize();
  window.addEventListener('resize', resize);

  if (REDUCED) {
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fill();
    }
  } else {
    requestAnimationFrame(paint);
  }
}


/* =========================================================================
   13. DÉMARRAGE
   ========================================================================= */
function boot() {
  initDecor();
  initChrome();
  initPortal();
  initPuzzleGoldenPath();   /* index.html   */
  initGallery();            /* galerie.html */
  initBouquet();            /* bouquet.html */
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
