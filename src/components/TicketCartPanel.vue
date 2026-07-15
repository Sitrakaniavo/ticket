<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { supabaseClient, supabaseMadarail } from '../lib/supabaseClient'

const props = defineProps({
  cartItems: { type: Array, required: true, default: () => [] },
  isMobile: { type: Boolean, default: false }
})

const emit = defineEmits(['remove-item', 'edit-item', 'refresh'])

// ===== ÉTATS =====
const currentFilter = ref('all')
const isModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedTicket = ref(null)
const isSaving = ref(false)
const editError = ref('')
const editSuccess = ref(false)
const isLoadingVoyages = ref(false)

// ===== DONNÉES DES GARES ET VOYAGES =====
const allGares = ref([])
const voyagesCache = ref({})
const isLoadingGares = ref(false)

// ===== FORMULAIRE D'ÉDITION =====
const editForm = reactive({
  id: null,
  nom_voyageur: '',
  cin: '',
  mineur: false,
  classe: '2eme',
  depart: '',
  arrivee: '',
  montant: 0,
  num_ticket: '',
  id_voyage: null,
  date_voyage: ''
})

// ===== FONCTIONS DE FORMATAGE =====
const formatPrice = (v) => {
  if (v === undefined || v === null) return '0'
  return new Intl.NumberFormat('fr-MG').format(v)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Date non disponible'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Date invalide'
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date)
  } catch {
    return dateString
  }
}

// ===== RÉCUPÉRATION D'UN VOYAGE AVEC CACHE =====
async function getVoyageById(voyageId) {
  if (!voyageId) return null
  
  if (voyagesCache.value[voyageId]) {
    return voyagesCache.value[voyageId]
  }
  
  try {
    const { data, error } = await supabaseMadarail
      .from('voyages')
      .select('id, date_voyage, sens, statut')
      .eq('id', voyageId)
      .maybeSingle()

    if (error) {
      console.error("Erreur récupération voyage:", error.message)
      return null
    }
    
    if (data) {
      voyagesCache.value[voyageId] = data
    }
    
    return data
  } catch (error) {
    console.error("Erreur récupération voyage:", error.message)
    return null
  }
}

// ===== CHARGEMENT DES VOYAGES MANQUANTS =====
async function loadMissingVoyages(tickets) {
  const voyageIds = [...new Set(tickets
    .filter(t => t.id_voyage && !voyagesCache.value[t.id_voyage])
    .map(t => t.id_voyage)
  )]
  
  if (voyageIds.length === 0) return
  
  isLoadingVoyages.value = true
  
  try {
    const { data, error } = await supabaseMadarail
      .from('voyages')
      .select('id, date_voyage, sens, statut')
      .in('id', voyageIds)

    if (error) throw error
    
    if (data) {
      data.forEach(voyage => {
        voyagesCache.value[voyage.id] = voyage
      })
    }
    
    console.log('✅ Voyages chargés:', Object.keys(voyagesCache.value).length)
  } catch (error) {
    console.error("Erreur chargement voyages manquants:", error.message)
  } finally {
    isLoadingVoyages.value = false
  }
}

// ===== ENRICHIR LES TICKETS AVEC LA DATE =====
const enrichedTickets = computed(() => {
  return props.cartItems.map(ticket => {
    if (ticket.date_voyage) {
      return {
        ...ticket,
        date_voyage: ticket.date_voyage,
        voyage_trouve: true,
        voyage_statut: 'unknown'
      }
    }
    
    if (ticket.id_voyage && voyagesCache.value[ticket.id_voyage]) {
      const voyage = voyagesCache.value[ticket.id_voyage]
      return {
        ...ticket,
        date_voyage: voyage.date_voyage || null,
        voyage_trouve: true,
        voyage_statut: voyage.statut || 'unknown'
      }
    }
    
    return {
      ...ticket,
      date_voyage: null,
      voyage_trouve: false,
      voyage_statut: null
    }
  })
})

// ===== COMPTER LES BILLETS ACTIFS =====
const hasActiveTickets = computed(() => {
  return enrichedTickets.value.some(t => t.status === 'actif')
})

