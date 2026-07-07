<!-- BookingSummary.vue -->
<script setup>
import { computed } from "vue";

const props = defineProps({
  activeTrain: {
    type: Object,
    default: null,
  },
  selectedSeat: {
    type: String,
    default: null,
  },
  // Nouveau paramètre pour adapter le style
  isHero: {
    type: Boolean,
    default: false,
  },
  // Mode compact pour la page d'accueil
  isCompact: {
    type: Boolean,
    default: false,
  },
});

// Formatage du prix avec espace comme séparateur de milliers
const formattedPrice = computed(() => {
  if (!props.activeTrain) return "";
  // Utiliser le tarif de la 2ème classe par défaut pour l'affichage
  const price = props.activeTrain.price || props.activeTrain.tarif_1 || 0;
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(price);
});

// Formater la date
const formattedDate = computed(() => {
  if (!props.activeTrain) return "";
  const date = new Date(props.activeTrain.date_voyage);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
});

// Formater l'heure
const formattedTime = computed(() => {
  if (!props.activeTrain) return "";
  if (props.activeTrain.heure_depart) {
    return props.activeTrain.heure_depart;
  }
  return "--:--";
});

// Nom du train
const trainName = computed(() => {
  if (!props.activeTrain) return "";
  return props.activeTrain.nom || `Train ${props.activeTrain.id}`;
});

// Direction du train
const trainDirection = computed(() => {
  if (!props.activeTrain) return "";
  const sens = props.activeTrain.sens;
  if (sens == 2132) return "Tamatave → Moramanga";
  if (sens == 2131) return "Moramanga → Tamatave";
  return "Trajet";
});
</script>
<!-- Contenu du résumé -->
<template v-if="activeTrain">
  <div class="summary-content">
    <!-- Version Hero (page d'accueil) -->
    <div v-if="isHero" class="hero-summary">
      <div class="train-header">
        <!-- <span class="train-icon">🚂</span> -->
        <span class="train-name">Départ prévue</span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="label">Date</span>
          <span class="value">{{ formattedDate }}</span>
        </div>
        <div class="info-item">
          <span class="label">Direction</span>
          <span class="value">{{ trainDirection }}</span>
        </div>
      </div>
    </div>

    <!-- Version Dashboard -->
  </div>
</template>

<style scoped>
/* ===== STYLES DE BASE ===== */
.summary-panel {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.summary-panel:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* ===== EN-TÊTE ===== */
.section-heading {
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 14px;
}

.section-heading .eyebrow {
  margin: 0 0 2px 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 600;
}

.section-heading h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

/* ===== STYLE HERO (PAGE D'ACCUEIL) ===== */
.summary-panel.is-hero {
  background: transparent;
  padding: 0;
  border: none;
}

.summary-panel.is-hero:hover {
  box-shadow: none;
}

.hero-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.train-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.train-icon {
  font-size: 1.3rem;
}

.train-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.route-direction {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  padding: 4px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-item .label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.5);
}

.info-item .value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
}

.info-item .value.price {
  color: #7ee0d7;
  font-size: 1rem;
}

/* ===== STYLE DASHBOARD ===== */
.dashboard-summary dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-summary dl > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}

.dashboard-summary dl > div:last-child {
  border-bottom: none;
}

.dashboard-summary dt {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.dashboard-summary dd {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.total-row {
  border-top: 2px solid #e2e8f0 !important;
  padding-top: 12px !important;
  margin-top: 4px;
}

.total-price {
  font-size: 1.2rem !important;
  font-weight: 800 !important;
  color: #24746c !important;
}

.primary-button {
  width: 100%;
  margin-top: 16px;
  padding: 12px 24px;
  background: #24746c;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.primary-button:hover {
  background: #1d5b57;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(36, 116, 108, 0.3);
}

.primary-button:active {
  transform: translateY(0);
}

/* ===== VERSION COMPACTE ===== */
.summary-panel.is-compact {
  padding: 16px;
}

.summary-panel.is-compact .hero-summary {
  gap: 6px;
}

.summary-panel.is-compact .info-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.summary-panel.is-compact .train-name {
  font-size: 0.95rem;
}

.summary-panel.is-compact .route-direction {
  font-size: 0.85rem;
}

.summary-panel.is-compact .info-item .value {
  font-size: 0.8rem;
}

/* ===== ÉTAT VIDE ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.empty-state .empty-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.summary-panel.is-hero .empty-state p {
  color: rgba(255, 255, 255, 0.5);
}

.summary-panel.is-hero .empty-state .empty-icon {
  opacity: 0.4;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .summary-panel.is-hero .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .train-name {
    font-size: 1rem;
  }

  .route-direction {
    font-size: 0.85rem;
  }

  .info-item .value {
    font-size: 0.8rem;
  }

  .dashboard-summary dl > div {
    padding: 4px 0;
  }

  .total-price {
    font-size: 1rem !important;
  }
}

@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr !important;
    gap: 6px;
  }

  .summary-panel.is-hero .info-grid {
    grid-template-columns: 1fr;
  }

  .summary-panel.is-compact {
    padding: 12px;
  }

  .train-header {
    gap: 6px;
  }

  .train-icon {
    font-size: 1.1rem;
  }
}
</style>
