/* =============================================================================
   LE MOTEUR DE BRODERIE — emma-broderie.fr
   -----------------------------------------------------------------------------
   Bibliotheque autonome, sans aucune dependance, qui fait apparaitre de la
   vraie broderie animee : point de bourdon (satin), point avant, point de
   croix, tambour a broder, curseur aiguille.

   Activation automatique au chargement, par lecture des attributs data-* :

     data-broderie="prenom"            -> le texte s'ecrit en point de bourdon
       options : data-fil, data-duree, data-declencheur (visible|charge|survol),
                 data-epaisseur, data-pas, data-espacement
     data-broderie="fil"               -> un fil traverse la section au scroll
     data-broderie="tambour"           -> <figure><img> revele dans un tambour
     data-broderie="croix"             -> grille de points de croix
     data-broderie="aiguille-curseur"  -> curseur aiguille (souris uniquement)

   API publique : window.Broderie = { init(racine), rafraichir() }

   Regles respectees :
   - on n'anime que transform, opacity et les proprietes SVG ;
   - une seule boucle requestAnimationFrame partagee, arretee des que rien
     n'est visible ;
   - IntersectionObserver : rien ne tourne hors ecran ;
   - prefers-reduced-motion: reduce -> chaque effet s'affiche instantanement
     dans son etat final ;
   - le contenu reste lisible si ce fichier n'est pas charge (aucun
     opacity: 0 pose par la CSS sur du contenu reel).
============================================================================= */

const SVGNS = 'http://www.w3.org/2000/svg';

/* Palette de reference (surchargeable par data-fil ou par les variables CSS). */
const FIL_DEFAUT = '#6B5560';   /* mauve profond */
const BOIS_CLAIR = '#C9A97E';
const BOIS_FONCE = '#8A6A46';

/* -----------------------------------------------------------------------------
   1. ALPHABET MONOLINEAIRE
   -----------------------------------------------------------------------------
   Aucune API du navigateur ne donne acces au contour des glyphes d'une police.
   Or le point de bourdon ne se calcule PAS sur un contour : il se calcule sur
   la ligne mediane d'un trait, a laquelle on donne une largeur — exactement ce
   que fait un logiciel de broderie machine. On dessine donc ici un alphabet
   « monolineaire » (un seul trait par courbe, sans epaisseur), et le moteur
   l'habille de points perpendiculaires. C'est la voie la plus robuste : elle
   fonctionne pour n'importe quel prenom, sans police a telecharger ni parseur.

   Repere de dessin (coordonnees SVG, y vers le bas) :
     y = 0   haut des majuscules et des hampes (b, d, l, h, k, f, t)
     y = 40  haut des minuscules (hauteur d'x)
     y = 100 ligne de base
     y = 140 bas des jambages (g, j, p, q, y)

   Format : 'c' : [avance, [trait, trait, ...]]
   Un trait est soit un trace SVG, soit [trace, coefficient de largeur] quand
   il doit etre plus fin que le corps de la lettre (accents, points sur les i).
   Chaque trait est brode independamment, dans l'ordre, comme une vraie
   sequence de broderie (l'aiguille « saute » d'un trait au suivant).
----------------------------------------------------------------------------- */

/** Petit cercle ferme, utilise pour les points sur les i, j et les tremas. */
const rond = (cx, cy, r) => {
  const k = (r * 0.5523).toFixed(2);
  const R = (v) => +v.toFixed(2);
  return `M${R(cx)} ${R(cy - r)}C${R(cx + +k)} ${R(cy - r)} ${R(cx + r)} ${R(cy - +k)} ${R(cx + r)} ${R(cy)}` +
         `C${R(cx + r)} ${R(cy + +k)} ${R(cx + +k)} ${R(cy + r)} ${R(cx)} ${R(cy + r)}` +
         `C${R(cx - +k)} ${R(cy + r)} ${R(cx - r)} ${R(cy + +k)} ${R(cx - r)} ${R(cy)}` +
         `C${R(cx - r)} ${R(cy - +k)} ${R(cx - +k)} ${R(cy - r)} ${R(cx)} ${R(cy - r)}`;
};

