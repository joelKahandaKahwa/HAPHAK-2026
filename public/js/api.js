/* Client API partagé — toutes les requêtes passent par le backend.
   Le frontend ne connaît jamais DATABASE_URL ni aucun secret. */

const API = (() => {
  const base = '/api';

  async function request(path, options = {}) {
    const response = await fetch(base + path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });

    let payload;
    try {
      payload = await response.json();
    } catch (e) {
      throw new Error("Réponse inattendue du serveur.");
    }

    if (!response.ok) {
      const error = new Error(payload.message || "Une erreur est survenue.");
      error.status = response.status;
      error.errors = payload.errors || [];
      throw error;
    }

    return payload;
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: 'DELETE' }),
    raw: request,
  };
})();