const activeTicketsCount = computed(() => {
  return enrichedTickets.value.filter(t => t.status === 'actif').length
})

// ===== CHARGEMENT DES GARES =====
async function loadGares() {
  if (allGares.value.length > 0) return
  
  isLoadingGares.value = true
  try {
    const { data, error } = await supabaseClient
      .from('gares')
      .select('code, nom, pk')
      .order('pk', { ascending: true })

    if (error) throw error
    allGares.value = data || []
  } catch (error) {
    console.error("Erreur chargement des gares:", error.message)
  } finally {
    isLoadingGares.value = false
  }
}

// ===== FILTRAGE DES GARES =====
const garesDepart = computed(() => allGares.value)

const garesArrivee = computed(() => {
  if (!editForm.depart || allGares.value.length === 0) {
    return []
  }
  
  const indexDepart = allGares.value.findIndex(g => g.nom === editForm.depart)
  if (indexDepart === -1) return []
  
  return allGares.value.slice(indexDepart + 1)
})

// ===== RECHERCHE DU PRIX =====
const prixCalcule = ref(null)
const isLoadingPrice = ref(false)

async function rechercherPrix() {
  if (!editForm.depart || !editForm.arrivee) {
    prixCalcule.value = null
    return
  }

  const gareDepart = allGares.value.find(g => g.nom === editForm.depart)
  const gareArrivee = allGares.value.find(g => g.nom === editForm.arrivee)

  if (!gareDepart || !gareArrivee) {
    prixCalcule.value = null
    return
  }

  isLoadingPrice.value = true
  try {
    const { data, error } = await supabaseClient
      .from('trajets_train')
      .select('tarif_1, tarif_2')
      .ilike('gare_depart', gareDepart.code.trim())
      .ilike('gare_arrivee', gareArrivee.code.trim())
      .maybeSingle()

    if (error) throw error

    if (data) {
      const tarif = editForm.classe === '1ere' 
        ? Number(data.tarif_2 || data.tarif_1 || 0)
        : Number(data.tarif_1 || 0)

      let montantFinal = tarif
      if (tarif === 5800) montantFinal = 7000
      else if (tarif === 8800) montantFinal = 10000
      else if (tarif === 11600) montantFinal = 14000
      else if (tarif === 13800) montantFinal = 15000
      else if (tarif === 22600) montantFinal = 25000

      prixCalcule.value = montantFinal
      editForm.montant = montantFinal
    } else {
      prixCalcule.value = null
      editForm.montant = 0
    }
  } catch (error) {
    console.error("Erreur recherche prix:", error.message)
    prixCalcule.value = null
  } finally {
    isLoadingPrice.value = false
  }
}

// ===== OUVERTURE MODALE D'ÉDITION =====
async function openEditModal(item) {
  await loadGares()
  
  if (item.id_voyage && !voyagesCache.value[item.id_voyage]) {
    await getVoyageById(item.id_voyage)
  }
  
  const voyage = item.id_voyage ? voyagesCache.value[item.id_voyage] : null
  
  editForm.id = item.id
  editForm.nom_voyageur = item.nom_voyageur || ''
  editForm.cin = item.cin ? String(item.cin).replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4") : ''
  editForm.mineur = item.mineur || false
  editForm.classe = item.classe || '2eme'
  editForm.depart = item.depart || ''
  editForm.arrivee = item.arrivee || ''
  editForm.montant = item.montant || 0
  editForm.num_ticket = item.num_ticket || ''
  editForm.id_voyage = item.id_voyage || null
  editForm.date_voyage = item.date_voyage || (voyage ? voyage.date_voyage : '')
  
  editError.value = ''
  editSuccess.value = false
  prixCalcule.value = null
  
  if (editForm.depart && editForm.arrivee) {
    await rechercherPrix()
  }
  
  isEditModalOpen.value = true
}

// ===== SURVEILLANCE =====
watch(() => [editForm.depart, editForm.arrivee, editForm.classe], async () => {
  if (editForm.depart && editForm.arrivee) {
    await rechercherPrix()
  } else {
    prixCalcule.value = null
  }
})

