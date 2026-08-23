<template>
  <div class="profile-page">
    <header class="profile-topbar">
      <router-link to="/" class="brand-wrap">
        <span class="brand-dot"></span>
        <div>
          <h1>Diatsara</h1>
          <p>Espace Voyageur</p>
        </div>
      </router-link>

      <nav v-if="!isMobile" class="topbar-actions">
        <router-link to="/booking" class="nav-pill">Réservation</router-link>
        <router-link to="/tickets" class="nav-pill position-relative">
          Billets
          <span v-if="cartBadgeCount > 0" class="badge-count-indicator">{{ cartBadgeCount }}</span>
        </router-link>
        <router-link to="/profile" class="profile-link active">
          <div class="avatar-placeholder">
            {{ user.displayName?.charAt(0)?.toUpperCase() || user.full_name?.charAt(0)?.toUpperCase() || "U" }}
          </div>
        </router-link>
      </nav>

      <div v-else class="mobile-nav-actions">
        <router-link to="/profile" class="mobile-profile-link">Profil</router-link>
        <button
          type="button"
          class="mobile-menu-button"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="profile-mobile-menu"
          :aria-label="isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
          @click="toggleMobileMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav
        v-if="isMobile && isMobileMenuOpen"
        id="profile-mobile-menu"
        class="mobile-menu"
        aria-label="Navigation mobile"
      >
        <router-link to="/booking" class="mobile-menu-link" @click="closeMobileMenu">
          Réservation
        </router-link>
        <router-link to="/tickets" class="mobile-menu-link" @click="closeMobileMenu">
          Billets
          <span v-if="cartBadgeCount > 0" class="mobile-badge-count">{{ cartBadgeCount }}</span>
        </router-link>
        <router-link to="/profile" class="mobile-menu-link active" @click="closeMobileMenu">
          Profil
        </router-link>
      </nav>
    </header>

    <!-- En-tête du profil -->
    <header class="profile-header">
      <div class="profile-header-content">
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar">
            {{
              user.displayName?.charAt(0)?.toUpperCase() ||
              user.full_name?.charAt(0)?.toUpperCase() ||
              "U"
            }}
          </div>
          <span class="profile-status-dot"></span>
        </div>
        <div class="profile-user-info">
          <h1>{{ user.displayName || user.full_name || "Utilisateur" }}</h1>
          <p class="profile-email">{{ user.email || "email@exemple.mg" }}</p>
          <div class="profile-badge">
            <span class="badge">Voyageur</span>
          </div>
        </div>
        <button @click="logout" class="btn-logout">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Déconnexion
        </button>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="profile-content">
      <!-- Informations personnelles -->
      <section class="profile-section">
        <div class="section-header">
          <div class="section-title-wrapper">
            <span class="section-icon">👤</span>
            <h3>Informations personnelles</h3>
          </div>
          <button v-if="!isEditing" @click="enableEditing" class="btn-edit">
            ✎ Modifier
          </button>
          <div v-else class="edit-actions-buttons">
            <button @click="cancelEditing" class="btn-cancel-edit">
              Annuler
            </button>
            <button
              @click="saveUserInfo"
              class="btn-save-edit"
              :disabled="isSaving"
            >
              {{ isSaving ? "Sauvegarde..." : "Sauvegarder" }}
            </button>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-group">
            <label>Nom complet</label>
            <p v-if="!isEditing" class="info-value">
              {{ user.displayName || user.full_name || "Non renseigné" }}
            </p>
            <input
              v-else
              v-model="editForm.full_name"
              type="text"
              class="info-input"
              placeholder="Votre nom complet"
            />
          </div>
          <div class="info-group">
            <label>Email</label>
            <p class="info-value">{{ user.email || "Non renseigné" }}</p>
            <span class="info-hint">L'email ne peut pas être modifié</span>
          </div>
          <div class="info-group">
            <label>N° CIN</label>
            <p v-if="!isEditing" class="info-value">
              {{ user.cin || "Non renseigné" }}
            </p>
            <input
              v-else
              v-model="editForm.cin"
              type="text"
              class="info-input"
              placeholder="Ex: 101 102 103 104"
              maxlength="14"
              @input="formatCin"
            />
          </div>
          <div class="info-group">
            <label>Téléphone</label>
            <p v-if="!isEditing" class="info-value">
              {{ user.phone || "Non renseigné" }}
            </p>
            <input
              v-else
              v-model="editForm.phone"
              type="tel"
              class="info-input"
              placeholder="+261 34 12 345 67"
              @input="formatPhone"
            />
          </div>
        </div>

        <div v-if="editError" class="edit-error">⚠️ {{ editError }}</div>
        <div v-if="editSuccess" class="edit-success">✅ {{ editSuccess }}</div>
      </section>

      <!-- Notifications -->
      <section class="profile-section">
        <div class="section-header">
          <div class="section-title-wrapper">
            <span class="section-icon">🔔</span>
            <h3>Notifications</h3>
          </div>
        </div>

        <div class="settings-grid">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Rappels de voyage</span>
              <span class="setting-desc"
                >Recevoir des rappels par email avant vos départs</span
              >
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="preferences.tripReminders" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Alertes perturbations</span>
              <span class="setting-desc"
                >Être informé des changements et annulations</span
              >
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="preferences.disruptionAlerts" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Offres promotionnelles</span>
              <span class="setting-desc"
                >Recevoir les meilleures offres et réductions</span
              >
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="preferences.promotions" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- Sécurité -->
      <section class="profile-section">
        <div class="section-header">
          <div class="section-title-wrapper">
            <span class="section-icon">🔒</span>
            <h3>Sécurité</h3>
          </div>
        </div>

        <div class="security-actions">
          <button
            @click="showChangePassword = true"
            class="btn-password-change"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              />
            </svg>
            Modifier le mot de passe
          </button>
          <p class="security-hint">
            Pour des raisons de sécurité, choisissez un mot de passe d'au moins
            8 caractères.
          </p>
        </div>
      </section>
    </main>

    <!-- Modal de changement de mot de passe -->
    <div
      v-if="showChangePassword"
      class="modal-overlay"
      @click.self="showChangePassword = false"
    >
      <div class="modal-content">
        <button class="close-btn" @click="showChangePassword = false">×</button>
        <h3>🔒 Modifier le mot de passe</h3>
        <p class="modal-subtitle">Entrez votre nouveau mot de passe</p>

        <form @submit.prevent="changePassword" class="password-form">
          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <div class="password-field">
              <input
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Entrez votre nouveau mot de passe"
                minlength="8"
                required
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <span class="eye-icon" :class="{ hidden: showPassword }"></span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Confirmer le mot de passe</label>
            <div class="password-field">
              <input
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Confirmez votre nouveau mot de passe"
                minlength="8"
                required
              />
            </div>
          </div>

          <div v-if="passwordError" class="form-error">
            ⚠️ {{ passwordError }}
          </div>
          <div v-if="passwordSuccess" class="form-success">
            ✅ {{ passwordSuccess }}
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn-cancel"
              @click="showChangePassword = false"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn-save"
              :disabled="isLoadingPassword"
            >
              {{ isLoadingPassword ? "Modification..." : "Modifier" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { supabaseClient } from "../lib/supabaseClient";

const router = useRouter();

// ===== ÉTATS =====
const user = ref({
  displayName: "",
  full_name: "",
  email: "",
  cin: "",
  phone: "",
  id: null,
});

const editForm = reactive({
  full_name: "",
  cin: "",
  phone: "",
});

const preferences = reactive({
  tripReminders: true,
  disruptionAlerts: true,
  promotions: false,
});

// États d'édition
const isEditing = ref(false);
const isSaving = ref(false);
const editError = ref("");
const editSuccess = ref("");

// État du modal mot de passe
const showChangePassword = ref(false);
const showPassword = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");
const passwordError = ref("");
const passwordSuccess = ref("");
const isLoadingPassword = ref(false);
const isMobile = ref(false);
const isMobileMenuOpen = ref(false);
const cartBadgeCount = ref(0);

function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    isMobileMenuOpen.value = false;
  }
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}

