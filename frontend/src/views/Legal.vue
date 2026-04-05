<template>
  <main class="min-h-screen px-6 py-28">
    <div class="mx-auto max-w-3xl space-y-10">
      <h1 class="text-4xl font-bold">Legal Notice</h1>

      <section class="space-y-4">
        <h2 class="section-title">Publishing Information / Impressum</h2>

        <p class="text-body">
          Legally responsible acc. to §55 RStV (European Union) and §5 Telemediengesetz (Germany):
        </p>

        <div class="text-body">
          <p>Shenpai Productions</p>
          <p>c/o Block Services</p>
          <p>Stuttgarter Str. 106</p>
          <p>70736 Fellbach</p>
        </div>

        <p class="text-body">
          Email:
          <a href="mailto:shenpai@dmbmgmt.com" class="link">
            shenpai@dmbmgmt.com
          </a>
        </p>
      </section>

      <section class="space-y-4">
        <h2 class="section-title">Copyright Notice</h2>

        <p class="text-body">
          All content on this website, including text, images, videos, and downloadable materials, is protected by copyright and may not be used, copied, reproduced, or distributed without prior written permission from the production company.
        </p>

        <p class="text-body">
          Unauthorized use may result in legal action, including both civil and criminal penalties.
        </p>
      </section>

      <section class="space-y-4">
        <h2 class="section-title">Urheberrechtshinweis</h2>

        <p class="text-body">
          Alle Inhalte dieser Website, einschließlich Texte, Bilder, Videos und herunterladbare Materialien, sind urheberrechtlich geschützt und dürfen ohne vorherige schriftliche Zustimmung der Produktionsfirma nicht verwendet, kopiert, vervielfältigt oder verbreitet werden.
        </p>

        <p class="text-body">
          Eine unbefugte Nutzung kann rechtliche Schritte nach sich ziehen, einschließlich zivil- und strafrechtlicher Konsequenzen.
        </p>
      </section>
      <div class="mt-12 flex flex-wrap justify-center gap-4">
        <router-link to="/privacy" class="action-btn">
          Privacy Policy
        </router-link>

        <a
            href="https://bsky.app/profile/shenpai.gay"
            target="_blank"
            rel="noopener noreferrer"
            class="action-btn"
        >
          Bluesky
        </a>
      </div>
    </div>
  </main>
</template>

<script setup>
</script>

<style scoped>
.section-title {
  color: var(--text-main);
  font-size: 1.5rem;
  font-weight: 600;
}

.text-body {
  color: var(--text-soft);
  line-height: 1.6;
}

.link {
  color: var(--text-main);
  text-decoration: underline;
}

.link:hover {
  opacity: 0.7;
}
</style>