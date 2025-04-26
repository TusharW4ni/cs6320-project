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
    useToastify("Audio processing successful");
  } catch (err) {
    console.error("err", err);
    useToastify("Audio processing failed");
  }
}
</script>

<template>
  <Navbar />
  <div
    class="flex flex-col items-center justify-center w-full h-[calc(100vh-10rem)] md:h-[calc(100vh-5rem)] relative"
    :class="{ recording: isRecording }"
  >
    <div
      class="relative flex items-center justify-center cursor-pointer"
      @mousedown="startRecording"
      @mouseup="stopRecording"
      @mouseleave="isRecording && stopRecording()"
      @touchstart.prevent="startRecording"
      @touchend.prevent="stopRecording"
    >
      <img
        :src="avatar_url"
        alt="User Profile Picture"
        class="w-36 md:w-80 rounded-full border-4 border-gray-300"
      />
      <div
        v-if="isRecording"
        class="absolute inset-0 rounded-full border-4 border-blue-500 animate-glow"
      ></div>
      <div
        v-else
        class="absolute inset-0 rounded-full border-4 border-blue-500 animate-ripple"
      ></div>
    </div>
    <div
      v-if="isRecording"
      class="absolute inset-0 border-4 border-blue-500 animate-screen-glow pointer-events-none"
    ></div>
  </div>
</template>

<style scoped>
/* Intense glowing effect for the image */
@keyframes glow {
  0% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.7);
  }
  50% {
    box-shadow: 0 0 40px rgba(59, 130, 246, 1);
  }
  100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.7);
  }
}

.animate-glow {
  animation: glow 1.2s infinite;
}

/* Ripple effect for the image */
@keyframes ripple {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  }
  100% {
    box-shadow: 0 0 0 40px rgba(59, 130, 246, 0);
  }
}

.animate-ripple {
  animation: ripple 2s infinite;
}

/* Intense glowing effect for the screen border */
@keyframes screen-glow {
  0% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.7);
  }
  50% {
    box-shadow: 0 0 60px rgba(59, 130, 246, 1);
  }
  100% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.7);
  }
}

.animate-screen-glow {
  animation: screen-glow 1.2s infinite;
}
</style>
