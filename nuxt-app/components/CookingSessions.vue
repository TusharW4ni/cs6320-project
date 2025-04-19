<script setup lang="ts">
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/vue/24/solid";
const { id } = defineProps<{
  id: number;
}>();
// console.log({ csID: id });

type Session = {
  id: string;
  Recipe: {
    title: string;
  };
};

const { data, pending } = await useFetch<Session[]>(`/api/session/get/${id}`);
const myArray = computed(() => data.value);
//print each session in myArray
// console.log("myArray", myArray.value.sessions[0].Recipe);
// if (myArray.value) {
//   myArray.value.sessions.forEach((session) => {
//     console.log("session", session);
//     console.log("session recipe", session.Recipe);
//     console.log(
//       `Session ID: ${session.id}, Recipe Title: ${session.Recipe.title}`
//     );
//   });
// }
const sidebarVisible = ref(false);

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

async function goto(path: string) {
  await navigateTo(path);
}
</script>

<template>
  <div
    class="flex text-white h-[calc(100vh-4rem)] border-2 mx-2 rounded-lg"
    :class="{
      'w-1/4': sidebarVisible,
    }"
  >
    <button
      v-if="!sidebarVisible"
      @click="toggleSidebar"
      class="hover:bg-gray-800 h-full rounded-lg"
    >
      <ChevronRightIcon class="w-6 h-6" />
    </button>
    <div v-if="sidebarVisible" class="flex rounded-lg h-full text-white w-full">
      <div v-if="!myArray" class="p-4">
        <h2 class="text-2xl font-bold mb-4">Cooking Sessions</h2>
        <p>No sessions yet!</p>
      </div>
      <div v-else class="p-4 w-full">
        <h2 class="text-2xl font-bold mb-4">Cooking Sessions</h2>
        <div v-for="session in myArray.sessions" :key="session.id" class="mb-4">
          <button
            @click="goto(`/${session.id}`)"
            class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg w-full text-left"
          >
            <p class="font-semibold">{{ session.Recipe.title }}</p>
          </button>
        </div>
      </div>
    </div>
    <button
      v-if="sidebarVisible"
      @click="toggleSidebar"
      class="border border-black hover:border hover:bg-gray-800 hover:border-white h-full rounded-lg"
    >
      <ChevronLeftIcon class="w-6 h-6" />
    </button>
  </div>
</template>
