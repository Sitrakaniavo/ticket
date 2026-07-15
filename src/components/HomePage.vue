<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabaseMadarail } from '../lib/supabaseClient'
import BookingSummary from './BookingSummary.vue'

const router = useRouter()
const hasSession = ref(false)
const trains = ref([])
const isLoading = ref(false)
const error = ref('')

// Statistiques de la section "Diatsara en chiffres"
const statsData = [
  {
    id: 1,
    icon: '🚂',
    value: '15+',
    label: 'Trajets quotidiens',
    description: 'Reliant les principales villes de Madagascar',
    color: '#24746c'
  },
  {
    id: 2,
    icon: '👨‍👩‍👧‍👦',
    value: '100K+',
    label: 'Voyageurs par mois',
    description: 'Une communauté grandissante de voyageurs',
    color: '#2d8f85'
  },
  {
    id: 3,
    icon: '🌟',
    value: '98%',
    label: 'Taux de satisfaction',
    description: 'Des voyageurs recommandant notre service',
    color: '#b8860b'
  },
  {
    id: 4,
    icon: '🏛️',
    value: '25',
    label: 'Gares desservies',
    description: 'À travers les régions de Madagascar',
    color: '#4a7c59'
  },
  {
    id: 5,
    icon: '🌍',
    value: '850+',
    label: 'Kilomètres de voies',
    description: 'Un réseau ferroviaire en pleine expansion',
    color: '#3a6b8f'
  },
  {
    id: 6,
    icon: '⚡',
    value: '99.5%',
    label: 'Ponctualité',
    description: 'Des départs toujours à l\'heure',
    color: '#5a7c6c'
  }
]

// Vérification de la session
const checkSession = () => {
  const session = localStorage.getItem('rail_user_session')
  hasSession.value = !!session
}

// Charger les trains actifs
async function loadActiveTrains() {
  isLoading.value = true
  error.value = ''
  
  try {
    const { data, error: supabaseError } = await supabaseMadarail
      .from("voyages")
      .select("*")
      .eq("statut", "actif")
      .order("date_voyage", { ascending: true });

    if (supabaseError) throw supabaseError;
    trains.value = data || [];
  } catch (err) {
    console.error("Erreur chargement trains:", err.message)
    error.value = "Impossible de charger les départs disponibles."
  } finally {
    isLoading.value = false
  }
}

// Sélectionner le premier train par défaut
const activeTrain = computed(() => {
  if (trains.value.length > 0) {
    return trains.value[0]
  }
  return null
})

// Statistiques du hero
const heroStats = computed(() => ({
  trajets: trains.value.length > 0 ? `${trains.value.length}+` : '0',
  satisfaction: '98%',
  gares: '15'
}))

onMounted(() => {
  checkSession()
  loadActiveTrains()
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'rail_user_session') {
      checkSession()
    }
  })
})
</script>

<template>
  <div class="home-container">
    <!-- HERO SECTION AVEC IMAGE DE FOND -->
    <header class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">Madarail • 2026</div>
          <h1>Diatsara Rail</h1>
          <p class="hero-subtitle">Voyagez autrement à Madagascar</p>

          <!-- Affichage des trains disponibles avec BookingSummary -->
          <div v-if="isLoading" class="loading-trains">
            <div class="loading-spinner-small"></div>
            <span>Chargement des départs...</span>
          </div>
          
          <div v-else-if="error" class="error-trains">
            <span>⚠️</span>
            <span>{{ error }}</span>
          </div>
          
          <div v-else-if="trains.length > 0" class="trains-summary-wrapper">
            <BookingSummary 
              :active-train="activeTrain"
              :is-hero="true"
              :selected-seat="null"
            />
          </div>
          
          <div v-else class="no-trains-message">
            <span>Aucun départ planifié pour le moment</span>
          </div>

          <div class="hero-actions">
            <router-link to="/dashboard" class="btn-primary">
              <span>Réserver maintenant</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </router-link>
            <router-link
              v-if="!hasSession"
              to="/dashboard"
              class="btn-secondary"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Connexion
            </router-link>
          </div>
        </div>

        <div class="hero-right">
          <div class="hero-stats">
            <div class="stat-card">
              <div class="stat-number">{{ heroStats.trajets }}</div>
              <div class="stat-label">Trajets quotidiens</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ heroStats.satisfaction }}</div>
              <div class="stat-label">Satisfaction client</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ heroStats.gares }}</div>
              <div class="stat-label">Gares desservies</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- SECTION STATS - Diatsara en chiffres (Version blanche) -->
    <section class="stats-section">
      <div class="stats-container">
        <div class="stats-header">
          <span class="section-badge">📊 Diatsara en chiffres</span>
          <h2>Notre Impact à Madagascar</h2>
          <p class="stats-subtitle">
            Des chiffres qui parlent d'eux-mêmes
          </p>
        </div>

        <div class="stats-grid">
          <div 
            v-for="stat in statsData" 
            :key="stat.id" 
            class="stat-card"
            :style="{ '--stat-color': stat.color }"
          >
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-description">{{ stat.description }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer>
      <div class="footer-content">
        <div class="footer-info">
          <h4>Diatsara Rail</h4>
          <p>Le système de gestion ferroviaire moderne de Madagascar</p>
        </div>
        <div class="footer-links">
          <a href="#">À propos</a>
          <a href="#">Contact</a>
          <a href="#">Mentions légales</a>
        </div>
        <p class="footer-copy">
          © 2026 Diatsara Madarail - Tous droits réservés
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family:
    "Segoe UI",
    system-ui,
    -apple-system,
    sans-serif;
}

