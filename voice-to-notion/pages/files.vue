<script setup lang="ts">
const files = ref<File[]>([]);
const uploading = ref(false);
const extracting = ref(false);
const summaries = ref<Record<string, any>>({});
const ntnApiKey = ref<string | null>(null);
const parentPageId = ref<string | null>(null);

onMounted(async () => {
  ntnApiKey.value = localStorage.getItem("apiKey");
  const parentPageTitle = localStorage.getItem("parentPageTitle");
  try {
    const res = await $fetch("/api/ntn/pages/get", {
      method: "POST",
      body: {
        apiKey: ntnApiKey.value,
      },
    });
    res.forEach((page: any) => {
      if (page.properties.title?.title[0].text.content === parentPageTitle) {
        parentPageId.value = page.id;
      }
    });
  } catch (error) {
    console.error("Error fetching Notion pages:", error);
  }
});

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

  uploading.value = true; // Start the uploading phase
  const formData = new FormData();
  files.value.forEach((file) => {
    formData.append("file", file);
  });

  try {
    const uploadResponse = await $fetch("/api/gemini/process-files/upload", {
      method: "POST",
      body: formData,
    });
    console.log("Files uploaded successfully:", uploadResponse);

    uploading.value = false; // End the uploading phase
    extracting.value = true; // Start the extracting phase

    const extractResponse = await $fetch("/api/gemini/process-files/extract", {
      method: "POST",
      body: { paths: uploadResponse.paths },
    });
    console.log("Files extracted successfully:", extractResponse);
    summaries.value = extractResponse.summaries;
    useToastify("Files extracted successfully");
    let dbId;
    const queryNtnDB = await $fetch("/api/ntn/database/get", {
      method: "POST",
      body: {
        apiKey: ntnApiKey.value,
        query: "courses",
      },
    }).then((res) => {
      // console.log({ res: res.results[0].id });
      // if (res.results.length === 0) {
      //   return;
      // }
      dbId = res.results[0]?.id;
    });

    // const dbId = queryNtnDB[0].id;

    if (!dbId) {
      try {
        const res = await $fetch("/api/ntn/database/post/courses", {
          method: "POST",
          body: {
            apiKey: ntnApiKey.value,
            parentPageId: parentPageId.value,
          },
        });
        console.log("Courses database created successfully:", res);
      } catch (e) {
        console.error("Error creating courses database:", e);
      }
    } else {
      console.log("Courses database already exists:", dbId);
    }

    files.value = [];
  } catch (error) {
    console.error("Error during upload or extraction:", error);
    useToastify("An error occurred during upload or extraction");
  } finally {
    uploading.value = false;
    extracting.value = false;
  }
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
      :disabled="uploading || extracting"
      class="mt-4 w-2/3 md:w-1/2 border border-black rounded hover:bg-black hover:text-white font-gowun font-bold"
    >
      <span v-if="!uploading && !extracting">Upload</span>
      <span v-if="uploading && !extracting">Uploading...</span>
      <span v-if="!uploading && extracting">Extracting...</span>
    </button>
    <div v-if="Object.keys(summaries).length > 0" class="mt-4 w-2/3 md:w-1/2">
      <h2 class="font-bold text-lg mb-2">Summaries</h2>
      <ul>
        <li
          v-for="(summary, fileName) in summaries"
          :key="fileName"
          class="border border-black rounded p-2 mb-2 bg-gray-100"
        >
          <h3 class="font-bold">{{ fileName }}</h3>
          <pre class="text-sm whitespace-pre-wrap">{{ summary }}</pre>
        </li>
      </ul>
    </div>
  </div>
</template>
