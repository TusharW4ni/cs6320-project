<script setup lang="ts">
import { Cog6ToothIcon, ArrowLeftIcon } from "@heroicons/vue/24/solid";

const route = useRoute();
const isHome = ref(false);
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
  },
  { immediate: true }
);
</script>

<template>
  <div class="text-white w-screen p-3 flex">
    <div class="w-1/2">
      <button
        v-if="!isHome"
        @click="goto('/')"
        class="font-mono underline decoration-emerald-600"
      >
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
    </div>
    <div class="w-1/2 flex justify-end">
      <button
        @click="goto('/settings')"
        class="px-2 py-1 rounded-full"
        @mouseenter="handleHover"
      >
        <Cog6ToothIcon :class="['h-6 w-6', isSpinning ? 'animate-spin' : '']" />
      </button>
    </div>
  </div>
</template>
