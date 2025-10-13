<template>
  <section class="card auth-wrap">
    <div class="card-body">
      <h1 class="title auth-title">Crear cuenta</h1>
      <p class="auth-sub">Regístrate para empezar a usar SurveyPro</p>

      <div class="field">
        <label class="label">Nombre</label>
        <input v-model.trim="nombre" class="input" type="text" placeholder="Tu nombre" />
      </div>

      <div class="field">
        <label class="label">Apellido</label>
        <input v-model.trim="apellido" class="input" type="text" placeholder="Tu apellido" />
      </div>

      <div class="field">
        <label class="label">Correo</label>
        <input v-model.trim="correo" class="input" type="email" placeholder="tucorreo@ejemplo.com" />
      </div>

      <div class="field">
        <label class="label">Contraseña</label>
        <input v-model="password" class="input" type="password" placeholder="••••••••" />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions" style="justify-content:flex-start">
        <button class="btn btn-primary" :disabled="loading" @click="onRegister">
          {{ loading ? 'Creando...' : 'Registrarme' }}
        </button>
        <router-link class="btn btn-ghost" :to="{ name: 'login' }">
          ¿Ya tienes cuenta? Inicia sesión
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

const nombre = ref('');
const apellido = ref('');
const correo = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function onRegister() {
  error.value = '';

  if (!nombre.value || !correo.value || !password.value) {
    error.value = 'Nombre, correo y contraseña son obligatorios';
    return;
  }
  if (!validEmail(correo.value)) {
    error.value = 'Correo inválido';
    return;
  }
  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres';
    return;
  }

  try {
    loading.value = true;
    await auth.register({
      nombre: nombre.value,
      apellido: apellido.value,
      correo: correo.value,
      password: password.value,
    });

    // Registro OK → enviamos al login
    alert('Cuenta creada. Ahora inicia sesión.');
    router.push({ name: 'login' });
  } catch (e) {
    error.value = auth.error || 'No se pudo registrar';
  } finally {
    loading.value = false;
  }
}
</script>