const ALPHABET = {
  /* --- minuscules --- */
  a: [60, ['M48 56C42 44 26 39 16 51C5 64 5 84 18 94C28 102 42 97 48 87', 'M48 44C48 62 47 84 49 93C50 99 54 101 58 98']],
  b: [58, ['M14 4C17 34 12 76 14 92', 'M14 66C20 53 32 47 41 54C51 62 50 85 38 94C28 102 18 98 14 89']],
  c: [54, ['M50 56C44 44 30 39 20 49C7 61 9 84 22 93C32 101 44 97 51 87']],
  d: [60, ['M46 56C40 44 24 39 14 51C3 64 3 84 16 94C26 102 40 97 46 87', 'M46 2C48 30 45 60 46 92C46 99 50 101 55 98']],
  e: [56, ['M9 74C22 71 37 67 47 61C54 56 47 40 34 41C19 42 8 57 8 73C8 89 20 100 34 98C43 97 49 92 53 85']],
  f: [46, ['M35 8C26 13 22 30 22 52C22 80 20 112 16 128C13 138 6 141 1 134', 'M5 50L39 45']],
  g: [60, ['M46 54C40 42 24 37 14 49C3 62 3 82 16 92C26 100 40 95 46 85', 'M46 42C46 70 49 100 44 118C39 135 25 141 15 134']],
  h: [58, ['M12 4C15 34 10 76 12 96', 'M12 60C16 48 26 39 34 42C44 45 48 55 48 69L48 96']],
  i: [32, ['M12 44C12 60 10 82 14 92C17 99 24 101 29 96', [rond(14, 24, 4.2), 0.5]]],
  j: [34, ['M20 44C20 72 23 104 16 120C11 134 4 139 -1 132', [rond(20, 24, 4.2), 0.5]]],
  k: [56, ['M12 4C15 34 10 76 12 96', 'M12 72C24 66 36 56 45 43', 'M22 66C28 74 34 87 46 92C50 94 53 94 55 91']],
  l: [34, ['M14 4C17 34 12 74 14 88C16 98 24 101 30 94']],
  m: [84, ['M8 96L8 44', 'M8 60C11 48 20 39 28 42C36 45 40 53 40 67L40 96', 'M40 60C43 48 52 39 60 42C68 45 72 53 72 67L72 96']],
  n: [58, ['M10 96L10 44', 'M10 60C14 48 24 39 34 42C44 45 48 55 48 69L48 96']],
  o: [58, ['M30 41C16 41 9 57 9 70C9 86 19 98 31 98C45 98 52 82 52 68C52 52 42 41 30 41']],
  p: [58, ['M12 42C12 70 10 112 12 138', 'M12 62C18 48 32 39 42 47C52 56 52 82 40 92C30 100 18 96 12 86']],
  q: [58, ['M46 54C40 42 24 37 14 49C3 62 3 82 16 92C26 100 40 95 46 85', 'M46 42C46 74 45 112 48 132C50 138 54 139 58 135']],
  r: [48, ['M10 96L10 44', 'M10 62C14 50 22 41 32 41C38 41 42 45 43 51']],
  s: [46, ['M40 54C36 43 22 39 14 47C5 56 12 66 22 72C32 78 39 84 35 92C30 99 18 101 9 92']],
  t: [44, ['M22 12C22 40 20 74 22 88C24 98 32 101 39 94', 'M5 46L38 42']],
  u: [58, ['M10 44C10 60 8 80 12 90C16 99 28 101 36 92C42 86 46 68 48 44', 'M48 44C48 62 46 82 48 92C49 98 53 101 57 98']],
  v: [54, ['M8 44C9 62 16 84 24 93C30 99 36 94 40 84C44 72 47 56 48 44']],
  w: [76, ['M6 44C7 62 12 84 20 93C25 98 30 94 33 84C36 72 38 56 38 44C38 58 40 82 48 93C53 98 58 94 61 84C64 72 67 56 68 44']],
  x: [54, ['M8 46C18 58 34 80 46 94', 'M48 46C38 58 22 80 10 94']],
  y: [58, ['M10 44C10 62 8 82 12 90C16 98 28 101 36 92C42 86 46 66 48 44', 'M48 44C48 72 51 104 45 120C39 136 25 141 14 134']],
  z: [52, ['M10 46L44 43', 'M44 43C34 58 20 78 10 94', 'M10 94C22 96 36 96 47 91']],

  /* --- majuscules (premiere lettre d'un prenom) --- */
  A: [80, ['M7 100C20 70 34 32 44 4', 'M44 4C52 34 62 70 73 100', 'M22 70L61 70']],
  B: [72, ['M16 100L16 5', 'M16 5C40 5 58 12 58 28C58 42 44 50 20 50', 'M20 50C48 50 65 58 65 76C65 92 46 100 16 100']],
  C: [74, ['M67 24C57 7 34 1 20 16C3 33 3 74 20 90C34 104 57 98 67 81']],
  D: [76, ['M16 100L16 5', 'M16 5C46 5 68 22 68 53C68 84 46 100 16 100']],
  E: [66, ['M61 12C48 5 28 5 18 5', 'M18 5L18 100', 'M18 100C30 100 51 100 61 92', 'M18 51L47 51']],
  F: [62, ['M18 100L18 5', 'M18 5C32 5 50 5 61 11', 'M18 50L47 50']],
  G: [80, ['M67 24C57 7 34 1 20 16C3 33 3 74 20 90C37 106 63 97 67 77L67 57L49 57']],
  H: [82, ['M14 4L14 100', 'M67 4L67 100', 'M14 51L67 51']],
  I: [40, ['M20 5L20 100', 'M6 5L34 5', 'M6 100L34 100']],
  J: [54, ['M35 5C35 40 37 86 31 100C25 114 10 115 3 104', 'M18 5L50 5']],
  K: [76, ['M16 4L16 100', 'M16 58C36 46 56 26 67 4', 'M32 48C42 62 54 84 69 100']],
  L: [64, ['M18 4L18 100', 'M18 100C32 100 52 100 63 92']],
  M: [98, ['M12 100L12 5', 'M12 5L49 78', 'M49 78L85 5', 'M85 5L85 100']],
  N: [84, ['M14 100L14 5', 'M14 5L70 100', 'M70 100L70 5']],
  O: [82, ['M41 3C20 3 6 25 6 52C6 78 20 100 41 100C62 100 76 78 76 52C76 25 62 3 41 3']],
  P: [68, ['M18 100L18 5', 'M18 5C44 5 62 14 62 32C62 50 44 58 18 58']],
  Q: [84, ['M41 3C20 3 6 25 6 52C6 78 20 100 41 100C62 100 76 78 76 52C76 25 62 3 41 3', 'M50 76C60 88 71 102 79 111']],
  R: [76, ['M18 100L18 5', 'M18 5C42 5 60 13 60 30C60 47 42 54 18 54', 'M36 54C46 68 58 86 69 100']],
  S: [62, ['M53 20C46 6 26 1 16 12C4 25 12 41 28 50C44 60 55 70 51 84C46 98 24 104 11 92']],
  T: [70, ['M35 5L35 100', 'M5 5L65 5']],
  U: [82, ['M14 4C14 44 12 80 20 92C30 107 55 107 65 92C73 80 71 44 71 4']],
  V: [78, ['M8 4C14 40 26 76 39 100', 'M39 100C52 76 64 40 70 4']],
  W: [108, ['M6 4C10 40 20 76 30 100', 'M30 100C40 74 48 40 52 9', 'M52 9C58 42 66 76 76 100', 'M76 100C86 76 96 40 100 4']],
  X: [76, ['M12 4L65 100', 'M65 4L12 100']],
  Y: [76, ['M10 4C18 32 30 56 38 68', 'M38 68L38 100', 'M38 68C48 54 60 30 67 4']],
  Z: [68, ['M12 5L59 5', 'M59 5L12 100', 'M12 100L59 100']],

  /* --- signes utiles dans les prenoms composes --- */
  '-': [46, ['M7 73L40 71']],
  '’': [24, ['M14 18C16 28 14 37 10 43']],
  "'": [24, ['M14 18C16 28 14 37 10 43']],
  ' ': [30, []],
};

