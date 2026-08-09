<script setup>
import { useRegisterPage } from '../composables/useRegisterPage'

const emit = defineEmits(['show-login'])

const {
  fullName,
  email,
  phone,
  cin,
  password,
  confirmPassword,
  showPassword,
  loading,
  errorMessage,
  successMessage,
  registerComplete,
  passwordsMatch,
  canSubmit,
  formatPhone,
  goHome,
  goToLogin,
  submitRegister,
} = useRegisterPage(emit)
</script>

<template>
  <section class="login-page">
    <div class="brand-panel">
      <p class="eyebrow">Diatsara</p>
      <h1>Creer un compte voyageur.</h1>
      <p>
        Enregistrez vos informations pour reserver plus vite, retrouver vos billets
        et choisir votre place avant le depart.
      </p>
    </div>

    <form class="login-card" @submit.prevent="submitRegister">
      <div class="login-card-header">
        <button type="button" class="btn-back-login" @click="goHome" title="Retour à l'accueil">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour
        </button>
        <div class="header-title">
          <p class="eyebrow">Inscription</p>
        </div>
      </div>

      <p v-if="confirmPassword && !passwordsMatch" class="form-error">
        Les mots de passe ne correspondent pas.
      </p>
      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="form-success">{{ successMessage }}</p>

      <template v-if="!registerComplete">
        <label>
          Nom d'utilisateur
          <input v-model="fullName" type="text" placeholder="Comment on vous appelle ?" autocomplete="name" required />
        </label>

        <label>
          Adresse e-mail
          <input v-model="email" type="email" placeholder="nom@exemple.com" autocomplete="email" required />
        </label>

        <label>
          Telephone
          <input 
            v-model="phone" 
            type="tel" 
            @input="formatPhone"
            autocomplete="tel"
            placeholder="+261 34 00 000 00"
            maxlength="17"
            required 
          />
        </label>

        <label>
          CIN
          <input v-model="cin" type="text" placeholder="Numero de CIN" maxlength="12" required />
        </label>

        <label>
          Mot de passe
          <span class="password-field">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Choisir un mot de passe"
              autocomplete="new-password"
              minlength="6"
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

        <label>
          Confirmer le mot de passe
          <span class="password-field">
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Repeter le mot de passe"
              autocomplete="new-password"
              minlength="6"
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

        <button class="primary-button" type="submit" :disabled="!canSubmit">
          {{ loading ? 'Creation...' : 'Creer mon compte' }}
        </button>

        <p class="auth-switch">
          Deja inscrit ?
          <button type="button" @click="goToLogin">Se connecter</button>
        </p>
      </template>
    </form>
  </section>
</template>

<style scoped>
@import '../styles/components/register-page.css';
</style>
