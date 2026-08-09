<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import Footer from "../components/Footer.vue";
import TicketCartPanel from "../components/TicketCartPanel.vue";
import { supabaseClient } from "../lib/supabaseClient.js";

const router = useRouter();

const cartItems = ref([]);
const isMobile = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const toastTimeoutId = ref(null);

function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
}

function triggerToast(message, duration = 3000) {
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
  } catch (error) {
    console.error("Erreur panier:", error);
    cartItems.value = [];
  }
}

async function handleDeleteItem(ticketId) {
  if (!confirm("Voulez-vous vraiment supprimer ce billet ?")) return;

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
    triggerToast("Impossible de supprimer le billet.", 3000);
  }
}

function handleEditItem(ticket) {
  const index = cartItems.value.findIndex((item) => item.id === ticket.id);
  if (index !== -1) {
    cartItems.value[index] = { ...cartItems.value[index], ...ticket };
  } else {
    loadCartFromSupabase();
  }

  triggerToast(
    `Le billet de ${ticket.nom_voyageur || "du voyageur"} a été modifié avec succès.`,
    3000,
  );
}

function logout() {
  localStorage.removeItem("rail_user_session");
  router.push({ name: "Home" });
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

      <nav class="topbar-actions">
        <router-link to="/booking" class="nav-pill">Réservation</router-link>
        <router-link to="/tickets" class="nav-pill active position-relative">
          Billets
          <span v-if="cartBadgeCount > 0" class="badge-count-indicator">{{
            cartBadgeCount
          }}</span>
        </router-link>
        <router-link to="/profile" class="profile-link">
          <div class="avatar-placeholder">
            {{ user.name.charAt(0).toUpperCase() }}
          </div>
          <div class="profile-meta">
            <span>{{ user.name }}</span>
            <small>{{ user.email }}</small>
          </div>
        </router-link>
      </nav>
    </header>

    <Transition name="toast-fade">
      <div v-if="showToast" class="toast-notification">
        <p>{{ toastMessage }}</p>
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

.nav-pill,
.profile-link {
  text-decoration: none;
  color: #0f172a;
}

.nav-pill {
  padding: 10px 14px;
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
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f4f8f7;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.avatar-placeholder {
  width: 36px;
  height: 36px;
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

.toast-notification {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: #ffffff;
  color: #0f172a;
  padding: 12px 16px;
  border-radius: 14px;
  z-index: 50;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.14);
  border: 1px solid rgba(15, 23, 42, 0.08);
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
</style>
