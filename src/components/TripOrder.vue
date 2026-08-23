<script setup>
import { reactive, computed, ref, watch, onMounted } from "vue";
import { supabaseClient } from "../lib/supabaseClient";
import { useTicketFare } from "../composables/useTicketFare.js";
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
  },
  isMobile: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(["ticket-saved", "ticket-updated"]);

// États pour gérer le chargement et les erreurs d'insertion
const isSaving = ref(false);
const errorMessage = ref("");
const isEditing = ref(false);
const showPreview = ref(false);
const submissionKey = ref(crypto.randomUUID());

// Formulaire réactif initialisé localement
const form = reactive({
  nom_voyageur: "",
  cin: "",
  mineur: false,
  classe: "2eme",
  depart: "",
  arrivee: "",
});

function getSessionCin() {
  const session = JSON.parse(localStorage.getItem("rail_user_session") || "{}");
  const sessionCin = props.user?.cin || session?.user?.cin || session?.cin || "";
  return String(sessionCin ?? "").trim();
}

function formatCinValue(rawCin) {
  if (!rawCin) return "";
  const digits = String(rawCin).replace(/\D/g, "").slice(0, 12);
  const blocks = digits.match(/.{1,3}/g);
  return blocks ? blocks.join(" ") : digits;
}

function syncFormCinFromSession() {
  form.cin = formatCinValue(getSessionCin());
}

// Génération d'un ID unique pour le ticket
const generateShortId = () =>
  Math.random().toString(36).substring(2, 7).toUpperCase();
const uniqueTicketSeed = ref(generateShortId());

// Fonction pour générer un nouveau seed
function refreshTicketSeed() {
  uniqueTicketSeed.value = generateShortId();
}

function refreshSubmissionKey() {
  submissionKey.value = crypto.randomUUID();
}

// Masque et formateur automatique pour le CIN (*** *** *** ***)
watch(
  () => form.cin,
  (newValue) => {
    if (!newValue) return;

    let digits = newValue.replace(/\D/g, "");
    if (digits.length > 12) {
      digits = digits.slice(0, 12);
    }
    const blocks = digits.match(/.{1,3}/g);
    form.cin = blocks ? blocks.join(" ") : digits;
  },
);

watch(
  () => props.user?.cin,
  () => {
    syncFormCinFromSession();
  },
  { immediate: true },
);

onMounted(() => {
  syncFormCinFromSession();
});

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

const hasFirstClassOption = computed(() => {
  const firstClassWagons = Number(
    props.activeTrain?.formation_voiture2 ?? props.activeTrain?.formation_voiture ?? 0,
  );
  return firstClassWagons > 0;
});

watch(
  () => [hasFirstClassOption.value, form.classe],
  ([hasFirstClass, selectedClass]) => {
    if (!hasFirstClass && selectedClass === "1ere") {
      form.classe = "2eme";
    }
  },
  { immediate: true },
);