// Formatage CIN
watch(() => editForm.cin, (newValue) => {
  if (!newValue) return
  let digits = newValue.replace(/\D/g, "")
  if (digits.length > 12) {
    digits = digits.slice(0, 12)
  }
  const blocks = digits.match(/.{1,3}/g)
  if (blocks) {
    const formatted = blocks.join(" ")
    if (formatted !== newValue) {
      editForm.cin = formatted
    }
  }
})

// ===== SAUVEGARDE =====
async function saveEdit() {
  if (!editForm.nom_voyageur || editForm.nom_voyageur.trim() === '') {
    editError.value = "Le nom du voyageur est obligatoire."
    return
  }

  if (!editForm.depart) {
    editError.value = "Veuillez sélectionner une gare de départ."
    return
  }

  if (!editForm.arrivee) {
    editError.value = "Veuillez sélectionner une gare d'arrivée."
    return
  }

  if (!editForm.mineur && (!editForm.cin || editForm.cin.replace(/\s/g, "").length !== 12)) {
    editError.value = "Le numéro CIN doit comporter exactement 12 chiffres."
    return
  }

  if (editForm.mineur && editForm.cin) {
    const cinDigits = editForm.cin.replace(/\s/g, "")
    if (cinDigits.length > 0 && cinDigits.length !== 12) {
      editError.value = "Le numéro CIN doit comporter exactement 12 chiffres."
      return
    }
  }

  if (!prixCalcule.value && prixCalcule.value !== 0) {
    editError.value = "Impossible de calculer le prix pour ce trajet."
    return
  }

  isSaving.value = true
  editError.value = ''
  editSuccess.value = false

  try {
    const updateData = {
      nom_voyageur: editForm.nom_voyageur.trim(),
      mineur: editForm.mineur,
      classe: editForm.classe,
      depart: editForm.depart,
      arrivee: editForm.arrivee,
      montant: prixCalcule.value,
      created_at: new Date().toISOString()
    }

    if (editForm.cin && editForm.cin.trim() !== '') {
      const cinDigits = editForm.cin.replace(/\s/g, "")
      if (cinDigits.length > 0) {
        updateData.cin = parseInt(cinDigits, 10)
      } else {
        updateData.cin = 0
      }
    } else {
      updateData.cin = 0
    }

    const { error } = await supabaseClient
      .from("ticket_voyageur_site")
      .update(updateData)
      .eq("id", editForm.id)

    if (error) throw error

    editSuccess.value = true
    editError.value = ''
    
    setTimeout(() => {
      isEditModalOpen.value = false
      emit('refresh')
      emit('edit-item', { ...editForm, ...updateData })
      editSuccess.value = false
    }, 1000)
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error.message)
    editError.value = error.message || "Impossible de mettre à jour le billet."
  } finally {
    isSaving.value = false
  }
}

// ===== FERMETURE =====
function closeEditModal() {
  if (isSaving.value) return
  isEditModalOpen.value = false
  editError.value = ''
  editSuccess.value = false
}

// ===== AUTRES FONCTIONS =====
function openModal(item) {
  selectedTicket.value = item
  isModalOpen.value = true
}

async function refreshData() {
  voyagesCache.value = {}
  await loadMissingVoyages(props.cartItems)
  emit('refresh')
}

function handleRemove(ticketId) {
  if (props.isMobile) {
    if (confirm('Supprimer ce billet ?')) {
      emit('remove-item', ticketId)
    }
  } else {
    emit('remove-item', ticketId)
  }
}

// ===== FILTRES ET TOTAUX =====
const filteredItems = computed(() => {
  const tickets = enrichedTickets.value
  if (currentFilter.value === 'all') return tickets
  return tickets.filter(item => item.status === currentFilter.value)
})

const totalActiveAmount = computed(() => 
  enrichedTickets.value.filter(i => i.status === 'actif')
    .reduce((sum, i) => sum + Number(i.montant || 0), 0)
)

// ===== CLASSE DISPLAY =====
const getClasseDisplay = (classe) => {
  if (classe === '1ere') return '1ère Classe'
  if (classe === '2eme') return '2ème Classe'
  return classe || '2ème Classe'
}

