/**
 * Lecture d'un classeur .xlsx dans le navigateur, sans bibliothèque.
 *
 * Un .xlsx est une archive zip de fichiers XML. On lit le répertoire central
 * du zip, on décompresse chaque fichier utile avec DecompressionStream
 * ('deflate-raw', natif dans les navigateurs récents), puis on lit le XML
 * avec DOMParser : classeur, liens vers les feuilles, chaînes partagées,
 * cellules (types s, inlineStr, str, b, n).
 *
 *   const classeur = await lireXlsx(fichier);
 *   classeur.feuilles['Mes coordonnées'] → [{ A: 'telephone', C: '06…' }, …]  (une entrée par ligne, index = n° de ligne)
 */
const decodeur = new TextDecoder('utf-8');

async function lireZip(octets) {
  const v = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  let fin = -1;
  for (let i = octets.length - 22; i >= Math.max(0, octets.length - 22 - 65535); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) throw new Error('Ce fichier n’est pas un classeur Excel (.xlsx).');
  const nombre = v.getUint16(fin + 10, true);
  let pos = v.getUint32(fin + 16, true);
  const entrees = new Map();
  for (let n = 0; n < nombre; n++) {
    if (v.getUint32(pos, true) !== 0x02014b50) throw new Error('Classeur abîmé (répertoire illisible).');
    const methode = v.getUint16(pos + 10, true);
    const tailleComp = v.getUint32(pos + 20, true);
    const lNom = v.getUint16(pos + 28, true), lExtra = v.getUint16(pos + 30, true), lCom = v.getUint16(pos + 32, true);
    const local = v.getUint32(pos + 42, true);
    const nom = decodeur.decode(octets.subarray(pos + 46, pos + 46 + lNom));
    entrees.set(nom, { methode, tailleComp, local });
    pos += 46 + lNom + lExtra + lCom;
  }
  return {
    noms: [...entrees.keys()],
    async lire(nom) {
      const e = entrees.get(nom);
      if (!e) return null;
      if (v.getUint32(e.local, true) !== 0x04034b50) throw new Error('Classeur abîmé.');
      const debut = e.local + 30 + v.getUint16(e.local + 26, true) + v.getUint16(e.local + 28, true);
      const donnees = octets.subarray(debut, debut + e.tailleComp);
      if (e.methode === 0) return decodeur.decode(donnees);
      if (e.methode !== 8) throw new Error('Classeur compressé d’une façon inconnue.');
      if (typeof DecompressionStream === 'undefined') throw new Error('Votre navigateur est trop ancien pour lire ce fichier. Mettez-le à jour, ou essayez depuis un ordinateur.');
      const flux = new Blob([donnees]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return decodeur.decode(await new Response(flux).arrayBuffer());
    },
  };
}

const xml = (texte) => new DOMParser().parseFromString(texte, 'application/xml');
/* Les espaces de noms varient selon le logiciel (Excel, LibreOffice, openpyxl) : on lit par nom local. */
const tous = (racine, nom) => [...racine.getElementsByTagNameNS('*', nom)];
const texteDe = (el) => tous(el, 't').map((t) => t.textContent).join('');

function cheminCible(cible) {
  const c = cible.replace(/^\//, '');
  return c.startsWith('xl/') ? c : `xl/${c.replace(/^\.\//, '')}`;
}

export async function lireXlsx(fichier) {
  const zip = await lireZip(new Uint8Array(await fichier.arrayBuffer()));
  const classeurXml = await zip.lire('xl/workbook.xml');
  if (!classeurXml) throw new Error('Ce fichier n’est pas un classeur Excel (.xlsx).');
  const liens = xml(await zip.lire('xl/_rels/workbook.xml.rels'));
  const cibles = Object.fromEntries(tous(liens, 'Relationship').map((r) => [r.getAttribute('Id'), r.getAttribute('Target')]));

  const partagees = [];
  const sst = await zip.lire('xl/sharedStrings.xml');
  if (sst) for (const si of tous(xml(sst), 'si')) partagees.push(texteDe(si));

  const feuilles = {};
  for (const f of tous(xml(classeurXml), 'sheet')) {
    const id = f.getAttribute('r:id') ?? [...f.attributes].find((a) => a.localName === 'id')?.value;
    const chemin = cheminCible(cibles[id] ?? '');
    const contenu = await zip.lire(chemin);
    if (!contenu) continue;
    const lignes = [];
    for (const c of tous(xml(contenu), 'c')) {
      const ref = /^([A-Z]+)(\d+)$/.exec(c.getAttribute('r') ?? '');
      if (!ref) continue;
      const type = c.getAttribute('t') ?? 'n';
      const v = tous(c, 'v')[0]?.textContent;
      let valeur = null;
      if (type === 's') valeur = partagees[Number(v)] ?? '';
      else if (type === 'inlineStr') valeur = texteDe(c);
      else if (type === 'str') valeur = v ?? '';
      else if (type === 'b') valeur = v === '1';
      else if (v !== undefined && v !== '') valeur = Number(v);
      if (valeur === null || valeur === '') continue;
      (lignes[Number(ref[2])] ??= {})[ref[1]] = valeur;
    }
    feuilles[f.getAttribute('name')] = lignes;
  }
  return { feuilles };
}

/** Numéro de série Excel → 'AAAA-MM-JJ' (calendrier 1900, base du 30/12/1899). */
export function dateExcel(n) {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n * 86400000));
  return d.toISOString().slice(0, 10);
}
/** Fraction de journée Excel → 'HH:MM'. */
export function heureExcel(n) {
  const minutes = Math.round((n % 1) * 1440);
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
