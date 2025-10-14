<template>
    <section class="home-hero">
        <h2 class="home-title">Crea, comparte y analiza encuestas en minutos</h2>
        <p class="home-sub">
            Bienvenido a SurveyPro. Diseña formularios con preguntas abiertas o de opción múltiple, comparte enlaces y
            revisa resultados en tiempo real.
        </p>

        <div class="home-cta">
            <router-link class="btn btn-primary" :to="{ name: 'login' }">Iniciar sesión</router-link>
            <router-link class="btn btn-ghost" :to="{ name: 'register' }">¿Aún no tienes una cuenta?</router-link>
        </div>

        <div class="home-features">
            <article class="feature">
                <h4>Editor intuitivo</h4>
                <p>Arrastra, ordena y personaliza preguntas fácilmente.</p>
            </article>
            <article class="feature">
                <h4>Resultados claros</h4>
                <p>Visualiza respuestas y exporta cuando lo necesites.</p>
            </article>
            <article class="feature">
                <h4>Compartir en un clic</h4>
                <p>Comparte enlaces públicos o privados con tu equipo.</p>
            </article>
        </div>
    </section>
</template>

<script setup>
import '@/assets/css/home.css'; // estilos específicos del home
</script>