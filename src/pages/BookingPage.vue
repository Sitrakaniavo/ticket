<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import BookingDashboard from '../components/BookingDashboard.vue'
import Footer from '../components/Footer.vue'
import { supabaseClient, supabaseMadarail } from '../lib/supabaseClient.js'

const router = useRouter()

const trains = ref([])
const selectedTrain = ref('')
const isLoadingTrains = ref(false)
const trainError = ref('')
const cartItems = ref([])
const showToast = ref(false)
const toastMessage = ref('')
const editingTicket = ref(null)
const isMobile = ref(false)
const toastTimeoutId = ref(null)

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

function triggerToast(message, duration = 3000) {
  toastMessage.value = message
  showToast.value = true

  if (toastTimeoutId.value) {
    clearTimeout(toastTimeoutId.value)
  }

  toastTimeoutId.value = setTimeout(() => {
    showToast.value = false
    toastTimeoutId.value = null
  }, duration)
}

async function loadTrainsFromSupabase() {
  isLoadingTrains.value = true
  trainError.value = ''

  try {
    const { data, error } = await supabaseMadarail
      .from('voyages')
      .select('*')
      .eq('statut', 'actif')
      .order('date_voyage', { ascending: true })

    if (error) throw error

    trains.value = data || []
    selectedTrain.value = trains.value.length > 0 ? trains.value[0].id : ''
  } catch (error) {
    console.error('Erreur voyages:', error.message)
    trainError.value = 'Impossible de charger les voyages actifs.'
    selectedTrain.value = ''
  } finally {
    isLoadingTrains.value = false
  }
}

