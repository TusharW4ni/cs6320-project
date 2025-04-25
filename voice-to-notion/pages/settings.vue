<script setup lang="ts">
const apiKey = ref<string>("");

onMounted(() => {
  const storedApiKey = localStorage.getItem("apiKey");
  if (storedApiKey) {
    apiKey.value = storedApiKey;
  }
});

const handleSubmit = (event: Event) => {
  event.preventDefault(); // Prevent the default form submission behavior
  if (apiKey.value.includes("ntn")) {
    localStorage.setItem("apiKey", apiKey.value);
    useToastify("API key saved successfully");
  } else if (apiKey.value === "") {
    localStorage.removeItem("apiKey");
    useToastify("API key cleared successfully");
  } else {
    localStorage.removeItem("apiKey");
    useToastify("Invalid API key format");
  }
};
</script>

<template>
  <Navbar />
  <div class="w-screen flex flex-col">
    <h1 class="font-gowun font-bold text-2xl m-4">Settings</h1>
    <div class="flex w-screen md:justify-center">
      <div
        class="border border-gray-300 rounded p-4 m-4 w-screen md:w-1/2 flex justify-center"
      >
        <form @submit="handleSubmit" class="w-full flex justify-center">
          <table>
            <tbody>
              <tr>
                <td class="p-2 font-gowun font-bold">API Key</td>
                <td class="p-2 flex items-center">
                  <input
                    v-model="apiKey"
                    type="text"
                    class="border border-gray-300 rounded p-1 w-full"
                    placeholder="Enter your API key"
                  />
                  <router-link
                    to="/help"
                    class="ml-2 text-blue-500 hover:underline"
                    title="How to get your API Key?"
                  >
                    ?
                  </router-link>
                </td>
              </tr>
              <tr>
                <td colspan="2" class="p-2 text-center">
                  <button
                    type="submit"
                    class="border border-black hover:bg-black px-2 py-1 rounded hover:text-white font-gowun font-bold"
                  >
                    Save
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </div>
  </div>
</template>
