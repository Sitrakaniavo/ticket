<script setup>
import BookingSummary from '../components/BookingSummary.vue'
import { useHomePage } from '../composables/useHomePage.js'

const {
  hasSession,
  trains,
  isLoading,
  error,
  statsData,
  activeTrain,
  heroStats,
} = useHomePage()
</script>

<template>
  <div class="home-container">
    <header class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">Madarail</div>
          <h1>Diatsara Rail</h1>
          <p class="hero-subtitle">Voyagez autrement à Madagascar</p>
          <p class="hero-description">
            Réservez rapidement, suivez vos trajets et gérez vos billets au travers d’une expérience fluide, claire et moderne.
          </p>

          <div v-if="isLoading" class="loading-trains">
            <div class="loading-spinner-small"></div>
            <span>Chargement des départs...</span>
          </div>

          <div v-else-if="error" class="error-trains">
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
            <router-link to="/booking" class="btn-primary">
              <span>Réserver maintenant</span>
            </router-link>
            <router-link v-if="!hasSession" to="/login" class="btn-secondary">
              Connexion
            </router-link>
          </div>
        </div>

        <div class="hero-right">
          <div class="hero-stats">
            <div class="stat-card">
              <div class="stat-number">2</div>
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

    <section class="stats-section">
      <div class="stats-container">
        <div class="stats-header">
          <span class="section-badge">Diatsara en chiffres</span>
          <h2>Une plateforme pensée pour un voyage fluide</h2>
          <p class="stats-subtitle">
            Un accès rapide aux informations, à la réservation et au suivi de vos billets.
          </p>
        </div>

        <div class="stats-grid">
          <div
            v-for="stat in statsData"
            :key="stat.id"
            class="stat-card"
            :style="{ '--stat-color': stat.color }"
          >
            <div class="stat-badge">{{ stat.badge }}</div>
            <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-description">{{ stat.description }}</div>
          </div>
        </div>
      </div>
    </section>

    <footer>
      <div class="footer-content">
        <div class="footer-info">
          <h4>Diatsara Rail</h4>
          <p>Le système de gestion ferroviaire moderne de Madagascar</p>
        </div>
        <div class="footer-links">
          <a href="#">À propos</a>
          <router-link to="/contact">Contact</router-link>
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
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 18%),
    linear-gradient(180deg, #071018 0%, #0b1220 100%);
}

.hero-section {
  position: relative;
  min-height: 82vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  padding: 40px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(6, 14, 22, 0.40), rgba(8, 23, 35, 0.26)),
    url("https://gcgbyipdhhwctfyappsm.supabase.co/storage/v1/object/public/image_diatsara/gare_image.jpg") center/cover no-repeat;
}

.hero-section::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(3, 10, 18, 0.40), rgba(9, 21, 34, 0.20)),
    linear-gradient(90deg, rgba(8, 15, 25, 0.50) 0%, rgba(8, 15, 25, 0.15) 100%);
}

.hero-overlay {
  position: absolute;
  inset: auto 0 0 0;
  height: 120px;
  background: linear-gradient(180deg, transparent, rgba(7, 19, 29, 0.85));
}

.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1240px;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 36px;
  align-items: center;
  animation: fadeInUp 0.8s ease-out;
}

.hero-left {
  text-align: left;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.18);
  border: 1px solid rgba(20, 184, 166, 0.5);
  color: #d7fbf4;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 18px;
}

.hero-left h1 {
  margin: 0 0 12px;
  font-size: clamp(3rem, 5.3vw, 5.3rem);
  line-height: 0.95;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: #f8fafc;
}

.hero-subtitle {
  margin: 0 0 10px;
  font-size: 1.15rem;
  color: #5eead4;
  font-weight: 800;
}

.hero-description {
  max-width: 660px;
  margin: 0 0 22px;
  color: rgba(226, 232, 240, 0.88);
  line-height: 1.8;
  font-size: 1rem;
}

.trains-summary-wrapper,
.loading-trains,
.error-trains,
.no-trains-message {
  margin-bottom: 22px;
  border-radius: 20px;
  padding: 18px 20px;
  backdrop-filter: blur(14px);
}

.trains-summary-wrapper {
  background: rgba(12, 23, 38, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 20px 50px rgba(2, 8, 20, 0.38);
}

.loading-trains {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #e2e8f0;
  background: rgba(10, 19, 31, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.24);
  border-top-color: #2dd4bf;
  animation: spin 0.8s linear infinite;
}

.error-trains,
.no-trains-message {
  background: rgba(10, 19, 31, 0.78);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.hero-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 22px;
  border-radius: 14px;
  font-weight: 800;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  color: white;
  box-shadow: 0 14px 36px rgba(15, 118, 110, 0.33);
}

.btn-secondary {
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.72);
}

.hero-right {
  display: flex;
  justify-content: center;
}

.hero-stats {
  display: grid;
  gap: 16px;
  width: 100%;
  max-width: 360px;
}

.hero-stats .stat-card {
  padding: 22px;
  border-radius: 20px;
  background: rgba(10, 19, 31, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.24);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(2, 8, 20, 0.35);
}

.hero-stats .stat-number {
  margin-bottom: 6px;
  font-size: 2.5rem;
  line-height: 1;
  font-weight: 900;
  color: #5eead4;
}

.hero-stats .stat-label {
  font-size: 0.96rem;
  color: rgba(226, 232, 240, 0.86);
}

.stats-section {
  padding: 84px 20px;
  background: linear-gradient(180deg, #f8fbfc 0%, #eef4f6 100%);
  position: relative;
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-header {
  margin-bottom: 34px;
  text-align: center;
}

.section-badge {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e6fbf7;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stats-header h2 {
  margin: 0 0 10px;
  font-size: clamp(2rem, 3vw, 3rem);
  color: #0f172a;
}

.stats-subtitle {
  margin: 0;
  color: #5b6570;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.stat-card {
  padding: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbfb 100%);
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 34px rgba(8, 30, 38, 0.08);
}

.stat-badge {
  display: inline-flex;
  margin-bottom: 14px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.10);
  color: #0f766e;
  font-size: 0.75rem;
  font-weight: 800;
}

.stat-value {
  margin-bottom: 6px;
  font-size: 2.3rem;
  line-height: 1;
  font-weight: 900;
}

.stat-label {
  margin-bottom: 6px;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.stat-description {
  color: #5b6570;
  font-size: 0.92rem;
  line-height: 1.6;
}

footer {
  background: #ffffff;
  color: #0f172a;
  padding: 36px 20px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.footer-info {
  text-align: center;
}

.footer-info h4 {
  margin: 0 0 6px;
  font-size: 1.3rem;
}

.footer-info p {
  margin: 0;
  color: #5b6570;
}

.footer-links {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-links a {
  color: #0f766e;
}

.footer-copy {
  margin: 0;
  width: 100%;
  text-align: center;
  color: #7d8e8a;
  font-size: 0.82rem;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 30px;
    text-align: center;
  }

  .hero-left {
    text-align: center;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-stats {
    max-width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 24px 16px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>