async function loadCartBadgeCount() {
  const session = JSON.parse(localStorage.getItem("rail_user_session") || "{}");
  const currentUserId =
    session.user?.id ||
    session.userId ||
    session.user?.id_user ||
    session.id_user;

  if (!currentUserId) {
    cartBadgeCount.value = 0;
    return;
  }

  try {
    const { count, error } = await supabaseClient
      .from("ticket_voyageur_site")
      .select("id", { count: "exact", head: true })
      .eq("id_voyageur", currentUserId);

    if (error) throw error;
    cartBadgeCount.value = count || 0;
  } catch (error) {
    console.error("Erreur compteur billets:", error);
    cartBadgeCount.value = 0;
  }
}

// ===== CHARGEMENT DES DONNÉES UTILISATEUR =====
function loadUserData() {
  try {
    const sessionData = localStorage.getItem("rail_user_session");
    if (!sessionData) {
      router.push("/login");
      return;
    }

    const session = JSON.parse(sessionData);

    user.value = {
      displayName: session.user?.displayName || session.user?.full_name || "",
      full_name: session.user?.full_name || session.user?.displayName || "",
      email: session.user?.email || "",
      cin: session.user?.cin || "",
      phone: session.user?.phone || "",
      id: session.user?.id || session.user?.id_user || session.id_user || null,
    };

    // Remplir le formulaire d'édition
    editForm.full_name = user.value.full_name || user.value.displayName || "";
    editForm.cin = user.value.cin || "";
    editForm.phone = user.value.phone || "";

    // Charger les préférences
    const savedPrefs = localStorage.getItem("user_preferences");
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        Object.assign(preferences, prefs);
      } catch (e) {
        console.error("Erreur chargement préférences:", e);
      }
    }
  } catch (error) {
    console.error("Erreur chargement profil:", error);
    router.push("/login");
  }
}

