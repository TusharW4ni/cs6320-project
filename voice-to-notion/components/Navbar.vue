<template>
  <div
    class="overflow-auto flex justify-between items-center p-3 m-3 rounded border border-black"
  >
    <div class="flex items-center space-x-4">
      <div class="font-gowun font-bold text-xl md:text-2xl">
        Voice-to-Notion
      </div>
    </div>
    <div class="flex items-center space-x-4 mx-3">
      <NuxtLink to="/voice" class="text-gray-500 hover:text-black">
        Voice
      </NuxtLink>
      <NuxtLink to="/files" class="text-gray-500 hover:text-black">
        Files
      </NuxtLink>
      <NuxtLink to="/settings" class="text-gray-500 hover:text-black">
        Settings
      </NuxtLink>
    </div>
  </div>
</template>
