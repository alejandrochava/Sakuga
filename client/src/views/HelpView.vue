<script setup>
import { ref, onMounted } from 'vue';

const providers = ref([]);

async function fetchProviders() {
  try {
    const response = await fetch('/api/providers');
    providers.value = await response.json();
  } catch (e) {
    console.error('Failed to fetch providers:', e);
  }
}

onMounted(fetchProviders);
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-6">Help</h1>

    <!-- Getting Started -->
    <section class="card p-6 mb-6">
      <h2 class="text-lg font-semibold text-white mb-4">Getting Started</h2>
      <p class="text-gray-300 mb-4">
        Sakuga is a personal AI image generation app. To use it, you need at least one AI provider API key configured in your <code class="bg-gray-800 px-1 rounded">server/.env</code> file.
      </p>

      <div class="bg-gray-800 rounded-lg p-4 text-sm font-mono text-gray-300">
        <p class="text-gray-500"># Add one or more of these:</p>
        <p>OPENAI_API_KEY=sk-...</p>
        <p>STABILITY_API_KEY=sk-...</p>
        <p>REPLICATE_API_TOKEN=r8_...</p>
        <p>GEMINI_API_KEY=AIza...</p>
      </div>

      <div class="mt-4">
        <p class="text-sm text-gray-400 mb-2">Currently configured providers:</p>
        <div v-if="providers.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="p in providers"
            :key="p.id"
            class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm"
          >
            {{ p.name }}
          </span>
        </div>
        <p v-else class="text-yellow-400 text-sm">No providers configured. Add an API key to get started.</p>
      </div>
    </section>

    <!-- Generation Modes -->
    <section class="card p-6 mb-6">
      <h2 class="text-lg font-semibold text-white mb-4">Generation Modes</h2>

      <div class="space-y-4">
        <div>
          <h3 class="text-primary-400 font-medium">Generate (Text to Image)</h3>
          <p class="text-gray-400 text-sm mt-1">
            Describe what you want and the AI creates it from scratch. Choose an aspect ratio and optionally generate multiple variants at once.
          </p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Edit</h3>
          <p class="text-gray-400 text-sm mt-1">
            Upload an existing image and describe changes you want to make. The AI will modify the image based on your prompt.
          </p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Transform</h3>
          <p class="text-gray-400 text-sm mt-1">
            Apply a style or concept to an existing image. Upload an image and describe how you want it transformed (e.g., "make it look like a watercolor painting").
          </p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Inpaint</h3>
          <p class="text-gray-400 text-sm mt-1">
            Paint over specific areas of an image to regenerate just those parts. Upload an image, draw a mask over the areas you want changed, then describe what should replace them.
          </p>
          <p class="text-gray-500 text-xs mt-1">Available with: Stability AI</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="card p-6 mb-6">
      <h2 class="text-lg font-semibold text-white mb-4">Features</h2>

      <div class="space-y-4">
        <div>
          <h3 class="text-primary-400 font-medium">Prompt Enhancement</h3>
          <p class="text-gray-400 text-sm mt-1">
            Toggle "Enhance prompt" to have AI improve your prompt before generating. This adds details about style, lighting, and composition for better results.
          </p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Variants</h3>
          <p class="text-gray-400 text-sm mt-1">
            Generate 1-4 images at once from the same prompt. Useful for exploring different interpretations and picking your favorite.
          </p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Upscaling</h3>
          <p class="text-gray-400 text-sm mt-1">
            Increase image resolution by 2x or 4x. Click the "Upscale" button on any generated image to create a higher-resolution version.
          </p>
          <p class="text-gray-500 text-xs mt-1">Available with: Stability AI, Replicate</p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Queue</h3>
          <p class="text-gray-400 text-sm mt-1">
            Add prompts to a queue for background processing. Useful for generating multiple images without waiting. Click "+ Queue" instead of "Generate" to add to the queue.
          </p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">History</h3>
          <p class="text-gray-400 text-sm mt-1">
            All generated images are saved locally and can be browsed in the History tab. Download or delete images anytime.
          </p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Cost Tracking</h3>
          <p class="text-gray-400 text-sm mt-1">
            Each generation shows an estimated cost. View your total usage and breakdown by provider in the Stats tab.
          </p>
        </div>
      </div>
    </section>

    <!-- Providers -->
    <section class="card p-6 mb-6">
      <h2 class="text-lg font-semibold text-white mb-4">AI Providers</h2>

      <div class="space-y-4">
        <div>
          <h3 class="text-primary-400 font-medium">OpenAI DALL-E</h3>
          <p class="text-gray-400 text-sm mt-1">
            DALL-E 3 produces high-quality, detailed images. DALL-E 2 is faster and cheaper but lower quality.
          </p>
          <p class="text-gray-500 text-xs mt-1">~$0.04/image (DALL-E 3) | Features: Generate, Edit, Variants</p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Stability AI</h3>
          <p class="text-gray-400 text-sm mt-1">
            Stable Diffusion 3 models. Good balance of quality and cost. Supports inpainting and upscaling.
          </p>
          <p class="text-gray-500 text-xs mt-1">~$0.003-0.065/image | Features: Generate, Edit, Inpaint, Upscale, Variants</p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Replicate</h3>
          <p class="text-gray-400 text-sm mt-1">
            Access to Flux and other open-source models. Flux Schnell is fast and cheap, Flux Pro is higher quality.
          </p>
          <p class="text-gray-500 text-xs mt-1">~$0.003-0.055/image | Features: Generate, Upscale, Variants</p>
        </div>

        <div>
          <h3 class="text-primary-400 font-medium">Google Gemini</h3>
          <p class="text-gray-400 text-sm mt-1">
            Gemini's experimental image generation. Note: Requires paid tier (no free quota for image generation).
          </p>
          <p class="text-gray-500 text-xs mt-1">~$0.02/image | Features: Generate, Edit</p>
        </div>
      </div>
    </section>

    <!-- Tips -->
    <section class="card p-6">
      <h2 class="text-lg font-semibold text-white mb-4">Tips</h2>

      <ul class="space-y-2 text-gray-400 text-sm">
        <li class="flex gap-2">
          <span class="text-primary-400">•</span>
          <span>Be specific in your prompts - include style, mood, lighting, and composition details</span>
        </li>
        <li class="flex gap-2">
          <span class="text-primary-400">•</span>
          <span>Use "Enhance prompt" for quick prompts to get better results automatically</span>
        </li>
        <li class="flex gap-2">
          <span class="text-primary-400">•</span>
          <span>Generate multiple variants to explore different interpretations</span>
        </li>
        <li class="flex gap-2">
          <span class="text-primary-400">•</span>
          <span>Try different providers - each has its own style and strengths</span>
        </li>
        <li class="flex gap-2">
          <span class="text-primary-400">•</span>
          <span>Use the queue for bulk generation without waiting</span>
        </li>
        <li class="flex gap-2">
          <span class="text-primary-400">•</span>
          <span>Upscale your favorite images for higher resolution prints or wallpapers</span>
        </li>
      </ul>
    </section>
  </div>
</template>
