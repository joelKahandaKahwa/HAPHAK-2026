/* Page d'accueil — remplace le contenu par les paramètres configurés par l'administrateur. */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data } = await API.get('/retreat');
    const s = data.settings;
    if (!s) return;

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el && value) el.textContent = value;
    };

    set('nom-retraite', (s.name || 'HAPHAK 2026').split(' ')[0]);
    set('signification', (s.meaning || 'transforme').toLowerCase());
    set('theme', s.theme);
    set('dates', s.datesLabel);
    set('heure', s.startTime);
    set('lieu', s.location);
    if (s.description) set('description', s.description);

    document.title = `${s.name || 'HAPHAK 2026'} — ${s.theme || ''}`.trim();

    // Lieu dans les informations pratiques
    const pratiqueLieu = document.getElementById('pratique-lieu');
    if (pratiqueLieu) {
      pratiqueLieu.innerHTML = s.location === 'À CONFIGURER'
        ? '<span class="a-configurer">À CONFIGURER</span>'
        : escapeHtml(s.location);
    }
    const pratiqueDates = document.getElementById('pratique-dates');
    if (pratiqueDates && s.datesLabel) {
      pratiqueDates.textContent = s.startTime
        ? `${s.datesLabel}. Rassemblement : ${s.startTime}.`
        : `${s.datesLabel}.`;
    }

    // Sessions
    if (Array.isArray(data.sessions) && data.sessions.length) {
      const liste = document.getElementById('liste-sessions');
      liste.innerHTML = data.sessions.map((session) => `
        <li class="session">
          <h3 class="session__nom">${escapeHtml(session.name)}</h3>
          <p class="session__detail">${
            session.time
              ? escapeHtml(session.time)
              : 'Horaire <span class="a-configurer">À CONFIGURER</span>'
          }${session.description ? ' — ' + escapeHtml(session.description) : ''}</p>
        </li>
      `).join('');
    }

    // Contact — affiché uniquement si des coordonnées sont configurées
    const contacts = [
      { label: 'Téléphone', value: s.contactPhone },
      { label: 'E-mail', value: s.contactEmail },
      { label: 'WhatsApp', value: s.whatsapp },
    ].filter((c) => c.value);

    if (contacts.length) {
      const section = document.getElementById('section-contact');
      const container = document.getElementById('contact-details');
      container.innerHTML = contacts.map((c) => `
        <div class="pratique__bloc">
          <h3>${escapeHtml(c.label)}</h3>
          <p>${escapeHtml(c.value)}</p>
        </div>
      `).join('');
      section.hidden = false;
    }
  } catch (err) {
    // La page reste lisible avec son contenu par défaut si l'API est indisponible.
    console.error(err.message);
  }
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