async function loadCartFromSupabase() {
  const session = JSON.parse(localStorage.getItem('rail_user_session') || '{}')
  const currentUserId = session.user?.id || session.userId || session.user?.id_user || session.id_user

  if (!currentUserId) {
    cartItems.value = []
    return
  }

  try {
    const { data, error } = await supabaseClient
      .from('ticket_voyageur_site')
      .select('*')
      .eq('id_voyageur', currentUserId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cartItems.value = data || []
  } catch (error) {
    console.error('Erreur panier:', error)
    cartItems.value = []
  }
}

function selectTrain(trainId) {
  selectedTrain.value = trainId || ''
}

function logout() {
  localStorage.removeItem('rail_user_session')
  router.push({ name: 'Home' })
}

const activeTrain = computed(() => {
  if (!selectedTrain.value || !trains.value.length) return null
  return trains.value.find((train) => train.id === selectedTrain.value) || null
})

const cartBadgeCount = computed(() => cartItems.value.length)

const user = computed(() => {
  const session = JSON.parse(localStorage.getItem('rail_user_session') || '{}')
  return {
    name: session.user?.displayName || session.user?.full_name || 'Voyageur',
    email: session.user?.email || 'voyageur@diatsara.mg',
    cin: session.user?.cin || session.cin || null,
    id: session.user?.id || session.userId || session.user?.id_user || session.id_user || null,
  }
})

async function handleTicketSaved(newTicket) {
  await loadCartFromSupabase()
  editingTicket.value = null
  triggerToast(`Le billet de ${newTicket?.nom_voyageur || 'du voyageur'} a été validé et enregistré.`, 4000)
}

function handleEditItem(ticket) {
  const index = cartItems.value.findIndex((item) => item.id === ticket.id)
  if (index !== -1) {
    cartItems.value[index] = { ...cartItems.value[index], ...ticket }
  } else {
    loadCartFromSupabase()
  }

  triggerToast(`Le billet de ${ticket.nom_voyageur || 'du voyageur'} a été modifié avec succès.`, 3000)
}

async function handleDeleteItem(ticketId) {
  if (!confirm('Voulez-vous vraiment supprimer ce billet ?')) return

  try {
    const { error } = await supabaseClient.from('ticket_voyageur_site').delete().eq('id', ticketId)

    if (error) throw error

    triggerToast('Le billet a été supprimé avec succès.')
    await loadCartFromSupabase()
  } catch (error) {
    console.error('Erreur lors de la suppression :', error.message)
    triggerToast('Impossible de supprimer le billet.', 3000)
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  loadTrainsFromSupabase()
  loadCartFromSupabase()

  window.addEventListener('storage', (event) => {
    if (event.key === 'rail_user_session') {
      loadCartFromSupabase()
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  if (toastTimeoutId.value) {
    clearTimeout(toastTimeoutId.value)
  }
})
</script>

<template>
  <div class="booking-page-shell">
    <header class="booking-topbar">
      <router-link to="/" class="brand-wrap">
        <span class="brand-dot"></span>
        <div>
          <h1>Diatsara</h1>
          <p>Espace Voyageur</p>
        </div>
      </router-link>

      <nav class="topbar-actions">
        <router-link to="/booking" class="nav-pill active">Réservation</router-link>
        <router-link to="/tickets" class="nav-pill position-relative">
          Billets
          <span v-if="cartBadgeCount > 0" class="badge-count-indicator">{{ cartBadgeCount }}</span>
        </router-link>
        <router-link to="/profile" class="profile-link">
          <div class="avatar-placeholder">{{ user.name.charAt(0).toUpperCase() }}</div>
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

    <main class="booking-main">
      <div v-if="trainError" class="error-state">
        <h3>Erreur de chargement</h3>
        <p>{{ trainError }}</p>
        <button class="btn-retry" @click="loadTrainsFromSupabase">Réessayer</button>
      </div>

      <div v-else-if="!isLoadingTrains && trains.length === 0" class="empty-state">
        <h2>Aucun départ planifié</h2>
        <p>Aucun train actif n'est disponible pour le moment.</p>
        <button class="btn-retry" @click="loadTrainsFromSupabase">Actualiser</button>
      </div>

      <div v-else-if="isLoadingTrains" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Chargement des départs disponibles...</p>
      </div>

      <div v-else class="booking-card">
        <BookingDashboard
          :trains="trains"
          :selected-train="selectedTrain"
          :active-train="activeTrain"
          :user="user"
          :editing-ticket="editingTicket"
          :is-mobile="isMobile"
          @select-train="selectTrain"
          @ticket-saved="handleTicketSaved"
          @ticket-updated="handleEditItem"
        />
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.booking-page-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.12), transparent 18%),
    linear-gradient(180deg, #f8fbfb 0%, #eef5f4 100%);
}

.booking-topbar {
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
  all : unset;
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
  box-shadow: 0 0 18px rgba(34, 197, 94, 0.7);
}

.brand-wrap h1,
.brand-wrap p {
  margin: 0;
}

.brand-wrap h1 {
  font-size: 1.25rem;
}

.brand-wrap p {
  font-size: 0.78rem;
  opacity: 0.8;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-pill,
.profile-link {
  text-decoration: none;
  color: white;
}

.nav-pill {
  padding: 10px 14px;
  border-radius: 999px;
  background: #f4f8f7;
  border: 1px solid rgba(15, 23, 42, 0.08);
  font-weight: 700;
  color: #0f172a;
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
  color: #0f172a;
}

.avatar-placeholder {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #0f172a;
  font-weight: 800;
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

.booking-main {
  padding: 28px 20px 40px;
}

.booking-card {
  max-width: 1280px;
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

.empty-state,
.loading-state,
.error-state {
  max-width: 680px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #0f172a;
  border-radius: 18px;
  padding: 28px;
  text-align: center;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
}

.empty-state h2,
.error-state h3,
.loading-state p {
  color: #0f172a;
}

.btn-retry {
  border: none;
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
}

.loading-spinner {
  width: 42px;
  height: 42px;
  margin: 0 auto 14px;
  border: 4px solid rgba(20, 184, 166, 0.24);
  border-top-color: #14b8a6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

</style>
