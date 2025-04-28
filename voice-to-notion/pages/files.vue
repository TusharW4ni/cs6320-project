<script setup lang="ts">
const files = ref<File[]>([]);
const uploading = ref(false);

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    files.value.push(...Array.from(input.files));
    console.log("Files uploaded:", files.value);
  }
  input.value = "";
}

function removeFile(index: number) {
  files.value.splice(index, 1);
}

async function uploadFiles() {
  if (files.value.length === 0) {
    console.error("No files to upload");
    return;
  }

  uploading.value = true;
  const formData = new FormData();
  files.value.forEach((file) => {
    formData.append("file", file);
  });

  await $fetch("/api/gemini/process-files/upload", {
    method: "POST",
    body: formData,
  })
    .then(async (response) => {
      console.log("Files uploaded successfully:", response);
      // files.value = [];
      const extractRes = await $fetch("/api/gemini/process-files/extract", {
        method: "POST",
        body: { paths: response.paths },
      })
        .then((response) => {
          console.log("Files extracted successfully:", response);
          useToastify("Files extracted successfully"); // Correctly closed
          files.value = [];
          uploading.value = false;
        })
        .catch((error) => {
          console.error("Error extracting files:", error);
          useToastify("Error extracting files"); // Correctly closed
          files.value = [];
          uploading.value = false;
        });
    })
    .catch((error) => {
      console.error("Error uploading files:", error);
      uploading.value = false;
      useToastify("Error uploading files");
    })
    .finally(() => {
      uploading.value = false;
      useToastify("Files uploaded successfully");
    });
}
</script>

<template>
  <Navbar />
  <div class="flex flex-col w-full items-center">
    <label
      class="flex w-2/3 md:w-1/2 justify-center border border-black rounded hover:cursor-pointer hover:bg-gray-100 focus:bg-black focus:text-white"
    >
      <span class="font-bold">+</span>
      <input
        type="file"
        accept=".doc, .docx, .pdf"
        multiple
        class="hidden"
        @change="handleFileUpload"
      />
    </label>
    <div
      v-if="files.length > 0"
      class="mt-4 w-2/3 md:w-1/2 h-[calc(100vh-70vh)] overflow-y-auto border border-black rounded bg-gray-300"
    >
      <ul>
        <li
          v-for="(file, index) in files"
          :key="file.name"
          class="flex justify-between items-center border border-black px-2 py-1 rounded m-1 bg-white"
        >
          <span class="truncate font-gowun font-bold">{{ file.name }}</span>
          <button
            class="text-red-500 font-bold ml-2 hover:text-red-700 bg-white"
            @click="removeFile(index)"
          >
            x
          </button>
        </li>
      </ul>
    </div>
    <button
      v-if="files.length > 0"
      @click.prevent="uploadFiles"
      :disabled="uploading"
      class="mt-4 w-2/3 md:w-1/2 border border-black rounded hover:bg-black hover:text-white font-gowun font-bold"
    >
      <span v-if="!uploading">Upload</span>
      <span v-else>Uploading...</span>
    </button>
  </div>
</template>
