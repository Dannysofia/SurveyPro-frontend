<template>
  <section class="card auth-wrap">
    <div class="card-body">
      <h1 class="title auth-title">Iniciar sesión</h1>
      <p class="auth-sub">Accede con tu correo y contraseña</p>

      <div class="field">
        <label class="label">Correo</label>
        <input v-model="correo" class="input" type="email" placeholder="tucorreo@ejemplo.com" />
      </div>

      <div class="field" style="position: relative;">
        <label class="label">Contraseña</label>
        <input v-model="password" type="password" class="input" placeholder="••••••••"/>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions" style="justify-content:flex-start">
        <button class="btn btn-primary" :disabled="loading" @click="onLogin">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
        <router-link class="btn btn-ghost" :to="{ name: 'register' }">
          ¿Aún no tienes una cuenta?
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore';
import '@/assets/css/auth.css';

const router = useRouter();
const auth = useAuthStore();

const correo = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onLogin() {
  error.value = '';
  if (!correo.value || !password.value) {
    error.value = 'Completa correo y contraseña';
    return;
  }
  try {
    loading.value = true;
    await auth.login({ correo: correo.value, password: password.value });
    router.push({ name: 'survey-home' });
  } catch (e) {
    error.value = auth.error || 'No se pudo iniciar sesión';
  } finally {
    loading.value = false;
  }
}
</script>