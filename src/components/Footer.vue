<template>
  <footer class="app-footer">
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
      <p class="footer-copy">© 2026 Diatsara Madarail - Tous droits réservés</p>
    </div>
  </footer>
</template>
<style scoped>
footer.app-footer {
  width: 100%;
  margin-top: auto;
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
</style>
