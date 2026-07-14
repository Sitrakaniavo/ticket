<!-- Footer.vue -->
<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const currentYear = computed(() => new Date().getFullYear());

const goTo = (route) => {
  router.push(route);
};

const socialLinks = [
  { name: "Facebook", icon: "📘", url: "#" },
  { name: "Instagram", icon: "📸", url: "#" },
  { name: "Twitter", icon: "🐦", url: "#" },
  { name: "YouTube", icon: "📺", url: "#" },
];

const quickLinks = [
  { name: "Accueil", route: "/" },
  { name: "Réservation", route: "/dashboard" },
  { name: "Profil", route: "/profile" },
  { name: "Contact", route: "/contact" },
];

const legalLinks = [
  { name: "Mentions légales", route: "/mentions" },
  { name: "Politique de confidentialité", route: "/confidentialite" },
  { name: "CGU", route: "/cgu" },
  { name: "Cookies", route: "/cookies" },
];

const appLinks = [
  { name: "Télécharger sur iOS", icon: "📱", url: "#" },
  { name: "Télécharger sur Android", icon: "📱", url: "#" },
];
</script>

<template>
  <footer class="app-footer">
    <div class="footer-container">
      <!-- Section 1: Logo & Description -->
      <div class="footer-section footer-brand">
        <div class="brand-wrapper">
          <span class="brand-logo">🚂</span>
          <div class="brand-text">
            <h2>Diatsara Rail</h2>
            <p>Le système de gestion ferroviaire moderne de Madagascar</p>
          </div>
        </div>
        <p class="brand-description">
          Voyagez autrement à Madagascar. Réservez vos billets de train en
          quelques minutes et profitez d'un voyage confortable à travers les
          plus belles destinations de l'île.
        </p>
        <!-- <div class="social-links">
          <a
            v-for="social in socialLinks"
            :key="social.name"
            :href="social.url"
            class="social-link"
            :aria-label="social.name"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="social-icon">{{ social.icon }}</span>
          </a>
        </div> -->
      </div>

      <!-- Section 2: Liens rapides -->
      <div class="footer-section">
        <h3>Navigation</h3>
        <ul class="footer-links">
          <li v-for="link in quickLinks" :key="link.name">
            <button @click="goTo(link.route)" class="footer-link-btn">
              {{ link.name }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Section 3: Légal -->
      <div class="footer-section">
        <h3>Informations légales</h3>
        <ul class="footer-links">
          <li v-for="link in legalLinks" :key="link.name">
            <button @click="goTo(link.route)" class="footer-link-btn">
              {{ link.name }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Section 4: Application mobile -->
      <!-- <div class="footer-section">
        <h3>Application mobile</h3>
        <p class="app-text">
          Retrouvez Diatsara Rail sur votre smartphone pour une expérience
          optimale.
        </p>
        <div class="app-links">
          <a
            v-for="app in appLinks"
            :key="app.name"
            :href="app.url"
            class="app-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="app-icon">{{ app.icon }}</span>
            <span class="app-name">{{ app.name }}</span>
          </a>
        </div>
        <div class="contact-info">
          <p class="contact-item">
            <span class="contact-icon">📧</span>
            <a href="mailto:contact@diatsara.mg">contact@diatsara.mg</a>
          </p>
          <p class="contact-item">
            <span class="contact-icon">📞</span>
            <a href="tel:+261341234567">+261 34 12 345 67</a>
          </p>
          <p class="contact-item">
            <span class="contact-icon">📍</span>
            <span>Antananarivo, Madagascar</span>
          </p>
        </div>
      </div> -->
    </div>

    <!-- Bottom Bar -->
    <div class="footer-bottom">
      <div class="footer-bottom-content">
        <p class="copyright">
          © {{ currentYear }} Diatsara Rail - Tous droits réservés
        </p>
        <div class="footer-bottom-links">
          <button @click="goTo('/mentions')" class="bottom-link">
            Mentions légales
          </button>
          <span class="bottom-separator">|</span>
          <button @click="goTo('/confidentialite')" class="bottom-link">
            Confidentialité
          </button>
          <span class="bottom-separator">|</span>
          <button @click="goTo('/cgu')" class="bottom-link">CGU</button>
        </div>
        <p class="footer-version">Version 1.0.0</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* ===== FOOTER PRINCIPAL ===== */
.app-footer {
  background: #0a1a1a;
  color: #e0f2f1;
  margin-top: 15px;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 32px;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 40px;
}

/* ===== SECTION BRAND ===== */
.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brand-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  font-size: 2rem;
  line-height: 1;
}

.brand-text h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.5px;
}

.brand-text p {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

.brand-description {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.7;
  color: #94a3b8;
  max-width: 380px;
}

/* ===== SOCIAL LINKS ===== */
.social-links {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: #24746c;
  border-color: #24746c;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(36, 116, 108, 0.3);
}

.social-icon {
  font-size: 1.1rem;
  line-height: 1;
}

/* ===== SECTIONS ===== */
.footer-section h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-link-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.9rem;
  padding: 4px 0;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  font-weight: 400;
  position: relative;
}

.footer-link-btn::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: #24746c;
  transition: width 0.3s ease;
}

.footer-link-btn:hover {
  color: #ffffff;
}

.footer-link-btn:hover::after {
  width: 100%;
}

/* ===== APPLICATION MOBILE ===== */
.app-text {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.app-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.app-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #e0f2f1;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.app-link:hover {
  background: rgba(36, 116, 108, 0.2);
  border-color: #24746c;
  transform: translateX(4px);
}

.app-icon {
  font-size: 1.2rem;
}

/* ===== CONTACT INFO ===== */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.contact-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
}

.contact-item a {
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-item a:hover {
  color: #24746c;
}

/* ===== FOOTER BOTTOM ===== */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 24px;
}

.footer-bottom-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.copyright {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}

.footer-bottom-links {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bottom-link {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0;
}

.bottom-link:hover {
  color: #24746c;
}

.bottom-separator {
  color: #1a3a3a;
  font-size: 0.8rem;
}

.footer-version {
  margin: 0;
  font-size: 0.7rem;
  color: #3a5a5a;
  letter-spacing: 0.5px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .footer-container {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}

@media (max-width: 768px) {
  .footer-container {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 32px 20px 24px;
  }

  .footer-brand {
    gap: 12px;
  }

  .brand-description {
    max-width: 100%;
  }

  .footer-bottom-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .footer-bottom-links {
    flex-wrap: wrap;
    justify-content: center;
  }

  .app-links {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .app-link {
    flex: 1;
    min-width: 140px;
    justify-content: center;
  }

  .social-links {
    justify-content: center;
  }

  .footer-section h3 {
    text-align: center;
  }

  .footer-links {
    align-items: center;
  }

  .footer-link-btn {
    text-align: center;
  }

  .contact-info {
    align-items: center;
  }
}

@media (max-width: 480px) {
  .footer-container {
    padding: 24px 16px 20px;
    gap: 20px;
  }

  .brand-text h2 {
    font-size: 1.2rem;
  }

  .brand-logo {
    font-size: 1.5rem;
  }

  .brand-description {
    font-size: 0.85rem;
  }

  .app-links {
    flex-direction: column;
  }

  .app-link {
    justify-content: center;
  }

  .footer-bottom {
    padding: 12px 16px;
  }

  .footer-bottom-links {
    flex-direction: column;
    gap: 4px;
  }

  .bottom-separator {
    display: none;
  }
}
</style>
