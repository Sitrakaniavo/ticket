import { ref, computed, watch } from 'vue'
import { supabaseMadarail, supabaseClient } from '../lib/supabaseClient'

export function useTicketFare(form, props) {
  // Liste brute de toutes les gares récupérées pour ce voyage
  const destinationTrains = ref([])

  // Détermination dynamique du tri selon le sens
  const estAscending = computed(() => {
    if (!props.activeTrain || !props.activeTrain.sens) return true
    const sensNumero = parseInt(props.activeTrain.sens, 10)
    return sensNumero % 2 !== 0
  })

  // FILTRE DYNAMIQUE : Liste des gares d'arrivée possibles
  const garesArriveePossibles = computed(() => {
    if (!form.depart || destinationTrains.value.length === 0) {
      return destinationTrains.value
    }
    
    // On trouve la position de la gare de départ sélectionnée
    const indexDepart = destinationTrains.value.findIndex(gare => gare.nom === form.depart)
    
    // On ne retourne que les gares situées APRÈS la gare de départ dans le sens du trajet
    return destinationTrains.value.slice(indexDepart + 1)
  })

  // Stockage des informations du trajet (tarifs, distance)
  const selectedRoute = ref(null)

  // Récupérer le code d'une gare à partir de son nom
  const getGareCode = (nomGare) => {
    const gare = destinationTrains.value.find(g => g.nom === nomGare)
    return gare ? gare.code : null
  }

  // Fonction pour charger le prix depuis public.trajets_train
  async function fetchRoutePrice() {
    selectedRoute.value = null

    const codeDepart = getGareCode(form.depart)
    const codeArrivee = getGareCode(form.arrivee)

    // On ne fait la requête que si on a les deux codes de gare
    if (!codeDepart || !codeArrivee) return

    try {
      const { data, error } = await supabaseClient
        .from('trajets_train')
        .select('tarif_1, tarif_2, distance_km')
        // Utilisation de ilike pour ignorer les espaces blancs du type character(3)
        .ilike('gare_depart', codeDepart.trim())
        .ilike('gare_arrivee', codeArrivee.trim())
        .maybeSingle()

      if (error) throw error
      if (data) {
        selectedRoute.value = data
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du prix du trajet :', error.message)
    }
  }

  // Fonction de récupération de toutes les gares au changement de train
  async function fetchTrainDestination() {
    if (!props.activeTrain) return
    
    try {
      // On récupère aussi le 'code' pour pouvoir faire la correspondance avec trajets_train
      const { data, error } = await supabaseClient
        .from('gares')
        .select('code, nom, pk')
        .order('pk', { ascending: estAscending.value })

      if (error) throw error

      destinationTrains.value = data || []

      // Initialisation par défaut (Première gares et Dernière gares)
      if (destinationTrains.value.length > 1) {
        form.depart = destinationTrains.value[0].nom
        form.arrivee = destinationTrains.value[destinationTrains.value.length - 1].nom
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails du train :', error.message)
    }
  }

  // Extraction réactive de la part Madarail brute (tarif_1 = 2ème classe, tarif_2 = 1ère classe)
  const currentPartMadarail = computed(() => {
    if (!selectedRoute.value) return 0

    return form.classe === '1ere'
      ? Number(selectedRoute.value.tarif_2 || selectedRoute.value.tarif_1 || 0) // Fallback tarif_1 si tarif_2 est null
      : Number(selectedRoute.value.tarif_1 || 0)
  })

  // Calcul dynamique du montant final voyageur selon tes 5 paliers stricts
  const currentAmount = computed(() => {
    // Si la BDD trajets_train n'a rien renvoyé, on utilise tes tarifs de secours d'origine
    if (!selectedRoute.value) {
      return form.classe === '1ere' 
        ? (props.activeTrain?.price_1ere || "-") 
        : (props.activeTrain?.price_2eme || "-")
    }
    
    const tarifBase = currentPartMadarail.value

    // Application stricte de tes paliers sur la part Madarail trouvée
    if (tarifBase === 5800) return 7000
    if (tarifBase === 8800) return 10000
    if (tarifBase === 11600) return 14000
    if (tarifBase === 13800) return 15000
    if (tarifBase === 22600) return 25000
    
    // Si la valeur sort des paliers, on retourne la valeur brute sans calcul masqué
    return tarifBase
  })

  // Formatage national lisible (fr-MG ou fr-FR selon tes préférences d'affichage d'espaces)
  const displayedPrice = computed(() => {
    return new Intl.NumberFormat('fr-MG', {
      maximumFractionDigits: 0
    }).format(currentAmount.value)
  })

  // Déclenche la recherche de prix dès que le trajet change
  watch(() => [form.depart, form.arrivee], () => {
    fetchRoutePrice()
  })

  // Surveiller le changement de la gare de départ pour réajuster l'arrivée si nécessaire
  watch(() => form.depart, () => {
    const toujoursValide = garesArriveePossibles.value.some(gare => gare.nom === form.arrivee)
    if (!toujoursValide && garesArriveePossibles.value.length > 0) {
      form.arrivee = garesArriveePossibles.value[garesArriveePossibles.value.length - 1].nom
    }
  })

  // On observe le changement du train actif pour recharger la liste des gares
  watch(() => props.activeTrain, (newTrain) => {
    if (newTrain) {
      fetchTrainDestination()
    }
  }, { immediate: true })

  return {
    destinationTrains,
    garesArriveePossibles,
    currentPartMadarail, // Exposé pour que ton TripOrder.vue puisse récupérer le tarif brut pour 'part_madarail'
    currentAmount,
    displayedPrice,
    selectedRoute
  }
}