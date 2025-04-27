<script setup lang="ts">
// import ILovePDFApi from "@ilovepdf/ilovepdf-nodejs";

// const ilovepdf = new ILovePDFApi();

const files = ref<File[]>([]);
// const config = useRuntimeConfig();

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    files.value.push(...Array.from(input.files));
    console.log("Files uploaded:", files.value);
  }
}

function removeFile(index: number) {
  files.value.splice(index, 1);
}

function uploadFiles() {
  if (files.value.length === 0) {
    console.error("No files to upload");
    return;
  }

  const formData = new FormData();
  files.value.forEach((file) => {
    formData.append("file", file); // Update field name to 'file'
  });

  $fetch("/api/gemini/process-files", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      console.log("Files uploaded successfully:", response);
      files.value = []; // Clear the files after successful upload
    })
    .catch((error) => {
      console.error("Error uploading files:", error);
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
      @click="uploadFiles"
      class="mt-4 w-2/3 md:w-1/2 border border-black rounded hover:bg-black hover:text-white font-gowun font-bold"
    >
      Upload
    </button>
  </div>
</template>
