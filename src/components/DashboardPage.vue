<!-- DashboardPage.vue -->
<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import BookingDashboard from "./BookingDashboard.vue";
import TicketCartPanel from "./TicketCartPanel.vue";
import { supabaseClient, supabaseMadarail } from "../lib/supabaseClient.js";

const router = useRouter();

// ===== ÉTATS RÉACTIFS =====
const trains = ref([]);
const isLoadingTrains = ref(false);
const trainError = ref("");
const selectedTrain = ref(""); // ← Initialisé comme chaîne vide
const cartItems = ref([]);
const showCartPage = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const editingTicket = ref(null);
let toastTimeoutId = null;
let refreshInterval = null;

// ===== TOAST =====
function triggerToast(message, duration = 3000) {
  toastMessage.value = message;
  showToast.value = true;

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = setTimeout(() => {
    showToast.value = false;
    toastTimeoutId = null;
  }, duration);
}

// ===== CHARGEMENT DES DONNÉES =====
async function loadTrainsFromSupabase() {
  isLoadingTrains.value = true;
  trainError.value = "";
  try {
    const { data, error } = await supabaseMadarail
      .from("voyages")
      .select("*")
      .eq("statut", "actif")
      .order("date_voyage", { ascending: true });

    if (error) throw error;
    trains.value = data || [];
    
    // Correction : Vérifier que trains a des éléments avant d'assigner
    if (trains.value.length > 0) {
      selectedTrain.value = trains.value[0].id;
    } else {
      selectedTrain.value = ""; // ← Toujours une chaîne, jamais undefined
    }
  } catch (error) {
    console.error("Erreur voyages:", error.message);
    trainError.value = "Impossible de charger les voyages actifs.";
    selectedTrain.value = ""; // ← En cas d'erreur, mettre une chaîne vide
  } finally {
    isLoadingTrains.value = false;
  }
}

async function loadCartFromSupabase() {
  const session = JSON.parse(localStorage.getItem("rail_user_session") || "{}");
  const currentUserId =
    session.user?.id ||
    session.userId ||
    session.user?.id_user ||
    session.id_user;

  if (!currentUserId) {
    cartItems.value = [];
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("ticket_voyageur_site")
      .select("*")
      .eq("id_voyageur", currentUserId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    cartItems.value = data || [];
    console.log('📦 Panier chargé:', cartItems.value.length, 'billets');
  } catch (error) {
    console.error("Erreur panier:", error);
    cartItems.value = [];
  }
}

// ===== RECHARGE AUTOMATIQUE =====
function startAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(() => {
    loadTrainsFromSupabase();
    if (!showCartPage.value) {
      loadCartFromSupabase();
    }
  }, 30000);
}

// ===== ACTIONS PANIER =====
async function handleDeleteItem(ticketId) {
  const confirmDelete = confirm("Voulez-vous vraiment supprimer ce billet ?");
  if (!confirmDelete) return;

  try {
    const { error } = await supabaseClient
      .from("ticket_voyageur_site")
      .delete()
      .eq("id", ticketId);

    if (error) throw error;

    triggerToast("Le billet a été supprimé avec succès.");
    await loadCartFromSupabase();
  } catch (error) {
    console.error("Erreur lors de la suppression :", error.message);
    alert("Impossible de supprimer le billet.");
  }
}

// ===== GESTION DE L'ÉDITION =====
function handleEditItem(ticket) {
  console.log('📝 Édition du ticket:', ticket);
  const index = cartItems.value.findIndex(item => item.id === ticket.id);
  if (index !== -1) {
    cartItems.value[index] = { ...cartItems.value[index], ...ticket };
    console.log('✅ Ticket mis à jour dans la liste locale');
  } else {
    console.log('🔄 Ticket non trouvé, rechargement complet');
    loadCartFromSupabase();
  }
  
  triggerToast(
    `Le billet de ${ticket.nom_voyageur || "du voyageur"} a été modifié avec succès.`,
    3000
  );
}

// ===== CALCULS =====
const activeTrain = computed(() => {
  // Vérifier que selectedTrain.value est une chaîne non vide
  if (!selectedTrain.value || !trains.value.length) return null;
  return trains.value.find((t) => t.id === selectedTrain.value) || null;
});

const cartBadgeCount = computed(() => cartItems.value.length);

const user = computed(() => {
  const session = JSON.parse(localStorage.getItem("rail_user_session") || "{}");
  return {
    name: session.user?.displayName || session.user?.full_name || "Voyageur",
    email: session.user?.email || "voyageur@diatsara.mg",
    id:
      session.user?.id ||
      session.userId ||
      session.user?.id_user ||
      session.id_user ||
      null,
  };
});

function logout() {
  localStorage.removeItem("rail_user_session");
  router.push({ name: "Home" });
}

// ===== GESTION DES TICKETS =====
async function handleTicketSaved(newTicket) {
  await loadCartFromSupabase();
  editingTicket.value = null;
  triggerToast(
    `Le billet de ${newTicket?.nom_voyageur || "du voyageur"} a été validé et enregistré.`,
    4000
  );
}