/* Accents, positionnes au-dessus du glyphe de base (centres sur son avance).
   Coefficient de largeur reduit : un accent est plus fin que le corps. */
const ACCENTS = {
  aigu: [['M-8 14L8 2', 0.62]],
  grave: [['M-8 2L8 14', 0.62]],
  circonflexe: [['M-9 14L0 2', 0.62], ['M0 2L9 14', 0.62]],
  trema: [[rond(-7, 9, 3), 0.4], [rond(7, 9, 3), 0.4]],
  tilde: [['M-10 11C-7 4 -3 13 1 9C5 5 8 9 10 6', 0.6]],
};
/* Cedille : sous la ligne de base, donc traitee a part. */
const CEDILLE = [['M25 97C24 110 32 117 41 111', 0.68]];

/* Decomposition des caracteres accentues : [base, accent] */
const COMPOSES = {
  'à': ['a', 'grave'], 'â': ['a', 'circonflexe'], 'ä': ['a', 'trema'], 'á': ['a', 'aigu'],
  'é': ['e', 'aigu'], 'è': ['e', 'grave'], 'ê': ['e', 'circonflexe'], 'ë': ['e', 'trema'],
  'î': ['i', 'circonflexe'], 'ï': ['i', 'trema'], 'í': ['i', 'aigu'], 'ì': ['i', 'grave'],
  'ô': ['o', 'circonflexe'], 'ö': ['o', 'trema'], 'ó': ['o', 'aigu'], 'õ': ['o', 'tilde'],
  'û': ['u', 'circonflexe'], 'ü': ['u', 'trema'], 'ù': ['u', 'grave'], 'ú': ['u', 'aigu'],
  'ÿ': ['y', 'trema'], 'ñ': ['n', 'tilde'],
  'É': ['E', 'aigu'], 'È': ['E', 'grave'], 'Ê': ['E', 'circonflexe'], 'Ë': ['E', 'trema'],
  'À': ['A', 'grave'], 'Â': ['A', 'circonflexe'], 'Ä': ['A', 'trema'],
  'Î': ['I', 'circonflexe'], 'Ï': ['I', 'trema'],
  'Ô': ['O', 'circonflexe'], 'Ö': ['O', 'trema'],
  'Û': ['U', 'circonflexe'], 'Ü': ['U', 'trema'],
  'Ç': ['C', 'cedille'], 'ç': ['c', 'cedille'],
};

/* Les accents des minuscules se posent plus bas que ceux des majuscules.
   Valeurs calees pour qu'un accent ne touche jamais le corps de la lettre,
   bourdon compris. */
const HAUTEUR_ACCENT_MIN = 8;
const HAUTEUR_ACCENT_MAJ = -26;

/* Cadre vertical FIXE : tous les prenoms s'alignent donc de la meme maniere,
   qu'ils aient ou non des jambages ou des accents. */
const CADRE_HAUT = -30;
const CADRE_BAS = 152;

/* -----------------------------------------------------------------------------
   2. OUTILS
----------------------------------------------------------------------------- */

const el = (nom, attrs) => {
  const n = document.createElementNS(SVGNS, nom);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

/** Mouvement reduit demande par le systeme ? (relu a chaque appel) */
const mouvementReduit = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Un unique <path> hors ecran sert de regle de mesure pour tous les traces.
   Il doit etre dans le document (et non en display:none) pour que
   getTotalLength / getPointAtLength fonctionnent partout. */
let regle = null;
function mesureur() {
  if (!regle) {
    const s = el('svg', { width: '0', height: '0', 'aria-hidden': 'true' });
    s.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden');
    regle = el('path');
    s.appendChild(regle);
    document.body.appendChild(s);
  }
  return regle;
}

/* Bruit deterministe : deux rendus du meme prenom se ressemblent,
   mais les points ne sont jamais parfaitement alignes (main humaine). */
function graine(chaine) {
  let h = 2166136261;
  for (let i = 0; i < chaine.length; i++) { h ^= chaine.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 10000) / 10000; };
}

/* -----------------------------------------------------------------------------
   3. BOUCLE D'ANIMATION PARTAGEE
   Une seule requestAnimationFrame pour tout le moteur. Elle s'arrete d'elle
   meme des qu'aucune animation n'est active.
----------------------------------------------------------------------------- */

const actifs = new Set();
let idFrame = 0;

function tourne(t) {
  idFrame = 0;
  for (const a of actifs) {
    let vivant = true;
    try { vivant = a.tic(t); } catch (e) { vivant = false; }
    if (vivant === false) actifs.delete(a);
  }
  if (actifs.size) idFrame = requestAnimationFrame(tourne);
}
function demarre(a) {
  actifs.add(a);
  if (!idFrame) idFrame = requestAnimationFrame(tourne);
}
function arrete(a) { actifs.delete(a); }

/* -----------------------------------------------------------------------------
   4. GENERATION DES POINTS
----------------------------------------------------------------------------- */

/**
 * POINT DE BOURDON (satin stitch).
 * Echantillonne un trace, calcule la normale en chaque point et pose un point
 * perpendiculaire a la ligne mediane. C'est le principe exact du bourdon :
 * des points serres qui traversent le trait de part en part.
 *
 * @param {string} d       trace SVG
 * @param {number} largeur largeur du bourdon (unites de dessin)
 * @param {number} pas     ecart entre deux piqures
 * @param {function} rnd   generateur de bruit
 * @returns {Array<[number,number,number,number]>} segments [x1,y1,x2,y2]
 */
