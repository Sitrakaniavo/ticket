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

// Statistiques calculées
const stats = computed(() => ({
  trajets: trains.value.length > 0 ? `${trains.value.length}+` : '0',
  satisfaction: '98%',
  gares: '15'
}))

onMounted(() => {
  checkSession()
  loadActiveTrains()
  
  // Écouter les changements de session
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
            <span>🚂</span>
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
              <div class="stat-number">{{ stats.trajets }}</div>
              <div class="stat-label">Trajets quotidiens</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ stats.satisfaction }}</div>
              <div class="stat-label">Satisfaction client</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ stats.gares }}</div>
              <div class="stat-label">Gares desservies</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- SECTION DES PRIX -->
    <section class="price-section">
      <div class="section-header">
        <span class="section-badge">Tarifs</span>
        <h3>Nos Classes de Voyage</h3>
        <p class="section-subtitle">Choisissez votre confort</p>
      </div>

      <div class="price-grid">
        <div class="price-category">
          <div class="price-icon">🚂</div>
          <h4>2ème Classe</h4>
          <div class="price-amount">7 000 MGA</div>
          <div class="price-detail">Trajet simple</div>
          <div class="price-amount alt">14 000 MGA</div>
          <div class="price-detail">Aller-retour</div>
          <div class="price-features">
            <span>Sièges standards</span>
            <span>Espace confortable</span>
          </div>
        </div>

        <div class="price-category featured">
          <div class="featured-badge">POPULAIRE</div>
          <div class="price-icon">🌟</div>
          <h4>1ère Classe</h4>
          <div class="price-amount">10 000 MGA</div>
          <div class="price-detail">Trajet simple</div>
          <div class="price-amount alt">15 000 MGA</div>
          <div class="price-detail">Aller-retour</div>
          <div class="price-amount alt">25 000 MGA</div>
          <div class="price-detail">Aller-retour premium</div>
          <div class="price-features">
            <span>Sièges Premium</span>
            <span>Service à bord</span>
            <span>Climatisation</span>
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

/* HERO SECTION */
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

/* LEFT COLUMN */
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

.trains-count {
  text-align: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.5px;
}

/* Loading & Error states */
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

.no-trains-message span:first-child {
  font-size: 1.5rem;
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

/* RIGHT COLUMN - STATS */
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

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 25px 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(-8px) scale(1.02);
  border-color: rgba(36, 116, 108, 0.4);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #e0f2f1 0%, #24746c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 5px;
}

/* PRICE SECTION */
.price-section {
  padding: 80px 20px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-badge {
  display: inline-block;
  background: #e0f2f1;
  color: #24746c;
  padding: 4px 16px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 2.5rem;
  color: #1a2a2a;
  font-weight: 700;
  margin: 0;
}

.section-subtitle {
  color: #64748b;
  font-size: 1.1rem;
  margin-top: 8px;
}

.price-grid {
  display: flex;
  justify-content: center;
  gap: 40px;
  max-width: 900px;
  margin: 0 auto;
  flex-wrap: wrap;
}

.price-category {
  flex: 1;
  min-width: 250px;
  max-width: 350px;
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid #eef2f6;
  position: relative;
}

.price-category:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

.price-category.featured {
  border: 2px solid #24746c;
  background: linear-gradient(135deg, #f8fafc 0%, #eef8f7 100%);
}

.featured-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #24746c;
  color: white;
  padding: 4px 20px;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.price-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.price-category h4 {
  font-size: 1.3rem;
  color: #1a2a2a;
  margin-bottom: 15px;
}

.price-amount {
  font-size: 1.8rem;
  font-weight: 800;
  color: #24746c;
  margin: 10px 0 4px;
}

.price-amount.alt {
  font-size: 1.4rem;
  margin-top: 5px;
}

.price-detail {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 5px;
}

.price-features {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.price-features span {
  font-size: 0.9rem;
  color: #475569;
  padding: 4px 0;
}

.price-features span::before {
  content: "✓ ";
  color: #24746c;
  font-weight: 700;
}

/* FOOTER */
footer {
  background: #0a1a1a;
  color: white;
  padding: 40px 20px;
  margin-top: auto;
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
  color: #e0f2f1;
}

.footer-copy {
  color: #64748b;
  font-size: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 20px;
  width: 100%;
  text-align: center;
}

/* ANIMATIONS */
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

/* RESPONSIVE */
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

  .stat-card:hover {
    transform: translateY(-8px) scale(1.02);
  }
}

@media (max-width: 768px) {
  .hero-left h1 {
    font-size: 2.8rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .trains-summary-wrapper {
    padding: 12px 16px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-number {
    font-size: 2rem;
  }

  .price-grid {
    flex-direction: column;
    align-items: center;
  }

  .price-category {
    max-width: 100%;
    width: 100%;
  }

  .section-header h3 {
    font-size: 2rem;
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
}
</style>

<style scoped>
/* ===== RESPONSIVE HOME ===== */

/* Tablette */
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

  .train-info-bar {
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

  .stat-card:hover {
    transform: translateY(-8px) scale(1.02);
  }
  
  .hero-left h1 {
    font-size: 3.5rem;
  }
}

/* Mobile */
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

  .train-info-bar {
    flex-direction: column;
    gap: 12px;
    padding: 15px 20px;
    width: 100%;
  }

  .info-divider {
    width: 80%;
    height: 1px;
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

  .stat-card {
    padding: 16px 20px;
  }

  .stat-number {
    font-size: 2rem;
  }

  .price-grid {
    flex-direction: column;
    align-items: center;
  }

  .price-category {
    max-width: 100%;
    width: 100%;
  }

  .section-header h3 {
    font-size: 2rem;
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

/* Petit mobile */
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
  
  .price-section {
    padding: 40px 16px;
  }
  
  .price-category {
    padding: 24px 16px;
  }
  
  .price-amount {
    font-size: 1.5rem;
  }
  
  .footer {
    padding: 24px 16px;
  }
  
  .footer-info h4 {
    font-size: 1.2rem;
  }
}
</style>