// ===== FORMATAGE DES CHAMPS =====
function formatCin(event) {
  let value = event.target.value.replace(/\D/g, "");
  if (value.length > 12) {
    value = value.slice(0, 12);
  }
  const blocks = value.match(/.{1,3}/g);
  editForm.cin = blocks ? blocks.join(" ") : value;
}

function formatPhone(event) {
  let value = event.target.value;
  if (!value.startsWith("+261 ")) {
    value = "+261 " + value.replace(/\D/g, "");
  }
  const numbers = value.substring(5).replace(/\D/g, "");
  const truncated = numbers.substring(0, 9);
  let formatted = "+261 ";
  if (truncated.length > 0) {
    formatted += truncated.substring(0, 2);
  }
  if (truncated.length > 2) {
    formatted += " " + truncated.substring(2, 4);
  }
  if (truncated.length > 4) {
    formatted += " " + truncated.substring(4, 7);
  }
  if (truncated.length > 7) {
    formatted += " " + truncated.substring(7, 9);
  }
  editForm.phone = formatted;
}

// ===== ÉDITION DES INFORMATIONS =====
function enableEditing() {
  isEditing.value = true;
  editError.value = "";
  editSuccess.value = "";
  editForm.full_name = user.value.full_name || user.value.displayName || "";
  editForm.cin = user.value.cin || "";
  editForm.phone = user.value.phone || "";
}

const goBack = () => router.push({ name: 'Booking' })

function cancelEditing() {
  isEditing.value = false;
  editError.value = "";
  editSuccess.value = "";
}

