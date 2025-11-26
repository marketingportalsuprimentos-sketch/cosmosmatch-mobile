import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import 'intl-pluralrules';

const resources = {
  // 🇧🇷 PORTUGUÊS
  pt: {
    translation: {
      welcome_back: 'CosmosMatch', // <--- MUDANÇA AQUI
      login_subtitle: 'Entre para conectar-se com as estrelas.',
      email_placeholder: 'Seu e-mail',
      password_placeholder: 'Sua senha',
      login_button: 'Entrar',
      forgot_password: 'Esqueci minha senha',
      no_account: 'Não tem uma conta?',
      register_link: 'Cadastre-se',
    },
  },
  // 🇺🇸 INGLÊS
  en: {
    translation: {
      welcome_back: 'CosmosMatch', // <--- MUDANÇA AQUI
      login_subtitle: 'Login to connect with the stars.',
      email_placeholder: 'Your email',
      password_placeholder: 'Your password',
      login_button: 'Log In',
      forgot_password: 'Forgot password?',
      no_account: "Don't have an account?",
      register_link: 'Sign Up',
    },
  },
  // 🇪🇸 ESPANHOL
  es: {
    translation: {
      welcome_back: 'CosmosMatch', // <--- MUDANÇA AQUI
      login_subtitle: 'Ingresa para conectar con las estrellas.',
      email_placeholder: 'Tu correo electrónico',
      password_placeholder: 'Tu contraseña',
      login_button: 'Ingresar',
      forgot_password: '¿Olvidaste tu contraseña?',
      no_account: '¿No tienes una cuenta?',
      register_link: 'Regístrate',
    },
  },
  // 🇫🇷 FRANCÊS
  fr: {
    translation: {
      welcome_back: 'CosmosMatch', // <--- MUDANÇA AQUI
      login_subtitle: 'Connectez-vous pour rejoindre les étoiles.',
      email_placeholder: 'Votre e-mail',
      password_placeholder: 'Votre mot de passe',
      login_button: 'Se connecter',
      forgot_password: 'Mot de passe oublié ?',
      no_account: "Vous n'avez pas de compte ?",
      register_link: "S'inscrire",
    },
  },
  // 🇮🇹 ITALIANO
  it: {
    translation: {
      welcome_back: 'CosmosMatch', // <--- MUDANÇA AQUI
      login_subtitle: 'Accedi per connetterti con le stelle.',
      email_placeholder: 'La tua email',
      password_placeholder: 'La tua password',
      login_button: 'Accedi',
      forgot_password: 'Password dimenticata?',
      no_account: 'Non hai un account?',
      register_link: 'Iscriviti',
    },
  },
};

const deviceLanguage = Localization.getLocales()[0].languageCode; 

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage, 
    fallbackLng: 'pt', 
    interpolation: { escapeValue: false },
  });

export default i18n;