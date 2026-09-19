/* ============================================
   Formulaire d'inscription HAPHAK 2026
   Validation côté client pour le confort ; le serveur revalide tout.
   ============================================ */

(() => {
  const TOTAL = 8;
  const NOMS_ETAPES = [
    'Identité', 'Coordonnées', 'Famille', 'Participation',
    'Hébergement', 'Compléments', 'Récapitulatif', 'Confirmation',
  ];

  const form = document.getElementById('form-inscription');
  const etapes = [...document.querySelectorAll('.etape')];
  const barre = document.getElementById('barre-progression');
  const nomEtape = document.getElementById('nom-etape');
  const numeroEtape = document.getElementById('numero-etape');
  const btnPrecedent = document.getElementById('btn-precedent');
  const btnSuivant = document.getElementById('btn-suivant');
  const alerte = document.getElementById('alerte-globale');

  let courante = 1;
  let envoiEnCours = false;

  // --- Chargement des paramètres (nom, thème) ---
  API.get('/retreat').then(({ data }) => {
    if (data.settings) {
      document.getElementById('titre-retraite').textContent = data.settings.name;
      document.getElementById('theme-retraite').textContent = `« ${data.settings.theme} »`;
    }
  }).catch(() => {});

  // ============================================
  // Navigation
  // ============================================
  function afficherEtape(n) {
    courante = n;
    etapes.forEach((e) => e.classList.toggle('est-active', Number(e.dataset.etape) === n));

    barre.style.width = `${(n / TOTAL) * 100}%`;
    barre.setAttribute('aria-valuenow', n);
    nomEtape.textContent = NOMS_ETAPES[n - 1];
    numeroEtape.textContent = n;

    btnPrecedent.style.visibility = n === 1 || n === TOTAL ? 'hidden' : 'visible';
    btnSuivant.hidden = n === TOTAL;
    btnSuivant.textContent = n === 7 ? 'Confirmer mon inscription' : 'Continuer';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    const titre = document.querySelector('.etape.est-active .etape__titre');
    if (titre) { titre.setAttribute('tabindex', '-1'); titre.focus({ preventScroll: true }); }
  }

  btnPrecedent.addEventListener('click', () => {
    masquerAlerte();
    if (courante > 1) afficherEtape(courante - 1);
  });

  btnSuivant.addEventListener('click', async () => {
    masquerAlerte();

    if (courante === 7) {
      await envoyer();
      return;
    }

    if (!validerEtape(courante)) {
      afficherAlerte("Veuillez corriger les champs signalés avant de continuer.");
      return;
    }

    if (courante === 6) construireRecap();
    afficherEtape(courante + 1);
  });

  // Empêche la soumission native (Entrée sur un champ)
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      btnSuivant.click();
    }
  });

  // ============================================
  // Blocs conditionnels
  // ============================================
  function brancher(nomChamp, valeurDeclenchante, idBloc) {
    const bloc = document.getElementById(idBloc);
    const radios = form.querySelectorAll(`input[name="${nomChamp}"]`);
    const mettreAJour = () => {
      const choisi = form.querySelector(`input[name="${nomChamp}"]:checked`);
      bloc.classList.toggle('est-visible', !!choisi && choisi.value === valeurDeclenchante);
    };
    radios.forEach((r) => r.addEventListener('change', mettreAJour));
    mettreAJour();
  }

  brancher('organizationMember', 'true', 'bloc-departement');
  brancher('accommodationRequired', 'true', 'bloc-hebergement');
  brancher('comingAlone', 'false', 'bloc-accompagnants');

  // ============================================
  // Validation
  // ============================================
  const REGEX_TEL = /^[0-9+()\s-]{6,20}$/;
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function poserErreur(nom, message) {
    const cible = document.querySelector(`[data-erreur="${nom}"]`);
    if (cible) cible.textContent = message || '';
    const champ = form.querySelector(`[name="${nom}"]`);
    if (champ && champ.type !== 'radio') {
      champ.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
  }

  function viderErreurs(section) {
    section.querySelectorAll('.champ__erreur').forEach((e) => (e.textContent = ''));
    section.querySelectorAll('[aria-invalid]').forEach((e) => e.setAttribute('aria-invalid', 'false'));
  }

  function valeur(nom) {
    const champ = form.querySelector(`[name="${nom}"]`);
    if (!champ) return '';
    if (champ.type === 'radio') {
      const choisi = form.querySelector(`[name="${nom}"]:checked`);
      return choisi ? choisi.value : '';
    }
    if (champ.type === 'checkbox') return champ.checked;
    return champ.value.trim();
  }

  const REGLES = {
    1: () => {
      const e = {};
      if (!valeur('lastName')) e.lastName = 'Veuillez saisir votre nom.';
      if (!valeur('firstName')) e.firstName = 'Veuillez saisir votre prénom.';
      if (!valeur('gender')) e.gender = 'Veuillez sélectionner votre sexe.';
      if (!valeur('maritalStatus')) e.maritalStatus = 'Veuillez sélectionner votre état civil.';
      return e;
    },
    2: () => {
      const e = {};
      const tel = valeur('phone');
      if (!tel) e.phone = 'Veuillez saisir votre numéro de téléphone.';
      else if (!REGEX_TEL.test(tel)) e.phone = 'Veuillez saisir un numéro de téléphone valide.';

      const wa = valeur('whatsapp');
      if (wa && !REGEX_TEL.test(wa)) e.whatsapp = 'Veuillez saisir un numéro WhatsApp valide.';

      const mail = valeur('email');
      if (!mail) e.email = 'Veuillez saisir votre adresse e-mail.';
      else if (!REGEX_EMAIL.test(mail)) e.email = 'Veuillez saisir une adresse e-mail valide.';

      if (!valeur('city')) e.city = 'Veuillez saisir votre ville.';
      if (!valeur('country')) e.country = 'Veuillez saisir votre pays.';
      return e;
    },
    3: () => {
      const e = {};
      if (!valeur('emergencyContactName')) {
        e.emergencyContactName = "Veuillez indiquer une personne à contacter en cas d'urgence.";
      }
      const tel = valeur('emergencyContactPhone');
      if (!tel) e.emergencyContactPhone = 'Veuillez saisir le numéro de cette personne.';
      else if (!REGEX_TEL.test(tel)) e.emergencyContactPhone = 'Veuillez saisir un numéro de téléphone valide.';

      if (!valeur('emergencyContactRelationship')) {
        e.emergencyContactRelationship = 'Veuillez préciser le lien avec cette personne.';
      }
      return e;
    },
    4: () => {
      const e = {};
      if (!valeur('source')) e.source = 'Veuillez indiquer comment vous avez connu HAPHAK.';
      if (!valeur('arrivalCity')) e.arrivalCity = 'Veuillez indiquer votre ville de provenance.';
      if (!valeur('transportMethod')) e.transportMethod = 'Veuillez indiquer votre moyen de transport.';
      if (!valeur('fullRetreat')) e.fullRetreat = 'Veuillez répondre à cette question.';

      const arrivee = valeur('arrivalDate');
      const depart = valeur('departureDate');
      if (arrivee && depart && new Date(depart) < new Date(arrivee)) {
        e.departureDate = 'La date de départ ne peut pas précéder la date d\'arrivée.';
      }
      return e;
    },
    5: () => ({}),
    6: () => {
      const e = {};
      if (!valeur('consent')) e.consent = "Vous devez accepter l'utilisation de vos informations pour continuer.";
      if (!valeur('confirmed')) e.confirmed = "Vous devez confirmer l'exactitude de vos informations.";
      return e;
    },
    7: () => ({}),
  };

  function validerEtape(n) {
    const section = etapes.find((e) => Number(e.dataset.etape) === n);
    viderErreurs(section);

    const erreurs = (REGLES[n] || (() => ({})))();
    Object.entries(erreurs).forEach(([nom, msg]) => poserErreur(nom, msg));

    if (Object.keys(erreurs).length) {
      const premier = section.querySelector('[aria-invalid="true"], .champ__erreur:not(:empty)');
      if (premier) premier.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return false;
    }
    return true;
  }

  // Efface l'erreur dès que l'utilisateur corrige
  form.addEventListener('input', (e) => {
    if (e.target.name) poserErreur(e.target.name, '');
  });

  // ============================================
  // Collecte des données
  // ============================================
  function collecter() {
    const alone = valeur('comingAlone') === 'true';
    return {
      lastName: valeur('lastName'),
      middleName: valeur('middleName'),
      firstName: valeur('firstName'),
      gender: valeur('gender'),
      maritalStatus: valeur('maritalStatus'),
      birthDate: valeur('birthDate') || null,

      phone: valeur('phone'),
      whatsapp: valeur('whatsapp'),
      email: valeur('email'),
      address: valeur('address'),
      city: valeur('city'),
      neighborhood: valeur('neighborhood'),
      commune: valeur('commune'),
      province: valeur('province'),
      country: valeur('country'),

      familyStatus: valeur('familyStatus'),
      familySize: valeur('familySize') || null,
      childrenCount: valeur('childrenCount') || null,
      emergencyContactName: valeur('emergencyContactName'),
      emergencyContactPhone: valeur('emergencyContactPhone'),
      emergencyContactRelationship: valeur('emergencyContactRelationship'),

      source: valeur('source'),
      arrivalCity: valeur('arrivalCity'),
      transportMethod: valeur('transportMethod'),
      fullRetreat: valeur('fullRetreat'),
      arrivalDate: valeur('arrivalDate') || null,
      departureDate: valeur('departureDate') || null,
      organizationMember: valeur('organizationMember') === 'true',
      department: valeur('department'),

      accommodationRequired: valeur('accommodationRequired') === 'true',
      nights: valeur('nights') || null,
      accommodationType: valeur('accommodationType') || null,
      comingWithOthers: !alone,
      companionsCount: alone ? null : (valeur('companionsCount') || null),

      specialNeeds: valeur('specialNeeds'),
      comments: valeur('comments'),
      observations: valeur('observations'),

      consent: valeur('consent'),
      confirmed: valeur('confirmed'),
    };
  }

  // ============================================
  // Récapitulatif
  // ============================================
  const LIBELLES = {
    HOMME: 'Homme', FEMME: 'Femme',
    CELIBATAIRE: 'Célibataire', MARIE: 'Marié(e)',
    PERE: 'Père', MERE: 'Mère', FRERE: 'Frère', SOEUR: 'Sœur',
    EPOUX_EPOUSE: 'Époux / épouse', TUTEUR: 'Tuteur', AUTRE: 'Autre',
    EGLISE: 'Église', AMI: 'Ami(e)', WHATSAPP: 'WhatsApp',
    FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', ANNONCE: 'Annonce',
    PERSONNEL: 'Transport personnel', COMMUN: 'Transport en commun', GROUPE: 'Véhicule de groupe',
    OUI: 'Oui', NON: 'Non', NE_SAIS_PAS: 'Je ne sais pas encore',
    CHAMBRE: 'Chambre', DORTOIR: 'Dortoir', PEU_IMPORTE: 'Peu importe',
  };

  const lib = (v) => LIBELLES[v] || v;

  function construireRecap() {
    const d = collecter();
    const groupes = [
      ['Identité', [
        ['Nom', d.lastName],
        ['Postnom', d.middleName],
        ['Prénom', d.firstName],
        ['Sexe', lib(d.gender)],
        ['État civil', lib(d.maritalStatus)],
        ['Date de naissance', d.birthDate],
      ]],
      ['Coordonnées', [
        ['Téléphone', d.phone],
        ['WhatsApp', d.whatsapp],
        ['E-mail', d.email],
        ['Adresse', d.address],
        ['Ville', d.city],
        ['Quartier', d.neighborhood],
        ['Commune', d.commune],
        ['Province', d.province],
        ['Pays', d.country],
      ]],
      ['Famille', [
        ['Situation familiale', d.familyStatus],
        ['Personnes dans la famille', d.familySize],
        ['Enfants', d.childrenCount],
        ['Contact d\'urgence', d.emergencyContactName],
        ['Son téléphone', d.emergencyContactPhone],
        ['Lien', lib(d.emergencyContactRelationship)],
      ]],
      ['Participation', [
        ['Connu par', lib(d.source)],
        ['Ville de provenance', d.arrivalCity],
        ['Transport', lib(d.transportMethod)],
        ['Toute la retraite', lib(d.fullRetreat)],
        ['Arrivée', d.arrivalDate],
        ['Départ', d.departureDate],
        ['Membre de l\'organisation', d.organizationMember ? 'Oui' : 'Non'],
        ['Département', d.organizationMember ? d.department : ''],
      ]],
      ['Hébergement', [
        ['Hébergement demandé', d.accommodationRequired ? 'Oui' : 'Non'],
        ['Nuits', d.accommodationRequired ? d.nights : ''],
        ['Préférence', d.accommodationRequired ? lib(d.accommodationType) : ''],
        ['Accompagné(e)', d.comingWithOthers ? 'Oui' : 'Non'],
        ['Accompagnants', d.comingWithOthers ? d.companionsCount : ''],
      ]],
      ['Compléments', [
        ['Besoins particuliers', d.specialNeeds],
        ['Commentaires', d.comments],
        ['Observations', d.observations],
      ]],
    ];

    const html = groupes.map(([titre, lignes]) => {
      const visibles = lignes.filter(([, v]) => v !== '' && v !== null && v !== undefined);
      if (!visibles.length) return '';
      return `
        <div class="recap__groupe">
          <h3>${titre}</h3>
          <dl style="margin:0">
            ${visibles.map(([k, v]) => `
              <div class="recap__ligne"><dt>${echapper(k)}</dt><dd>${echapper(v)}</dd></div>
            `).join('')}
          </dl>
        </div>`;
    }).join('');

    document.getElementById('recap').innerHTML = html;
  }

  function echapper(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // ============================================
  // Envoi
  // ============================================
  async function envoyer() {
    if (envoiEnCours) return;
    envoiEnCours = true;
    btnSuivant.disabled = true;
    btnSuivant.textContent = 'Enregistrement…';

    try {
      const reponse = await API.post('/registrations', collecter());
      // Redirection vers la page de confirmation avec le numéro d'inscription
      window.location.href = `/success.html?n=${encodeURIComponent(reponse.registrationId)}`;
    } catch (err) {
      envoiEnCours = false;
      btnSuivant.disabled = false;
      btnSuivant.textContent = 'Confirmer mon inscription';

      if (err.errors && err.errors.length) {
        // Le serveur a rejeté des champs : on les signale et on revient à leur étape.
        err.errors.forEach(({ field, message }) => poserErreur(field, message));
        const premiereEtape = etapeDuChamp(err.errors[0].field);
        afficherEtape(premiereEtape);
        afficherAlerte("Veuillez corriger les champs signalés.");
      } else {
        afficherAlerte(err.message);
      }
    }
  }

  function etapeDuChamp(nom) {
    const champ = form.querySelector(`[name="${nom}"]`);
    if (!champ) return 1;
    const section = champ.closest('.etape');
    return section ? Number(section.dataset.etape) : 1;
  }

  function afficherAlerte(message) {
    alerte.textContent = message;
    alerte.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function masquerAlerte() {
    alerte.hidden = true;
    alerte.textContent = '';
  }

  afficherEtape(1);
})();
