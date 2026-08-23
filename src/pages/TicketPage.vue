<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import Footer from "../components/Footer.vue";
import TicketCartPanel from "../components/TicketCartPanel.vue";
import { supabaseClient } from "../lib/supabaseClient.js";

const router = useRouter();

const cartItems = ref([]);
const isMobile = ref(false);
const isMobileMenuOpen = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const toastTimeoutId = ref(null);
const ticketToDelete = ref(null);
const isDeletingTicket = ref(false);
const isLoadingTickets = ref(true);

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

function showConfirmationModal(message, duration = 1500) {
  toastMessage.value = message;
  showToast.value = true;

  if (toastTimeoutId.value) {
    clearTimeout(toastTimeoutId.value);
  }

  toastTimeoutId.value = setTimeout(() => {
    showToast.value = false;
    toastTimeoutId.value = null;
  }, duration);
}

async function loadCartFromSupabase() {
  isLoadingTickets.value = true;
  const session = JSON.parse(localStorage.getItem("rail_user_session") || "{}");
  const currentUserId =
    session.user?.id ||
    session.userId ||
    session.user?.id_user ||
    session.id_user;

  if (!currentUserId) {
    cartItems.value = [];
    isLoadingTickets.value = false;
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
  } catch (error) {
    console.error("Erreur panier:", error);
    cartItems.value = [];
  } finally {
    isLoadingTickets.value = false;
  }
}

function handleDeleteItem(ticketId) {
  ticketToDelete.value = cartItems.value.find((ticket) => ticket.id === ticketId) || {
    id: ticketId,
  };
}

function closeDeleteModal() {
  if (!isDeletingTicket.value) {
    ticketToDelete.value = null;
  }
}

async function confirmDeleteTicket() {
  if (!ticketToDelete.value || isDeletingTicket.value) return;

  isDeletingTicket.value = true;

  try {
    const { error } = await supabaseClient
      .from("ticket_voyageur_site")
      .delete()
      .eq("id", ticketToDelete.value.id);

    if (error) throw error;

    ticketToDelete.value = null;
    showConfirmationModal("Le billet a été supprimé avec succès.");
    await loadCartFromSupabase();
  } catch (error) {
    console.error("Erreur lors de la suppression :", error.message);
    showConfirmationModal("Impossible de supprimer le billet.", 1500);
  } finally {
    isDeletingTicket.value = false;
  }
}

function handleEditItem(ticket) {
  const index = cartItems.value.findIndex((item) => item.id === ticket.id);
  if (index !== -1) {
    cartItems.value[index] = { ...cartItems.value[index], ...ticket };
  } else {
    loadCartFromSupabase();
  }

  showConfirmationModal(
    `Le billet de ${ticket.nom_voyageur || "du voyageur"} a été modifié avec succès.`,
    1500,
  );
}

async function logout() {
  try {
    await supabaseClient.auth.signOut();
  } finally {
    localStorage.removeItem("rail_user_session");
    router.push({ name: "Home" });
  }
}

const cartBadgeCount = computed(() => cartItems.value.length);

const user = computed(() => {
  const session = JSON.parse(localStorage.getItem("rail_user_session") || "{}");
  return {
    name: session.user?.displayName || session.user?.full_name || "Voyageur",
    email: session.user?.email || "voyageur@diatsara.mg",
  };
});

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  loadCartFromSupabase();

  window.addEventListener("storage", (event) => {
    if (event.key === "rail_user_session") {
      loadCartFromSupabase();
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkMobile);
  if (toastTimeoutId.value) {
    clearTimeout(toastTimeoutId.value);
  }
});
</script>

