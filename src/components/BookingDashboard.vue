<!-- BookingDashboard.vue - Version Mobile First -->
<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import TrainList from './TrainList.vue'
import TripOrder from './TripOrder.vue'

const props = defineProps({
  trains: Array,
  selectedTrain: String,
  activeTrain: Object,
  user: Object,
  editingTicket: Object,
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-train', 'ticket-saved', 'ticket-updated'])

// État pour l'accordéon mobile
const expandedSections = ref({
  trains: true,
  form: false
})

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// Fonction de sélection
const handleSelectTrain = (trainId) => {
  console.log('📌 BookingDashboard: sélection du train:', trainId)
  emit('select-train', trainId)
  
  // Sur mobile, ouvrir automatiquement la section formulaire
  if (props.isMobile) {
    expandedSections.value.form = true
  }
}

// Détection automatique du mobile
const isMobileDevice = computed(() => {
  return window.innerWidth <= 768 || props.isMobile
})
</script>

<template>
  <div class="dashboard-grid" :class="{ 'mobile-layout': isMobileDevice }">
    <!-- Version Desktop: 2 colonnes -->
    <template v-if="!isMobileDevice">
      <div class="grid-pane gauche">
        <div class="pane-header">
          <h3>1. Liste des Départs</h3>
          <p>Sélectionnez la rotation active pour l'attribution des places.</p>
        </div>
        
        <TrainList 
          :trains="trains" 
          :selected-train="selectedTrain"
          @select="handleSelectTrain" 
        />
      </div>

      <div class="grid-pane layout-split">
        <div class="pane-header">
          <h3>2. Détails & Émission du Billet</h3>
          <p>Complétez les champs et validez pour imprimer le titre de transport.</p>
        </div>

        <div v-if="selectedTrain" class="form-container">
          <TripOrder 
            :active-train="activeTrain"
            :user="user"
            :editing-ticket="editingTicket"
            :only-form="false"
            :only-preview="false"
            @ticket-saved="(ticket) => emit('ticket-saved', ticket)"
            @ticket-updated="(ticket) => emit('ticket-updated', ticket)"
          />
        </div>
        
        <div v-else class="no-selection-state">
          <div class="arrow-indicator">⇠</div>
          <p>Veuillez sélectionner une ligne de train à gauche pour commencer l'enregistrement.</p>
        </div>
      </div>
    </template>

    <!-- Version Mobile: Accordéon -->
    <template v-else>
      <div class="mobile-dashboard">
        <!-- Section 1: Liste des Trains -->
        <div class="mobile-section">
          <div class="mobile-section-header" @click="toggleSection('trains')">
            <div class="section-header-left">
              <span class="section-number">1</span>
              <h3>Liste des Départs</h3>
              <span v-if="selectedTrain" class="selected-train-indicator">✓</span>
            </div>
            <span class="section-toggle">{{ expandedSections.trains ? '−' : '+' }}</span>
          </div>
          
          <div v-show="expandedSections.trains" class="mobile-section-content">
            <TrainList 
              :trains="trains" 
              :selected-train="selectedTrain"
              @select="handleSelectTrain" 
            />
          </div>
        </div>

        <!-- Section 2: Formulaire de Réservation -->
        <div class="mobile-section">
          <div class="mobile-section-header" @click="toggleSection('form')">
            <div class="section-header-left">
              <span class="section-number">2</span>
              <h3>Détails & Émission</h3>
            </div>
            <span class="section-toggle">{{ expandedSections.form ? '−' : '+' }}</span>
          </div>
          
          <div v-show="expandedSections.form" class="mobile-section-content">
            <div v-if="selectedTrain" class="form-container">
              <TripOrder 
                :active-train="activeTrain"
                :user="user"
                :editing-ticket="editingTicket"
                :only-form="false"
                :only-preview="false"
                :is-mobile="true"
                @ticket-saved="(ticket) => emit('ticket-saved', ticket)"
                @ticket-updated="(ticket) => emit('ticket-updated', ticket)"
              />
            </div>
            
            <div v-else class="no-selection-state">
              <div class="arrow-indicator">⇠</div>
              <p>Veuillez sélectionner une ligne de train</p>
              <button class="btn-select-train" @click="toggleSection('trains')">
                Sélectionner un train
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
// Ajout de l'état pour l'accordéon mobile
import { ref } from 'vue'

export default {
  setup() {
    const expandedSections = ref({
      trains: true,
      form: false
    })

    const toggleSection = (section) => {
      expandedSections.value[section] = !expandedSections.value[section]
    }

    return {
      expandedSections,
      toggleSection
    }
  }
}
</script>

<style scoped>
/* ===== STYLES COMMUNS ===== */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 24px;
  align-items: start;
}

.grid-pane {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  min-height: 500px;
}

.pane-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 14px;
}

.pane-header h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.pane-header p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.no-selection-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
}

.arrow-indicator {
  font-size: 2rem;
  margin-bottom: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-6px); }
}

/* ===== MOBILE VERSION ===== */
.mobile-dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.mobile-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.mobile-section-header:active {
  background-color: #f8fafc;
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #24746c;
  color: white;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.mobile-section-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.section-toggle {
  font-size: 1.4rem;
  font-weight: 300;
  color: #64748b;
  transition: transform 0.3s ease;
}

.mobile-section-content {
  padding: 0 18px 18px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-select-train {
  margin-top: 12px;
  padding: 10px 24px;
  background: #24746c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-select-train:active {
  background: #1a5c55;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-grid.mobile-layout {
    display: block;
  }
  
  .grid-pane {
    min-height: auto;
    padding: 0;
    border: none;
    border-radius: 0;
  }
  
  .pane-header {
    display: none;
  }
  
  .no-selection-state {
    padding: 40px 20px;
    min-height: 200px;
  }
  
  .no-selection-state .arrow-indicator {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .mobile-section-header {
    padding: 14px 14px;
  }
  
  .section-number {
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }
  
  .mobile-section-header h3 {
    font-size: 0.85rem;
  }
  
  .section-toggle {
    font-size: 1.2rem;
  }
  
  .mobile-section-content {
    padding: 0 14px 14px;
  }
}

/* ===== STYLES MOBILE ===== */
.mobile-dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.mobile-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.mobile-section-header:active {
  background-color: #f8fafc;
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #24746c;
  color: white;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.selected-train-indicator {
  color: #24746c;
  font-weight: 700;
  font-size: 0.9rem;
}

.mobile-section-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.section-toggle {
  font-size: 1.4rem;
  font-weight: 300;
  color: #64748b;
  transition: transform 0.3s ease;
}

.mobile-section-content {
  padding: 0 18px 18px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-select-train {
  margin-top: 12px;
  padding: 10px 24px;
  background: #24746c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-select-train:active {
  background: #1a5c55;
}

.no-selection-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.arrow-indicator {
  font-size: 2rem;
  margin-bottom: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-6px); }
}

@media (max-width: 480px) {
  .mobile-section-header {
    padding: 14px 14px;
  }
  
  .section-number {
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }
  
  .mobile-section-header h3 {
    font-size: 0.85rem;
  }
  
  .section-toggle {
    font-size: 1.2rem;
  }
  
  .mobile-section-content {
    padding: 0 14px 14px;
  }
}


</style>