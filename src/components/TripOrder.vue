<script setup>
import { reactive, computed, ref, watch, onMounted } from "vue";
import { supabaseClient } from "../lib/supabaseClient";
import { useTicketFare } from "./useTicketFare";
import TicketPreviewPanel from "./TicketPreviewPanel.vue";

const props = defineProps({
  activeTrain: {
    type: Object,
    default: null,
  },
  user: {
    type: Object,
    required: true,
  },
  editingTicket: {
    type: Object,
    default: null,
  }
});

const emit = defineEmits(["ticket-saved", "ticket-updated"]);

// États pour gérer le chargement et les erreurs d'insertion
const isSaving = ref(false);
const errorMessage = ref("");
const isEditing = ref(false);

// Formulaire réactif initialisé localement
const form = reactive({
  nom_voyageur: "",
  cin: "",
  mineur: false,
  classe: "2eme",
  depart: "",
  arrivee: "",
});

// Génération d'un ID unique pour le ticket
const generateShortId = () =>
  Math.random().toString(36).substring(2, 7).toUpperCase();
const uniqueTicketSeed = ref(generateShortId());

// Fonction pour générer un nouveau seed
function refreshTicketSeed() {
  uniqueTicketSeed.value = generateShortId();
}

// Surveillance du statut mineur : on réinitialise juste le CIN pour éviter les erreurs de saisie
watch(
  () => form.mineur,
  () => {
    form.cin = "";
  },
);

// Masque et formateur automatique pour le CIN (*** *** *** ***)
watch(
  () => form.cin,
  (newValue) => {
    if (!newValue) return;

    // 1. Ne garder que les chiffres
    let digits = newValue.replace(/\D/g, "");

    // 2. Limiter à 12 chiffres maximum
    if (digits.length > 12) {
      digits = digits.slice(0, 12);
    }

    // 3. Découper par blocs de 3 chiffres et les joindre avec un espace
    const blocks = digits.match(/.{1,3}/g);
    form.cin = blocks ? blocks.join(" ") : digits;
  },
);

// Injection et liaison de la logique extraite du composable
const {
  destinationTrains,
  garesArriveePossibles,
  currentAmount,
  currentPartMadarail,
  displayedPrice,
  fetchTrainDestination,
} = useTicketFare(form, props);

// Numéro de ticket calculé
const ticketNumber = computed(() => {
  if (!props.activeTrain) return "V.......";

  const gareDepartTrouvee = destinationTrains.value.find(g => g.nom === form.depart);
  const codeDepart = gareDepartTrouvee?.code 
    ? gareDepartTrouvee.code.trim().toUpperCase()
    : props.activeTrain.gare_depart?.code || "DP";

  const gareArriveeTrouvee = garesArriveePossibles.value.find(g => g.nom === form.arrivee);
  const codeArrivee = gareArriveeTrouvee?.code 
    ? gareArriveeTrouvee.code.trim().toUpperCase()
    : props.activeTrain.gare_arrivee?.code || "AR";

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateStr = `${yy}${mm}${dd}`;

  return `V${uniqueTicketSeed.value}${codeDepart}${codeArrivee}${dateStr}`;
});

// Objet préparé pour le panneau de prévisualisation
const ticketPreviewData = computed(() => {
  return {
    ticketNumber: ticketNumber.value,
    travelerName: form.nom_voyageur || "-",
    cin: form.cin || "--- --- --- ---",
    mineur: form.mineur,
    depart: form.depart || "---",
    arrivee: form.arrivee || "---",
    departureDate: props.activeTrain?.date_voyage || "---",
    seat: props.selectedSeat,
    ticketClass: form.classe === "1ere" ? "1ère classe" : "2ème classe",
    amount: displayedPrice.value,
  };
});

// Fonction pour charger un ticket en édition
function loadTicketForEdit(ticket) {
  if (!ticket) return;
  
  isEditing.value = true;
  form.nom_voyageur = ticket.nom_voyageur || "";
  form.cin = ticket.cin ? String(ticket.cin).replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4") : "";
  form.mineur = ticket.mineur || false;
  form.classe = ticket.classe || "2eme";
  form.depart = ticket.depart || "";
  form.arrivee = ticket.arrivee || "";
}

// Surveiller les changements de ticket d'édition
watch(() => props.editingTicket, (newTicket) => {
  if (newTicket) {
    loadTicketForEdit(newTicket);
  }
}, { immediate: true });

