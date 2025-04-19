<script setup lang="ts">
import {
  ArrowRightStartOnRectangleIcon,
  ArrowLeftIcon,
} from "@heroicons/vue/24/solid";

type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  archived: boolean;
};

const currentUser: User = useCookie("currentUser");

const userNameEmpty = ref(false);

async function goto(location: string) {
  if (location.includes("logout")) {
    window.location.href = location;
  } else {
    await navigateTo(location);
  }
}

function handleUserNameEmpty(value: boolean) {
  console.log("userNameEmpty", value);
  userNameEmpty.value = value;
}
</script>

<template>
  <Navbar />
  <div class="flex justify-center text-white">
    <div class="w-1/2">
      <div class="flex justify-between">
        <button
          @click="goto('/new-session')"
          class="flex justify-center items-center rounded-md bg-gray-700 hover:bg-gray-800 py-1 px-2 my-10"
        >
          <ArrowLeftIcon class="w-6 h-6 mx-1" />
          <span class="mx-1 font-bold">Back</span>
        </button>
        <button
          @click="goto('/api/auth0/logout')"
          class="flex justify-center items-center rounded-md bg-red-500 hover:bg-red-700 py-1 px-2 my-10"
        >
          <span><ArrowRightStartOnRectangleIcon class="w-6 h-6 mx-1" /></span>
          <span class="mx-1 font-bold">Logout</span>
        </button>
      </div>

      <h1 class="text-4xl font-mono mb-10 underline decoration-emerald-600">
        Profile
      </h1>
      <SettingsForm
        :currentUser="currentUser"
        @userNameEmpty="handleUserNameEmpty"
      />
    </div>
    <div
      v-if="userNameEmpty"
      class="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div class="bg-gray-900 p-5 rounded-lg">
        <h2 class="text-2xl font-mono mb-5">Please provide your name:</h2>
        <SettingsForm
          :currentUser="currentUser"
          @userNameEmpty="handleUserNameEmpty"
        />
      </div>
    </div>
  </div>
</template>
