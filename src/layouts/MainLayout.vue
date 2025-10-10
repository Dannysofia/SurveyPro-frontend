<template>
  <header class="hero">
    <h1 class="brand">SurveyPro</h1>
  </header>

  <main class="container">
    <router-view />
  </main>
</template>

<script setup>
// No script needed for now
</script>

<style scoped>
:root {
  --primary: #2563eb;
  --primary-800: #1e40af;
  --text-on-primary: #fff;
  --bg: #f8fafc;
}
.hero {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(90deg, var(--primary-800), var(--primary));
  color: var(--text-on-primary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.brand {
  margin: 0;
  font-size: 28px;
  letter-spacing: 0.6px;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  background: var(--bg);
  min-height: calc(100vh - 100px);
}
</style>
