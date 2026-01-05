<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  imageSrc: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['maskReady']);

const canvasRef = ref(null);
const maskCanvasRef = ref(null);
const ctx = ref(null);
const maskCtx = ref(null);
const isDrawing = ref(false);
const brushSize = ref(30);
const tool = ref('brush'); // 'brush' or 'eraser'

let lastX = 0;
let lastY = 0;

function initCanvas() {
  const canvas = canvasRef.value;
  const maskCanvas = maskCanvasRef.value;
  if (!canvas || !maskCanvas) return;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;
    maskCanvas.width = img.width;
    maskCanvas.height = img.height;

    // Draw image on main canvas
    ctx.value = canvas.getContext('2d');
    ctx.value.drawImage(img, 0, 0);

    // Initialize mask canvas (transparent)
    maskCtx.value = maskCanvas.getContext('2d');
    maskCtx.value.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  };
  img.src = props.imageSrc;
}

function startDrawing(e) {
  isDrawing.value = true;
  const rect = maskCanvasRef.value.getBoundingClientRect();
  const scaleX = maskCanvasRef.value.width / rect.width;
  const scaleY = maskCanvasRef.value.height / rect.height;
  lastX = (e.clientX - rect.left) * scaleX;
  lastY = (e.clientY - rect.top) * scaleY;
}

function draw(e) {
  if (!isDrawing.value || !maskCtx.value) return;

  const rect = maskCanvasRef.value.getBoundingClientRect();
  const scaleX = maskCanvasRef.value.width / rect.width;
  const scaleY = maskCanvasRef.value.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  maskCtx.value.beginPath();
  maskCtx.value.moveTo(lastX, lastY);
  maskCtx.value.lineTo(x, y);
  maskCtx.value.strokeStyle = tool.value === 'brush' ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
  maskCtx.value.lineWidth = brushSize.value;
  maskCtx.value.lineCap = 'round';
  maskCtx.value.lineJoin = 'round';
  maskCtx.value.globalCompositeOperation = tool.value === 'brush' ? 'source-over' : 'destination-out';
  maskCtx.value.stroke();

  lastX = x;
  lastY = y;
}

function stopDrawing() {
  if (isDrawing.value) {
    isDrawing.value = false;
    emitMask();
  }
}

function clearMask() {
  if (maskCtx.value) {
    maskCtx.value.clearRect(0, 0, maskCanvasRef.value.width, maskCanvasRef.value.height);
    emitMask();
  }
}

function emitMask() {
  if (maskCanvasRef.value) {
    const dataUrl = maskCanvasRef.value.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    emit('maskReady', base64);
  }
}

watch(() => props.imageSrc, initCanvas);
onMounted(initCanvas);
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center gap-4 flex-wrap">
      <div class="flex gap-2">
        <button
          @click="tool = 'brush'"
          class="px-3 py-1.5 rounded-neu-sm text-sm transition-all duration-200"
          :class="tool === 'brush'
            ? 'bg-neu-inset shadow-neu-inset-sm text-accent'
            : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:text-text-primary'"
        >
          Brush
        </button>
        <button
          @click="tool = 'eraser'"
          class="px-3 py-1.5 rounded-neu-sm text-sm transition-all duration-200"
          :class="tool === 'eraser'
            ? 'bg-neu-inset shadow-neu-inset-sm text-accent'
            : 'bg-neu-surface shadow-neu-raised-sm text-text-secondary hover:text-text-primary'"
        >
          Eraser
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm text-text-secondary">Size:</span>
        <input
          type="range"
          v-model="brushSize"
          min="5"
          max="100"
          class="w-24 accent-accent"
        />
        <span class="text-sm text-text-muted w-8">{{ brushSize }}</span>
      </div>

      <button
        @click="clearMask"
        class="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-neu-sm text-sm hover:bg-red-500/30 transition-colors"
      >
        Clear Mask
      </button>
    </div>

    <!-- Canvas Container -->
    <div class="relative neu-raised p-2 overflow-hidden">
      <canvas
        ref="canvasRef"
        class="w-full h-auto rounded-neu-sm"
      />
      <canvas
        ref="maskCanvasRef"
        class="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] cursor-crosshair rounded-neu-sm"
        style="opacity: 0.5; mix-blend-mode: screen;"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
      />
    </div>

    <p class="text-xs text-text-muted">
      Paint over the areas you want to regenerate. White areas will be replaced.
    </p>
  </div>
</template>
