<script setup lang="ts">
const { notify } = useToast();

const props = defineProps<{
  currentUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    archived: boolean;
  };
}>();

const emits = defineEmits<{
  (e: "userNameEmpty", value: boolean): void;
}>();

let user: any;

// if (props.currentUser) {
user = ref({
  firstName: props.currentUser?.firstName || "",
  lastName: props.currentUser?.lastName || "",
});
// }

onMounted(() => {
  emits("userNameEmpty", props.currentUser?.firstName === null);
});

async function onSave() {
  if (!user.value.firstName || !user.value.lastName) {
    // notify("Please provide your name", "error");
    console.log("Please provide your name");
    return;
  }
  await $fetch("/api/putSettings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      id: props.currentUser.id,
      firstName: user.value.firstName,
      lastName: user.value.lastName,
    },
  }).then(() => {
    window.location.reload();
  });
}
</script>

<template>
  <form @submit.prevent="onSave" class="flex flex-col items-center">
    <div class="w-full grid grid-cols-2 items-center gap-4 mb-5">
      <label class="text-2xl flex justify-center">First Name</label>
      <input
        v-model="user.firstName"
        class="text-black font-semibold outline-none px-6 py-1 rounded-full border-2 border-white focus:border-emerald-600"
      />
      <label class="text-2xl flex justify-center">Last Name</label>
      <input
        v-model="user.lastName"
        class="text-black font-semibold outline-none px-6 py-1 rounded-full border-2 border-white focus:border-emerald-600"
      />
    </div>
    <button class="bg-green-500 rounded-md w-1/6 m-3 py-1">Save</button>
  </form>
</template>
