<script setup>
// Définition des props reçues par le composant
defineProps({
  selectedTrain: {
    type: String,
    required: true,
  },
  trains: {
    type: Array,
    required: true,
  },
})

// Émission d'un événement quand un train est sélectionné
defineEmits(['select-train'])
</script>

<template>
  <section class="train-list-compact">
    <div class="section-heading-compact">
      <h2>Le train actif en ce moment</h2>
    </div>

    <div class="options-container">
      <!-- Boucle sur la liste des trains disponibles -->
      <button
        v-for="train in trains"
        :key="train.id"
        class="train-option-compact"
        :class="{ selected: selectedTrain === train.id }"
        type="button"
        @click="$emit('select-train', train.id)"
      >
        <span class="train-info">
          <!-- Affiche la direction du train selon la valeur du champ sens -->
          <strong class="route">{{ train.sens == 2132 ? 'Tamatave ➔ Moramanga' : 'Moramanga ➔ Tamatave' }}</strong>
          <!-- Affiche la date du voyage -->
          <span class="date">Date : {{ train.date_voyage }}</span>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
/* Conteneur principal réduit et épuré */
.train-list-compact {
  background: #ffffff;
  border: 1px solid #dce5dd;
  border-radius: 6px;
  padding: 12px;
}

/* Titre ultra-discret et compact */
.section-heading-compact h2 {
  margin: 0 0 8px 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #52625e;
  font-weight: 700;
}

/* Alignement des cartes de trains */
.options-container {
  display: grid;
  gap: 6px;
}

/* Bouton option ultra-minimaliste et condensé */
.train-option-compact {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #dce5dd;
  border-radius: 5px;
  padding: 8px 12px;
  color: #17211f;
  background: #fbfdfb;
  text-align: left;
  transition: all 0.15s ease;
}

/* Survol léger */
.train-option-compact:hover {
  background: #f4f8f5;
  border-color: #cad7d0;
}

/* Thème clair sélectionné : discret et élégant */
.train-option-compact.selected {
  border-color: #24746c;
  background: #eaf6f2;
}

/* Structure interne compacte */
.train-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Typographie resserrée */
.route {
  font-size: 0.88rem;
  font-weight: 700;
  color: #17211f;
}

.date {
  font-size: 0.75rem;
  color: #667672;
  font-weight: 500;
}
</style>