<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { supabaseClient } from "../lib/supabaseClient";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

const canSubmit = computed(
  () => email.value && password.value && !loading.value,
);

function goHome() {
  router.push('/');
}

async function login() {
  errorMessage.value = "";

  if (!canSubmit.value) {
    errorMessage.value =
      "Veuillez renseigner votre e-mail et votre mot de passe.";
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    });

    if (error) throw error;

    const user = data.user;
    if (!user)
      throw new Error("Impossible de récupérer les données utilisateur.");

    const { data: userInfo, error: dbError } = await supabaseClient
      .from("info_user")
      .select("n_et_p")
      .eq("id_user", user.id)
      .single();

    const nameFromDb = userInfo?.n_et_p;
    const nameFromMetadata =
      user.user_metadata?.full_name || user.user_metadata?.n_et_p;

    const finalDisplayName = nameFromDb || nameFromMetadata || "Voyageur";

    const sessionData = {
      ...data,
      id_user: user.id,
      id: user.id,
      userId: user.id,
      user: {
        ...user,
        id: user.id,
        id_user: user.id,
        displayName: finalDisplayName,
      },
    };

    localStorage.setItem("rail_user_session", JSON.stringify(sessionData));
    router.push({ name: "Dashboard" });
  } catch (err) {
    errorMessage.value =
      err.message || "Erreur de connexion. Veuillez réessayer.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="login-page">
    <div class="brand-panel">
      <p class="eyebrow">Diatsara</p>
      <h1>Reservez votre billet de train en quelques minutes.</h1>
      <p>
        Connectez-vous pour rechercher un trajet, choisir une place sur le plan
        du wagon et preparer votre reservation.
      </p>
    </div>

    <form class="login-card" @submit.prevent="login">
      <div class="login-card-header">
        <button type="button" class="btn-back-login" @click="goHome" title="Retour à l'accueil">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour
        </button>
        <div class="header-title">
          <p class="eyebrow">Connexion</p>
        </div>
      </div>

      <label>
        Adresse e-mail
        <input
          v-model="email"
          type="email"
          placeholder="nom@exemple.com"
          autocomplete="email"
          required
        />
      </label>

      <label>
        Mot de passe
        <input
          v-model="password"
          type="password"
          placeholder="Votre mot de passe"
          autocomplete="current-password"
          required
        />
      </label>

      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

      <button class="primary-button" type="submit" :disabled="!canSubmit">
        {{ loading ? "Connexion..." : "Se connecter" }}
      </button>

      <p class="auth-switch">
        Pas encore de compte ?
        <button type="button" @click="router.push({ name: 'Signup' })">
          Créer un compte
        </button>
      </p>
    </form>
  </section>
</template>

<style scoped>
/* ===== LAYOUT ===== */
.login-page {
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
}

/* ===== BRAND PANEL ===== */
.brand-panel {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: center;
  padding: clamp(32px, 7vw, 96px);
  color: #f8fbf8;
  background:
    linear-gradient(rgba(10, 30, 28, 0.58), rgba(10, 30, 28, 0.7)),
    url("../assets/gare_image.jpg") center / cover;
}

.brand-panel h1 {
  margin: 0;
  font-size: clamp(2.2rem, 6vw, 5.2rem);
  line-height: 0.98;
  letter-spacing: 0;
}

.brand-panel p:not(.eyebrow) {
  margin: 24px 0 0;
  color: rgba(248, 251, 248, 0.82);
  font-size: 1.1rem;
  line-height: 1.7;
}

.eyebrow {
  margin: 0 0 10px;
  color: #24746c;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand-panel .eyebrow {
  color: #9fe3cd;
}

/* ===== LOGIN CARD ===== */
.login-card {
  align-self: center;
  width: min(420px, calc(100% - 48px));
  margin: 0 auto;
  padding: 32px;
  border: 1px solid #dce5dd;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(23, 33, 31, 0.12);
  position: relative;
}

/* ===== HEADER AVEC BOUTON RETOUR ===== */
.login-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-back-login {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f8faf8;
  color: #17211f;
  border: 1px solid #dce5dd;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.btn-back-login:hover {
  background: #24746c;
  color: #ffffff;
  border-color: #24746c;
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(36, 116, 108, 0.25);
}

.btn-back-login:active {
  transform: translateX(-2px) scale(0.97);
}

.btn-back-login svg {
  width: 18px;
  height: 18px;
  transition: transform 0.25s ease;
}

.btn-back-login:hover svg {
  transform: translateX(-3px);
}

.login-card-header .eyebrow {
  margin: 0;
  font-size: 1.5rem;
  color: #52625e;
  letter-spacing: 0.05em;
}

/* ===== FORMULAIRE ===== */
label {
  display: grid;
  gap: 8px;
  margin-top: 20px;
  color: #52625e;
  font-size: 0.92rem;
  font-weight: 700;
}

label:first-of-type {
  margin-top: 0;
}

input {
  width: 100%;
  min-height: 48px;
  border: 1px solid #cad7d0;
  border-radius: 8px;
  padding: 0 14px;
  color: #17211f;
  background: #fbfdfb;
  outline: none;
  font-size: 1rem;
}

input:focus {
  border-color: #24746c;
  box-shadow: 0 0 0 4px rgba(36, 116, 108, 0.12);
}

.primary-button {
  min-height: 48px;
  width: 100%;
  border: 0;
  border-radius: 8px;
  margin-top: 24px;
  padding: 0 18px;
  color: #ffffff;
  background: #24746c;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.primary-button:hover:not(:disabled) {
  background: #1b5e58;
}

.primary-button:disabled {
  background: #98aaa5;
  cursor: not-allowed;
}

.form-error {
  margin: 12px 0 0;
  color: #b53737;
  font-size: 0.9rem;
  font-weight: 800;
}

.auth-switch {
  margin: 18px 0 0;
  color: #52625e;
  font-size: 0.92rem;
  font-weight: 700;
  text-align: center;
}

.auth-switch button {
  border: 0;
  padding: 0;
  color: #24746c;
  background: transparent;
  font-weight: 900;
  cursor: pointer;
}

.auth-switch button:hover {
  text-decoration: underline;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 940px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 44vh;
    padding: 32px 24px;
  }

  .login-card {
    margin: -40px auto 40px;
    width: calc(100% - 32px);
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 20px;
    margin: -30px auto 30px;
  }

  .login-card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .btn-back-login {
    justify-content: center;
    padding: 8px 12px;
    font-size: 0.8rem;
  }

  .login-card-header .eyebrow {
    text-align: center;
  }

  .brand-panel h1 {
    font-size: 2rem;
  }
}
</style>

