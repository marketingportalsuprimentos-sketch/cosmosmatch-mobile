import { Platform } from 'react-native';

// URL Oficial do seu Backend no Render
const BACKEND_URL = 'https://cosmosmatch-backend.onrender.com';

export const ENV = {
  // A API fica em /api
  API_URL: `${BACKEND_URL}/api`,

  // O Socket.io conecta na raiz
  SOCKET_URL: BACKEND_URL,

  // Chave do Google Maps para o Autocomplete das cidades
  GOOGLE_API_KEY: 'AIzaSyAci2s5EVtp0CQ8jbBTQFvyDA6octWS4wQ',
};