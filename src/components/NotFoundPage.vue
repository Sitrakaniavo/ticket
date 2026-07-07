<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main class="not-found-page">
    <section class="not-found-panel">
      <p class="eyebrow">Page introuvable</p>
      <h1>Cette route n'existe pas.</h1>
      <p>Retournez a la reservation ou connectez-vous pour continuer.</p>

      <div class="not-found-actions">
        <button class="primary-button" type="button" @click="router.push({ name: 'Dashboard' })">
          Aller au dashboard
        </button>
        <button class="secondary-button" type="button" @click="router.push({ name: 'Login' })">
          Connexion
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* ===== RESPONSIVE NOT FOUND ===== */

/* Tablette */
@media (max-width: 768px) {
  .not-found-panel {
    padding: 24px;
  }
  
  .not-found-panel h1 {
    font-size: clamp(2rem, 5vw, 3rem);
  }
}

/* Mobile */
@media (max-width: 560px) {
  .not-found-page {
    padding: 16px;
  }
  
  .not-found-panel {
    padding: 20px;
  }
  
  .not-found-panel h1 {
    font-size: 1.8rem;
  }
  
  .not-found-panel p:not(.eyebrow) {
    font-size: 0.9rem;
  }
  
  .not-found-actions {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .btn-back-notfound {
    font-size: 0.8rem;
    padding: 6px 14px;
  }
  
  .btn-back-notfound svg {
    width: 16px;
    height: 16px;
  }
  
  .primary-button,
  .secondary-button {
    min-height: 42px;
    font-size: 0.9rem;
  }
}

/* Petit mobile */
@media (max-width: 380px) {
  .not-found-panel {
    padding: 16px;
  }
  
  .not-found-panel h1 {
    font-size: 1.5rem;
  }
}
</style>