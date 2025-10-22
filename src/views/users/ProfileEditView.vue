<!-- src/views/users/ProfileEditView.vue -->
<template>
    <section>
        <!-- Aviso temporal -->
        <div v-if="toast.show" class="card" style="border-color:#bbf7d0;background:#f0fdf4;margin-bottom:12px;">
            <div class="card-body" style="color:#166534;padding:10px;">
                {{ toast.message }}
            </div>
        </div>

        <!-- Encabezado -->
        <div class="list-header">
            <h1 style="margin:0;">Editar perfil</h1>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-ghost" @click="goBack">Cancelar</button>
                <button class="btn btn-primary" :disabled="saving || loading" @click="onSave">
                    {{ saving ? 'Guardando…' : 'Guardar cambios' }}
                </button>
            </div>
        </div>

        <!-- Formulario -->
        <div class="card">
            <div class="card-body">
                <div v-if="loading">Cargando…</div>

                <div v-else>
                    <div class="form-grid">
                        <div class="form-col">
                            <label class="label">Nombre *</label>
                            <input class="input" v-model.trim="form.name" type="text" />

                            <label class="label">Apellido</label>
                            <input class="input" v-model.trim="form.last_name" type="text" />

                            <label class="label">Correo *</label>
                            <input class="input" v-model.trim="form.email" type="email" />
                        </div>
                    </div>

                    <p v-if="error" class="error mt-6">{{ error }}</p>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import '@/assets/css/surveys.css';

const router = useRouter();
const profileStore = useProfileStore();
const auth = useAuthStore();

const loading = computed(() => profileStore.loading);
const error = computed(() => profileStore.error);

const form = reactive({
    name: '',
    last_name: '',
    email: '',
});
const saving = ref(false);

const toast = reactive({
    show: false,
    message: '',
    timer: null,
});

function showToast(msg, ms = 2500) {
    toast.message = msg;
    toast.show = true;
    if (toast.timer) clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        toast.show = false;
        toast.timer = null;
    }, ms);
}

onMounted(async () => {
    try {
        if (!profileStore.profile) {
            await profileStore.fetchProfile();
        }
        if (profileStore.profile) {
            form.name = profileStore.profile.name || '';
            form.last_name = profileStore.profile.last_name || '';
            form.email = profileStore.profile.email || '';
        }
    } catch (e) {
        console.error('Error cargando perfil:', e);
    }
});

function goBack() {
    router.push({ name: 'profile' });
}

function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}

async function onSave() {
    if (!form.name || !form.email) {
        return (profileStore.error = 'Nombre y correo son obligatorios');
    }
    if (!validEmail(form.email)) {
        return (profileStore.error = 'Correo inválido');
    }

    try {
        saving.value = true;

        const updated = await profileStore.updateProfile({
            name: form.name,
            last_name: form.last_name || null,
            email: String(form.email).toLowerCase(),
        });

        if (auth.user && updated) {
            auth.user = {
                ...auth.user,
                name: updated.name,
                last_name: updated.last_name,
                email: updated.email,
            };
        }

        showToast('Perfil actualizado');
        setTimeout(() => router.push({ name: 'profile' }), 1000);
    } catch (e) {
        console.error('Error al actualizar perfil:', e);
    } finally {
        saving.value = false;
    }
}
</script>