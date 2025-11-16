<template>
  <div class="breadcrumbs">
    <template v-for="(item, index) in items" :key="index">
      <span
        class="breadcrumb-item"
        :class="item.clickable"
        @click="handleClick(item)"
        >{{ item.label }}</span
      >
      <span v-if="index < items.length - 1" class="breadcrumb-separator"
        >/</span
      >
    </template>
  </div>
</template>

<script setup>
    import "@/assets/css/breadcrumbs.css";
    import{defineProps, defineEmits} from 'vue';
    
    defineProps({
        items:{
            type:Array,
            required:true,
            default:()=>[]
        }
    });

    const emit =defineEmits(['navigate']);

    function handleClick(item){
        if(item.clickable){
            emit('navigate', item.key);
        }
    }
</script>
