<script setup lang="ts">
const route = useRoute();
const sessionId = route.params.sessionId;

const { data } = await useFetch(`/api/session/get/${sessionId}`);

console.log({ session: data.value.session });
//console.log({ length: data.value?.session.Messages.length });
console.log({ ingredients: data?.value?.session?.Recipe.Ingredients });
console.log({ ingredients: data?.value?.session?.Recipe.Ingredients.length });
</script>

<template>
  <Navbar />
  <div></div>
  <div v-if="data?.session?.Recipe?.Ingredients?.length > 0" class="text-white">
    <div class="w-full h-[calc(100vh-4rem)] flex justify-center items-center">
      <div>
        <ul>
          <li
            v-for="ingredient in data.session.Recipe.Ingredients"
            :key="ingredient.id"
            class="flex items-center"
          >
            <input type="checkbox" class="mr-2" />
            <div>{{ ingredient.text }}</div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div v-else class="text-white">
    <div class="w-full h-[calc(100vh-4rem)] flex justify-center items-center">
      <div>No ingredients found for this recipe.</div>
    </div>
  </div>
</template>
