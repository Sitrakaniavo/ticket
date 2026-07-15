<script setup>
import { ref, watch, onMounted } from 'vue'

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

// État local pour la sélection (synchronisé avec la prop)
const localSelectedTrain = ref(props.selectedTrain)

// Fonction de sélection
const selectTrain = (trainId) => {
  localSelectedTrain.value = trainId
  emit('select', trainId)
}

// Synchroniser avec la prop si elle change depuis l'extérieur
watch(() => props.selectedTrain, (newVal) => {
  if (newVal !== localSelectedTrain.value) {
    localSelectedTrain.value = newVal
  }
})

// À l'initialisation, sélectionner le premier train si aucun n'est sélectionné
onMounted(() => {
  if (!localSelectedTrain.value && props.trains.length > 0) {
    const firstTrainId = props.trains[0].id
    localSelectedTrain.value = firstTrainId
    emit('select', firstTrainId)
  }
})

// Surveiller les changements de la liste des trains
watch(() => props.trains, (newTrains) => {
  if (newTrains.length > 0) {
    const exists = newTrains.some(t => t.id === localSelectedTrain.value)
    if (!exists) {
      const firstTrainId = newTrains[0].id
      localSelectedTrain.value = firstTrainId
      emit('select', firstTrainId)
    }
  }
}, { immediate: true })
</script>

<template>
  <section class="train-list-compact">
    <div class="section-heading-compact">
      <h2>Trains disponibles</h2>
      <span class="train-count">{{ trains.length }} train(s)</span>
    </div>

    <div v-if="trains.length === 0" class="no-trains-message">
      <span class="no-trains-icon">🚫</span>
      <span>Aucun train disponible</span>
    </div>

    <div v-else class="options-container">
      <button
        v-for="train in trains"
        :key="train.id"
        class="train-option-compact"
        :class="{ selected: localSelectedTrain === train.id }"
        type="button"
        @click="selectTrain(train.id)"
      >
        <span class="train-info">
          <strong class="route">
            {{ train.sens == 2132 ? 'Tamatave → Moramanga' : 'Moramanga → Tamatave' }}
          </strong>
          <span class="date">
            {{ train.date_voyage }}
          </span>
          <span v-if="train.heure_depart" class="time">
            {{ train.heure_depart }}
          </span>
        </span>
        <span v-if="localSelectedTrain === train.id" class="selected-badge">
          ✓
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.train-list-compact {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

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
  border: 1px dashed #e2e8f0;
}

.no-trains-icon {
  font-size: 1.2rem;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.train-option-compact {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  color: #17211f;
  background: #fbfdfb;
  text-align: left;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  font-family: inherit;
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
}

.date, .time {
  font-size: 0.75rem;
  color: #667672;
  font-weight: 500;
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
  
  .selected-badge {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }
}
</style>