// ===== SURVEILLANCE DES TICKETS =====
watch(() => props.cartItems, async (newTickets) => {
  if (newTickets && newTickets.length > 0) {
    await loadMissingVoyages(newTickets)
  }
}, { immediate: true, deep: true })

// ===== INITIALISATION =====
onMounted(() => {
  loadGares()
  if (props.cartItems && props.cartItems.length > 0) {
    loadMissingVoyages(props.cartItems)
  }
})
</script>

<template>
  <div class="cart-panel-container" :class="{ 'mobile-cart': isMobile }">
    <!-- Header avec filtres -->
    <div class="cart-header-actions">
      <div class="filter-bar">
        <span class="filter-label">Filtrer</span>
        <div class="filter-options">
          <button 
            v-for="f in ['all', 'actif', 'inactif']" 
            :key="f"
            class="filter-chip" 
            :class="{ active: currentFilter === f }"
            @click="currentFilter = f"
          >
            {{ f.charAt(0).toUpperCase() + f.slice(1) }} 
            ({{ f === 'all' ? enrichedTickets.length : enrichedTickets.filter(i => i.status === f).length }})
          </button>
        </div>
      </div>
      
      <button class="btn-refresh-cart" @click="refreshData" title="Rafraîchir">
        <span v-if="!isMobile">↻ Rafraîchir</span>
        <span v-else>↻</span>
      </button>
    </div>

    <!-- Notice -->
    <div class="notice-bar" :class="{ 'mobile-notice': isMobile }">
      <span class="notice-icon">i</span>
      <span>Pour valider les billets, présentez-vous au vendeur.</span>
    </div>

    <!-- État vide - Aucun billet -->
    <div v-if="enrichedTickets.length === 0" class="empty-tickets-state">
      <div class="empty-tickets-icon">🎫</div>
      <h3 class="empty-tickets-title">Aucun billet enregistré</h3>
      <p class="empty-tickets-text">
        Vous n'avez pas encore de billets dans votre historique.
        Réservez votre premier voyage dès maintenant !
      </p>
    </div>

    <!-- GRILLE DES BILLETS -->
    <template v-else>
      <div class="cart-grid-layout" :class="{ 'mobile-grid': isMobile }">
        <div v-for="item in filteredItems" :key="item.id" 
          class="ticket-card" :class="[`status-${item.status}`]"
          @click="openModal(item)">
          
          <div class="ticket-header">
            <span class="ticket-id">{{ item.num_ticket }}</span>
            <span class="ticket-status-badge" :class="item.status">{{ item.status }}</span>
          </div>

          <div class="ticket-body">
            <!-- Trajet -->
            <div class="route-display">
              <div class="station">
                <span class="station-label">Départ</span>
                <strong class="station-name">{{ item.depart || '---' }}</strong>
              </div>
              <div class="route-arrow">→</div>
              <div class="station">
                <span class="station-label">Arrivée</span>
                <strong class="station-name">{{ item.arrivee || '---' }}</strong>
              </div>
            </div>
            
            <!-- Informations : Date et Classe en space-between -->
            <div class="ticket-meta">
              <div class="meta-item" :class="{ 'meta-missing': !item.voyage_trouve }">
                <span class="meta-label">Date</span>
                <span class="meta-value" :class="{ 'date-missing': !item.date_voyage }">
                  {{ formatDate(item.date_voyage) }}
                </span>
                <span v-if="!item.voyage_trouve" class="meta-warning">⚠</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Classe</span>
                <span class="meta-value" :class="{ 'first-class': item.classe === '1ere' }">
                  {{ getClasseDisplay(item.classe) }}
                </span>
              </div>

            </div>
            
            <!-- Voyageur -->
            <div class="meta-row">
              <span class="meta-row-label">Voyageur</span>
              <strong class="meta-row-value">{{ item.nom_voyageur || '---' }}</strong>
            </div>
            
            <!-- Avertissement voyage non trouvé -->
            <div v-if="!item.voyage_trouve && item.id_voyage" class="voyage-warning">
              ⚠ Voyage non trouvé (ID: {{ item.id_voyage.substring(0, 8) }}...)
            </div>
          </div>

          <!-- Footer du ticket -->
          <div class="ticket-footer">
            <span class="price">{{ formatPrice(item.montant) }} MGA</span>
            <div class="actions-zone">
              <button v-if="item.status === 'actif'" @click.stop="openEditModal(item)" class="card-action-btn edit-btn">
                Modifier
              </button>
              <button v-if="item.status === 'actif'" @click.stop="handleRemove(item.id)" class="card-action-btn remove-btn">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Total -->
      <div v-if="hasActiveTickets" class="cart-summary-footer" :class="{ 'mobile-summary': isMobile }">
        <div class="total-block">
          <span class="total-label">Total ({{ activeTicketsCount }} billet{{ activeTicketsCount > 1 ? 's' : '' }})</span>
          <span class="total-value">{{ formatPrice(totalActiveAmount) }} MGA</span>
        </div>
      </div>
    </template>

    <!-- MODALE DÉTAILS -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
      <div class="modal-content" :class="{ 'mobile-modal': isMobile }">
        <button class="close-btn" @click="isModalOpen = false">×</button>
        <h3>Détails du Billet</h3>
        <div class="qr-container">
          <qrcode-vue :value="selectedTicket?.num_ticket || ''" :size="isMobile ? 140 : 160" level="H" render-as="svg" />
        </div>
        <div class="ticket-info">
          <p v-if="selectedTicket?.mineur" class="minor-badge">Voyageur mineur</p>
          <p><span class="info-label">Numéro</span> <span class="info-value">{{ selectedTicket?.num_ticket }}</span></p>
          <p><span class="info-label">Voyageur</span> <span class="info-value">{{ selectedTicket?.nom_voyageur }}</span></p>
          <p><span class="info-label">Trajet</span> <span class="info-value">{{ selectedTicket?.depart || '---' }} → {{ selectedTicket?.arrivee || '---' }}</span></p>
          <p><span class="info-label">Date</span> <span class="info-value">{{ formatDate(selectedTicket?.date_voyage) }}</span></p>
          <p><span class="info-label">Classe</span> <span class="info-value">{{ getClasseDisplay(selectedTicket?.classe) }}</span></p>
          <p><span class="info-label">Montant</span> <span class="info-value">{{ formatPrice(selectedTicket?.montant) }} MGA</span></p>
          <p v-if="selectedTicket?.id_voyage && !selectedTicket?.voyage_trouve" class="warning-badge">
            ⚠ Voyage associé non trouvé (ID: {{ selectedTicket?.id_voyage?.substring(0, 8) }}...)
          </p>
        </div>
      </div>
    </div>

    <!-- MODALE ÉDITION -->
    <div v-if="isEditModalOpen" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content edit-modal" :class="{ 'mobile-modal': isMobile }">
        <button class="close-btn" @click="closeEditModal" :disabled="isSaving">×</button>
        <h3>Modifier le billet</h3>
        <p class="edit-subtitle">Modifiez les informations du billet {{ editForm.num_ticket }}</p>

        <div v-if="editSuccess" class="edit-success">
          ✓ Billet modifié avec succès !
        </div>

        <div class="edit-form">
          <div class="form-group">
            <label>Nom du voyageur *</label>
            <input v-model="editForm.nom_voyageur" type="text" placeholder="Nom complet" :disabled="isSaving" />
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="editForm.mineur" type="checkbox" :disabled="isSaving" />
              <span>Le voyageur est mineur</span>
            </label>
          </div>

          <div class="form-group">
            <label>Numéro CIN</label>
            <input 
              v-model="editForm.cin" 
              type="text" 
              placeholder="Ex: 101 102 103 104"
              :disabled="isSaving"
              maxlength="17"
            />
            <span class="field-hint">Format: 12 chiffres (ex: 101 102 103 104)</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Départ *</label>
              <select v-model="editForm.depart" class="select-input" :disabled="isSaving || isLoadingGares">
                <option value="" disabled>Sélectionner</option>
                <option v-for="gare in garesDepart" :key="gare.pk" :value="gare.nom">
                  {{ gare.nom }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Arrivée *</label>
              <select v-model="editForm.arrivee" class="select-input" :disabled="isSaving || isLoadingGares">
                <option value="" disabled>Sélectionner</option>
                <option v-for="gare in garesArrivee" :key="gare.pk" :value="gare.nom">
                  {{ gare.nom }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Classe</label>
              <select v-model="editForm.classe" class="select-input" :disabled="isSaving">
                <option value="1ere">1ère Classe</option>
                <option value="2eme">2ème Classe</option>
              </select>
            </div>
            <div class="form-group">
              <label>Prix (MGA)</label>
              <div class="price-display" :class="{ 'price-loading': isLoadingPrice }">
                <span v-if="isLoadingPrice" class="loading-text-price">Calcul...</span>
                <span v-else-if="prixCalcule" class="price-calculated">{{ formatPrice(prixCalcule) }}</span>
                <span v-else class="price-empty">Sélectionnez un trajet</span>
              </div>
            </div>
          </div>

          <div v-if="editError" class="edit-error">
            ⚠ {{ editError }}
          </div>

          <div class="edit-actions">
            <button class="btn-cancel" @click="closeEditModal" :disabled="isSaving">
              Annuler
            </button>
            <button class="btn-save" @click="saveEdit" :disabled="isSaving || !prixCalcule || !editForm.nom_voyageur || !editForm.depart || !editForm.arrivee">
              {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== STYLES COMMUNS ===== */
.cart-panel-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: transparent;
}

.cart-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-refresh-cart {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  border: 1px solid #dce5dd;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-refresh-cart:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.btn-refresh-cart:active {
  transform: scale(0.95);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #dce5dd;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #52625e;
}

.filter-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-chip {
  background: #fbfdfb;
  border: 1px solid #dce5dd;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #667672;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-chip:hover {
  background: #f4f8f5;
  border-color: #cad7d0;
}

.filter-chip.active {
  background: #24746c;
  border-color: #24746c;
  color: #ffffff;
}

/* ===== NOTICE ===== */
.notice-bar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f8fafc;
  border-left: 4px solid #0f172a;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.5;
}

.notice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #0f172a;
  color: #ffffff;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* ===== ÉTAT VIDE ===== */
.empty-tickets-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 2px dashed #dce5dd;
  min-height: 300px;
}

