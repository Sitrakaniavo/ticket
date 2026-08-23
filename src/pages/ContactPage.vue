<template>
  <main class="contact-page">
    <section class="contact-panel">
      <div class="contact-intro">
        <p class="eyebrow">Diatsara Rail</p>
        <h1>Contactez-nous</h1>
        <p>
          Notre équipe est à votre disposition pour vous accompagner dans vos
          réservations et répondre à vos questions.
        </p>
      </div>

      <div class="contact-people">
        <article class="contact-person">
          <div class="person-icon" aria-hidden="true">1</div>
          <div>
            <h2>Personnel Diatsara 1</h2>
            <a href="tel:+261341234567">+261 34 12 345 67</a>
          </div>
        </article>

        <article class="contact-person">
          <div class="person-icon" aria-hidden="true">2</div>
          <div>
            <h2>Personnel Diatsara 2</h2>
            <a href="tel:+261329876543">+261 32 98 765 43</a>
          </div>
        </article>
      </div>

      <router-link to="/" class="back-link">Retour à l'accueil</router-link>
    </section>
  </main>
</template>

<style scoped>
.contact-page {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 48px 24px;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.14), transparent 28%),
    linear-gradient(180deg, #f8fbfb 0%, #eef5f4 100%);
}

.contact-panel {
  width: min(760px, 100%);
  padding: 48px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.1);
}

.contact-intro {
  max-width: 560px;
}

.contact-intro h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
}

.contact-intro p:not(.eyebrow) {
  margin: 18px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.contact-people {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 36px;
}

.contact-person {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 108px;
  padding: 20px;
  border: 1px solid #dce5dd;
  border-radius: 8px;
  background: #f8fbf9;
}

.person-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: #24746c;
  font-weight: 800;
}

.contact-person h2 {
  margin: 0 0 8px;
  color: #17211f;
  font-size: 1rem;
}

.contact-person a {
  color: #0f766e;
  font-weight: 800;
  text-decoration: none;
}

.contact-person a:hover {
  text-decoration: underline;
}

.back-link {
  display: inline-flex;
  margin-top: 32px;
  color: #24746c;
  font-weight: 800;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 560px) {
  .contact-page {
    padding: 24px 16px;
  }

  .contact-panel {
    padding: 28px 20px;
  }

  .contact-people {
    grid-template-columns: 1fr;
    margin-top: 28px;
  }
}
</style>
