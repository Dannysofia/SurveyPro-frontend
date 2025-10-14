<template>
  <div class="layout">
    <!-- Header simple, sin card/bordes -->
    <header class="site-header">
      <div class="site-header__inner">
        <h1 class="brand">SurveyPro</h1>
      </div>
    </header>

    <main class="site-main">
      <router-view />
    </main>
  </div>
</template>

<script setup></script>

<style scoped>
.layout { min-height: 100dvh; background: #f6f8fb; } /* menos “blanco puro” */
.site-header {
  background: linear-gradient(180deg, #ffffff 0%, #f6f8fb 100%);
  border-bottom: 1px solid #eef2f7;
}
.site-header__inner {
  max-width: 1100px; margin: 0 auto; padding: 16px 12px;
  display: flex; align-items: center; justify-content: space-between;
}
.brand { margin: 0; font-size: 22px; letter-spacing: .2px; }
.site-main { max-width: 1100px; margin: 0 auto; padding: 24px 12px 48px; }
</style>