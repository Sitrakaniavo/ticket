<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginPage } from '../composables/useLoginPage'

const router = useRouter()
const showPassword = ref(false)

const {
  email,
  password,
  loading,
  errorMessage,
  canSubmit,
  goHome,
  login,
} = useLoginPage()
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
        <span class="password-field">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Votre mot de passe"
            autocomplete="current-password"
            required
          />
          <button
            class="password-toggle"
            type="button"
            :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            :title="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            @click="showPassword = !showPassword"
          >
            <span class="eye-icon" :class="{ hidden: showPassword }"></span>
          </button>
        </span>
      </label>

      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

      <button class="primary-button" type="submit" :disabled="!canSubmit">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
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
@import '../styles/components/login-page.css';
</style>