async function saveUserInfo() {
  // Validation
  if (!editForm.full_name || editForm.full_name.trim() === "") {
    editError.value = "Le nom complet est obligatoire.";
    return;
  }

  if (editForm.cin && editForm.cin.replace(/\s/g, "").length > 0) {
    const cinDigits = editForm.cin.replace(/\s/g, "");
    if (cinDigits.length !== 12) {
      editError.value = "Le numéro CIN doit comporter exactement 12 chiffres.";
      return;
    }
  }

  isSaving.value = true;
  editError.value = "";
  editSuccess.value = "";

  try {
    const userId = user.value.id;
    if (!userId) {
      throw new Error("Utilisateur non identifié");
    }

    // Préparer les données
    const updateData = {
      n_et_p: editForm.full_name.trim(),
      numero: editForm.phone || "",
      cin: editForm.cin.replace(/\s/g, "") || "",
    };

    // Mettre à jour dans la table info_user
    const { error } = await supabaseClient
      .from("info_user")
      .update(updateData)
      .eq("id_info_user", userId);

    if (error) throw error;

    // Mettre à jour les métadonnées de l'utilisateur
    const { error: authError } = await supabaseClient.auth.updateUser({
      data: {
        full_name: editForm.full_name.trim(),
        displayName: editForm.full_name.trim(),
      },
    });

    if (authError) throw authError;

    // Mettre à jour la session locale
    const sessionData = localStorage.getItem("rail_user_session");
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.user.full_name = editForm.full_name.trim();
      session.user.displayName = editForm.full_name.trim();
      session.user.cin = editForm.cin.replace(/\s/g, "") || "";
      session.user.phone = editForm.phone || "";
      localStorage.setItem("rail_user_session", JSON.stringify(session));
    }

    // Mettre à jour l'objet user
    user.value.full_name = editForm.full_name.trim();
    user.value.displayName = editForm.full_name.trim();
    user.value.cin = editForm.cin.replace(/\s/g, "") || "";
    user.value.phone = editForm.phone || "";

    editSuccess.value = "Informations mises à jour avec succès !";

    setTimeout(() => {
      isEditing.value = false;
      editSuccess.value = "";
    }, 2000);
  } catch (error) {
    console.error("Erreur mise à jour:", error);
    editError.value =
      error.message || "Impossible de mettre à jour les informations.";
  } finally {
    isSaving.value = false;
  }
}

// ===== SAUVEGARDE DES PRÉFÉRENCES =====
function savePreferences() {
  try {
    localStorage.setItem("user_preferences", JSON.stringify(preferences));
  } catch (error) {
    console.error("Erreur sauvegarde préférences:", error);
  }
}

watch(
  preferences,
  () => {
    savePreferences();
  },
  { deep: true },
);

// ===== CHANGEMENT DE MOT DE PASSE =====
async function changePassword() {
  passwordError.value = "";
  passwordSuccess.value = "";

  if (newPassword.value.length < 8) {
    passwordError.value =
      "Le mot de passe doit contenir au moins 8 caractères.";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "Les mots de passe ne correspondent pas.";
    return;
  }

  isLoadingPassword.value = true;

  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword.value,
    });

    if (error) throw error;

    passwordSuccess.value = "Mot de passe modifié avec succès !";
    newPassword.value = "";
    confirmPassword.value = "";

    setTimeout(() => {
      showChangePassword.value = false;
      passwordSuccess.value = "";
    }, 2000);
  } catch (error) {
    console.error("Erreur changement mot de passe:", error);
    passwordError.value =
      error.message || "Impossible de modifier le mot de passe.";
  } finally {
    isLoadingPassword.value = false;
  }
}

// ===== DÉCONNEXION =====
const logout = () => {
  localStorage.removeItem("rail_user_session");
  localStorage.removeItem("user_preferences");
  router.push("/login");
};

