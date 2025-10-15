<template>
    <div class="section" style="flex:1 1 220px;">
        <div class="section-title">{{ title }}</div>
        <strong style="font-size:20px;">{{ value }}</strong>
    </div>
</template>

<script setup>
import {  defineProps } from 'vue';
defineProps({
    title: { type: String, required: true },
    value: { type: [Number, String], default: 0 },
});
</script>