function pointsDeBourdon(d, largeur, pas, rnd) {
  const p = mesureur();
  p.setAttribute('d', d);
  const L = p.getTotalLength();
  const segments = [];
  if (!isFinite(L) || L <= 0) return segments;

  const eps = Math.min(1.2, L / 40);
  const demi = largeur / 2;

  /* Avance a pas VARIABLE. Sur une courbe, les points s'ecartent en eventail
     du cote exterieur : une brodeuse resserre alors sa densite. On divise donc
     le pas par (1 + rayon du bourdon x courbure), ce qui garde un ecart
     constant sur le bord exterieur. */
  let s = 0;
  let securite = 0;
  while (s <= L && securite++ < 6000) {
    const c = p.getPointAtLength(s);
    const a = p.getPointAtLength(Math.max(0, s - eps));
    const b = p.getPointAtLength(Math.min(L, s + eps));
    let tx = b.x - a.x, ty = b.y - a.y;
    const m = Math.hypot(tx, ty) || 1;
    tx /= m; ty /= m;

    /* Courbure locale : variation d'angle par unite de longueur. */
    const a1 = Math.atan2(c.y - a.y, c.x - a.x);
    const a2 = Math.atan2(b.y - c.y, b.x - c.x);
    let dA = a2 - a1;
    while (dA > Math.PI) dA -= 2 * Math.PI;
    while (dA < -Math.PI) dA += 2 * Math.PI;
    const courbure = Math.abs(dA) / eps;

    /* Normale + legere inclinaison aleatoire : un bourdon a la main n'est
       jamais parfaitement perpendiculaire. */
    const incl = (rnd() - 0.5) * 0.16;
    const nx = -ty * Math.cos(incl) - tx * Math.sin(incl);
    const ny = tx * Math.cos(incl) - ty * Math.sin(incl);

    /* Affinage aux deux extremites du trait : les points raccourcissent,
       comme une plume qui attaque et qui leve. */
    const t = s / L;
    const bord = Math.min(t, 1 - t) / 0.14;
    const affine = bord >= 1 ? 1 : 0.58 + 0.42 * Math.sin((Math.PI / 2) * bord);
    const h = demi * affine * (0.94 + rnd() * 0.12);

    const jx = (rnd() - 0.5) * 0.5, jy = (rnd() - 0.5) * 0.5;
    segments.push([
      +(c.x + nx * h + jx).toFixed(2), +(c.y + ny * h + jy).toFixed(2),
      +(c.x - nx * h + jx).toFixed(2), +(c.y - ny * h + jy).toFixed(2),
    ]);

    const avance = pas / (1 + demi * courbure * 0.92);
    s += Math.max(pas * 0.26, Math.min(pas, avance));
    /* on force le tout dernier point exactement au bout du trait */
    if (s > L && s - avance < L - pas * 0.3) s = L;
  }
  return segments;
}

/**
 * POINT AVANT (running stitch) : des tirets successifs POSES SUR le trace.
 * Sert au fil qui traverse la page.
 */
function pointsAvant(d, pas, longueur) {
  const p = mesureur();
  p.setAttribute('d', d);
  const L = p.getTotalLength();
  const segments = [];
  if (!isFinite(L) || L <= 0) return segments;
  for (let s = 0; s + longueur <= L; s += pas) {
    const a = p.getPointAtLength(s);
    const b = p.getPointAtLength(s + longueur);
    segments.push([+a.x.toFixed(1), +a.y.toFixed(1), +b.x.toFixed(1), +b.y.toFixed(1)]);
  }
  return segments;
}

/* -----------------------------------------------------------------------------
   5. L'AIGUILLE
   Pointe a l'origine (0,0), corps vers le haut. On la place par
   transform="translate(x y) rotate(a)" : pas de reflow, uniquement du GPU.
----------------------------------------------------------------------------- */

function creeAiguille(taille, couleurFil) {
  const g = el('g', { class: 'broderie-aiguille', 'aria-hidden': 'true' });
  const inner = el('g', { transform: `scale(${taille})` });
  inner.appendChild(el('path', {
    class: 'broderie-aiguille-corps',
    d: 'M0 0 L1.15 -8 L1.15 -43 Q0 -47 -1.15 -43 L-1.15 -8 Z',
  }));
  inner.appendChild(el('path', { class: 'broderie-aiguille-reflet', d: 'M-0.35 -10 L-0.35 -40' }));
  inner.appendChild(el('ellipse', { class: 'broderie-aiguille-chas', cx: 0, cy: -36, rx: 0.5, ry: 2.6 }));
  inner.appendChild(el('path', {
    class: 'broderie-aiguille-fil', stroke: couleurFil,
    d: 'M0 -36 C 6 -40 9 -48 5 -55 C 2 -60 -4 -59 -6 -54',
  }));
  g.appendChild(inner);
  return g;
}

/* -----------------------------------------------------------------------------
   6. DECLENCHEURS
----------------------------------------------------------------------------- */

let observateur = null;
const aLaVue = new WeakMap();

function surVisible(noeud, callback, marge) {
  if (!('IntersectionObserver' in window)) { callback(); return; }
  if (!observateur) {
    observateur = new IntersectionObserver((entrees) => {
      for (const e of entrees) {
        const fn = aLaVue.get(e.target);
        if (!fn) continue;
        fn(e.isIntersecting);
      }
    }, { rootMargin: marge || '0px 0px -12% 0px', threshold: 0.01 });
  }
  aLaVue.set(noeud, callback);
  observateur.observe(noeud);
}

/** Cablage commun : lit data-declencheur et appelle demarrer() au bon moment. */
function cableDeclencheur(noeud, demarrer, options) {
  const mode = noeud.dataset.declencheur || 'visible';
  const opt = options || {};
  if (mouvementReduit()) { demarrer(true); return; }
  if (mode === 'charge') { demarrer(); return; }
  if (mode === 'survol') {
    let fait = false;
    const go = () => { if (!fait) { fait = true; demarrer(); } };
    noeud.addEventListener('mouseenter', go);
    noeud.addEventListener('focusin', go);
    /* Sur tactile il n'y a pas de survol : on retombe sur la visibilite. */
    if (!window.matchMedia('(hover: hover)').matches) surVisible(noeud, (v) => { if (v) go(); });
    return;
  }
  /* mode "visible" */
  let fait = false;
  surVisible(noeud, (v) => {
    if (v && !fait) { fait = true; demarrer(); }
    else if (!v && opt.suspendreHorsEcran) opt.suspendreHorsEcran();
    else if (v && opt.reprendre) opt.reprendre();
  });
}