.empty-tickets-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-tickets-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #17211f;
  margin: 0 0 8px 0;
}

.empty-tickets-text {
  font-size: 0.95rem;
  color: #667672;
  margin: 0;
  line-height: 1.6;
  max-width: 400px;
}

/* ===== GRILLE DES BILLETS ===== */
.cart-grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  max-height: 580px;
  overflow-y: auto;
  padding: 4px 2px;
}

.ticket-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;
}

.ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.ticket-card:active {
  transform: scale(0.98);
}

.ticket-card.status-inactif {
  background: #f8faf8;
  border-color: #e2eae4;
  opacity: 0.85;
}

/* ===== HEADER DU TICKET ===== */
.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2f6;
  border-radius: 10px 10px 0 0;
}

.ticket-id {
  font-family: monospace;
  font-size: 0.82rem;
  font-weight: 700;
  color: #17211f;
  letter-spacing: 0.5px;
}

.ticket-status-badge {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ticket-status-badge.actif {
  background: #eaf6f2;
  color: #24746c;
}

.ticket-status-badge.inactif {
  background: #ececec;
  color: #777777;
}

/* ===== CORPS DU TICKET ===== */
.ticket-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
}

/* Trajet */
.route-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
}

.station {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.station-label {
  font-size: 0.6rem;
  color: #889894;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.station-name {
  font-size: 0.95rem;
  color: #17211f;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-arrow {
  color: #24746c;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
  padding: 0 4px;
}

.status-inactif .route-arrow {
  color: #889894;
}

/* Métadonnées */
.ticket-meta {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.meta-label {
  font-size: 0.58rem;
  color: #889894;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 600;
}

.meta-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #17211f;
}

.meta-value.first-class {
  color: #b8860b;
}

.meta-value.statut-actif {
  color: #22c55e;
}

.meta-value.statut-termine {
  color: #64748b;
}

.meta-missing {
  opacity: 0.7;
}

.date-missing {
  color: #dc2626 !important;
  font-style: italic;
}

.meta-warning {
  font-size: 0.7rem;
  color: #f59e0b;
  margin-left: 4px;
}

/* Voyageur - space-between */
.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-top: 1px solid #f1f4f6;
  padding-top: 8px;
}