function selectTrain(trainId) {
  // S'assurer que trainId est une chaîne
  selectedTrain.value = trainId || "";
}

// ===== NETTOYAGE =====
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
});

// ===== INITIALISATION =====
onMounted(() => {
  loadTrainsFromSupabase();
  loadCartFromSupabase();
  startAutoRefresh();
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'rail_user_session') {
      loadCartFromSupabase();
    }
  });
});
</script>

<template>
  <div class="dashboard-root-layout">
    <!-- BARRE DE NAVIGATION SUPÉRIEURE -->
    <header class="app-top-navbar">
      <div class="navbar-brand">
        <span class="brand-logo-indicator"></span>
        <div class="brand-text-group">
          <h1>Diatsara</h1>
          <p>Espace Voyageur</p>
        </div>
      </div>

      <nav class="navbar-actions">
        <button
          class="nav-toggle-btn"
          :class="{ active: !showCartPage }"
          @click="showCartPage = false"
        >
          Réservation
        </button>
        <button
          class="nav-toggle-btn position-relative"
          :class="{ active: showCartPage }"
          @click="showCartPage = true"
        >
          Panier / Billets
          <span v-if="cartBadgeCount > 0" class="badge-count-indicator">
            {{ cartBadgeCount }}
          </span>
        </button>

        <router-link
          to="/profile"
          class="user-profile-link"
          title="Voir mon profil"
        >
          <div class="user-profile-summary">
            <div class="avatar-placeholder">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <div class="user-meta-info">
              <span class="profile-username">{{ user.name }}</span>
              <span class="profile-email">{{ user.email }}</span>
            </div>
          </div>
        </router-link>
      </nav>
    </header>

    <!-- TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="toast-notification">
        <div class="toast-content">
          <p>{{ toastMessage }}</p>
        </div>
      </div>
    </Transition>

    <!-- ZONE DE CONTENU PRINCIPAL -->
    <main class="dashboard-main-content">
      <!-- Message d'erreur -->
      <div v-if="trainError" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erreur de chargement</h3>
        <p>{{ trainError }}</p>
        <button @click="loadTrainsFromSupabase" class="btn-retry">
          Réessayer
        </button>
      </div>

      <!-- Aucun train disponible -->
      <div v-else-if="!isLoadingTrains && trains.length === 0 && !showCartPage" class="empty-state">
        <div class="empty-state-icon">🚂</div>
        <h2>Aucun départ planifié</h2>
        <p>
          Aucun train actif n'est disponible pour le moment.<br />
          Veuillez revenir plus tard ou consulter les horaires à venir.
        </p>
        <div class="empty-state-actions">
          <button @click="loadTrainsFromSupabase" class="btn-refresh">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
            </svg>
            Actualiser
          </button>
          <router-link to="/profile" class="btn-secondary-outline">
            Voir mon profil
          </router-link>
        </div>
      </div>

      <!-- Chargement -->
      <div v-else-if="isLoadingTrains && !showCartPage" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Chargement des départs disponibles...</p>
      </div>

      <!-- Contenu normal -->
      <div v-else-if="!showCartPage" class="booking-section">
        <BookingDashboard
          :trains="trains"
          :selected-train="selectedTrain"
          :active-train="activeTrain"
          :user="user"
          :editing-ticket="editingTicket"
          @select-train="selectTrain"
          @ticket-saved="handleTicketSaved"
        />
      </div>

      <!-- Panier -->
      <div v-else class="cart-section">
        <div class="section-title-block">
          <h2>Historique récent des encaissements</h2>
          <p>Retrouvez la liste complète des titres émis au guichet.</p>
        </div>

        <TicketCartPanel
          :cart-items="cartItems"
          @remove-item="handleDeleteItem"
          @edit-item="handleEditItem"
          @refresh="loadCartFromSupabase"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ===== LAYOUT PRINCIPAL ===== */
.dashboard-root-layout {
  min-height: 100vh;
  background-color: #eef2ed;
  display: flex;
  flex-direction: column;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* ===== NAVBAR ===== */
.app-top-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 12px 24px;
  border-bottom: 1px solid #dce5dd;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo-indicator {
  width: 8px;
  height: 24px;
  background: #24746c;
  border-radius: 2px;
}

.brand-text-group h1 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #17211f;
  margin: 0;
  line-height: 1.1;
}

