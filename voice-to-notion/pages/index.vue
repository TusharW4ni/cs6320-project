<script setup lang="ts">
const apiKey = ref<string>(""); // Use a ref to store the API key

const mediaRecorder = ref<MediaRecorder | null>(null);
const chunks = ref<Blob[]>([]);
const audio = ref<HTMLAudioElement | null>(null);
const audioFile = ref<File | null>(null);
const mediaStream = ref<MediaStream | null>(null);
const isRecording = ref(false);

const fetchedData = ref<any>(null);

onMounted(() => {
  apiKey.value = localStorage.getItem("apiKey") || "";
});

async function handleClick() {
  if (!apiKey.value) {
    useToastify("Please set the API key first in the settings");
    console.error("API key is not set");
    return;
  }
  await $fetch("/api/ntn/pages/get", {
    method: "POST",
    body: {
      apiKey: apiKey.value, // Use the reactive apiKey value
    },
  })
    .then((res) => {
      fetchedData.value = res;
      console.log("fetchedData", fetchedData.value);
    })
    .catch((err) => {
      console.error("err", err);
    });
}

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

// function stopRecording() {
//   if (mediaRecorder.value) {
//     mediaRecorder.value.stop();
//     isRecording.value = false;
//     console.log("Recording stopped");

//     mediaRecorder.value.onstop = () => {
//       const blob = new Blob(chunks.value, { type: "audio/wav" });
//       const audioFileName = `audio-${Date.now()}.wav`;
//       audioFile.value = new File([blob], audioFileName, { type: "audio/wav" });
//       const url = URL.createObjectURL(blob);
//       audio.value = new Audio(url);
//     };

//     if (mediaStream.value) {
//       mediaStream.value.getTracks().forEach((track) => track.stop());
//       console.log("Microphone capture stopped");
//     }

//     sendToServer(audioFile.value);
//   } else {
//     console.error("MediaRecorder is not initialized");
//   }
// }

function stopRecording() {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
    console.log("Recording stopped");

    // Set up the callback that runs AFTER stopping is complete
    mediaRecorder.value.onstop = () => {
      const blob = new Blob(chunks.value, { type: "audio/wav" });
      const audioFileName = `audio-${Date.now()}.wav`;
      audioFile.value = new File([blob], audioFileName, { type: "audio/wav" }); // Create the File here
      const url = URL.createObjectURL(blob);
      audio.value = new Audio(url);

      // --- CALL sendToServer *HERE* AFTER audioFile.value is ready ---
      console.log("Audio file created, sending to server...");
      sendToServer(audioFile.value);
      // --- End of change ---
    };

    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach((track) => track.stop());
      console.log("Microphone capture stopped");
    }

    // --- REMOVE THE PREMATURE CALL FROM HERE ---
    // sendToServer(audioFile.value); // <-- REMOVE THIS LINE
  } else {
    console.error("MediaRecorder is not initialized");
  }
}

async function sendToServer(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  await $fetch("/api/gemini/get/audio-transcript", {
    method: "POST",
    body: formData,
  });
  // .then((res) => {
  //   console.log("res", res);
  //   useToastify("Audio transcription successful");
  // })
  // .catch((err) => {
  //   console.error("err", err);
  //   useToastify("Audio transcription failed");
  // });
  // })
}
</script>

<template>
  <Navbar />
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
    <audio
      v-if="audio"
      :src="audio.src"
      controls
      class="w-full max-w-md mt-4 border border-gray-300 rounded-md"
    ></audio>
  </div>
  <div>
    <button @click="handleClick">Fetch Data</button>
  </div>
</template>
