/** GET /api/session — l'appareil est-il connecté ? */
import { json } from '../lib/reponses.mjs';
import { sessionValide, configurationPresente } from '../lib/session.mjs';

export default async (req) => json({ connectee: sessionValide(req), configuree: configurationPresente() });

export const config = { path: '/api/session', method: 'GET' };
