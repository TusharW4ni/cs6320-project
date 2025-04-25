<script setup lang="ts">
import { ref, onMounted } from "vue";

const mediaRecorder = ref<MediaRecorder | null>(null);
const chunks = ref<Blob[]>([]);
const audioList = ref<string[]>([]); // List of recorded audio URLs
const mediaStream = ref<MediaStream | null>(null);
const silenceTimeout = ref<NodeJS.Timeout | null>(null);
const isRecording = ref(false);
const isListening = ref(true); // Track if speech recognition is actively listening

let recognition: SpeechRecognition | null = null;

onMounted(() => {
  if (typeof window !== "undefined") {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      initializeSpeechRecognition();
    } else {
      console.error("SpeechRecognition is not supported in this browser.");
    }
  }
});

function initializeSpeechRecognition() {
  if (!recognition) return;

  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript.toLowerCase();
    console.log("Speech received:", speechResult);

    if (speechResult.includes("start recording") && !isRecording.value) {
      startRecording();
    } else if (isRecording.value) {
      console.log(`Heard: ${speechResult}`);
      console.log("start recording - not detected.");
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    console.log("Speech recognition ended.");
    if (isListening.value) {
      recognition?.start(); // Restart recognition only if listening is active
    }
  };

  recognition.start();
}

function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log("getUserMedia is not supported on your browser!");
    return;
  }

  stopListening(); // Stop speech recognition while recording

  navigator.mediaDevices
    .getUserMedia({ audio: true })
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

      mediaRecorder.value.onstop = () => {
        if (chunks.value.length > 0) {
          const blob = new Blob(chunks.value, { type: "audio/wav" });
          const url = URL.createObjectURL(blob);
          audioList.value.push(url); // Save the recorded audio
          console.log("Recording saved.");
        } else {
          console.log("Recording discarded because no voice was detected.");
        }

        isRecording.value = false;
        startListening(); // Restart speech recognition after recording stops
      };

      // Set a timeout to stop recording if no voice is detected
      silenceTimeout.value = setTimeout(() => {
        console.log("No voice detected. Stopping recording...");
        stopRecording(false); // Stop recording and discard if no voice detected
      }, 5000);
    })
    .catch((err) => {
      console.error(
        "The following getUserMedia error occurred:",
        err.name,
        err
      );
    });
}

function stopRecording(save = true) {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop();
    console.log("Recording stopped");

    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach((track) => track.stop());
      console.log("Microphone capture stopped");
    }

    // Clear the silence timeout
    if (silenceTimeout.value) {
      clearTimeout(silenceTimeout.value);
      silenceTimeout.value = null;
    }

    if (!save) {
      chunks.value = []; // Discard the recording
      console.log("Recording discarded.");
    }

    // Restart listening for the trigger word
    startListening();
  } else {
    console.error("MediaRecorder is not initialized");
  }
}

function stopListening() {
  isListening.value = false;
  recognition?.stop();
}

function startListening() {
  isListening.value = true;
  recognition?.start();
}
</script>

<template>
  <div class="flex flex-col text-white bg-red-500 p-4">
    <h1 class="text-lg font-bold mb-4">Audio Recorder</h1>
    <div v-if="audioList.length > 0" class="mb-4">
      <h2 class="text-md font-semibold">Recorded Audio:</h2>
      <ul>
        <li v-for="(audioSrc, index) in audioList" :key="index" class="mb-2">
          <audio :src="audioSrc" controls class="border"></audio>
        </li>
      </ul>
    </div>
    <p v-else>No recordings yet. Say "start recording" to begin.</p>
  </div>
</template>