// Fonction d'enregistrement réel dans la base de données
async function handleSubmit() {
  if (!form.nom_voyageur) {
    errorMessage.value = "Veuillez saisir le nom du voyageur.";
    return;
  }

  if (!form.cin) {
    errorMessage.value = "Le numéro CIN est obligatoire.";
    return;
  }

  if (!form.mineur && form.cin.replace(/\s/g, "").length !== 12) {
    errorMessage.value = "Le numéro CIN doit comporter exactement 12 chiffres.";
    return;
  }

  if (!form.depart || !form.arrivee) {
    errorMessage.value = "Veuillez sélectionner les gares de départ et d'arrivée.";
    return;
  }

  const userId = props.user?.id_user || props.user?.id;
  if (!userId) {
    errorMessage.value = "Erreur de session : Impossible de valider votre identifiant d'agent.";
    return;
  }

  isSaving.value = true;
  errorMessage.value = "";

  try {
    let sensArray = [2131, 2132];
    if (props.activeTrain && props.activeTrain.sens) {
      sensArray = Array.isArray(props.activeTrain.sens)
        ? props.activeTrain.sens.map(Number)
        : [parseInt(props.activeTrain.sens, 10)];
    }

    const tarifBaseMadarail = Number(
      currentPartMadarail.value ||
        props.activeTrain?.tarif_1 ||
        props.activeTrain?.tarif_2 ||
        0,
    );
    const montantBrut = Number(currentAmount.value);
    const montantFinalVoyageur =
      Number.isFinite(montantBrut) && montantBrut > 0
        ? montantBrut
        : tarifBaseMadarail;

    const cinAsInteger = parseInt(form.cin.replace(/\s/g, ""), 10);

    if (!form.mineur && isNaN(cinAsInteger)) {
      errorMessage.value = "Le numéro de CIN est invalide.";
      return;
    }

    const ticketToInsert = {
      num_ticket: ticketNumber.value,
      nom_voyageur: form.nom_voyageur,
      cin: cinAsInteger,
      mineur: form.mineur,
      depart: form.depart,
      arrivee: form.arrivee,
      classe: form.classe,
      montant: montantFinalVoyageur,
      part_madarail: tarifBaseMadarail,
      id_voyageur: userId,
      id_voyage: props.activeTrain?.id || null,
      status: "actif",
      sens: sensArray,
    };

    const { data, error } = await supabaseClient
      .from("ticket_voyageur_site")
      .insert([ticketToInsert])
      .select()
      .single();

    if (error) throw error;

    // Réinitialiser le formulaire
    form.nom_voyageur = "";
    form.cin = "";
    form.mineur = false;
    form.depart = "";
    form.arrivee = "";
    isEditing.value = false;
    refreshTicketSeed();

    // Émettre l'événement pour mettre à jour la liste
    emit("ticket-saved", data);
  } catch (error) {
    console.error("Erreur lors de la création du ticket :", error);
    errorMessage.value = error.message || "Impossible d'enregistrer le ticket.";
  } finally {
    isSaving.value = false;
  }
}

// Fonction pour réinitialiser le formulaire
function resetForm() {
  form.nom_voyageur = "";
  form.cin = "";
  form.mineur = false;
  form.depart = "";
  form.arrivee = "";
  isEditing.value = false;
  errorMessage.value = "";
  refreshTicketSeed();
}

// Exposer les fonctions pour le parent
defineExpose({
  resetForm,
  loadTicketForEdit
});
</script>