// ===== INITIALISATION =====
onMounted(() => {
  loadUserData();
  loadCartBadgeCount();
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #eef2ed;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.profile-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(12px);
}

.brand-wrap {
  all: unset;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.brand-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #22c55e;
}

.brand-wrap h1,
.brand-wrap p {
  margin: 0;
}

.brand-wrap h1 {
  color: #0f172a;
  font-size: 1.25rem;
}

.brand-wrap p {
  color: #0f172a;
  font-size: 0.78rem;
  opacity: 0.8;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-pill,
.profile-link {
  color: #0f172a;
  text-decoration: none;
}

.nav-pill {
  display: inline-flex;
  height: 42px;
  align-items: center;
  padding: 0 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: #f4f8f7;
  font-weight: 700;
}

.position-relative {
  position: relative;
}

.badge-count-indicator {
  position: absolute;
  top: -6px;
  right: -6px;
  display: grid;
  min-width: 18px;
  height: 18px;
  place-items: center;
  padding: 0 4px;
  border-radius: 50%;
  color: #ffffff;
  background: #ef4444;
  font-size: 0.72rem;
}

.profile-link {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0;
  border: 1px solid rgba(20, 184, 166, 0.32);
  border-radius: 999px;
  background: #e8fbf7;
}

.avatar-placeholder {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: #d1fae5;
  color: #0f172a;
  font-weight: 700;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-meta span {
  font-weight: 700;
}

.profile-meta small {
  opacity: 0.75;
}

.mobile-nav-actions {
  display: none;
}

/* ===== EN-TÊTE ===== */
.profile-header {
  padding: 30px clamp(24px, 5vw, 72px);
  border-bottom: 1px solid #cfe1da;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.98), rgba(239, 248, 245, 0.96)),
    #f4f9f7;
  box-shadow: 0 8px 24px rgba(23, 33, 31, 0.05);
}

.profile-header-content {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #24746c;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid rgba(255, 255, 255, 0.85);
  font-size: 1.8rem;
  font-weight: 800;
  box-shadow: 0 6px 16px rgba(36, 116, 108, 0.22);
}

.profile-status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #22c55e;
  border: 3px solid #ffffff;
}

.profile-user-info {
  flex: 1;
}

.profile-user-info h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #17211f;
}

.profile-email {
  margin: 4px 0 8px 0;
  color: #667672;
  font-size: 0.95rem;
}

.profile-badge {
  display: flex;
  gap: 8px;
  align-items: center;
}

.badge {
  display: inline-block;
  background: #eaf6f2;
  color: #24746c;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid #cce7dd;
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 18px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.btn-logout:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* ===== CONTENU ===== */
.profile-content {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ===== SECTIONS ===== */
.profile-section {
  background: #ffffff;
  border: 1px solid #dce5dd;
  border-radius: 12px;
  padding: 24px;
  transition: box-shadow 0.2s;
}

.profile-section:hover {
  box-shadow: 0 4px 12px rgba(23, 33, 31, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  font-size: 1.3rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #17211f;
}

/* ===== BOUTONS D'ÉDITION ===== */
.btn-edit {
  padding: 6px 16px;
  background: transparent;
  color: #24746c;
  border: 1px solid #24746c;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-edit:hover {
  background: #eaf6f2;
}

.edit-actions-buttons {
  display: flex;
  gap: 8px;
}

.btn-cancel-edit {
  padding: 6px 16px;
  background: transparent;
  color: #667672;
  border: 1px solid #dce5dd;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel-edit:hover {
  background: #f1f4f1;
}

.btn-save-edit {
  padding: 6px 16px;
  background: #24746c;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-save-edit:hover:not(:disabled) {
  background: #1b5e58;
}

.btn-save-edit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== INFOS PERSONNELLES ===== */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-group {
  padding: 12px 16px;
  background: #f8faf8;
  border-radius: 8px;
}

.info-group label {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: #889894;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 4px;
}

.info-value {
  margin: 0;
  font-size: 0.95rem;
  color: #17211f;
  font-weight: 600;
}

.info-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #cad7d0;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #17211f;
  background: #ffffff;
  outline: none;
  transition: border-color 0.2s;
}

.info-input:focus {
  border-color: #24746c;
  box-shadow: 0 0 0 3px rgba(36, 116, 108, 0.12);
}

.info-hint {
  display: block;
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 4px;
}

.edit-error {
  margin-top: 12px;
  color: #b53737;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 8px 12px;
  background: #fdf2f2;
  border-radius: 8px;
  border: 1px solid #f0d4d4;
}

.edit-success {
  margin-top: 12px;
  color: #24746c;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 8px 12px;
  background: #eaf6f2;
  border-radius: 8px;
  border: 1px solid #24746c;
}

/* ===== NOTIFICATIONS ===== */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 4px;
  border-bottom: 1px solid #f1f4f1;
}

.setting-item:last-of-type {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-weight: 600;
  color: #17211f;
  font-size: 0.95rem;
}

.setting-desc {
  font-size: 0.8rem;
  color: #667672;
}

/* ===== TOGGLE SWITCH ===== */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: #d1d5db;
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #ffffff;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.toggle-switch input:checked + .toggle-slider {
  background: #24746c;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* ===== SÉCURITÉ ===== */
.security-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-password-change {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #f8faf8;
  color: #24746c;
  border: 1px solid #dce5dd;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s;
  align-self: flex-start;
}

.btn-password-change:hover {
  background: #eaf6f2;
  border-color: #24746c;
  transform: translateX(4px);
}

.security-hint {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.5;
}

@media (min-width: 769px) {
  .profile-content {
    display: grid;
    max-width: none;
    width: 100%;
    margin: 0;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    align-items: stretch;
    gap: 18px;
    padding: 32px 24px 40px;
  }

  .profile-section {
    min-width: 0;
    padding: 24px;
  }

  .profile-section:nth-child(1) {
    grid-column: span 7;
  }

  .profile-section:nth-child(2) {
    grid-column: span 5;
  }

  .profile-section:nth-child(3) {
    grid-column: 1 / -1;
  }

  .profile-section:nth-child(2) .setting-item {
    min-height: 66px;
  }

  .profile-section:nth-child(3) .security-actions {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 20px;
  }
}

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: #ffffff;
  padding: 32px;
  border-radius: 12px;
  max-width: 450px;
  width: 100%;
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: #667672;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #17211f;
}

.modal-subtitle {
  color: #667672;
  font-size: 0.9rem;
  margin: 4px 0 20px 0;
}

/* ===== FORMULAIRE MOT DE PASSE ===== */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #52625e;
  margin-top: 0;
}

