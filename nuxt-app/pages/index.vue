<script setup lang="ts">
import {
  CogIcon,
  MagnifyingGlassCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/vue/24/solid";
import CookingSessions from "~/components/CookingSessions.vue";

interface CurrentUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  archived: boolean;
}

const currentUser = useCookie<CurrentUser>("currentUser");
// console.log({ currentUser: currentUser.value.id });
const cuId = currentUser.value.id;

const url = ref("");
const html = ref({});
const res = ref({});
const loading = ref(false);
const divHovered = ref(false);

async function getHTML(url: string) {
  if (!url) return;
  try {
    loading.value = true;
    html.value = await $fetch(`/api/fetchHtml?url=${url}`);
    console.log({ html });
    res.value = await $fetch(`/api/fetchInitialContext`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html: html.value }),
    });
    console.log({ res });
    loading.value = false;
  } catch (e) {
    console.log("error fetching html");
    loading.value = false;
  }
}
</script>

<template>
  <Navbar />
  <div class="flex h-[calc(100vh-4rem)]">
    <CookingSessions :id="cuId" />
    <div
      class="overflow-hidden flex justify-center items-center text-white border-2 rounded-lg w-full h-[calc(100vh-4rem)]"
    >
      <div class="flex flex-col w-full md:w-1/2">
        <!-- <div class=""> -->
        <h2
          class="text-2xl font-mono tracking-widest mb-5 text-center font-bold"
        >
          <em> Whatcha Cookin'? </em>
        </h2>
        <form @submit.prevent="getHTML(url)">
          <div class="flex items-center space-x-4">
            <input
              v-model="url"
              placeholder="Enter Recipe URL"
              class="text-black font-semibold w-full outline-none px-6 py-2 rounded-full border-4 border-white focus:border-emerald-600"
            />
            <button
              v-if="!loading"
              type="submit"
              class="bg-emerald-600 text-white px-4 py-2 border-4 border-emerald-600 rounded-full bg-emerald-600"
            >
              <MagnifyingGlassCircleIcon class="h-6 w-6" />
            </button>
            <div
              v-if="loading"
              type="submit"
              class="bg-emerald-600 text-white px-4 py-2 border-4 border-emerald-600 rounded-full bg-emerald-600"
            >
              <CogIcon class="h-6 w-6 animate-spin" />
            </div>
          </div>
        </form>
        <!-- </div> -->
      </div>
      <!-- <div v-if="Object.keys(res).length !== 0" class="w-full md:w-1/2">
      <h2 class="text-2xl font-mono mb-5 mt-5">Ingredients</h2>
      <ul class="space-y-4">
        <li
          v-for="(ingredient, index) in res.ingredients"
          :key="index"
          class="flex items-center space-x-3"
        >
          <input
            type="checkbox"
            class="h-5 w-5 text-emerald-600 border-gray-300 rounded accent-green-600"
          />
          <label class="text-lg font-semibold">{{ ingredient }}</label>
        </li>
      </ul>
    </div> -->
    </div>
  </div>
</template>
