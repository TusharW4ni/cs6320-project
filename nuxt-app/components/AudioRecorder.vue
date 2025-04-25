<script setup lang="ts">
const mediaRecorder = ref<MediaRecorder | null>(null);
const chunks = ref<Blob[]>([]);
const audio = ref<HTMLAudioElement | null>(null);
const mediaStream = ref<MediaStream | null>(null);

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
    console.log("Recording stopped");

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(chunks.value, { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      audio.value = new Audio(url);
    };

    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach((track) => track.stop());
      console.log("Microphone capture stopped");
    }
  } else {
    console.error("MediaRecorder is not initialized");
  }
}
</script>

<template>
  <div class="flex text-white bg-red-500">
    <button @click="startRecording" class="border">record</button>
    <button @click="stopRecording" class="border">stop</button>
    <audio v-if="audio" :src="audio.src" controls class="border"></audio>
  </div>
</template>