/* =============================================================================
   EFFET 1 — data-broderie="prenom"
   Le prenom s'ecrit en point de bourdon, point par point.
============================================================================= */

function effetPrenom(noeud) {
  const texte = (noeud.textContent || '').trim();
  if (!texte) return;

  const couleur = noeud.dataset.fil || getComputedStyle(noeud).getPropertyValue('--broderie-fil').trim() || FIL_DEFAUT;
  const duree = Math.max(300, parseInt(noeud.dataset.duree, 10) || 2600);
  const largeur = parseFloat(noeud.dataset.epaisseur) || 13;
  const pas = parseFloat(noeud.dataset.pas) || 2.9;
  const espacement = parseFloat(noeud.dataset.espacement);
  const chasse = isNaN(espacement) ? 4 : espacement;
  const rnd = graine(texte + largeur);

  /* --- Composition : on aligne les glyphes et on genere leurs points. --- */
  const traces = [];      /* traces « crayon » (guide pale, visible d'emblee) */
  const points = [];      /* tous les points de bourdon, dans l'ordre */
  let x = 0;
  let inconnus = [];

  for (const ch of Array.from(texte)) {
    let base = ch, accent = null;
    if (COMPOSES[ch]) { base = COMPOSES[ch][0]; accent = COMPOSES[ch][1]; }
    let g = ALPHABET[base];
    if (!g) { g = ALPHABET[base.toLowerCase()] || ALPHABET[base.toUpperCase()]; }
    if (!g) { inconnus.push({ ch, x }); x += 44 + chasse; continue; }

    const [avance, formes] = g;
    /* Normalisation : chaque trait devient [trace, coefficient de largeur]. */
    const listes = formes.map((f) => (typeof f === 'string' ? [f, 1] : f));

    if (accent) {
      const majuscule = base === base.toUpperCase() && base !== base.toLowerCase();
      if (accent === 'cedille') {
        listes.push(...CEDILLE);
      } else {
        const cx = avance / 2;
        const cy = majuscule ? HAUTEUR_ACCENT_MAJ : HAUTEUR_ACCENT_MIN;
        for (const [a, k] of ACCENTS[accent]) listes.push([decale(a, cx, cy), k]);
      }
    }

    for (const [d, k] of listes) {
      const dd = decale(d, x, 0);
      traces.push(dd);
      points.push(...pointsDeBourdon(dd, largeur * k, pas * (k < 1 ? 0.82 : 1), rnd));
    }
    x += avance + chasse;
  }

  const largeurTotale = Math.max(x - chasse, 40);
  const marge = largeur * 0.9 + 6;
  const vbX = -marge, vbY = CADRE_HAUT;
  const vbW = largeurTotale + marge * 2;
  const vbH = CADRE_BAS - CADRE_HAUT;

  /* --- Construction du SVG --- */
  const svg = el('svg', {
    class: 'broderie-prenom', 'aria-hidden': 'true', focusable: 'false',
    viewBox: `${vbX} ${vbY} ${vbW} ${vbH}`,
    preserveAspectRatio: 'xMidYMid meet',
  });
  svg.style.setProperty('--broderie-ratio', (vbW / vbH).toFixed(4));

  const gTrace = el('g', { class: 'broderie-trace' });
  for (const d of traces) gTrace.appendChild(el('path', { d }));
  svg.appendChild(gTrace);

  const gPoints = el('g', { class: 'broderie-points', stroke: couleur });
  const noeudsPoints = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    const [x1, y1, x2, y2] = points[i];
    const ln = el('line', { x1, y1, x2, y2 });
    /* Trois nuances de brillance : le fil accroche la lumiere. */
    const n = (i * 7 + ((i * i) % 5)) % 9;
    if (n < 2) ln.setAttribute('class', 'lustre');
    else if (n > 6) ln.setAttribute('class', 'mat');
    gPoints.appendChild(ln);
    noeudsPoints[i] = ln;
  }
  svg.appendChild(gPoints);

  /* Caracteres hors alphabet : rendus en texte SVG, jamais perdus. */
  for (const inc of inconnus) {
    const t = el('text', { class: 'broderie-inconnu', x: inc.x + 4, y: 100, fill: couleur });
    t.textContent = inc.ch;
    svg.appendChild(t);
  }

  const aiguille = creeAiguille(1.25, couleur);
  svg.appendChild(aiguille);

  /* --- Remplacement du texte, en gardant l'accessibilite --- */
  const lu = document.createElement('span');
  lu.className = 'broderie-lu';
  lu.textContent = texte;
  noeud.textContent = '';
  noeud.appendChild(lu);
  noeud.appendChild(svg);
  noeud.classList.add('broderie-prenom-pret');

  /* --- Animation : on n'allume que les points franchis dans la frame. --- */
  const total = points.length;
  let indice = 0, t0 = 0, enCours = false;

  const machine = {
    tic(t) {
      if (!t0) t0 = t;
      const avancement = Math.min(1, (t - t0) / duree);
      /* Legere acceleration puis ralentissement : un geste, pas un metronome. */
      const e = avancement < 0.5
        ? 2 * avancement * avancement
        : 1 - Math.pow(-2 * avancement + 2, 2) / 2;
      const cible = Math.min(total, Math.round(e * total));

      while (indice < cible) {
        noeudsPoints[indice].classList.add('pique');
        indice++;
      }

      /* L'aiguille se place sur le dernier point, avec un balancement. */
      const der = points[Math.min(total - 1, Math.max(0, indice - 1))];
      if (der) {
        const px = (der[0] + der[2]) / 2, py = (der[1] + der[3]) / 2;
        const angle = -26 + Math.sin(t / 95) * 5;
        const lift = Math.abs(Math.sin(t / 42)) * 2.2;
        aiguille.setAttribute('transform', `translate(${px.toFixed(1)} ${(py - lift).toFixed(1)}) rotate(${angle.toFixed(1)})`);
      }

      if (avancement >= 1) {
        svg.classList.add('broderie-fini');
        enCours = false;
        return false;
      }
      return true;
    },
  };

  const demarrer = (instantane) => {
    if (instantane) {
      for (const n of noeudsPoints) n.classList.add('pique', 'sans-anim');
      svg.classList.add('broderie-fini');
      return;
    }
    if (enCours) return;
    enCours = true; t0 = 0; indice = 0;
    svg.classList.add('broderie-en-cours');
    svg.classList.remove('broderie-fini');
    for (const n of noeudsPoints) n.classList.remove('pique');
    demarre(machine);
  };

  /** Pose directement l'etat correspondant a une fraction (0 -> 1), sans
      animation : sert a la page de demonstration et a l'etat final force. */
  function poser(f) {
    arrete(machine);
    enCours = false;
    const cible = Math.round(Math.max(0, Math.min(1, f)) * total);
    for (let i = 0; i < total; i++) {
      noeudsPoints[i].classList.toggle('pique', i < cible);
      noeudsPoints[i].classList.add('sans-anim');
    }
    indice = cible;
    const der = points[Math.max(0, cible - 1)];
    if (der) {
      aiguille.setAttribute('transform',
        `translate(${((der[0] + der[2]) / 2).toFixed(1)} ${((der[1] + der[3]) / 2).toFixed(1)}) rotate(-26)`);
    }
    svg.classList.toggle('broderie-en-cours', cible > 0 && cible < total);
    svg.classList.toggle('broderie-fini', cible >= total);
  }

  noeud.__broderie = { rejouer: () => demarrer(false), poser, points: total };
  cableDeclencheur(noeud, demarrer);
}

