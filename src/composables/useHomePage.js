import { computed, onMounted, ref } from 'vue'
import { supabaseMadarail } from '../lib/supabaseClient'

export function useHomePage() {
  const hasSession = ref(false)
  const trains = ref([])
  const isLoading = ref(false)
  const error = ref('')

  const statsData = [
    {
      id: 1,
      badge: '01',
      value: '15+',
      label: 'Trajets quotidiens',
      description: 'Des rotations fiables entre les villes clés de Madagascar.',
      color: '#0f766e',
    },
    {
      id: 2,
      badge: '02',
      value: '100K+',
      label: 'Voyageurs par mois',
      description: 'Une base de voyageurs en croissance constante.',
      color: '#0ea5e9',
    },
    {
      id: 3,
      badge: '03',
      value: '98%',
      label: 'Taux de satisfaction',
      description: 'Une expérience pensée pour la simplicité et la confiance.',
      color: '#b45309',
    },
    {
      id: 4,
      badge: '04',
      value: '25',
      label: 'Gares desservies',
      description: 'Un réseau de desserte qui couvre les grands axes du pays.',
      color: '#16a34a',
    },
    {
      id: 5,
      badge: '05',
      value: '850+',
      label: 'Kilomètres de voies',
      description: 'Un système ferroviaire moderne et en constante évolution.',
      color: '#2563eb',
    },
    {
      id: 6,
      badge: '06',
      value: '99.5%',
      label: 'Ponctualité',
      description: 'Des départs et des informations toujours bien organisés.',
      color: '#0f766e',
    },
  ]

  const checkSession = () => {
    const session = localStorage.getItem('rail_user_session')
    hasSession.value = !!session
  }

  async function loadActiveTrains() {
    isLoading.value = true
    error.value = ''

    try {
      const { data, error: supabaseError } = await supabaseMadarail
        .from('voyages')
        .select('*')
        .eq('statut', 'actif')
        .order('date_voyage', { ascending: true })

      if (supabaseError) throw supabaseError
      trains.value = data || []
    } catch (err) {
      console.error('Erreur chargement trains:', err.message)
      error.value = 'Impossible de charger les départs disponibles.'
    } finally {
      isLoading.value = false
    }
  }

  const activeTrain = computed(() => {
    if (trains.value.length > 0) {
      return trains.value[0]
    }
    return null
  })

  const heroStats = computed(() => ({
    trajets: trains.value.length > 0 ? `${trains.value.length}+` : '0',
    satisfaction: '98%',
    gares: '25',
  }))

  onMounted(() => {
    checkSession()
    loadActiveTrains()

    window.addEventListener('storage', (event) => {
      if (event.key === 'rail_user_session') {
        checkSession()
      }
    })
  })

  return {
    hasSession,
    trains,
    isLoading,
    error,
    statsData,
    activeTrain,
    heroStats,
  }
}
