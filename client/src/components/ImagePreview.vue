<script setup>
const props = defineProps({
  src: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    default: ''
  }
});

function downloadImage() {
  const link = document.createElement('a');
  link.href = props.src;
  link.download = `sakuga-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="card overflow-hidden">
    <div class="relative group">
      <img
        :src="src"
        :alt="prompt"
        class="w-full aspect-square object-contain bg-gray-900"
      />
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          @click="downloadImage"
          class="btn btn-primary flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
    <div v-if="prompt" class="p-4 border-t border-gray-700">
      <p class="text-sm text-gray-400 line-clamp-2">{{ prompt }}</p>
    </div>
  </div>
</template>