<template>
  <div class="ticket-page-shell">
    <header class="ticket-topbar">
      <router-link to="/" class="brand-wrap">
        <span class="brand-dot"></span>
        <div>
          <h1>Diatsara</h1>
          <p>Espace Voyageur</p>
        </div>
      </router-link>

      <nav v-if="!isMobile" class="topbar-actions">
        <router-link to="/booking" class="nav-pill">Réservation</router-link>
        <router-link to="/tickets" class="nav-pill active position-relative">
          Billets
        </router-link>
        <router-link to="/profile" class="profile-link">
          <div class="avatar-placeholder">
            {{ user.name.charAt(0).toUpperCase() }}
          </div>
        </router-link>
      </nav>

      <div v-else class="mobile-nav-actions">
        <router-link to="/tickets" class="mobile-ticket-link position-relative">
          Billets
          <span v-if="cartBadgeCount > 0" class="badge-count-indicator">{{
            cartBadgeCount
          }}</span>
        </router-link>
        <button
          type="button"
          class="mobile-menu-button"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="ticket-mobile-menu"
          :aria-label="isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
          @click="toggleMobileMenu"
        >
          <span class="menu-line"></span>
          <span class="menu-line"></span>
          <span class="menu-line"></span>
          <span v-if="cartBadgeCount > 0" class="mobile-menu-count">{{ cartBadgeCount }}</span>
        </button>
      </div>

      <nav
        v-if="isMobile && isMobileMenuOpen"
        id="ticket-mobile-menu"
        class="mobile-menu"
        aria-label="Navigation mobile"
      >
        <router-link to="/booking" class="mobile-menu-link" @click="closeMobileMenu">
          Réservation
        </router-link>
        <router-link to="/tickets" class="mobile-menu-link active" @click="closeMobileMenu">
          Billets
          <span v-if="cartBadgeCount > 0" class="mobile-badge-count">{{
            cartBadgeCount
          }}</span>
        </router-link>
        <router-link to="/profile" class="mobile-menu-link" @click="closeMobileMenu">
          Profil
        </router-link>
      </nav>
    </header>

    <Transition name="modal-fade">
      <div v-if="showToast" class="delete-modal-overlay" role="presentation">
        <section
          class="delete-modal success-modal"
          role="status"
          aria-live="polite"
        >
          <div class="delete-modal-icon success-modal-icon" aria-hidden="true">✓</div>
          <h2>Billet annulé</h2>
          <p>{{ toastMessage }}</p>
        </section>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div
        v-if="ticketToDelete"
        class="delete-modal-overlay"
        role="presentation"
        @click.self="closeDeleteModal"
      >
        <section
          class="delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div class="delete-modal-icon" aria-hidden="true">!</div>
          <h2 id="delete-modal-title">Annuler ce billet ?</h2>
          <p>
            Voulez-vous vraiment annuler le billet de 
            <strong>{{ ticketToDelete.nom_voyageur || "sélectionné" }}</strong> ?
          </p>
          <div class="delete-modal-actions">
            <button
              type="button"
              class="delete-cancel-button"
              :disabled="isDeletingTicket"
              @click="closeDeleteModal"
            >
              Non, conserver
            </button>
            <button
              type="button"
              class="delete-confirm-button"
              :disabled="isDeletingTicket"
              @click="confirmDeleteTicket"
            >
              {{ isDeletingTicket ? "Annulation..." : "Oui, annuler" }}
            </button>
          </div>
        </section>
      </div>
    </Transition>

    <main class="ticket-main">
      <div class="section-title-block">
        <h2>Mes Billets</h2>
        <p>Retrouvez la liste de vos titres de transport.</p>
      </div>

      <div class="ticket-card">
        <TicketCartPanel
          :cart-items="cartItems"
          :is-loading="isLoadingTickets"
          :is-mobile="isMobile"
          @remove-item="handleDeleteItem"
          @edit-item="handleEditItem"
          @refresh="loadCartFromSupabase"
        />
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.ticket-page-shell {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at top left,
      rgba(20, 184, 166, 0.12),
      transparent 18%
    ),
    linear-gradient(180deg, #f8fbfb 0%, #eef5f4 100%);
}

.ticket-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.95);
  color: #0f172a;
  gap: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.brand-wrap {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #22c55e;
}

