<template>
    <article class="card">
        <div class="card-accent" :style="{ background: accentColor }"></div>
        <div class="card-body">
            <h3 style="margin:0 0 6px;">{{ survey.title }}</h3>
            <p class="muted" style="margin:0;">{{ survey.description }}</p>
            <p class="subtle">{{ formatDate(survey.created_at) }}</p>
        </div>
    </article>
</template>

<script setup>
import { computed } from 'vue';
import {  defineProps } from 'vue';

const props = defineProps({
    survey: {
        type: Object,
        required: true,
    }
});

function formatDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return '' }
}

const accentColor = computed(() =>
    (props.survey.status === 'Cerrado') ? '#ef4444' : 'var(--primary)'
);
</script>