/** Decale un trace SVG (uniquement des commandes absolues M/C/L/Q). */
function decale(d, dx, dy) {
  if (!dx && !dy) return d;
  let pair = 0;
  return d.replace(/-?\d*\.?\d+/g, (m) => {
    const v = parseFloat(m) + (pair++ % 2 === 0 ? dx : dy);
    return String(+v.toFixed(2));
  });
}

/* =============================================================================
   EFFET 2 — data-broderie="fil"
   Un fil sinueux traverse le conteneur, se brode au rythme du defilement,
   precede d'une aiguille qui se balance. Toujours DERRIERE le contenu.
============================================================================= */

function effetFil(noeud) {
  const couleur = noeud.dataset.fil || FIL_DEFAUT;
  const svg = el('svg', { class: 'broderie-fil-couche', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'none' });
  const gPoints = el('g', { class: 'broderie-fil-points', stroke: couleur });
  const gGuide = el('path', { class: 'broderie-fil-guide' });
  svg.appendChild(gGuide);
  svg.appendChild(gPoints);
  const aiguille = creeAiguille(1.9, couleur);
  svg.appendChild(aiguille);
  noeud.classList.add('broderie-fil-hote');
  noeud.insertBefore(svg, noeud.firstChild);

  let segs = [], noeuds = [], W = 0, H = 0, haut = 0, montre = -1;

  function construit() {
    const r = noeud.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    haut = r.top + window.scrollY;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    /* Trace sinueux : des ancres alternees a gauche et a droite, reliees en
       courbes lisses (S) pour une continuite parfaite. */
    const n = Math.min(14, Math.max(3, Math.round(H / 480)));
    const g = graine('fil' + W + H);
    const ax = (i) => {
      const cote = i % 2 === 0 ? 0.2 : 0.8;
      return (cote + (g() - 0.5) * 0.14) * W;
    };
    let d = `M${(0.5 * W).toFixed(1)} 0`;
    const pas = H / n;
    for (let i = 1; i <= n; i++) {
      const y = i * pas;
      const x = i === n ? 0.5 * W : ax(i);
      const cy = y - pas * 0.5;
      d += i === 1
        ? ` C${ax(0).toFixed(1)} ${(pas * 0.35).toFixed(1)} ${x.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`
        : ` S${x.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    gGuide.setAttribute('d', d);

    segs = pointsAvant(d, Math.max(13, W * 0.022), Math.max(8, W * 0.014));
    gPoints.textContent = '';
    noeuds = segs.map(([x1, y1, x2, y2]) => {
      const l = el('line', { x1, y1, x2, y2 });
      gPoints.appendChild(l);
      return l;
    });
    montre = -1;
  }

  function place(i, t) {
    const s = segs[Math.max(0, Math.min(segs.length - 1, i))];
    if (!s) return;
    const a = Math.atan2(s[3] - s[1], s[2] - s[0]) * 180 / Math.PI;
    const balance = Math.sin(t / 260) * 7;
    aiguille.setAttribute('transform', `translate(${s[2]} ${s[3]}) rotate(${(a - 90 + balance).toFixed(1)})`);
  }

  function applique(cible, t) {
    if (cible === montre) return;
    if (cible > montre) { for (let i = montre + 1; i <= cible; i++) noeuds[i] && noeuds[i].classList.add('pique'); }
    else { for (let i = montre; i > cible; i--) noeuds[i] && noeuds[i].classList.remove('pique'); }
    montre = cible;
    place(cible, t);
  }

  const machine = {
    tic(t) {
      const vh = window.innerHeight;
      /* Aucune lecture de layout ici : haut et H sont en cache. */
      const p = (window.scrollY + vh * 0.72 - haut) / Math.max(1, H + vh * 0.2);
      const clamp = Math.max(0, Math.min(1, p));
      applique(Math.round(clamp * (segs.length - 1)), t);
      svg.classList.toggle('broderie-fil-actif', clamp > 0.001 && clamp < 0.999);
      return true;
    },
  };

  let visible = false;
  function etat(v) {
    visible = v;
    if (v && !mouvementReduit()) demarre(machine); else arrete(machine);
  }

  construit();
  if (mouvementReduit()) {
    for (const n of noeuds) n.classList.add('pique', 'sans-anim');
    montre = noeuds.length - 1;
    place(montre, 0);
    aiguille.style.display = 'none';
  } else {
    surVisible(noeud, etat, '30% 0px 30% 0px');
  }

  noeud.__broderie = {
    rafraichir() {
      construit();
      if (mouvementReduit()) { for (const n of noeuds) n.classList.add('pique', 'sans-anim'); }
      else if (visible) demarre(machine);
    },
    /** Force l'etat du fil a une fraction donnee, sans defilement. */
    poser(f) {
      arrete(machine);
      const cible = Math.round(Math.max(0, Math.min(1, f)) * (noeuds.length - 1));
      for (let i = 0; i < noeuds.length; i++) {
        noeuds[i].classList.toggle('pique', i <= cible);
        noeuds[i].classList.add('sans-anim');
      }
      montre = cible;
      place(cible, 0);
      svg.classList.toggle('broderie-fil-actif', f > 0.001 && f < 0.999);
    },
    get points() { return noeuds.length; },
  };
}

/* =============================================================================
   EFFET 3 — data-broderie="tambour"
   L'image est revelee a travers un cercle de tambour qui se serre.
============================================================================= */

function effetTambour(noeud) {
  const img = noeud.querySelector('img');
  if (!img) return;

  /* On enveloppe l'image : le disque porte le recadrage, l'image compense
     l'echelle. Seules des transformations sont animees. */
  const disque = document.createElement('span');
  disque.className = 'broderie-tambour-disque';
  img.parentNode.insertBefore(disque, img);
  disque.appendChild(img);

  const anneau = el('svg', { class: 'broderie-tambour-anneau', viewBox: '0 0 200 200', 'aria-hidden': 'true', focusable: 'false' });
  const C = 2 * Math.PI * 94;
  anneau.appendChild(el('circle', { class: 'broderie-anneau-ombre', cx: 100, cy: 100, r: 94 }));
  const trait = el('circle', {
    class: 'broderie-anneau-bois', cx: 100, cy: 100, r: 94,
    'stroke-dasharray': C.toFixed(1), 'stroke-dashoffset': C.toFixed(1),
  });
  anneau.appendChild(trait);
  anneau.appendChild(el('circle', { class: 'broderie-anneau-liserre', cx: 100, cy: 100, r: 88 }));
  /* La vis de serrage, en haut. */
  const vis = el('g', { class: 'broderie-tambour-vis' });
  vis.appendChild(el('path', { d: 'M92 12 L108 12 L110 2 L90 2 Z' }));
  vis.appendChild(el('circle', { cx: 96.5, cy: 7, r: 1.8, class: 'broderie-vis-tete' }));
  vis.appendChild(el('circle', { cx: 103.5, cy: 7, r: 1.8, class: 'broderie-vis-tete' }));
  anneau.appendChild(vis);
  /* L'anneau vit DANS le disque : il suit donc exactement son echelle
     pendant le serrage, sans transformation a synchroniser. */
  disque.appendChild(anneau);

  noeud.classList.add('broderie-tambour-pret');

  const demarrer = (instantane) => {
    trait.style.strokeDashoffset = '0';
    if (instantane) noeud.classList.add('broderie-tambour-serre', 'sans-anim');
    else noeud.classList.add('broderie-tambour-serre');
  };
  noeud.__broderie = {
    rejouer() {
      noeud.classList.remove('broderie-tambour-serre', 'sans-anim');
      trait.style.strokeDashoffset = C.toFixed(1);
      /* force un reflow volontaire, hors boucle d'animation */
      void noeud.offsetWidth;
      demarrer(false);
    },
    /** 0 = tambour desserre, 1 = tambour serre, sans transition. */
    poser(f) {
      trait.style.strokeDashoffset = f >= 0.5 ? '0' : C.toFixed(1);
      noeud.classList.add('sans-anim');
      noeud.classList.toggle('broderie-tambour-serre', f >= 0.5);
    },
  };
  cableDeclencheur(noeud, demarrer);
}

/* =============================================================================
   EFFET 4 — data-broderie="croix"
   Une grille de points de croix qui se remplit dans un ordre legerement
   aleatoire, comme une vraie broderie a la main.
============================================================================= */

const MOTIFS = {
  bande: () => true,
  vague: (c, l, C, L) => {
    const y = (Math.sin((c / C) * Math.PI * 2) * 0.5 + 0.5) * (L - 1);
    return Math.abs(l - y) < 0.85;
  },
  losange: (c, l, C, L) => {
    const dx = Math.abs(c - (C - 1) / 2) / ((C - 1) / 2 || 1);
    const dy = Math.abs(l - (L - 1) / 2) / ((L - 1) / 2 || 1);
    return dx + dy <= 1.02;
  },
  coeur: (c, l, C, L) => {
    const x = (c / (C - 1)) * 2 - 1;
    const y = 1 - (l / (L - 1)) * 2;
    const a = x * x + (y - Math.abs(x) * 0.72) * (y - Math.abs(x) * 0.72);
    return a <= 0.82;
  },
};

function effetCroix(noeud) {
  const couleur = noeud.dataset.fil || FIL_DEFAUT;
  const C = Math.max(1, parseInt(noeud.dataset.colonnes, 10) || 26);
  const L = Math.max(1, parseInt(noeud.dataset.lignes, 10) || 3);
  const duree = Math.max(200, parseInt(noeud.dataset.duree, 10) || 1400);
  const motif = MOTIFS[noeud.dataset.motif] || MOTIFS.bande;
  const cell = 12;

  const svg = el('svg', {
    class: 'broderie-croix', 'aria-hidden': 'true', focusable: 'false',
    viewBox: `0 0 ${C * cell} ${L * cell}`, width: C * cell, height: L * cell,
  });
  const g = el('g', { stroke: couleur });
  const liste = [];
  const rnd = graine('croix' + C + L + (noeud.dataset.motif || ''));
  for (let l = 0; l < L; l++) {
    for (let c = 0; c < C; c++) {
      if (!motif(c, l, C, L)) continue;
      const x = c * cell, y = l * cell, m = 2.1;
      const p = el('path', {
        d: `M${x + m} ${y + m}L${x + cell - m} ${y + cell - m}M${x + cell - m} ${y + m}L${x + m} ${y + cell - m}`,
      });
      g.appendChild(p);
      /* ordre = position + bruit : on progresse globalement de gauche a
         droite mais sans regularite mecanique */
      liste.push({ n: p, ordre: (l * C + c) + (rnd() - 0.5) * C * 0.9 });
    }
  }
  liste.sort((a, b) => a.ordre - b.ordre);
  svg.appendChild(g);
  noeud.appendChild(svg);
  noeud.classList.add('broderie-croix-pret');

  let i = 0, t0 = 0;
  const machine = {
    tic(t) {
      if (!t0) t0 = t;
      const cible = Math.min(liste.length, Math.round(((t - t0) / duree) * liste.length));
      while (i < cible) { liste[i].n.classList.add('pique'); i++; }
      if (i >= liste.length) return false;
      return true;
    },
  };

  const demarrer = (instantane) => {
    if (instantane) { for (const o of liste) o.n.classList.add('pique', 'sans-anim'); return; }
    i = 0; t0 = 0;
    for (const o of liste) o.n.classList.remove('pique');
    demarre(machine);
  };
  function poser(f) {
    arrete(machine);
    const cible = Math.round(Math.max(0, Math.min(1, f)) * liste.length);
    for (let k = 0; k < liste.length; k++) {
      liste[k].n.classList.toggle('pique', k < cible);
      liste[k].n.classList.add('sans-anim');
    }
    i = cible;
  }
  noeud.__broderie = { rejouer: () => demarrer(false), poser, points: liste.length };
  cableDeclencheur(noeud, demarrer);
}

/* =============================================================================
   EFFET 5 — data-broderie="aiguille-curseur"
   Sur ordinateur uniquement (pointeur fin) : le curseur devient une aiguille
   qui laisse un fil qui s'estompe. Jamais sur tactile.
============================================================================= */

function effetCurseur(noeud) {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (mouvementReduit()) return;
  if (document.querySelector('.broderie-curseur')) return;

  const couleur = noeud.dataset.fil || FIL_DEFAUT;
  const svg = el('svg', { class: 'broderie-curseur', 'aria-hidden': 'true', focusable: 'false' });
  const gFil = el('g', { class: 'broderie-curseur-fil', stroke: couleur });
  const N = 14;
  const segs = [];
  for (let i = 0; i < N; i++) {
    const l = el('line', { x1: 0, y1: 0, x2: 0, y2: 0 });
    l.setAttribute('opacity', '0');
    gFil.appendChild(l);
    segs.push(l);
  }
  svg.appendChild(gFil);
  const aiguille = creeAiguille(1.05, couleur);
  svg.appendChild(aiguille);
  document.body.appendChild(svg);
  document.documentElement.classList.add('broderie-curseur-actif');

  let sx = -200, sy = -200, x = -200, y = -200;
  const trace = [];
  let bouge = 0;

  const onMove = (e) => {
    sx = e.clientX; sy = e.clientY;
    bouge = performance.now();
    demarre(machine);
  };
  const onOut = () => { svg.classList.add('broderie-curseur-parti'); };
  const onIn = () => { svg.classList.remove('broderie-curseur-parti'); };

  const machine = {
    tic(t) {
      /* poursuite douce : l'aiguille traine un peu derriere la souris */
      x += (sx - x) * 0.3;
      y += (sy - y) * 0.3;
      const ang = -32 + Math.sin(t / 220) * 3;
      aiguille.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`);

      /* le fil : un point avant pose tous les 16 px parcourus */
      const d = trace.length ? Math.hypot(x - trace[0][0], y - trace[0][1]) : 99;
      if (d > 16) trace.unshift([x, y]);
      if (trace.length > N + 1) trace.length = N + 1;
      for (let i = 0; i < N; i++) {
        const a = trace[i], b = trace[i + 1];
        const l = segs[i];
        if (!a || !b) { l.setAttribute('opacity', '0'); continue; }
        l.setAttribute('x1', a[0].toFixed(1)); l.setAttribute('y1', a[1].toFixed(1));
        l.setAttribute('x2', b[0].toFixed(1)); l.setAttribute('y2', b[1].toFixed(1));
        l.setAttribute('opacity', (0.5 * (1 - i / N)).toFixed(2));
      }

      /* la souris est immobile depuis longtemps : on laisse le fil se vider
         puis on rend la main (boucle arretee) */
      if (t - bouge > 900) {
        if (trace.length) { trace.pop(); return true; }
        return false;
      }
      return true;
    },
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('mouseleave', onOut);
  document.addEventListener('mouseenter', onIn);
}

