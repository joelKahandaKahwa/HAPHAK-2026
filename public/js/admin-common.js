/* ============================================
   Utilitaires partagés de l'administration
   ============================================ */

const Admin = (() => {
  const LIENS = [
    { href: '/admin', texte: 'Tableau de bord' },
    { href: '/admin/registrations', texte: 'Participants' },
    { href: '/admin/scanner', texte: 'Scanner' },
    { href: '/admin/attendance', texte: 'Présences' },
    { href: '/admin/settings', texte: 'Paramètres' },
  ];

  function rendreChrome(actif) {
    const barre = document.getElementById('barre-admin');
    if (!barre) return;

    barre.innerHTML = `
      <div class="barre">
        <div class="enveloppe barre__interieur">
          <a class="barre__marque" href="/admin">HAPHAK <span>ADMIN</span></a>
          <button type="button" class="barre__deconnexion" id="btn-deconnexion">Se déconnecter</button>
        </div>
      </div>
      <nav class="menu" aria-label="Navigation administration">
        <div class="enveloppe">
          <ul class="menu__liste">
            ${LIENS.map((l) => `
              <li><a class="menu__lien ${l.href === actif ? 'est-actif' : ''}" href="${l.href}">${l.texte}</a></li>
            `).join('')}
          </ul>
        </div>
      </nav>`;

    document.getElementById('btn-deconnexion').addEventListener('click', async () => {
      try { await API.post('/admin/logout', {}); } catch (e) { /* on redirige quand même */ }
      window.location.href = '/admin/login';
    });
  }

  // Si la session a expiré, on renvoie vers la page de connexion.
  async function appel(promesse) {
    try {
      return await promesse;
    } catch (err) {
      if (err.status === 401) {
        window.location.href = '/admin/login';
        return null;
      }
      throw err;
    }
  }

  const LIBELLES = {
    HOMME: 'Homme', FEMME: 'Femme',
    CELIBATAIRE: 'Célibataire', MARIE: 'Marié(e)',
    PERE: 'Père', MERE: 'Mère', FRERE: 'Frère', SOEUR: 'Sœur',
    EPOUX_EPOUSE: 'Époux / épouse', TUTEUR: 'Tuteur', AUTRE: 'Autre',
    EGLISE: 'Église', AMI: 'Ami(e)', WHATSAPP: 'WhatsApp',
    FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', ANNONCE: 'Annonce',
    PERSONNEL: 'Transport personnel', COMMUN: 'Transport en commun', GROUPE: 'Véhicule de groupe',
    OUI: 'Oui', NON: 'Non', NE_SAIS_PAS: 'Ne sait pas encore',
    CHAMBRE: 'Chambre', DORTOIR: 'Dortoir', PEU_IMPORTE: 'Peu importe',
    REGISTERED: 'Inscrit', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé',
    EMAIL_PENDING: 'E-mail en attente', EMAIL_SENT: 'E-mail envoyé', EMAIL_FAILED: 'E-mail échoué',
  };

  const lib = (v) => (v === null || v === undefined || v === '' ? '—' : (LIBELLES[v] || v));

  function echapper(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function dateCourte(valeur) {
    if (!valeur) return '—';
    return new Date(valeur).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function dateLongue(valeur) {
    if (!valeur) return '—';
    return new Date(valeur).toLocaleString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function alerter(message, type = 'erreur') {
    const zone = document.getElementById('alerte');
    if (!zone) return;
    zone.className = `alerte alerte--${type}`;
    zone.textContent = message;
    zone.hidden = false;
  }

  return { rendreChrome, appel, lib, echapper, dateCourte, dateLongue, alerter };
})();
