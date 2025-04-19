<script setup lang="ts">
try {
  const user = useCookie("currentUser");
  if (user) {
    navigateTo("/new-session");
  }
} catch (e) {
  console.error("Error in index.vue:", e);
}
</script>
<template>
  <Navbar />
</template>
