<template>
  <div
    class="flex justify-between items-center p-3 m-3 rounded border border-black"
  >
    <div class="flex items-center space-x-4">
      <div class="font-gowun font-bold text-2xl">Geminify</div>
      <!-- <div class="text-gray-500">v1.0.0</div> -->
    </div>
    <div class="flex items-center space-x-4">
      <NuxtLink to="/" class="text-gray-500 hover:text-black">Home</NuxtLink>
      <NuxtLink to="/settings" class="text-gray-500 hover:text-black"
        >Settings</NuxtLink
      >
    </div>
  </div>
</template>
