<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { supabaseClient } from '../lib/supabaseClient'

const props = defineProps({
  cartItems: { type: Array, required: true, default: () => [] },
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

// ===== DONNÉES DES GARES =====
const allGares = ref([])
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
  id_voyage: null
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

// ===== FILTRAGE DES GARES D'ARRIVÉE =====
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

      // Application des paliers de prix
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
  // Charger les gares si nécessaire
  await loadGares()
  
  // Charger les données du ticket
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
  
  editError.value = ''
  editSuccess.value = false
  prixCalcule.value = null
  
  // Rechercher le prix si les gares sont renseignées
  if (editForm.depart && editForm.arrivee) {
    await rechercherPrix()
  }
  
  isEditModalOpen.value = true
}

// ===== SURVEILLANCE DES CHANGEMENTS =====
watch(() => [editForm.depart, editForm.arrivee, editForm.classe], async () => {
  if (editForm.depart && editForm.arrivee) {
    await rechercherPrix()
  } else {
    prixCalcule.value = null
  }
})

// Formatage CIN - TOUJOURS MODIFIABLE
watch(() => editForm.cin, (newValue) => {
  if (!newValue) return
  // Supprimer tous les caractères non numériques
  let digits = newValue.replace(/\D/g, "")
  // Limiter à 12 chiffres
  if (digits.length > 12) {
    digits = digits.slice(0, 12)
  }
  // Formater avec des espaces tous les 3 chiffres
  const blocks = digits.match(/.{1,3}/g)
  if (blocks) {
    // Mettre à jour sans recréer de boucle
    const formatted = blocks.join(" ")
    if (formatted !== newValue) {
      editForm.cin = formatted
    }
  }
})

// ===== SAUVEGARDE DE L'ÉDITION =====
async function saveEdit() {
  // Validation des champs obligatoires
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

  // Si mineur, le CIN est optionnel mais on le garde tel quel
  if (editForm.mineur && editForm.cin) {
    const cinDigits = editForm.cin.replace(/\s/g, "")
    if (cinDigits.length > 0 && cinDigits.length !== 12) {
      editError.value = "Le numéro CIN doit comporter exactement 12 chiffres."
      return
    }
  }

  if (!prixCalcule.value && prixCalcule.value !== 0) {
    editError.value = "Impossible de calculer le prix pour ce trajet. Vérifiez les gares sélectionnées."
    return
  }

  isSaving.value = true
  editError.value = ''
  editSuccess.value = false

  try {
    // Préparer les données de mise à jour
    const updateData = {
      nom_voyageur: editForm.nom_voyageur.trim(),
      mineur: editForm.mineur,
      classe: editForm.classe,
      depart: editForm.depart,
      arrivee: editForm.arrivee,
      montant: prixCalcule.value,
      created_at: new Date().toISOString()
    }

    // Traitement du CIN
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

    // Mise à jour dans Supabase
    const { error } = await supabaseClient
      .from("ticket_voyageur_site")
      .update(updateData)
      .eq("id", editForm.id)

    if (error) throw error

    // Succès
    editSuccess.value = true
    editError.value = ''
    
    // Fermer la modale après un court délai
    setTimeout(() => {
      isEditModalOpen.value = false
      // Rafraîchir la liste des tickets
      emit('refresh')
      // Émettre l'événement d'édition
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

function refreshData() {
  emit('refresh')
}

const filteredItems = computed(() => {
  if (currentFilter.value === 'all') return props.cartItems
  return props.cartItems.filter(item => item.status === currentFilter.value)
})

const totalActiveAmount = computed(() => 
  props.cartItems.filter(i => i.status === 'actif')
    .reduce((sum, i) => sum + Number(i.montant || 0), 0)
)

const formatPrice = (v) => new Intl.NumberFormat('fr-MG').format(v)

// ===== INITIALISATION =====
onMounted(() => {
  loadGares()
})
</script>

<template>
  <div class="cart-panel-container">
    <div class="cart-header-actions">
      <div class="filter-bar">
        <span class="filter-label">Filtrer par statut :</span>
        <div class="filter-options">
          <button 
            v-for="f in ['all', 'actif', 'inactif']" 
            :key="f"
            class="filter-chip" 
            :class="{ active: currentFilter === f }"
            @click="currentFilter = f"
          >
            {{ f.charAt(0).toUpperCase() + f.slice(1) }} 
            ({{ f === 'all' ? cartItems.length : cartItems.filter(i => i.status === f).length }})
          </button>
        </div>
      </div>
      
      <button class="btn-refresh-cart" @click="refreshData" title="Rafraîchir">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
          <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
        </svg>
        Rafraîchir
      </button>
    </div>

    <div style="display: flex; align-items: flex-start; gap: 12px; background: #f8fafc; border-left: 4px solid #0f172a; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
      <div style="font-size: 0.88rem; color: #334155; line-height: 1.5;">
        <strong style="color: #0f172a; font-weight: 700;">NB :</strong> 
        Pour valider les billets, veuillez aller auprès du vendeur près de vous.
      </div>
    </div>

    <!-- GRILLE -->
    <div class="cart-grid-layout">
      <div v-for="item in filteredItems" :key="item.id" 
        class="ticket-card" :class="`status-${item.status}`"
        @click="openModal(item)">
        
        <div class="ticket-header">
          <span class="ticket-id">{{ item.num_ticket }}</span>
          <span class="ticket-status-badge" :class="item.status">{{ item.status }}</span>
        </div>

        <div class="ticket-body">
          <div class="route-display">
            <div class="station"><span>Départ</span><strong>{{ item.depart }}</strong></div>
            <div class="route-arrow">→</div>
            <div class="station"><span>Arrivée</span><strong>{{ item.arrivee }}</strong></div>
          </div>
          <div class="meta-row"><span>Voyageur :</span><strong>{{ item.nom_voyageur }}</strong></div>
        </div>

        <div class="ticket-footer">
          <span class="price">{{ formatPrice(item.montant) }} MGA</span>
          <div class="actions-zone">
            <button v-if="item.status === 'actif'" @click.stop="openEditModal(item)" class="card-action-btn edit-btn">
              ✎ Modifier
            </button>
            <button v-if="item.status === 'actif'" @click.stop="emit('remove-item', item.id)" class="card-action-btn remove-btn">
              ✕ Annuler
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Total -->
    <div class="cart-summary-footer">
      <div class="total-block">
        <span class="total-label">Total actif :</span>
        <span class="total-value">{{ formatPrice(totalActiveAmount) }} MGA</span>
      </div>
    </div>

    <!-- MODALE DÉTAILS -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
      <div class="modal-content">
        <button class="close-btn" @click="isModalOpen = false">×</button>
        <h3>Détails du Billet</h3>
        <div class="qr-container">
          <qrcode-vue :value="selectedTicket.num_ticket" :size="160" level="H" render-as="svg" />
        </div>
        <div class="ticket-info">
          <p><strong>Numéro :</strong> {{ selectedTicket.num_ticket }}</p>
          <p><strong>Voyageur :</strong> {{ selectedTicket.nom_voyageur }}</p>
          <p><strong>Trajet :</strong> {{ selectedTicket.depart }} → {{ selectedTicket.arrivee }}</p>
          <p><strong>Classe :</strong> {{ selectedTicket.classe }}</p>
          <p><strong>Montant :</strong> {{ formatPrice(selectedTicket.montant) }} MGA</p>
        </div>
      </div>
    </div>

    <!-- MODALE ÉDITION -->
    <div v-if="isEditModalOpen" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content edit-modal">
        <button class="close-btn" @click="closeEditModal" :disabled="isSaving">×</button>
        <h3>✎ Modifier le billet</h3>
        <p class="edit-subtitle">Modifiez les informations du billet {{ editForm.num_ticket }}</p>

        <div v-if="editSuccess" class="edit-success">
          ✅ Billet modifié avec succès !
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
            ⚠️ {{ editError }}
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

.cart-grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  max-height: 580px;
  overflow-y: auto;
  padding: 4px 2px;
}

.ticket-card {
  background: #ffffff;
  border: 1px solid #dce5dd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 2px 6px rgba(23, 33, 31, 0.03);
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;
}

.ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(23, 33, 31, 0.06);
}

.ticket-card.status-inactif {
  background: #f8faf8;
  border-color: #e2eae4;
  opacity: 0.85;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fdfdfd;
  border-bottom: 1px solid #f0f4f1;
  border-radius: 8px 8px 0 0;
}

.ticket-id {
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #17211f;
}

.ticket-status-badge {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.ticket-status-badge.actif {
  background: #eaf6f2;
  color: #24746c;
}

.ticket-status-badge.inactif {
  background: #ececec;
  color: #777777;
}

.ticket-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
}

.route-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.station {
  display: flex;
  flex-direction: column;
  max-width: 42%;
}

.station span {
  font-size: 0.68rem;
  color: #889894;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.station strong {
  font-size: 0.95rem;
  color: #17211f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-arrow {
  color: #24746c;
  font-size: 0.9rem;
  font-weight: bold;
}

.status-inactif .route-arrow {
  color: #889894;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
}

.meta-row span {
  color: #667672;
}

.meta-row strong {
  color: #17211f;
  font-weight: 600;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ticket-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fbfdfb;
  border-top: 1px solid #f0f4f1;
  border-radius: 0 0 8px 8px;
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
  background: #ffffff;
  border: 1px solid #dce5dd;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s;
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

.cart-summary-footer {
  background: #ffffff;
  border: 1px solid #dce5dd;
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
  width: 350px;
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
  margin: 20px 0;
  padding: 15px;
  border: 1px dashed #24746c;
  display: inline-block;
  border-radius: 8px;
}

.ticket-info {
  text-align: left;
  font-size: 0.9rem;
}

.ticket-info p {
  margin: 6px 0;
  color: #17211f;
}

/* ===== MODALE ÉDITION ===== */
.edit-modal {
  width: 520px;
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
  margin-top: 0;
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
  gap: 8px;
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

.checkbox-label input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
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

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .cart-header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-options {
    justify-content: center;
  }

  .cart-grid-layout {
    grid-template-columns: 1fr;
    max-height: none;
  }

  .edit-modal {
    width: 100%;
    padding: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .edit-actions {
    grid-template-columns: 1fr;
  }

  .modal-content:not(.edit-modal) {
    width: 100%;
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .ticket-footer {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .actions-zone {
    justify-content: center;
  }

  .station strong {
    font-size: 0.8rem;
  }
}
</style>
/* ===== RESPONSIVE TICKET CART ===== */

@media (max-width: 768px) {
  .cart-header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-options {
    justify-content: center;
  }

  .cart-grid-layout {
    grid-template-columns: 1fr;
    max-height: none;
  }

  .edit-modal {
    width: 100%;
    padding: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .edit-actions {
    grid-template-columns: 1fr;
  }

  .modal-content:not(.edit-modal) {
    width: 100%;
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .ticket-footer {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .actions-zone {
    justify-content: center;
  }

  .station strong {
    font-size: 0.8rem;
  }
}