<style scoped>
/* ===== RESPONSIVE LOGIN ===== */

/* Tablette */
@media (max-width: 940px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 40vh;
    padding: 32px 24px;
  }

  .login-card {
    margin: -40px auto 40px;
    width: calc(100% - 32px);
    padding: 24px;
  }
  
  .brand-panel h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
  }
  
  .brand-panel p:not(.eyebrow) {
    font-size: 1rem;
  }
}

/* Mobile */
@media (max-width: 560px) {
  .login-card {
    padding: 20px;
    margin: -30px auto 30px;
    width: calc(100% - 20px);
  }

  .login-card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .btn-back-login {
    justify-content: center;
    padding: 8px 12px;
    font-size: 0.8rem;
  }

  .login-card-header .eyebrow {
    text-align: center;
    font-size: 0.8rem;
  }

  .brand-panel {
    min-height: 35vh;
    padding: 24px 16px;
  }
  
  .brand-panel h1 {
    font-size: 1.8rem;
  }
  
  .brand-panel p:not(.eyebrow) {
    font-size: 0.9rem;
    margin-top: 16px;
  }
  
  label {
    font-size: 0.85rem;
    margin-top: 16px;
  }
  
  input {
    min-height: 42px;
    font-size: 0.9rem;
  }
  
  .primary-button {
    min-height: 42px;
    font-size: 0.9rem;
    margin-top: 18px;
  }
  
  .auth-switch {
    font-size: 0.85rem;
  }
}

/* Petit mobile */
@media (max-width: 380px) {
  .login-card {
    padding: 16px;
  }
  
  .btn-back-login {
    font-size: 0.7rem;
    padding: 6px 10px;
  }
  
  .btn-back-login svg {
    width: 14px;
    height: 14px;
  }
}
</style>