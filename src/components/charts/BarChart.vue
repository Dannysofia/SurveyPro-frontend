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

onMounted(() => { render(); });
onBeforeUnmount(() => { if (chart) { chart.destroy(); chart = null; } });
watch(() => [props.labels, props.values], () => { render(); });

function render() {
  const ctx = el.value?.getContext('2d');
  if (!ctx) return;
  if (chart) { chart.destroy(); chart = null; }
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [{
        label: '%',
        data: props.values,
        backgroundColor: '#2563eb'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}
</script>

<style scoped>
div { min-height: 220px; }
</style>