.password-field {
  position: relative;
  display: block;
}

.password-field input {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cad7d0;
  border-radius: 8px;
  padding: 0 14px;
  color: #17211f;
  background: #fbfdfb;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.password-field input:focus {
  border-color: #24746c;
  box-shadow: 0 0 0 4px rgba(36, 116, 108, 0.12);
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

.form-error {
  color: #b53737;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 8px 12px;
  background: #fdf2f2;
  border-radius: 8px;
  border: 1px solid #f0d4d4;
}

.form-success {
  color: #24746c;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 8px 12px;
  background: #eaf6f2;
  border-radius: 8px;
  border: 1px solid #24746c;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel {
  min-height: 44px;
  border: 1px solid #cad7d0;
  border-radius: 8px;
  background: #ffffff;
  color: #17211f;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background: #f4f8f5;
}

.btn-save {
  min-height: 44px;
  border: none;
  border-radius: 8px;
  background: #24746c;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-save:hover:not(:disabled) {
  background: #1b5e58;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .profile-topbar {
    min-height: 72px;
    padding: 12px 16px;
  }

  .brand-wrap {
    gap: 8px;
  }

  .brand-dot {
    width: 10px;
    height: 10px;
  }

  .brand-wrap h1 {
    font-size: 1rem;
  }

  .brand-wrap p {
    font-size: 0.65rem;
  }

  .mobile-nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .mobile-profile-link,
  .mobile-menu-button {
    min-height: 44px;
  }

  .mobile-profile-link {
    display: inline-flex;
    align-items: center;
    padding: 0 11px;
    border: 1px solid rgba(20, 184, 166, 0.32);
    border-radius: 999px;
    color: #0f766e;
    background: #e8fbf7;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
  }

  .mobile-menu-button {
    display: grid;
    width: 44px;
    place-content: center;
    gap: 4px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 10px;
    color: #0f172a;
    background: #f4f8f7;
  }

  .mobile-menu-button span {
    display: block;
    width: 18px;
    height: 2px;
    border-radius: 2px;
    background: currentColor;
  }

  .mobile-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 16px;
    left: 16px;
    display: grid;
    gap: 4px;
    padding: 8px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.14);
  }

  .mobile-menu-link {
    display: flex;
    min-height: 46px;
    align-items: center;
    padding: 0 12px;
    border-radius: 8px;
    color: #0f172a;
    font-weight: 700;
    text-decoration: none;
  }

  .mobile-menu-link.active {
    color: #0f766e;
    background: #e8fbf7;
  }

  .mobile-badge-count {
    display: grid;
    min-width: 22px;
    height: 22px;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background: #ef4444;
    font-size: 0.72rem;
  }

  .profile-header {
    padding: 20px 16px;
  }

  .profile-header-content {
    flex-wrap: wrap;
    gap: 16px;
  }

  .profile-avatar {
    width: 64px;
    height: 64px;
    font-size: 1.5rem;
  }

  .profile-user-info h1 {
    font-size: 1.3rem;
  }

  .btn-logout {
    width: 100%;
    justify-content: center;
  }

  .profile-content {
    padding: 16px;
    gap: 16px;
  }

  .profile-section {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .edit-actions-buttons {
    width: 100%;
    justify-content: flex-end;
  }

  .modal-content {
    padding: 24px;
    margin: 16px;
  }

  .modal-actions {
    grid-template-columns: 1fr;
  }

  .btn-password-change {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .profile-avatar {
    width: 56px;
    height: 56px;
    font-size: 1.2rem;
  }

  .profile-user-info h1 {
    font-size: 1.1rem;
  }

  .profile-email {
    font-size: 0.85rem;
  }

  .setting-item {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>

<style scoped>
/* ===== RESPONSIVE PROFILE ===== */

/* Tablette */
@media (max-width: 768px) {
  .profile-header {
    padding: 20px 16px;
  }

  .profile-header-content {
    flex-wrap: wrap;
    gap: 16px;
  }

  .profile-avatar {
    width: 64px;
    height: 64px;
    font-size: 1.5rem;
  }

  .profile-user-info h1 {
    font-size: 1.3rem;
  }

  .btn-logout {
    width: 100%;
    justify-content: center;
  }

  .profile-content {
    padding: 16px;
    gap: 16px;
  }

  .profile-section {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .edit-actions-buttons {
    width: 100%;
    justify-content: flex-end;
  }

  .modal-content {
    padding: 24px;
    margin: 16px;
  }

  .modal-actions {
    grid-template-columns: 1fr;
  }

  .btn-password-change {
    width: 100%;
    justify-content: center;
  }
  
  .profile-header-left {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .btn-back {
    width: 100%;
    justify-content: center;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .profile-avatar {
    width: 56px;
    height: 56px;
    font-size: 1.2rem;
  }

  .profile-user-info h1 {
    font-size: 1.1rem;
  }

  .profile-email {
    font-size: 0.85rem;
  }

  .setting-item {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .profile-section {
    padding: 12px;
  }
  
  .info-group {
    padding: 10px 12px;
  }
  
  .info-value {
    font-size: 0.85rem;
  }
  
  .btn-edit,
  .btn-cancel-edit,
  .btn-save-edit {
    font-size: 0.7rem;
    padding: 4px 12px;
  }
  
  .security-hint {
    font-size: 0.7rem;
  }
}
</style>