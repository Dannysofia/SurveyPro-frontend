<template>
  <div style="position:relative; width:100%; height:100%;">
    <canvas ref="el"></canvas>
  </div>
  
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { Chart } from 'chart.js/auto';

const props = defineProps({
  labels: { type: Array, default: () => [] },
  values: { type: Array, default: () => [] },
});

const el = ref(null);
let chart = null;

onMounted(() => {
  render();
});

onBeforeUnmount(() => {
  if (chart) { chart.destroy(); chart = null; }
});

watch(() => [props.labels, props.values], () => {
  render();
});

function render() {
  const ctx = el.value?.getContext('2d');
  if (!ctx) return;
  if (chart) { chart.destroy(); chart = null; }
  const colors = generateColors(props.labels.length);
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: props.labels,
      datasets: [{
        label: '%',
        data: props.values,
        backgroundColor: colors,
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function generateColors(n) {
  const base = [
    '#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6',
    '#8b5cf6', '#f472b6', '#06b6d4', '#84cc16', '#e11d48'
  ];
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(base[i % base.length]);
  return arr;
}
</script>

<style scoped>
div { min-height: 220px; }
</style>