/* ===== HERO SECTION ===== */
.hero-section {
  position: relative;
  min-height: 80vh;
  background:
    linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 100%),
    url("https://gcgbyipdhhwctfyappsm.supabase.co/storage/v1/object/public/image_diatsara/gare_image.jpg") center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 40px;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.2) 100%
  );
}

.hero-content {
  position: relative;
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  z-index: 1;
  animation: fadeInUp 0.8s ease-out;
}

.hero-left {
  text-align: left;
}

.hero-badge {
  display: inline-block;
  background: rgba(36, 116, 108, 0.9);
  padding: 6px 20px;
  border-radius: 50px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.hero-left h1 {
  font-size: 4.5rem;
  font-weight: 800;
  letter-spacing: -2px;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #ffffff 0%, #e0f2f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  font-weight: 300;
  letter-spacing: 1px;
}

/* Trains Summary Wrapper */
.trains-summary-wrapper {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.trains-summary-wrapper:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(36, 116, 108, 0.4);
}

.loading-trains {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.8);
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top: 2px solid #24746c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-trains {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(239, 68, 68, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
  color: #fca5a5;
  font-size: 0.9rem;
}

.no-trains-message {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
}

/* Hero Actions */
.hero-actions {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 32px;
  background: #24746c;
  color: white;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 8px 25px rgba(36, 116, 108, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  background: #1e625b;
  box-shadow: 0 12px 35px rgba(36, 116, 108, 0.4);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
}

/* Hero Right Stats */
.hero-right {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  width: 100%;
  max-width: 300px;
}

.hero-stats .stat-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 25px 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.hero-stats .stat-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(-8px) scale(1.02);
  border-color: rgba(36, 116, 108, 0.4);
}

.hero-stats .stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #e0f2f1 0%, #24746c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-stats .stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 5px;
}

/* ===== STATS SECTION - VERSION BLANCHE ===== */
.stats-section {
  padding: 80px 20px;
  background: #ffffff;
  color: #0a1a1a;
  position: relative;
}

/* Bordure décorative en haut */
.stats-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #24746c, #4a7c59, #b8860b, #2d8f85, #24746c);
  background-size: 200% 100%;
  animation: gradientMove 4s ease-in-out infinite;
}

@keyframes gradientMove {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-badge {
  display: inline-block;
  background: #eaf6f2;
  color: #24746c;
  padding: 4px 16px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.stats-header h2 {
  font-size: 2.5rem;
  margin: 0 0 8px 0;
  font-weight: 800;
  color: #0a1a1a;
}

.stats-subtitle {
  font-size: 1.1rem;
  color: #667672;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.stats-grid .stat-card {
  text-align: center;
  background: #f8faf8;
  border-radius: 16px;
  padding: 30px 20px;
  border: 1px solid #eef2f6;
  transition: all 0.4s ease;
  position: relative;
}

.stats-grid .stat-card:hover {
  background: #ffffff;
  transform: translateY(-6px);
  border-color: var(--stat-color);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  display: block;
  transition: transform 0.4s ease;
}

.stats-grid .stat-card:hover .stat-icon {
  transform: scale(1.15) rotate(-5deg);
}

.stat-value {
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.stat-label {
  font-size: 1rem;
  font-weight: 700;
  color: #0a1a1a;
  margin-bottom: 6px;
}

.stat-description {
  font-size: 0.85rem;
  color: #667672;
  line-height: 1.5;
}

/* ===== FOOTER ===== */
footer {
  background: #0a1a1a;
  color: white;
  padding: 40px 20px;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.footer-info {
  text-align: center;
}

.footer-info h4 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #e0f2f1;
}

.footer-info p {
  color: #94a3b8;
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  gap: 30px;
}

.footer-links a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: #7ee0d7;
}

.footer-copy {
  color: #64748b;
  font-size: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 20px;
  width: 100%;
  text-align: center;
}

/* ===== ANIMATIONS ===== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }

  .hero-left {
    text-align: center;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-right {
    order: -1;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    max-width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 100vh;
    padding: 20px;
  }

  .hero-left h1 {
    font-size: 2.8rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .hero-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .hero-stats .stat-card {
    padding: 16px 20px;
  }

  .hero-stats .stat-number {
    font-size: 2rem;
  }

  .stats-section {
    padding: 50px 16px;
  }

  .stats-header h2 {
    font-size: 1.8rem;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .stats-grid .stat-value {
    font-size: 2rem;
  }

  .stats-grid .stat-card {
    padding: 20px 16px;
  }

  .footer-links {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .loading-trains,
  .error-trains,
  .no-trains-message {
    padding: 12px 16px;
    font-size: 0.85rem;
  }

  .trains-summary-wrapper {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .hero-left h1 {
    font-size: 2.2rem;
  }

  .hero-badge {
    font-size: 0.65rem;
    padding: 4px 14px;
  }

  .hero-subtitle {
    font-size: 0.9rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }

  .stats-header h2 {
    font-size: 1.5rem;
  }

  .stats-section {
    padding: 40px 16px;
  }

  .stats-grid .stat-card {
    padding: 24px 16px;
  }

  .stat-value {
    font-size: 2.2rem;
  }

  footer {
    padding: 24px 16px;
  }

  .footer-info h4 {
    font-size: 1.2rem;
  }
}
</style>