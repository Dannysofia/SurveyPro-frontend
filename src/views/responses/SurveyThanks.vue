<template>
  <section>
    <div class="card" style="max-width:640px;margin:0 auto;">
      <div class="card-body">
        <h2 style="margin:0 0 8px;">¡Gracias por tu respuesta!</h2>
        <p class="muted" style="margin:0 0 12px;">
          Hemos recibido tus respuestas correctamente.
        </p>
        <p class="muted" style="margin:0 0 16px;">
          ¿Te gustaría crear tus propias encuestas?
        </p>
        <div class="actions">
          <button class="btn btn-primary" @click="goLogin">Crear mis encuestas en SurveyPro</button>
        </div>
      </div>
    </div>
  </section>
  
</template>

<script setup>
import { useRouter } from 'vue-router';
import '@/assets/css/surveys.css';

const router = useRouter();
function goLogin() {
  router.push({ name: 'home' });
}
</script>
