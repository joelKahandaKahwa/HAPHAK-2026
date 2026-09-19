const { z } = require('zod');

// Le frontend valide déjà pour l'UX, mais on ne fait JAMAIS confiance au frontend :
// toute donnée est revalidée ici, côté serveur, avant d'être enregistrée.

const phoneRegex = /^[0-9+()\s-]{6,20}$/;

const registrationSchema = z.object({
  // Étape 1 — Identité
  lastName: z.string({ required_error: "Veuillez saisir votre nom." })
    .trim().min(1, "Veuillez saisir votre nom.").max(100),
  middleName: z.string().trim().max(100).optional().or(z.literal('')),
  firstName: z.string({ required_error: "Veuillez saisir votre prénom." })
    .trim().min(1, "Veuillez saisir votre prénom.").max(100),
  gender: z.enum(['HOMME', 'FEMME'], { required_error: "Veuillez sélectionner votre sexe." }),
  maritalStatus: z.enum(['CELIBATAIRE', 'MARIE'], { required_error: "Veuillez sélectionner votre état civil." }),
  birthDate: z.string().optional().nullable(),

  // Étape 2 — Coordonnées
  phone: z.string({ required_error: "Veuillez saisir votre numéro de téléphone." })
    .trim().regex(phoneRegex, "Veuillez saisir un numéro de téléphone valide."),
  whatsapp: z.string().trim().regex(phoneRegex, "Veuillez saisir un numéro WhatsApp valide.").optional().or(z.literal('')),
  email: z.string({ required_error: "Veuillez saisir votre adresse e-mail." })
    .trim().email("Veuillez saisir une adresse e-mail valide.").max(150),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string({ required_error: "Veuillez saisir votre ville." }).trim().min(1, "Veuillez saisir votre ville.").max(100),
  neighborhood: z.string().trim().max(100).optional().or(z.literal('')),
  commune: z.string().trim().max(100).optional().or(z.literal('')),
  province: z.string().trim().max(100).optional().or(z.literal('')),
  country: z.string({ required_error: "Veuillez saisir votre pays." }).trim().min(1, "Veuillez saisir votre pays.").max(100),

  // Étape 3 — Informations familiales
  familyStatus: z.string().trim().max(100).optional().or(z.literal('')),
  familySize: z.coerce.number().int().min(0).max(50).optional().nullable(),
  childrenCount: z.coerce.number().int().min(0).max(50).optional().nullable(),
  emergencyContactName: z.string({ required_error: "Veuillez indiquer une personne à contacter en cas d'urgence." })
    .trim().min(1, "Veuillez indiquer une personne à contacter en cas d'urgence.").max(150),
  emergencyContactPhone: z.string({ required_error: "Veuillez saisir le numéro de la personne à contacter." })
    .trim().regex(phoneRegex, "Veuillez saisir un numéro de téléphone valide."),
  emergencyContactRelationship: z.enum(
    ['PERE', 'MERE', 'FRERE', 'SOEUR', 'EPOUX_EPOUSE', 'TUTEUR', 'AUTRE'],
    { required_error: "Veuillez préciser le lien avec cette personne." }
  ),

  // Étape 4 — Participation
  source: z.enum(['EGLISE', 'AMI', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'ANNONCE', 'AUTRE'], {
    required_error: "Veuillez indiquer comment vous avez connu HAPHAK.",
  }),
  arrivalCity: z.string({ required_error: "Veuillez indiquer votre ville de provenance." })
    .trim().min(1).max(100),
  transportMethod: z.enum(['PERSONNEL', 'COMMUN', 'GROUPE', 'AUTRE'], {
    required_error: "Veuillez indiquer votre moyen de transport.",
  }),
  fullRetreat: z.enum(['OUI', 'NON', 'NE_SAIS_PAS'], {
    required_error: "Veuillez préciser si vous participerez à toute la retraite.",
  }),
  arrivalDate: z.string().optional().nullable(),
  departureDate: z.string().optional().nullable(),
  organizationMember: z.coerce.boolean().default(false),
  department: z.string().trim().max(100).optional().or(z.literal('')),

  // Étape 5 — Hébergement
  accommodationRequired: z.coerce.boolean().default(false),
  nights: z.coerce.number().int().min(0).max(60).optional().nullable(),
  accommodationType: z.enum(['CHAMBRE', 'DORTOIR', 'PEU_IMPORTE']).optional().nullable(),
  comingWithOthers: z.coerce.boolean().default(false),
  companionsCount: z.coerce.number().int().min(0).max(50).optional().nullable(),

  // Étape 6 — Complémentaire
  specialNeeds: z.string().trim().max(1000).optional().or(z.literal('')),
  comments: z.string().trim().max(1000).optional().or(z.literal('')),
  observations: z.string().trim().max(1000).optional().or(z.literal('')),

  // Consentement (obligatoire)
  consent: z.coerce.boolean().refine((v) => v === true, {
    message: "Vous devez accepter l'utilisation de vos informations pour continuer.",
  }),
  confirmed: z.coerce.boolean().refine((v) => v === true, {
    message: "Vous devez confirmer l'exactitude de vos informations.",
  }),
});

function validateRegistration(data) {
  return registrationSchema.safeParse(data);
}

// Formate les erreurs Zod en une liste simple {field, message} en français
function formatZodErrors(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

module.exports = { validateRegistration, formatZodErrors, registrationSchema };
