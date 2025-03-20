<script setup lang="ts">
const url = ref("");
const html = ref({});
const res = ref({});

async function getHTML(url: string) {
  try {
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
  } catch (e) {
    console.log("error fetching html");
  }
}
</script>

<template>
  <div
    class="w-screen h-screen flex flex-col justify-center items-center bg-black text-white"
  >
    <h1 class="text-4xl font-mono mb-10 underline decoration-emerald-600">
      Chef-ferino
    </h1>
    <div>
      <h2 class="text-2xl font-mono mb-5">Recipe URL</h2>
      <form @submit.prevent="getHTML(url)">
        <input
          v-model="url"
          class="text-black font-semibold w-[calc(50vw)] outline-none px-6 py-2 rounded-full border-4 border-white focus:border-emerald-600"
        />
      </form>
    </div>
  </div>
</template>