// Fonction pour charger un ticket en édition
function loadTicketForEdit(ticket) {
  if (!ticket) return;
  
  isEditing.value = true;
  form.nom_voyageur = ticket.nom_voyageur || "";
  form.cin = formatCinValue(getSessionCin() || ticket.cin);
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

  const connectedCin = getSessionCin();

  if (!connectedCin) {
    errorMessage.value = "Aucun CIN n'a été trouvé dans votre compte connecté.";
    return;
  }

  form.cin = formatCinValue(connectedCin);

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

    const cinAsInteger = parseInt(connectedCin.replace(/\s/g, ""), 10);

    if (Number.isNaN(cinAsInteger)) {
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

    const { data, error } = await supabaseClient.rpc("create_ticket_idempotent", {
      p_ticket: ticketToInsert,
      p_idempotency_key: submissionKey.value,
    });

    if (error) throw error;

    const savedTicket = Array.isArray(data) ? data[0] : data;
    if (!savedTicket) {
      throw new Error("Le billet n'a pas pu être confirmé par le serveur.");
    }

    // Réinitialiser le formulaire
    form.nom_voyageur = "";
    syncFormCinFromSession();
    form.mineur = false;
    form.depart = "";
    form.arrivee = "";
    isEditing.value = false;
    refreshTicketSeed();
    refreshSubmissionKey();
    showPreview.value = false;

    // Émettre l'événement pour mettre à jour la liste
    emit("ticket-saved", savedTicket);
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
  syncFormCinFromSession();
  form.mineur = false;
  form.depart = "";
  form.arrivee = "";
  isEditing.value = false;
  errorMessage.value = "";
  refreshTicketSeed();
  showPreview.value = false;
}

// Exposer les fonctions pour le parent
defineExpose({
  resetForm,
  loadTicketForEdit
});

// Toggle preview on mobile
function togglePreview() {
  showPreview.value = !showPreview.value;
}
</script>

<template>
  <div class="order-grid-container" :class="{ 'mobile-order': isMobile }">
    <!-- Version Desktop: Grille 2 colonnes -->
    <template v-if="!isMobile">
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
            <span class="field-label">CIN du compte</span>
            <div class="account-cin-display">
              <span class="account-cin-value">{{ form.cin || 'CIN non disponible' }}</span>
              <small>Le CIN de votre compte connecté sera utilisé automatiquement.</small>
            </div>
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
              <div class="class-toggle-group" :class="{ 'class-toggle-group-disabled': isSaving }">
                <button
                  type="button"
                  class="class-option-btn"
                  :class="{ active: form.classe === '2eme' }"
                  @click="form.classe = '2eme'"
                  :disabled="isSaving"
                >
                  2ème classe
                </button>
                <button
                  type="button"
                  class="class-option-btn"
                  :class="{ active: form.classe === '1ere' }"
                  :disabled="isSaving || !hasFirstClassOption"
                  @click="form.classe = '1ere'"
                >
                  1ère classe
                </button>
              </div>
              <small v-if="!hasFirstClassOption" class="class-hint">
                La 1ère classe n’est pas proposée pour ce voyage.
              </small>
            </label>
          </div>

          <div class="price-display-block">
            <span class="price-label">Prix estimé</span>
            <span class="price-value">{{ displayedPrice }} MGA</span>
          </div>

          <button v-if="isEditing"
            type="submit" 
            class="submit-btn" 
            :disabled="isSaving"
          >
            {{ isSaving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer le billet' }}
          </button>
        </form>
      </section>

      <TicketPreviewPanel
        :preview-data="ticketPreviewData"
        :is-editing="isEditing"
        :is-mobile="isMobile"
        :class="{ 'panel-disabled': isSaving }"
        @submit="handleSubmit"
      />
    </template>

    <!-- Version Mobile: Stack vertical -->
    <template v-else>
      <section class="summary-panel-compact mobile-summary">
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
            <span class="field-label">CIN du compte</span>
            <div class="account-cin-display">
              <span class="account-cin-value">{{ form.cin || 'CIN non disponible' }}</span>
              <small>Le CIN de votre compte connecté sera utilisé automatiquement.</small>
            </div>
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
              <div class="class-toggle-group" :class="{ 'class-toggle-group-disabled': isSaving }">
                <button
                  type="button"
                  class="class-option-btn"
                  :class="{ active: form.classe === '2eme' }"
                  @click="form.classe = '2eme'"
                  :disabled="isSaving"
                >
                  2ème classe
                </button>
                <button
                  type="button"
                  class="class-option-btn"
                  :class="{ active: form.classe === '1ere' }"
                  :disabled="isSaving || !hasFirstClassOption"
                  @click="form.classe = '1ere'"
                >
                  1ère classe
                </button>
              </div>
              <small v-if="!hasFirstClassOption" class="class-hint">
                La 1ère classe n’est pas proposée pour ce voyage.
              </small>
            </label>
          </div>

          <div class="price-display-block">
            <span class="price-label">Prix estimé</span>
            <span class="price-value">{{ displayedPrice }} MGA</span>
          </div>

          <div class="mobile-actions">
            <button 
              type="button"
              class="btn-preview"
              @click="togglePreview"
            >
              {{ showPreview ? 'Masquer l\'aperçu' : 'Voir l\'aperçu' }}
            </button>
            <button 
              type="submit" 
              class="submit-btn" 
              :disabled="isSaving"
            >
              {{ isSaving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer' }}
            </button>
          </div>
        </form>

        <!-- Aperçu mobile (toggle) -->
        <div v-if="showPreview" class="mobile-preview">
          <TicketPreviewPanel
            :preview-data="ticketPreviewData"
            :is-editing="isEditing"
            :is-mobile="isMobile"
            :class="{ 'panel-disabled': isSaving }"
            @submit="handleSubmit"
          />
        </div>
      </section>
    </template>
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
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfb 100%);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.section-heading-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-heading-compact h2 {
  margin: 0;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0f172a;
  font-weight: 800;
}

.btn-cancel-edit {
  background: #f4f8f7;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f766e;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel-edit:hover {
  background: #e8fbf7;
}

.ticket-form-compact {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #52625e;
}

.required {
  color: #ef4444;
}

input[type="text"],
.select-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: 0.9rem;
  font-family: inherit;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input[type="text"]::placeholder {
  color: #74818c;
}

input[type="text"]:focus,
.select-input:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
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
  accent-color: #0f766e;
}

.account-cin-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  background: #f8fbfb;
  color: #0f172a;
}

.account-cin-value {
  font-size: 0.9rem;
  font-weight: 800;
  color: #0f766e;
}

.account-cin-display small {
  font-size: 0.72rem;
  color: #5b6570;
}

.class-toggle-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.class-option-btn {
  min-height: 40px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.class-option-btn:hover:not(:disabled) {
  border-color: #24746c;
  background: #eaf6f2;
  color: #24746c;
}

.class-option-btn.active {
  background: #24746c;
  border-color: #24746c;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(36, 116, 108, 0.18);
}

.class-option-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.class-toggle-group-disabled .class-option-btn {
  opacity: 0.7;
}

.class-hint {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 0.7rem;
}

.price-display-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e8fbf7;
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: 4px;
}

.price-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #0f766e;
}

.price-value {
  font-size: 1.15rem;
  font-weight: 900;
  color: #0f766e;
}

.error-msg {
  color: #b91c1c;
  font-weight: 700;
  margin: 2px 0 6px 0;
  font-size: 0.78rem;
}

.submit-btn {
  width: 100%;
  padding: 11px;
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-weight: 900;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(20, 184, 166, 0.24);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.panel-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.mobile-order .summary-panel-compact {
  padding: 14px;
  border-radius: 16px;
}

.class-toggle-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.class-option-btn {
  min-height: 40px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.class-option-btn:hover:not(:disabled) {
  border-color: #24746c;
  background: #eaf6f2;
  color: #24746c;
}

.class-option-btn.active {
  background: #24746c;
  border-color: #24746c;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(36, 116, 108, 0.18);
}

.class-option-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.class-toggle-group-disabled .class-option-btn {
  opacity: 0.7;
}

.mobile-order .class-option-btn {
  min-height: 46px;
  border: 1px solid #cbdad5;
  background: #f8fbfa;
  color: #52625e;
  box-shadow: none;
}

.mobile-order .class-option-btn.active {
  position: relative;
  border-color: #0f766e;
  background: #0f766e;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 118, 110, 0.24);
  transform: translateY(-1px);
}

.mobile-order .class-option-btn.active::after {
  position: absolute;
  top: 5px;
  right: 7px;
  content: "✓";
  font-size: 0.72rem;
  font-weight: 900;
}

.mobile-order .class-option-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.class-hint {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 0.7rem;
}

.mobile-order .form-row {
  flex-direction: column;
  gap: 8px;
}

.mobile-order .form-field {
  gap: 4px;
}

.mobile-order input[type="text"],
.mobile-order .select-input {
  height: 42px;
  font-size: 0.9rem;
  border-radius: 10px;
}

.mobile-order .checkbox-field {
  padding: 4px 0;
}

.mobile-order .checkbox-field input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.mobile-actions {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 8px;
  margin-top: 4px;
}

.btn-preview {
  padding: 10px;
  background: #f4f8f7;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-preview:active {
  background: #e8fbf7;
  transform: scale(0.97);
}

.mobile-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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
    height: 36px;
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
  
  .mobile-actions {
    grid-template-columns: 1fr;
  }
  
  .btn-preview {
    padding: 8px;
    font-size: 0.8rem;
  }
}
</style>