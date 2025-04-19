<script setup lang="ts">
import { Cog6ToothIcon, ArrowLeftIcon } from "@heroicons/vue/24/solid";

const route = useRoute();
const isHome = ref(false);
const isSettings = ref(false);
const isSpinning = ref(false);

const handleHover = () => {
  isSpinning.value = true;
  setTimeout(() => {
    isSpinning.value = false;
  }, 200);
};

async function goto(location: string) {
  await navigateTo(location);
}

watch(
  route,
  () => {
    isHome.value = route.path === "/";
    isSettings.value = route.path === "/settings";
  },
  { immediate: true }
);
</script>

<template>
  <div class="text-white p-3 flex justify-start items-center">
    <div class="flex items-center w-1/2">
      <!-- <button
        v-if="!isHome"
        @click="goto('/')"
        class="font-mono underline decoration-emerald-600 mx-2"
      >
        <ArrowLeftIcon class="h-6 w-6" />
      </button> -->
      <img
        v-if="!isHome"
        src="../assets/logo.svg"
        class="w-10 mr-3"
        draggable="false"
      />
      <h1 class="font-mono underline decoration-emerald-600">Chef-ferino</h1>
    </div>
    <div class="w-1/2 flex justify-end items-center">
      <button
        v-if="!isHome && !isSettings"
        @click="goto('/settings')"
        class="px-2 py-1 rounded-full"
        @mouseenter="handleHover"
      >
        <Cog6ToothIcon :class="['h-6 w-6', isSpinning ? 'animate-spin' : '']" />
      </button>
    </div>
  </div>
</template>