.meta-row-label {
  font-size: 0.7rem;
  color: #889894;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.meta-row-value {
  font-size: 0.85rem;
  color: #17211f;
  font-weight: 600;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voyage-warning {
  font-size: 0.65rem;
  color: #f59e0b;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 4px;
  padding: 4px 8px;
  text-align: center;
}

/* ===== FOOTER DU TICKET ===== */
.ticket-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #eef2f6;
  border-radius: 0 0 10px 10px;
}

.price {
  font-size: 1.05rem;
  font-weight: 800;
  color: #17211f;
}

.actions-zone {
  display: flex;
  gap: 6px;
}

.card-action-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  -webkit-tap-highlight-color: transparent;
}

.card-action-btn:active {
  transform: scale(0.95);
}

.edit-btn {
  color: #24746c;
}

.edit-btn:hover {
  background: #eaf6f2;
  border-color: #24746c;
}

.remove-btn {
  color: #ef4444;
}

.remove-btn:hover {
  background: #fff5f5;
  border-color: #ef4444;
}

/* ===== TOTAL ===== */
.cart-summary-footer {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
}

.total-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #17211f;
}

.total-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #24746c;
}

/* ===== MODALES ===== */
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
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: #ffffff;
  padding: 30px;
  border-radius: 12px;
  max-width: 90%;
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