.brand-wrap h1,
.brand-wrap p {
  font-size: 1.25rem;
  margin: 0;
}

.brand-wrap p {
  font-size: 0.78rem;
  opacity: 0.8;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-nav-actions {
  display: none;
}

.nav-pill,
.profile-link {
  text-decoration: none;
  color: #0f172a;
}

.nav-pill {
  display: inline-flex;
  height: 42px;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: #f4f8f7;
  border: 1px solid rgba(15, 23, 42, 0.08);
  font-weight: 700;
}

.nav-pill.active {
  background: #e8fbf7;
  border-color: rgba(20, 184, 166, 0.32);
  color: #0f766e;
}

.profile-link {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0;
  border-radius: 999px;
  background: #f4f8f7;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.avatar-placeholder {
  width: 30px;
  height: 30px;
  display: grid;
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

.ticket-main {
  padding: 24px;
}

.section-title-block {
  max-width: 1200px;
  margin: 0 auto 18px;
}

.section-title-block h2 {
  margin: 0 0 4px;
}

.section-title-block p {
  margin: 0;
  color: #64748b;
}

.ticket-card {
  max-width: 1200px;
  margin: 0 auto;
}

.delete-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.68);
  backdrop-filter: blur(3px);
}

.delete-modal {
  width: min(420px, 100%);
  padding: 28px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2);
  text-align: center;
}

.delete-modal-icon {
  display: grid;
  width: 44px;
  height: 44px;
  margin: 0 auto 16px;
  place-items: center;
  border-radius: 50%;
  color: #b42318;
  background: #fee4e2;
  font-size: 1.4rem;
  font-weight: 900;
}

.success-modal-icon {
  color: #24746c;
  background: #d9f3e8;
}

.delete-modal h2 {
  margin: 0;
  color: #17211f;
  font-size: 1.35rem;
}

.delete-modal p {
  margin: 12px 0 0;
  color: #64748b;
  line-height: 1.6;
}

.delete-modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 24px;
}

.delete-cancel-button,
.delete-confirm-button {
  min-height: 44px;
  border-radius: 8px;
  padding: 0 14px;
  font-weight: 800;
  cursor: pointer;
}

.delete-cancel-button {
  border: 1px solid #cad7d0;
  color: #17211f;
  background: #ffffff;
}

.delete-confirm-button {
  border: 1px solid #b42318;
  color: #ffffff;
  background: #b42318;
}

.delete-cancel-button:disabled,
.delete-confirm-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.28s ease;
}

.modal-fade-enter-active .delete-modal,
.modal-fade-leave-active .delete-modal {
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .delete-modal,
.modal-fade-leave-to .delete-modal {
  opacity: 0;
  transform: translateY(18px) scale(0.94);
}

.badge-count-indicator {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #ef4444;
  color: white;
  font-size: 0.72rem;
  padding: 0 4px;
}

.position-relative {
  position: relative;
}

@media (max-width: 768px) {
  .ticket-topbar {
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

  .mobile-ticket-link,
  .mobile-menu-button {
    min-height: 44px;
  }

  .mobile-ticket-link {
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
    position: relative;
    display: grid;
    width: 44px;
    place-content: center;
    gap: 4px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 10px;
    color: #0f172a;
    background: #f4f8f7;
  }

  .mobile-menu-button .menu-line {
    display: block;
    width: 18px;
    height: 2px;
    border-radius: 2px;
    background: currentColor;
  }

  .mobile-menu-count {
    position: absolute;
    top: -7px;
    right: -7px;
    display: grid;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    place-items: center;
    border: 2px solid #ffffff;
    border-radius: 999px;
    background: #ef4444;
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 800;
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
    justify-content: space-between;
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

  .ticket-main {
    padding: 20px 16px;
  }

  .section-title-block h2 {
    font-size: 1.5rem;
  }

  .section-title-block p {
    font-size: 0.9rem;
    line-height: 1.5;
  }

}
</style>
