<script setup lang="ts">
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/vue/24/solid";

const props = defineProps<{
  id: string;
}>();

const { data, error } = await useFetch(`/api/session/get/${props.id}`);
console.log({ data: data.value }); // Log the resolved value of data
const sidebarVisible = ref(false);

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};
</script>

<template>
  <div
    class="text-white h-[calc(100vh-4rem)] border-2 mx-2 rounded-lg flex justify-center items-center"
  >
    <!-- Button to open the sidebar -->
    <button
      v-if="!sidebarVisible"
      @click="toggleSidebar"
      class="hover:bg-gray-800 h-full rounded-lg flex justify-center items-center"
    >
      <ChevronRightIcon class="w-6 h-6" />
    </button>

    <!-- Sidebar -->
    <div
      v-if="sidebarVisible"
      class="flex rounded-lg h-full text-white shadow-lg transition-transform duration-300 ease-in-out"
    >
      <!-- Loading State -->
      <!-- <div v-if="pending" class="p-4">
        <h2 class="text-2xl font-bold mb-4">Loading...</h2>
      </div> -->

      <!-- Error State -->
      <!-- <div v-else-if="error" class="p-4">
        <h2 class="text-2xl font-bold mb-4">Error</h2>
        <p>{{ error.message }}</p>
      </div> -->

      <!-- Check if data is empty -->
      <div v-if="!data.value || data.value.length === 0" class="p-4">
        <h2 class="text-2xl font-bold mb-4">Cooking Sessions</h2>
        <p>No sessions yet!</p>
      </div>

      <!-- Render sessions if data exists -->
      <div v-else class="p-4">
        <h2 class="text-2xl font-bold mb-4">Cooking Sessions</h2>
        <div v-for="session in data.value" :key="session.id" class="mb-4">
          <button
            class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg w-full text-left"
          >
            <p class="font-semibold">{{ session.Recipe.title }}</p>
          </button>
        </div>
      </div>

      <!-- Button to close the sidebar -->
      <button
        v-if="sidebarVisible"
        @click="toggleSidebar"
        class="hover:bg-gray-800 h-full rounded-lg flex justify-center items-center hover:border"
      >
        <ChevronLeftIcon class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>