.modal-content:not(.edit-modal) {
  width: 380px;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: #667672;
  transition: color 0.2s;
}

.close-btn:hover:not(:disabled) {
  color: #17211f;
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qr-container {
  justify-content: center;
  margin: 16px 0;
  padding: 12px;
  border: 1px dashed #24746c;
  display: inline-block;
  border-radius: 8px;
}

.ticket-info {
  text-align: left;
  font-size: 0.9rem;
}

.ticket-info p {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 6px 0;
  padding: 4px 0;
  border-bottom: 1px solid #f1f4f6;
}

.ticket-info p:last-child {
  border-bottom: none;
}

.info-label {
  color: #667672;
  font-weight: 500;
  font-size: 0.8rem;
}

.info-value {
  color: #17211f;
  font-weight: 600;
  text-align: right;
}

.ticket-info .minor-badge {
  color: #f08c00;
  background: #fff9db;
  padding: 2px 12px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.75rem;
}

.ticket-info .warning-badge {
  color: #f59e0b;
  background: #fffbeb;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  border: 1px solid #fcd34d;
}

/* ===== MODALE ÉDITION ===== */
.edit-modal {
  width: 540px;
  max-width: 100%;
}

.edit-subtitle {
  color: #667672;
  font-size: 0.9rem;
  margin: 4px 0 20px 0;
}

.edit-success {
  background: #eaf6f2;
  color: #24746c;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #24746c;
  font-weight: 700;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
}

.field-hint {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 2px;
}

.form-group input,
.form-group .select-input {
  width: 100%;
  min-height: 42px;
  border: 1px solid #cad7d0;
  border-radius: 8px;
  padding: 0 14px;
  color: #17211f;
  background: #fbfdfb;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group .select-input:focus {
  border-color: #24746c;
  box-shadow: 0 0 0 4px rgba(36, 116, 108, 0.12);
}

.form-group input:disabled,
.form-group .select-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #52625e;
  font-size: 0.9rem;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #24746c;
  cursor: pointer;
}

.price-display {
  min-height: 42px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border: 1px solid #cad7d0;
  border-radius: 8px;
  background: #fbfdfb;
  font-weight: 700;
}

.price-display.price-loading {
  background: #f1f5f9;
}

.loading-text-price {
  color: #667672;
  font-size: 0.85rem;
}

.price-calculated {
  color: #24746c;
  font-size: 1.05rem;
}

.price-empty {
  color: #94a3b8;
  font-size: 0.85rem;
}

