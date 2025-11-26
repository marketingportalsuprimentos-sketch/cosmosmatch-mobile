import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import 'intl-pluralrules';

const resources = {
  // 🇧🇷 PORTUGUÊS
  pt: {
    translation: {
      app_name: 'CosmosMatch',
      loading: 'Carregando...',
      success: 'Sucesso',
      error: 'Erro',
      cancel: 'Cancelar',
      save: 'Salvar',
      
      // Login/Auth
      welcome_back: 'CosmosMatch',
      login_subtitle: 'Entre para conectar-se com as estrelas.',
      email_placeholder: 'Seu e-mail',
      password_placeholder: 'Sua senha',
      login_button: 'Entrar',
      forgot_password: 'Esqueci minha senha',
      no_account: 'Não tem uma conta?',
      register_link: 'Cadastre-se',
      register_title: 'Crie sua conta',
      name_placeholder: 'Nome (Exibição)',
      username_label: 'Nome de Utilizador (@)',
      username_helper: 'Apenas letras, números e _ (Ex: joao_silva)',
      confirm_password_label: 'Confirmar Senha',
      register_button: 'Criar Conta',
      already_account: 'Já tem uma conta?',
      login_link: 'Faça login',

      // --- TABS (NOVO) ---
      tab_discovery: 'Descoberta',
      tab_feed: 'Feed',
      tab_chat: 'Chat',
      tab_profile: 'Perfil',
    },
  },
  
  // 🇺🇸 INGLÊS
  en: {
    translation: {
      app_name: 'CosmosMatch',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      cancel: 'Cancel',
      save: 'Save',
      
      welcome_back: 'CosmosMatch',
      login_subtitle: 'Login to connect with the stars.',
      email_placeholder: 'Your email',
      password_placeholder: 'Your password',
      login_button: 'Log In',
      forgot_password: 'Forgot password?',
      no_account: "Don't have an account?",
      register_link: 'Sign Up',
      register_title: 'Create account',
      name_placeholder: 'Display Name',
      username_label: 'Username (@)',
      username_helper: 'Only letters, numbers and _',
      confirm_password_label: 'Confirm Password',
      register_button: 'Sign Up',
      already_account: 'Already have an account?',
      login_link: 'Log In',

      // --- TABS (NOVO) ---
      tab_discovery: 'Discovery',
      tab_feed: 'Feed',
      tab_chat: 'Chat',
      tab_profile: 'Profile',
    },
  },

  // 🇪🇸 ESPANHOL
  es: {
    translation: {
      app_name: 'CosmosMatch',
      loading: 'Cargando...',
      success: 'Éxito',
      error: 'Error',
      cancel: 'Cancelar',
      save: 'Guardar',

      welcome_back: 'CosmosMatch',
      login_subtitle: 'Ingresa para conectar con las estrellas.',
      email_placeholder: 'Tu correo electrónico',
      password_placeholder: 'Tu contraseña',
      login_button: 'Ingresar',
      forgot_password: '¿Olvidaste tu contraseña?',
      no_account: '¿No tienes una cuenta?',
      register_link: 'Regístrate',
      register_title: 'Crear cuenta',
      name_placeholder: 'Nombre (Visible)',
      username_label: 'Nombre de usuario (@)',
      username_helper: 'Solo letras, números y _',
      confirm_password_label: 'Confirmar Contraseña',
      register_button: 'Registrarse',
      already_account: '¿Ya tienes cuenta?',
      login_link: 'Ingresar',

      // --- TABS (NOVO) ---
      tab_discovery: 'Descubrir',
      tab_feed: 'Feed',
      tab_chat: 'Chat',
      tab_profile: 'Perfil',
    },
  },

  // 🇫🇷 FRANCÊS
  fr: {
    translation: {
      app_name: 'CosmosMatch',
      loading: 'Chargement...',
      success: 'Succès',
      error: 'Erreur',
      cancel: 'Annuler',
      save: 'Enregistrer',

      welcome_back: 'CosmosMatch',
      login_subtitle: 'Connectez-vous pour rejoindre les étoiles.',
      email_placeholder: 'Votre e-mail',
      password_placeholder: 'Votre mot de passe',
      login_button: 'Se connecter',
      forgot_password: 'Mot de passe oublié ?',
      no_account: "Vous n'avez pas de compte ?",
      register_link: "S'inscrire",
      register_title: 'Créer un compte',
      name_placeholder: 'Nom (Affichage)',
      username_label: "Nom d'utilisateur (@)",
      username_helper: 'Lettres, chiffres et _ uniquement',
      confirm_password_label: 'Confirmer le mot de passe',
      register_button: "S'inscrire",
      already_account: 'Vous avez déjà un compte ?',
      login_link: 'Se connecter',

      // --- TABS (NOVO) ---
      tab_discovery: 'Découverte',
      tab_feed: 'Actu',
      tab_chat: 'Chat',
      tab_profile: 'Profil',
    },
  },

  // 🇮🇹 ITALIANO
  it: {
    translation: {
      app_name: 'CosmosMatch',
      loading: 'Caricamento...',
      success: 'Successo',
      error: 'Errore',
      cancel: 'Annulla',
      save: 'Salva',

      welcome_back: 'CosmosMatch',
      login_subtitle: 'Accedi per connetterti con le stelle.',
      email_placeholder: 'La tua email',
      password_placeholder: 'La tua password',
      login_button: 'Accedi',
      forgot_password: 'Password dimenticata?',
      no_account: 'Non hai un account?',
      register_link: 'Iscriviti',
      register_title: 'Crea account',
      name_placeholder: 'Nome (Visualizzato)',
      username_label: 'Nome utente (@)',
      username_helper: 'Solo lettere, numeri e _',
      confirm_password_label: 'Conferma Password',
      register_button: 'Iscriviti',
      already_account: 'Hai già un account?',
      login_link: 'Accedi',

      // --- TABS (NOVO) ---
      tab_discovery: 'Scopri',
      tab_feed: 'Feed',
      tab_chat: 'Chat',
      tab_profile: 'Profilo',
    },
  },

  // 🇩🇪 ALEMÃO
  de: {
    translation: {
      app_name: 'CosmosMatch',
      loading: 'Laden...',
      success: 'Erfolg',
      error: 'Fehler',
      cancel: 'Abbrechen',
      save: 'Speichern',

      welcome_back: 'CosmosMatch',
      login_subtitle: 'Melden Sie sich an, um sich mit den Sternen zu verbinden.',
      email_placeholder: 'Ihre E-Mail',
      password_placeholder: 'Ihr Passwort',
      login_button: 'Anmelden',
      forgot_password: 'Passwort vergessen?',
      no_account: 'Kein Konto?',
      register_link: 'Registrieren',
      register_title: 'Konto erstellen',
      name_placeholder: 'Name (Anzeige)',
      username_label: 'Benutzername (@)',
      username_helper: 'Nur Buchstaben, Zahlen und _',
      confirm_password_label: 'Passwort bestätigen',
      register_button: 'Registrieren',
      already_account: 'Haben Sie bereits ein Konto?',
      login_link: 'Anmelden',

      // --- TABS (NOVO) ---
      tab_discovery: 'Entdecken',
      tab_feed: 'Feed',
      tab_chat: 'Chat',
      tab_profile: 'Profil',
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