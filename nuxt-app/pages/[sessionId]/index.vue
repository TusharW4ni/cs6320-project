<script setup lang="ts">
const route = useRoute();
const sessionId = route.params.sessionId;

const { data } = await useFetch(`/api/session/get/${sessionId}`);

console.log({ session: data.value.session });
console.log({ length: data.value?.session.Messages.length });
</script>
<template>
  <Navbar />
  <!-- Messages -->
  <div></div>
  <!-- Substitutions -->
  <div v-if="!data.value?.session.Messages" class="text-white">
    <div class="w-full h-[calc(100vh-4rem)] flex justify-center items-center">
      <div>
        <ul>
          <input type="checkbox" />
          <div>afa</div>
          <div>asdfasd</div>
        </ul>
      </div>
    </div>
  </div>
</template>