.brand-text-group p {
  font-size: 0.72rem;
  color: #667672;
  margin: 2px 0 0 0;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-toggle-btn {
  background: transparent;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: #667672;
  padding: 8px 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}

.nav-toggle-btn:hover {
  background: #f4f8f5;
  color: #17211f;
}

.nav-toggle-btn.active {
  background: #eaf6f2;
  color: #24746c;
}

.position-relative {
  position: relative;
}

.badge-count-indicator {
  position: absolute;
  top: -4px;
  right: -6px;
  background: #24746c;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 10px;
  min-width: 12px;
  text-align: center;
}

.user-profile-link {
  text-decoration: none;
  padding-left: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.user-profile-link:hover {
  opacity: 0.7;
}

.user-profile-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 1px solid #dce5dd;
  padding-left: 16px;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  background: #24746c;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.user-meta-info {
  display: flex;
  flex-direction: column;
}

.profile-username {
  font-size: 0.82rem;
  font-weight: 700;
  color: #17211f;
}

.profile-email {
  font-size: 0.7rem;
  color: #667672;
}

/* ===== CONTENU PRINCIPAL ===== */
.dashboard-main-content {
  flex-grow: 1;
  padding: 24px;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.section-title-block {
  margin-bottom: 20px;
}

.section-title-block h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #17211f;
  margin: 0;
}

.section-title-block p {
  font-size: 0.85rem;
  color: #667672;
  margin: 4px 0 0 0;
}

/* ===== ÉTATS ===== */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  background: #fdf2f2;
  border-radius: 8px;
  border: 1px solid #f0d4d4;
  min-height: 300px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.error-state h3 {
  font-size: 1.3rem;
  color: #991b1b;
  margin: 0 0 8px 0;
}

.error-state p {
  color: #7f1d1d;
  font-size: 0.95rem;
  margin: 0 0 20px 0;
}

.btn-retry {
  padding: 10px 24px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-retry:hover {
  background: #b91c1c;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 2px dashed #dce5dd;
  min-height: 300px;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-state h2 {
  font-size: 1.5rem;
  color: #17211f;
  margin: 0 0 12px 0;
  font-weight: 700;
}

.empty-state p {
  color: #667672;
  font-size: 1rem;
  max-width: 500px;
  margin: 0 0 30px 0;
  line-height: 1.6;
}

.empty-state-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #24746c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refresh:hover {
  background: #1b5e58;
  transform: translateY(-2px);
}

.btn-secondary-outline {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: transparent;
  color: #24746c;
  border: 2px solid #24746c;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-secondary-outline:hover {
  background: #eaf6f2;
  transform: translateY(-2px);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 8px;
  min-height: 300px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #24746c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.loading-state p {
  color: #667672;
  font-size: 0.95rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== TOAST ===== */
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #17211f;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(23, 33, 31, 0.2);
  z-index: 9999;
  max-width: 380px;
  pointer-events: none;
}

.toast-content p {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.4;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 940px) {
  .app-top-navbar {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;
  }

  .navbar-actions {
    flex-wrap: wrap;
    width: 100%;
    justify-content: space-between;
  }

  .user-profile-link {
    padding-left: 8px;
  }
}

@media (max-width: 560px) {
  .dashboard-main-content {
    padding: 16px;
  }

  .empty-state {
    padding: 40px 16px;
    min-height: 200px;
  }

  .empty-state-icon {
    font-size: 3rem;
  }

  .empty-state h2 {
    font-size: 1.2rem;
  }

  .empty-state-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-refresh,
  .btn-secondary-outline {
    width: 100%;
    justify-content: center;
  }

  .error-state {
    padding: 40px 16px;
    min-height: 200px;
  }

  .loading-state {
    padding: 40px 16px;
    min-height: 200px;
  }

  .toast-notification {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
  }
}
</style>

<style scoped>
/* ===== RESPONSIVE DASHBOARD ===== */

/* Tablette */
@media (max-width: 940px) {
  .app-top-navbar {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;
  }

  .navbar-actions {
    flex-wrap: wrap;
    width: 100%;
    justify-content: space-between;
  }

  .user-profile-link {
    padding-left: 8px;
  }
  
  .dashboard-main-content {
    padding: 16px;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr !important;
  }
  
  .grid-pane {
    min-height: 300px !important;
    padding: 16px !important;
  }
}

/* Mobile */
@media (max-width: 560px) {
  .dashboard-main-content {
    padding: 12px;
  }
  
  .app-top-navbar {
    padding: 10px 12px;
  }
  
  .navbar-brand h1 {
    font-size: 1rem;
  }
  
  .navbar-brand p {
    font-size: 0.65rem;
  }
  
  .nav-toggle-btn {
    font-size: 0.75rem;
    padding: 6px 10px;
  }
  
  .user-meta-info {
    display: none;
  }
  
  .avatar-placeholder {
    width: 28px;
    height: 28px;
    font-size: 0.7rem;
  }
  
  .user-profile-summary {
    padding-left: 8px;
    border-left: none;
  }

  .empty-state {
    padding: 30px 16px;
    min-height: 200px;
  }

  .empty-state-icon {
    font-size: 3rem;
  }

  .empty-state h2 {
    font-size: 1.2rem;
  }

  .empty-state-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-refresh,
  .btn-secondary-outline {
    width: 100%;
    justify-content: center;
  }

  .error-state {
    padding: 30px 16px;
    min-height: 200px;
  }

  .loading-state {
    padding: 30px 16px;
    min-height: 200px;
  }

  .toast-notification {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
  }
  
  .section-title-block h2 {
    font-size: 1.1rem;
  }
  
  .section-title-block p {
    font-size: 0.8rem;
  }
}
</style>

