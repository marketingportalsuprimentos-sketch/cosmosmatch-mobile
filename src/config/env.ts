import { Platform } from 'react-native';

// ==============================================================================
// 🌍 CONFIGURAÇÃO DE AMBIENTE (PRODUÇÃO)
// ==============================================================================

// URL do Backend na Nuvem (Render)
const BACKEND_URL = 'https://cosmosmatch-backend.onrender.com';

// URL do Site/Frontend (Vercel)
const FRONTEND_URL = 'https://cosmosmatch.com.br';

export const ENV = {
  // 🔗 Conexões de Rede
  API_URL: `${BACKEND_URL}/api`,
  SOCKET_URL: BACKEND_URL,
  FRONTEND_URL: FRONTEND_URL,

  // 🗺️ Google Maps (Para o autocompletar de cidades funcionar)
  GOOGLE_API_KEY: 'AIzaSyAci2s5EVtp0CQ8jbBTQFvyDA6octWS4wQ',

  // ☁️ Cloudinary (Para fotos e vídeos funcionarem)
  CLOUDINARY_CLOUD_NAME: 'dohbufspp',
  CLOUDINARY_API_KEY: '784353591925794',
  CLOUDINARY_UPLOAD_PRESET: 'ml_default', // Se usares um preset diferente, avisa!

  // 💳 Pagamentos (Asaas)
  // Nota: Idealmente o backend gerencia isso, mas se o app precisar, aqui está:
  ASAAS_API_URL: 'https://sandbox.asaas.com/api/v3',
  // ASAAS_API_KEY: (Por segurança, evitamos colocar a chave secreta aqui no app, 
  // o backend deve processar o pagamento).
};