/* =============================================================================
   INITIALISATION
============================================================================= */

const EFFETS = {
  prenom: effetPrenom,
  fil: effetFil,
  tambour: effetTambour,
  croix: effetCroix,
  'aiguille-curseur': effetCurseur,
};

function init(racine) {
  const r = racine || document;
  const noeuds = r.querySelectorAll('[data-broderie]');
  for (const n of noeuds) {
    if (n.dataset.broderiePret === '1') continue;
    const fn = EFFETS[n.dataset.broderie];
    if (!fn) continue;
    n.dataset.broderiePret = '1';
    try { fn(n); } catch (e) {
      n.dataset.broderiePret = 'erreur';
      if (window.console) console.warn('[broderie]', n.dataset.broderie, e);
    }
  }
}

/** A appeler apres un changement de mise en page (resize, contenu injecte). */
function rafraichir() {
  init(document);
  for (const n of document.querySelectorAll('[data-broderie="fil"]')) {
    if (n.__broderie && n.__broderie.rafraichir) n.__broderie.rafraichir();
  }
}

let tempoResize = 0;
window.addEventListener('resize', () => {
  clearTimeout(tempoResize);
  tempoResize = setTimeout(rafraichir, 220);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init(document), { once: true });
} else {
  init(document);
}

window.Broderie = { init, rafraichir, ALPHABET };
export { init, rafraichir, ALPHABET, pointsDeBourdon };
export default { init, rafraichir };
