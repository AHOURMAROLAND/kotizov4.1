export const API_BASE_URL = 'http://unpoeticised-stonefly-julieta.ngrok-free.dev/api';

export const ENDPOINTS = {
  inscription: '/auth/inscription/',
  connexion: '/auth/connexion/',
  deconnexion: '/auth/deconnexion/',  
  tokenRefresh: '/auth/token/refresh/',
  moi: '/auth/moi/',
  moiStats: '/auth/moi/stats/',
  fcmToken: '/auth/fcm-token/',
  whatsappWebhook: '/auth/whatsapp/webhook/',
  verifierEmail: (token) => `/auth/verifier-email/${token}/`,
  reinitialisation: (token) => `/auth/reinitialisation/${token}/`,

  cotisations: '/cotisations/',
  mesParticipations: '/cotisations/mes-participations/',
  cotisationDetail: (slug) => `/cotisations/${slug}/`,
  cotisationPublique: (slug) => `/cotisations/publique/${slug}/`,
  rejoindre: (slug) => `/cotisations/${slug}/rejoindre/`,
  participants: (slug) => `/cotisations/${slug}/participants/`,
  rappeler: (slug) => `/cotisations/${slug}/rappeler/`,
  signaler: (slug) => `/cotisations/${slug}/signaler/`,

  initierPaiement: (slug) => `/paiements/initier/${slug}/`,
  historique: '/paiements/historique/',
  remboursement: '/paiements/remboursement/',

  quickpay: '/quickpay/',
  quickpayRecus: '/quickpay/recus/',
  quickpayDetail: (code) => `/quickpay/${code}/`,
  quickpayPayer: (code) => `/quickpay/${code}/payer/`,

  notifications: '/notifications/',
  nonLues: '/notifications/non-lues/',
  toutLire: '/notifications/tout-lire/',

  messageIA: '/agent-ia/message/',
  historiqueIA: '/agent-ia/historique/',
  reclamation: '/agent-ia/reclamation/',
};