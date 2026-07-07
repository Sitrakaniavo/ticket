<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabaseClient } from '../lib/supabaseClient'

const emit = defineEmits(['show-login'])
const router = useRouter()

const fullName = ref('')
const email = ref('')
// Initialisation du téléphone avec le préfixe figé
const phone = ref('+261 ')
const cin = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const registerComplete = ref(false)
const redirectTimeout = ref(null)

function goHome() {
  router.push('/')
}

// Supabase Auth gere le hash du mot de passe cote serveur.
const passwordsMatch = computed(() => password.value === confirmPassword.value)

// La validation s'assure aussi que le numéro a la bonne longueur formatée (+261 + 9 chiffres + 4 espaces = 17 caractères)
const canSubmit = computed(
  () => fullName.value && email.value && phone.value.length === 17 && cin.value && password.value.length >= 6 && passwordsMatch.value && !loading.value,
)

// Logique de formatage dynamique du numéro malgache
function formatPhone(event) {
  let inputVal = event.target.value

  // 1. Forcer le "+261 " initial quoi qu'il arrive
  if (!inputVal.startsWith('+261 ')) {
    phone.value = '+261 '
    return
  }

  // 2. Extraire uniquement les chiffres entrés après "+261 "
  const rawNumbers = inputVal.substring(5).replace(/\D/g, '')

  // 3. Tronquer à 9 chiffres maximum (standard Madagascar)
  const truncated = rawNumbers.substring(0, 9)

  // 4. Reconstruire la chaîne avec le bon formatage d'espaces
  let formatted = '+261 '
  
  if (truncated.length > 0) {
    formatted += truncated.substring(0, 2) // Ex: "38"
  }
  if (truncated.length > 2) {
    formatted += ' ' + truncated.substring(2, 4) // Ex: "77"
  }
  if (truncated.length > 4) {
    formatted += ' ' + truncated.substring(4, 7) // Ex: "837"
  }
  if (truncated.length > 7) {
    formatted += ' ' + truncated.substring(7, 9) // Ex: "44"
  }

  phone.value = formatted
}

// Sécurité si l'utilisateur sélectionne tout et fait "Retour arrière"
watch(phone, (newVal) => {
  if (!newVal || newVal.length < 5) {
    phone.value = '+261 '
  }
})

async function submitRegister() {
  errorMessage.value = ''
  successMessage.value = ''
  registerComplete.value = false

  if (!canSubmit.value) {
    errorMessage.value = 'Verifiez les champs du formulaire avant de continuer.'
    return
  }

  loading.value = true

  try {
    // Etape 1: Creation du compte Supabase Auth avec le nom dans les metadonnees
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          displayName: fullName.value,
        },
      },
    })

    if (authError) {
      throw authError
    }

    // Etape 2: Recuperer l'UID du nouvel utilisateur
    const userId = authData.user?.id
    if (!userId) {
      throw new Error('Impossible de recuperer l\'UID utilisateur.')
    }

    // Etape 3: Inserer les donnees dans la table info_user
    const { error: insertError } = await supabaseClient
      .from('info_user')
      .insert([
        {
          id_info_user: userId,
          n_et_p: fullName.value,
          numero: phone.value,
          cin: cin.value,
        },
      ])

    if (insertError) {
      throw insertError
    }

    registerComplete.value = true
    successMessage.value = 'Compte cree avec succes. Redirection vers la connexion...'
    redirectTimeout.value = setTimeout(() => goToLogin(), 3000)
  } catch (err) {
    errorMessage.value = err.message || 'Une erreur est survenue pendant l inscription.'
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  emit('show-login')
  router.push({ name: 'Login' })
}

onBeforeUnmount(() => {
  if (redirectTimeout.value) {
    clearTimeout(redirectTimeout.value)
  }
})
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
  justify-content: space-between;
  align-items: center;
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

.password-field {
  position: relative;
  display: block;
}

.password-field input {
  padding-right: 54px;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  display: grid;
  width: 34px;
  min-height: 34px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  padding: 0;
  color: #24746c;
  background: #eaf6f2;
  transform: translateY(-50%);
  cursor: pointer;
}

.password-toggle:hover {
  background: #d8eee7;
}

.eye-icon {
  position: relative;
  width: 18px;
  height: 12px;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.eye-icon::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  content: "";
  transform: translate(-50%, -50%);
}

.eye-icon.hidden::after {
  position: absolute;
  top: 50%;
  left: -3px;
  width: 24px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  content: "";
  transform: rotate(-42deg);
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

.form-success {
  margin: 12px 0 0;
  color: #24746c;
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
/* ===== RESPONSIVE REGISTER ===== */

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
  
  .password-toggle {
    width: 30px;
    min-height: 30px;
  }
  
  .eye-icon {
    width: 16px;
    height: 10px;
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