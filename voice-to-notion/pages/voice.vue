<script setup lang="ts">
const apiKey = ref<string>("");
const parentPageTitle = ref<string>("");
const mediaRecorder = ref<MediaRecorder | null>(null);
const chunks = ref<Blob[]>([]);
const audio = ref<HTMLAudioElement | null>(null);
const audioFile = ref<File | null>(null);
const mediaStream = ref<MediaStream | null>(null);
const isRecording = ref(false);
const user = ref<any>(null);
const avatar_url = ref<string>("");
const textPrompt = ref<string>("");

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
        console.log("Audio data available:", event.data);
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
    const res = await $fetch("/api/gemini/process-audio", {
      method: "POST",
      body: formData,
    });
    console.log("res", res);
    // transcription.value = res.transcript;
    useToastify("Audio processing successful");
  } catch (err) {
    console.error("err", err);
    useToastify("Audio processing failed");
  }
}

function handleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
}

async function sendTextPrompt() {
  if (!textPrompt.value.trim()) {
    useToastify("Text prompt cannot be empty");
    return;
  }

  try {
    const res = await $fetch("/api/gemini/process-text", {
      method: "POST",
      body: {
        textPrompt: textPrompt.value,
        ntnApiKey: apiKey.value,
        parentPageTitle: parentPageTitle.value,
      },
    });
    console.log("Text prompt response:", res);
    useToastify("Text prompt processed successfully");
  } catch (err) {
    console.error("Error processing text prompt:", err);
    useToastify("Failed to process text prompt");
  } finally {
    // Clear the text input after sending
    textPrompt.value = "";
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === "Enter") {
    sendTextPrompt();
  }
}
</script>

<template>
  <Navbar />
  <div
    class="flex flex-col items-center justify-center w-full h-[calc(100vh-10rem)] md:h-[calc(100vh-5rem)] relative"
  >
    <!-- Existing voice recording button -->
    <button
      @click="handleRecording"
      class="relative flex items-center justify-center ripple-container"
      :class="{ recording: isRecording }"
    >
      <img
        v-if="avatar_url"
        :src="avatar_url"
        alt="User Profile Picture"
        class="w-36 md:w-80 rounded-full border-4 border-gray-300"
      />
      <div
        v-if="!avatar_url"
        class="w-36 md:w-80 h-36 md:h-80 rounded-full border-4 border-gray-300 flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="{1.5}"
          stroke="currentColor"
          class="size-24 text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </div>
    </button>

    <!-- New text prompt input -->
    <div class="mt-24 w-full max-w-md">
      <div class="flex shadow-sm rounded-md overflow-hidden">
        <!-- Text input grows to fill -->
        <input
          v-model="textPrompt"
          @keydown="handleKeyPress"
          type="text"
          placeholder="Enter your text prompt"
          class="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <!-- Arrow button -->
        <button
          @click="sendTextPrompt"
          class="flex-none bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 px-4 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<!-- This has been implemented in css only for the animation. all other stylings should be done using tailwindcss. -->
<style scoped>
.ripple-container {
  position: relative;
  width: 10rem;
  height: 10rem;
  border-radius: 50%;
  overflow: visible;
}

.ripple-container::before,
.ripple-container::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(1);
  opacity: 0;
  pointer-events: none;
}

.ripple-container.recording::before,
.ripple-container.recording::after {
  border: 3px solid rgba(255, 0, 0, 0.5);
  animation: ripple 1s infinite;
}

.ripple-container::before,
.ripple-container::after {
  border: 3px solid rgba(0, 0, 255, 0.5);
  animation: ripple 1s infinite;
}

.ripple-container::after {
  animation-delay: 1s;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}
</style>
