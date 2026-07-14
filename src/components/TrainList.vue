<script setup>
// Définition des props reçues par le composant
const props = defineProps({
  selectedTrain: {
    type: String,
    required: false,
    default: null
  },
  trains: {
    type: Array,
    required: true,
    default: () => []
  }
})

// Émission d'un événement quand un train est sélectionné
const emit = defineEmits(['select'])

// Fonction de sélection
const selectTrain = (trainId) => {
  console.log('Train sélectionné:', trainId)
  emit('select', trainId)
}
</script>

<template>
  <section class="train-list-compact">
    <div class="section-heading-compact">
      <h2>🚂 Trains disponibles</h2>
      <span class="train-count">{{ trains.length }} train(s)</span>
    </div>

    <div v-if="trains.length === 0" class="no-trains-message">
      <span>🚫</span>
      <span>Aucun train disponible</span>
    </div>

    <div v-else class="options-container">
      <!-- Boucle sur la liste des trains disponibles -->
      <button
        v-for="train in trains"
        :key="train.id"
        class="train-option-compact"
        :class="{ selected: selectedTrain === train.id }"
        type="button"
        @click="selectTrain(train.id)"
      >
        <span class="train-info">
          <strong class="route">
            <span class="route-icon">🚂</span>
            {{ train.sens == 2132 ? 'Tamatave ➔ Moramanga' : 'Moramanga ➔ Tamatave' }}
          </strong>
          <span class="date">
            <span class="date-icon">📅</span>
            {{ train.date_voyage }}
          </span>
          <span v-if="train.heure_depart" class="time">
            <span class="time-icon">⏰</span>
            {{ train.heure_depart }}
          </span>
        </span>
        <span v-if="selectedTrain === train.id" class="selected-badge">
          ✓
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
/* Conteneur principal */
.train-list-compact {
  background: #ffffff;
  border: 1px solid #dce5dd;
  border-radius: 12px;
  padding: 16px;
}

/* En-tête */
.section-heading-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-heading-compact h2 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #17211f;
}

.train-count {
  font-size: 0.75rem;
  color: #667672;
  background: #f1f4f1;
  padding: 2px 10px;
  border-radius: 12px;
}

/* Message aucun train */
.no-trains-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #667672;
  font-size: 0.9rem;
  background: #f8faf8;
  border-radius: 8px;
  border: 1px dashed #dce5dd;
}

.no-trains-message span:first-child {
  font-size: 1.5rem;
}

/* Conteneur des options */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Bouton option */
.train-option-compact {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #dce5dd;
  border-radius: 10px;
  padding: 12px 14px;
  color: #17211f;
  background: #fbfdfb;
  text-align: left;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}

.train-option-compact:hover {
  background: #f4f8f5;
  border-color: #cad7d0;
}

.train-option-compact.selected {
  border-color: #24746c;
  background: #eaf6f2;
  box-shadow: 0 0 0 2px rgba(36, 116, 108, 0.15);
}

.train-option-compact:active {
  transform: scale(0.98);
}

/* Structure interne */
.train-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.route {
  font-size: 0.9rem;
  font-weight: 700;
  color: #17211f;
  display: flex;
  align-items: center;
  gap: 6px;
}

.route-icon {
  font-size: 0.9rem;
}

.date, .time {
  font-size: 0.75rem;
  color: #667672;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-icon, .time-icon {
  font-size: 0.7rem;
}

.selected-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #24746c;
  color: white;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* ===== RESPONSIVE MOBILE ===== */
@media (max-width: 768px) {
  .train-list-compact {
    padding: 12px;
    border-radius: 8px;
  }
  
  .section-heading-compact h2 {
    font-size: 0.8rem;
  }
  
  .train-option-compact {
    padding: 10px 12px;
    border-radius: 8px;
  }
  
  .route {
    font-size: 0.82rem;
  }
  
  .date, .time {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .train-list-compact {
    padding: 10px;
  }
  
  .train-option-compact {
    padding: 8px 10px;
  }
  
  .route {
    font-size: 0.75rem;
  }
  
  .route-icon {
    font-size: 0.75rem;
  }
  
  .selected-badge {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }
}
</style>