<!-- TicketPreviewPanel.vue - Version Mobile Optimisée -->
<script setup>
const props = defineProps({
  previewData: {
    type: Object,
    required: true,
    default: () => ({
      ticketNumber: 'V.......',
      travelerName: '-',
      cin: '--- --- --- ---',
      mineur: false,
      depart: '---',
      arrivee: '---',
      departureDate: '---',
      seat: '—',
      ticketClass: '2ème classe',
      amount: '0',
    })
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

defineEmits(['submit'])
</script>

<template>
  <div class="preview-panel" :class="{ 'mobile-preview': isMobile }">
    <div class="ticket-card">
      <div class="ticket-header">
        <span class="company">DIATSARA</span>
        <span class="ticket-id">{{ previewData.ticketNumber }}</span>
      </div>
      
      <div class="ticket-body">
        <!-- Informations Voyageur -->
        <div class="passenger-info">
          <p class="label">Voyageur</p>
          <p class="value-highlight">{{ previewData.travelerName }}</p>
          
          <!-- Bloc d'identification (CIN) -->
          <div class="identification-block">
            <div>
              <p class="label">Numéro CIN</p>
              <p class="value font-mono">{{ previewData.cin }}</p>
            </div>
            
            <!-- Affiche le badge Mineur si la propriété mineur est vraie -->
            <div v-if="previewData.mineur" class="minor-badge-wrapper">
              <span class="badge-minor">Voyageur Mineur</span>
            </div>
          </div>
        </div>

        <!-- Trajet -->
        <div class="route-info">
          <div>
            <p class="label">De</p>
            <p class="value">{{ previewData.depart }}</p>
          </div>
          <div class="arrow">→</div>
          <div>
            <p class="label">À</p>
            <p class="value">{{ previewData.arrivee }}</p>
          </div>
        </div>

        <!-- Métadonnées additionnelles (Date, Classe) -->
        <div class="meta-info">
          <div>
            <p class="label">Date de voyage</p>
            <p class="value">{{ previewData.departureDate }}</p>
          </div>
          <div>
            <p class="label">Classe</p>
            <p class="value">{{ previewData.ticketClass }}</p>
          </div>
        </div>
      </div>

      <!-- Tarification et validation -->
      <div class="ticket-footer">
        <div class="price-zone">
          <p class="label">Net à payer</p>
          <p class="final-price">{{ previewData.amount }} MGA</p>
        </div>
        <button class="confirm-btn" @click="$emit('submit')">
          Valider le billet
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-panel {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
}

.ticket-card {
  background: #ffffff;
  border: 1px dashed #cad7d0;
  border-radius: 6px;
  width: 100%;
  max-width: 100%;
  padding: 12px;
  box-shadow: none;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed #dce5dd;
  padding-bottom: 6px;
  margin-bottom: 10px;
}

.company {
  color: #24746c;
  font-weight: 800;
  letter-spacing: 1px;
  font-size: 0.85rem;
}

.ticket-id {
  color: #667672;
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
}

.ticket-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 0.65rem;
  color: #667672;
  text-transform: uppercase;
  margin: 0 0 1px 0;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.value {
  font-size: 0.8rem;
  color: #17211f;
  font-weight: 600;
  margin: 0;
}

.value-highlight {
  font-size: 1rem;
  color: #17211f;
  font-weight: 800;
  margin: 0;
}

.identification-block {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.minor-badge-wrapper {
  margin-top: 2px;
}

.font-mono {
  font-family: monospace;
  letter-spacing: 0.5px;
}

.badge-minor {
  display: inline-block;
  background: #fff9db;
  color: #f08c00;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
}

.route-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0;
  background: #fbfdfb;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid #dce5dd;
}

.arrow {
  color: #24746c;
  font-weight: 800;
  font-size: 1rem;
}

.meta-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.ticket-footer {
  border-top: 1px dashed #dce5dd;
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.price-zone {
  display: flex;
  flex-direction: column;
}

.final-price {
  font-size: 1.15rem;
  font-weight: 800;
  color: #24746c;
  margin: 0;
  line-height: 1.1;
}

.confirm-btn {
  flex: 1;
  height: 34px;
  background: #24746c;
  color: #ffffff;
  border: none;
  padding: 0 12px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}

.confirm-btn:hover {
  background: #1d5b57;
}

.confirm-btn:active {
  background: #174643;
}

/* ===== VERSION MOBILE ===== */
.mobile-preview .ticket-card {
  padding: 10px;
  border-radius: 8px;
}

.mobile-preview .ticket-header {
  padding-bottom: 4px;
  margin-bottom: 8px;
}

.mobile-preview .company {
  font-size: 0.75rem;
}

.mobile-preview .ticket-id {
  font-size: 0.65rem;
}

.mobile-preview .ticket-body {
  gap: 6px;
}

.mobile-preview .value-highlight {
  font-size: 0.9rem;
}

.mobile-preview .value {
  font-size: 0.75rem;
}

.mobile-preview .route-info {
  padding: 6px 8px;
  margin: 4px 0;
}

.mobile-preview .arrow {
  font-size: 0.85rem;
}

.mobile-preview .meta-info {
  gap: 6px;
  margin-bottom: 6px;
}

.mobile-preview .final-price {
  font-size: 1rem;
}

.mobile-preview .confirm-btn {
  height: 38px;
  font-size: 0.85rem;
  padding: 0 10px;
}

.mobile-preview .ticket-footer {
  padding-top: 8px;
  gap: 8px;
}

.mobile-preview .label {
  font-size: 0.6rem;
}

@media (max-width: 480px) {
  .preview-panel {
    padding: 0;
  }
  
  .ticket-card {
    padding: 10px;
  }
  
  .ticket-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .confirm-btn {
    width: 100%;
    height: 40px;
  }
  
  .price-zone {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .final-price {
    font-size: 1rem;
  }
}
</style>