.edit-error {
  color: #b53737;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 8px 12px;
  background: #fdf2f2;
  border-radius: 8px;
  border: 1px solid #f0d4d4;
}

.edit-actions {
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

.btn-cancel:hover:not(:disabled) {
  background: #f4f8f5;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== MOBILE STYLES ===== */
.mobile-cart .cart-header-actions {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.mobile-cart .filter-bar {
  flex-direction: column;
  align-items: stretch;
  padding: 8px 12px;
}

.mobile-cart .filter-options {
  justify-content: center;
}

.mobile-cart .btn-refresh-cart {
  justify-content: center;
  padding: 8px;
}

.mobile-notice {
  padding: 10px 12px;
  font-size: 0.78rem;
  gap: 8px;
}

.mobile-grid {
  grid-template-columns: 1fr;
  max-height: none;
  padding: 0;
  gap: 12px;
}

.mobile-grid .ticket-card {
  border-radius: 10px;
}

.mobile-grid .ticket-header {
  padding: 10px 14px;
}

.mobile-grid .ticket-id {
  font-size: 0.78rem;
}

.mobile-grid .ticket-body {
  padding: 12px 14px;
  gap: 8px;
}

.mobile-grid .station-name {
  font-size: 0.88rem;
}

.mobile-grid .station-label {
  font-size: 0.55rem;
}

.mobile-grid .route-arrow {
  font-size: 0.8rem;
}

.mobile-grid .ticket-meta {
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  padding: 6px 10px;
}

.mobile-grid .meta-value {
  font-size: 0.7rem;
}

.mobile-grid .meta-label {
  font-size: 0.55rem;
}

.mobile-grid .meta-row {
  padding-top: 6px;
}

.mobile-grid .meta-row-value {
  font-size: 0.8rem;
  max-width: 120px;
}

.mobile-grid .ticket-footer {
  padding: 8px 14px;
  flex-wrap: wrap;
  gap: 6px;
}

.mobile-grid .price {
  font-size: 0.95rem;
}

.mobile-grid .card-action-btn {
  padding: 4px 10px;
  font-size: 0.65rem;
}

.mobile-grid .actions-zone {
  gap: 4px;
}

.mobile-summary {
  padding: 10px 14px;
}

.mobile-summary .total-value {
  font-size: 1.1rem;
}

.mobile-modal {
  padding: 20px;
  max-width: 95%;
}

.mobile-modal .qr-container {
  padding: 10px;
}

.mobile-modal .ticket-info p {
  font-size: 0.8rem;
}

.mobile-modal .edit-form {
  gap: 10px;
}

.mobile-modal .form-row {
  grid-template-columns: 1fr;
}

.mobile-modal .edit-actions {
  grid-template-columns: 1fr;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .empty-tickets-state {
    padding: 40px 20px;
    min-height: 250px;
  }
  
  .empty-tickets-icon {
    font-size: 3rem;
  }
  
  .empty-tickets-title {
    font-size: 1.1rem;
  }
  
  .empty-tickets-text {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .cart-panel-container {
    gap: 10px;
  }
  
  .filter-chip {
    font-size: 0.7rem;
    padding: 3px 10px;
  }
  
  .mobile-grid .ticket-meta {
    grid-template-columns: 1fr 1fr;
  }
  
  .mobile-grid .ticket-footer {
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
  }
  
  .mobile-grid .actions-zone {
    justify-content: center;
  }
  
  .mobile-grid .station-name {
    font-size: 0.78rem;
  }
  
  .modal-content {
    padding: 16px;
  }
  
  .modal-content:not(.edit-modal) {
    width: 100%;
  }
  
  .edit-modal {
    width: 100%;
    padding: 16px;
  }
  
  .empty-tickets-state {
    padding: 30px 16px;
    min-height: 200px;
  }
  
  .empty-tickets-icon {
    font-size: 2.5rem;
  }
  
  .empty-tickets-title {
    font-size: 1rem;
  }
  
  .empty-tickets-text {
    font-size: 0.8rem;
  }
  
  .ticket-info p {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .info-value {
    text-align: left;
    width: 100%;
  }
}
</style>