<template>
  <div class="order-grid-container">
    <section class="summary-panel-compact">
      <p v-if="errorMessage" class="error-msg">⚠️ {{ errorMessage }}</p>
      <div class="section-heading-compact">
        <h2>{{ isEditing ? 'Modifier le billet' : 'Détails du voyageur' }}</h2>
        <button v-if="isEditing" @click="resetForm" class="btn-cancel-edit">
          Annuler
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="ticket-form-compact">
        <label class="form-field">
          <span class="field-label">Nom du voyageur</span>
          <input
            v-model="form.nom_voyageur"
            type="text"
            placeholder="Ex: Rabe Hery"
            :disabled="isSaving"
            required
          />
        </label>

        <label class="checkbox-field">
          <input v-model="form.mineur" type="checkbox" :disabled="isSaving" />
          <span class="field-label">Le voyageur est mineur</span>
        </label>

        <label class="form-field">
          <span class="field-label"
            >Numéro CIN <span class="required">*</span></span
          >
          <input
            v-model="form.cin"
            type="text"
            :placeholder="
              form.mineur ? 'Ex: CIN du tuteur' : 'Ex: 101 102 103 104'
            "
            :disabled="isSaving"
            :required="!form.mineur"
          />
        </label>

        <div class="form-row">
          <label class="form-field">
            <span class="field-label">Départ</span>
            <select
              v-model="form.depart"
              class="select-input"
              :disabled="isSaving"
              required
            >
              <option value="" disabled>Sélectionner</option>
              <option
                v-for="gare in destinationTrains"
                :key="gare.pk"
                :value="gare.nom"
              >
                {{ gare.nom }}
              </option>
            </select>
          </label>

          <label class="form-field">
            <span class="field-label">Arrivée</span>
            <select
              v-model="form.arrivee"
              class="select-input"
              :disabled="isSaving"
              required
            >
              <option value="" disabled>Sélectionner</option>
              <option
                v-for="gare in garesArriveePossibles"
                :key="gare.pk"
                :value="gare.nom"
              >
                {{ gare.nom }}
              </option>
            </select>
          </label>
        </div>

        <div class="form-row">
          <label class="form-field">
            <span class="field-label">Classe</span>
            <select
              v-model="form.classe"
              class="select-input"
              :disabled="isSaving"
              required
            >
              <option value="1ere">1ère classe</option>
              <option value="2eme">2ème classe</option>
            </select>
          </label>
        </div>

        <div class="price-display-block">
          <span class="price-label">Prix estimé</span>
          <span class="price-value">{{ displayedPrice }} MGA</span>
        </div>


        <!-- <button 
          type="submit" 
          class="submit-btn" 
          :disabled="isSaving"
        >
          {{ isSaving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer le billet' }}
        </button> -->
      </form>
    </section>

    <TicketPreviewPanel
      :preview-data="ticketPreviewData"
      :is-editing="isEditing"
      :class="{ 'panel-disabled': isSaving }"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.order-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  width: 100%;
}

.summary-panel-compact {
  background: #ffffff;
  border: 1px solid #dce5dd;
  border-radius: 6px;
  padding: 12px;
}

.section-heading-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-heading-compact h2 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #52625e;
  font-weight: 700;
}

.btn-cancel-edit {
  background: #f1f5f9;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel-edit:hover {
  background: #e2e8f0;
}

.ticket-form-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #52625e;
}

.required {
  color: #cc4141;
}

input[type="text"],
.select-input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  font-size: 0.85rem;
  font-family: inherit;
  border: 1px solid #dce5dd;
  border-radius: 4px;
  background: #fbfdfb;
  color: #17211f;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}

input[type="text"]:focus,
.select-input:focus {
  outline: none;
  border-color: #24746c;
  background: #ffffff;
}

.form-row {
  display: flex;
  gap: 10px;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 2px 0;
  user-select: none;
}

.checkbox-field input[type="checkbox"] {
  margin: 0;
  width: 14px;
  height: 14px;
  accent-color: #24746c;
}

.price-display-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eaf6f2;
  border-radius: 4px;
  padding: 6px 10px;
  margin-top: 4px;
}

.price-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #24746c;
}

.price-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #24746c;
}

.error-msg {
  color: #cc4141;
  font-weight: 600;
  margin: 4px 0 0 0;
  font-size: 0.78rem;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  background: #24746c;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: #1d5b57;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.panel-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>

/* ===== RESPONSIVE TRIP ORDER ===== */

/* Tablette */
@media (max-width: 768px) {
  .order-grid-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .summary-panel-compact {
    padding: 16px;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .order-grid-container {
    gap: 12px;
  }
  
  .summary-panel-compact {
    padding: 12px;
  }
  
  .section-heading-compact h2 {
    font-size: 0.7rem;
  }
  
  .ticket-form-compact {
    gap: 6px;
  }
  
  .form-field {
    gap: 2px;
  }
  
  .field-label {
    font-size: 0.7rem;
  }
  
  input[type="text"],
  .select-input {
    height: 30px;
    font-size: 0.8rem;
    padding: 0 8px;
  }
  
  .checkbox-field {
    padding: 0;
  }
  
  .price-display-block {
    padding: 4px 8px;
  }
  
  .price-value {
    font-size: 1rem;
  }
  
  .submit-btn {
    padding: 8px;
    font-size: 0.8rem;
  }
}