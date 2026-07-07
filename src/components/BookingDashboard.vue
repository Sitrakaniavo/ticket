<!-- BookingDashboard.vue -->
<script setup>
import { defineProps, defineEmits } from 'vue'
import TrainList from './TrainList.vue'
import TripOrder from './TripOrder.vue'

const props = defineProps({
  trains: Array,
  selectedTrain: String,
  activeTrain: Object,
  user: Object,
  editingTicket: Object
})

const emit = defineEmits(['select-train', 'ticket-saved', 'ticket-updated'])
</script>

<template>
  <div class="dashboard-grid">
    <!-- COLONNE GAUCHE : Choix du flux de transport -->
    <div class="grid-pane gauche">
      <div class="pane-header">
        <h3>1. Liste des Départs</h3>
        <p>Sélectionnez la rotation active pour l'attribution des places.</p>
      </div>
      
      <TrainList 
        :trains="trains" 
        :selected-train="selectedTrain"
        @select="(id) => emit('select-train', id)" 
      />
    </div>

    <!-- COLONNE DROITE : Saisie client et aperçu intégré simultané -->
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
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
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

@media (max-width: 768px) {
  .grid-pane {
    padding: 16px;
    min-height: 300px;
  }
}
</style>