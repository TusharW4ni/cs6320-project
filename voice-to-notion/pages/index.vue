<script setup lang="ts">
const apiKey = ref<string>("");
const parentPageTitle = ref<string>("");
const mediaRecorder = ref<MediaRecorder | null>(null);
const chunks = ref<Blob[]>([]);
const audio = ref<HTMLAudioElement | null>(null);
const audioFile = ref<File | null>(null);
const mediaStream = ref<MediaStream | null>(null);
const isRecording = ref(false);
const transcription = ref<string>("");
const user = ref<any>(null);
const avatar_url = ref<string>("");

onMounted(async () => {
  apiKey.value = localStorage.getItem("apiKey") || "";
  parentPageTitle.value = localStorage.getItem("parentPageTitle") || "";
  if (apiKey.value) {
    try {
      const res = await $fetch(`/api/ntn/user/get/${apiKey.value}`);
      user.value = res;
      avatar_url.value = user.value.avatar_url || "";
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  } else {
    console.error("API key is missing");
  }
});

function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log("getUserMedia is not supported on your browser!");
    return;
  }

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
    })
    .then((stream) => {
      mediaStream.value = stream;
      mediaRecorder.value = new MediaRecorder(stream);
      chunks.value = [];
      mediaRecorder.value.start();
      isRecording.value = true;
      console.log("Recording started");

      mediaRecorder.value.ondataavailable = (event) => {
        chunks.value.push(event.data);
      };
    })
    .catch((err) => {
      console.error(
        "The following getUserMedia error occurred: " + err.name,
        err
      );
    });
}

function stopRecording() {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
    console.log("Recording stopped");

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(chunks.value, { type: "audio/wav" });
      const audioFileName = `audio-${Date.now()}.wav`;
      audioFile.value = new File([blob], audioFileName, { type: "audio/wav" }); // Create the File here
      const url = URL.createObjectURL(blob);
      audio.value = new Audio(url);

      console.log("Audio file created, sending to server...");
      sendToServer(audioFile.value);
    };

    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach((track) => track.stop());
      console.log("Microphone capture stopped");
    }
  } else {
    console.error("MediaRecorder is not initialized");
  }
}

async function sendToServer(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ntnApiKey", apiKey.value);
  formData.append("parentPageTitle", parentPageTitle.value);
  try {
    const res = await $fetch("/api/dispatcher", {
      method: "POST",
      body: formData,
    });
    console.log("res", res);
    // transcription.value = res.transcript;
    useToastify("Audio transcription successful");
  } catch (err) {
    console.error("err", err);
    useToastify("Audio transcription failed");
  }
}
</script>

<template>
  <Navbar />
  <div class="flex w-full justify-center items-center">
    <img :src="avatar_url" alt="User Profile Picture" class="w-46 md:w-80" />
  </div>
  <div
    class="flex flex-col items-center justify-center space-y-4 p-6 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-sm"
  >
    <button
      @click="startRecording"
      :disabled="isRecording"
      class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md border border-gray-400 transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      {{ isRecording ? "Recording..." : "Start Recording" }}
    </button>
    <button
      @click="stopRecording"
      :disabled="!isRecording"
      class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md border border-gray-400 transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      Stop Recording
    </button>
    <div v-if="transcription" class="mt-4 text-gray-700">
      <h3 class="text-lg font-semibold">Transcription:</h3>
      <p class="mt-2">{{ transcription }}</p>
    </div>
    <!-- <audio
      v-if="audio"
      :src="audio.src"
      controls
      class="w-full max-w-md mt-4 border border-gray-300 rounded-md"
    ></audio> -->
  </div>
</template>
