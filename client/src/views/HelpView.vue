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
    <h1 class="text-2xl font-bold text-text-primary mb-6">Help</h1>

    <!-- Getting Started -->
    <section class="card p-6 mb-6">
      <h2 class="text-lg font-semibold text-text-primary mb-4">Getting Started</h2>
      <p class="text-text-secondary mb-4">
        Sakuga is a personal AI image generation app. To use it, you need at least one AI provider API key configured in your <code class="bg-neu-inset px-2 py-0.5 rounded-lg shadow-neu-inset-sm">server/.env</code> file.
      </p>

      <div class="bg-neu-inset rounded-neu-sm shadow-neu-inset-sm p-4 text-sm font-mono text-text-secondary">
        <p class="text-text-muted"># Add one or more of these:</p>
        <p>OPENAI_API_KEY=sk-...</p>
        <p>STABILITY_API_KEY=sk-...</p>
        <p>REPLICATE_API_TOKEN=r8_...</p>
        <p>GEMINI_API_KEY=AIza...</p>
        <p>IDEOGRAM_API_KEY=...</p>
        <p>FAL_KEY=...</p>
        <p>TOGETHER_API_KEY=...</p>
        <p>BFL_API_KEY=...</p>
        <p>A1111_URL=http://localhost:7860</p>
      </div>

      <div class="mt-4">
        <p class="text-sm text-text-muted mb-2">Currently configured providers:</p>
        <div v-if="providers.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="p in providers"
            :key="p.id"
            class="px-3 py-1.5 bg-neu-surface shadow-neu-raised-sm text-accent rounded-full text-sm"
          >
            {{ p.name }}
          </span>
        </div>
        <p v-else class="text-yellow-400 text-sm">No providers configured. Add an API key to get started.</p>
      </div>
    </section>

    <!-- Generation Modes -->
    <section class="card p-6 mb-6">
      <h2 class="text-lg font-semibold text-text-primary mb-4">Generation Modes</h2>

      <div class="space-y-4">
        <div>
          <h3 class="text-accent font-medium">Generate (Text to Image)</h3>
          <p class="text-text-secondary text-sm mt-1">
            Describe what you want and the AI creates it from scratch. Choose an aspect ratio and optionally generate multiple variants at once.
          </p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Edit</h3>
          <p class="text-text-secondary text-sm mt-1">
            Upload an existing image and describe changes you want to make. The AI will modify the image based on your prompt.
          </p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Transform</h3>
          <p class="text-text-secondary text-sm mt-1">
            Apply a style or concept to an existing image. Upload an image and describe how you want it transformed (e.g., "make it look like a watercolor painting").
          </p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Inpaint</h3>
          <p class="text-text-secondary text-sm mt-1">
            Paint over specific areas of an image to regenerate just those parts. Upload an image, draw a mask over the areas you want changed, then describe what should replace them.
          </p>
          <p class="text-text-muted text-xs mt-1">Available with: Stability AI, Automatic1111</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="card p-6 mb-6">
      <h2 class="text-lg font-semibold text-text-primary mb-4">Features</h2>

      <div class="space-y-4">
        <div>
          <h3 class="text-accent font-medium">Prompt Enhancement</h3>
          <p class="text-text-secondary text-sm mt-1">
            Toggle "Enhance prompt" to have AI improve your prompt before generating. This adds details about style, lighting, and composition for better results.
          </p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Variants</h3>
          <p class="text-text-secondary text-sm mt-1">
            Generate 1-4 images at once from the same prompt. Useful for exploring different interpretations and picking your favorite.
          </p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Upscaling</h3>
          <p class="text-text-secondary text-sm mt-1">
            Increase image resolution by 2x or 4x. Click the "Upscale" button on any generated image to create a higher-resolution version.
          </p>
          <p class="text-text-muted text-xs mt-1">Available with: Stability AI, Replicate</p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Queue</h3>
          <p class="text-text-secondary text-sm mt-1">
            Add prompts to a queue for background processing. Useful for generating multiple images without waiting. Click "+ Queue" instead of "Generate" to add to the queue.
          </p>
        </div>

        <div>
          <h3 class="text-accent font-medium">History</h3>
          <p class="text-text-secondary text-sm mt-1">
            All generated images are saved locally and can be browsed in the History tab. Download or delete images anytime.
          </p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Cost Tracking</h3>
          <p class="text-text-secondary text-sm mt-1">
            Each generation shows an estimated cost. View your total usage and breakdown by provider in the Stats tab.
          </p>
        </div>
      </div>
    </section>

    <!-- Providers -->
    <section class="card p-6 mb-6">
      <h2 class="text-lg font-semibold text-text-primary mb-4">AI Providers</h2>

      <div class="space-y-4">
        <div>
          <h3 class="text-accent font-medium">OpenAI DALL-E</h3>
          <p class="text-text-secondary text-sm mt-1">
            DALL-E 3 produces high-quality, detailed images. DALL-E 2 is faster and cheaper but lower quality.
          </p>
          <p class="text-text-muted text-xs mt-1">~$0.04/image (DALL-E 3) | Features: Generate, Edit, Variants</p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Stability AI</h3>
          <p class="text-text-secondary text-sm mt-1">
            Stable Diffusion 3 models. Good balance of quality and cost. Supports inpainting and upscaling.
          </p>
          <p class="text-text-muted text-xs mt-1">~$0.003-0.065/image | Features: Generate, Edit, Inpaint, Upscale, Variants</p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Replicate</h3>
          <p class="text-text-secondary text-sm mt-1">
            Access to Flux and other open-source models. Flux Schnell is fast and cheap, Flux Pro is higher quality.
          </p>
          <p class="text-text-muted text-xs mt-1">~$0.003-0.055/image | Features: Generate, Upscale, Variants</p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Google Gemini</h3>
          <p class="text-text-secondary text-sm mt-1">
            Gemini's experimental image generation. Note: Requires paid tier (no free quota for image generation).
          </p>
          <p class="text-text-muted text-xs mt-1">~$0.02/image | Features: Generate, Edit</p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Ideogram</h3>
          <p class="text-text-secondary text-sm mt-1">
            Excellent for generating images with text. Best-in-class text rendering in AI-generated images.
          </p>
          <p class="text-text-muted text-xs mt-1">~$0.01-0.08/image | Features: Generate, Variants</p>
        </div>

        <div>
          <h3 class="text-accent font-medium">FAL.ai</h3>
          <p class="text-text-secondary text-sm mt-1">
            Fast and affordable access to Flux models and SDXL. Great for quick iterations and experiments.
          </p>
          <p class="text-text-muted text-xs mt-1">~$0.003-0.05/image | Features: Generate, Edit, Variants</p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Together AI</h3>
          <p class="text-text-secondary text-sm mt-1">
            Very affordable Flux model hosting. Flux Schnell Free tier available for testing.
          </p>
          <p class="text-text-muted text-xs mt-1">~$0.003-0.018/image | Features: Generate, Variants</p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Black Forest Labs</h3>
          <p class="text-text-secondary text-sm mt-1">
            Official Flux API from the creators of Flux. Highest quality Flux generations available.
          </p>
          <p class="text-text-muted text-xs mt-1">~$0.003-0.06/image | Features: Generate, Variants</p>
        </div>

        <div>
          <h3 class="text-accent font-medium">Automatic1111 (Self-hosted)</h3>
          <p class="text-text-secondary text-sm mt-1">
            Connect to a local Stable Diffusion WebUI. Free to use, runs on your own hardware. Requires WebUI running with --api flag.
          </p>
          <p class="text-text-muted text-xs mt-1">Free (local) | Features: Generate, Edit, Inpaint, Variants</p>
        </div>
      </div>
    </section>

    <!-- Tips -->
    <section class="card p-6">
      <h2 class="text-lg font-semibold text-text-primary mb-4">Tips</h2>

      <ul class="space-y-2 text-text-secondary text-sm">
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span>Be specific in your prompts - include style, mood, lighting, and composition details</span>
        </li>
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span>Use "Enhance prompt" for quick prompts to get better results automatically</span>
        </li>
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span>Generate multiple variants to explore different interpretations</span>
        </li>
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span>Try different providers - each has its own style and strengths</span>
        </li>
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span>Use the queue for bulk generation without waiting</span>
        </li>
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span>Upscale your favorite images for higher resolution prints or wallpapers</span>
        </li>
      </ul>
    </section>
  </div>
</template>
