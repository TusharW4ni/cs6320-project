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
</script>

<template>
  <Navbar />
  <div
    class="flex flex-col items-center justify-center w-full h-[calc(100vh-15rem)] md:h-[calc(100vh-10rem)] relative"
  >
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
        v-else
        class="w-36 h-36 rounded-full border-4 border-gray-300 flex items-center justify-center"
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
