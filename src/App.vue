<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// FIX: Emergency Clear of Corrupted State
try {
  localStorage.removeItem('tokanA_filter_form_data')
  console.log('Fixed: Cleared corrupted local storage state.')
} catch(e) {}
</script>

<style scoped>
#app { min-height: 100vh; background: var(--color-bg-1, #232324); }
</style>
