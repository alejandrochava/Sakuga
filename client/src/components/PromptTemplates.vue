<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '../composables/useToast';

const toast = useToast();

const props = defineProps({
  currentPrompt: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select']);

const isOpen = ref(false);
const templates = ref([]);
const newTemplateName = ref('');
const showSaveForm = ref(false);

const STORAGE_KEY = 'sakuga-prompt-templates';

// Default templates
const defaultTemplates = [
  { id: 'default-1', name: 'Anime Portrait', prompt: 'anime style portrait, detailed face, vibrant colors, studio lighting', isDefault: true },
  { id: 'default-2', name: 'Fantasy Landscape', prompt: 'epic fantasy landscape, magical atmosphere, dramatic lighting, highly detailed', isDefault: true },
  { id: 'default-3', name: 'Cyberpunk City', prompt: 'cyberpunk cityscape, neon lights, rain, futuristic, blade runner style', isDefault: true },
  { id: 'default-4', name: 'Studio Ghibli', prompt: 'studio ghibli style, whimsical, nature, soft colors, peaceful atmosphere', isDefault: true },
  { id: 'default-5', name: 'Product Photo', prompt: 'professional product photography, clean background, studio lighting, high quality', isDefault: true }
];

const userTemplates = computed(() => templates.value.filter(t => !t.isDefault));
const builtInTemplates = computed(() => templates.value.filter(t => t.isDefault));

onMounted(() => {
  loadTemplates();
});

function loadTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const userSaved = saved ? JSON.parse(saved) : [];
    templates.value = [...defaultTemplates, ...userSaved];
  } catch {
    templates.value = [...defaultTemplates];
  }
}

function saveTemplates() {
  const toSave = templates.value.filter(t => !t.isDefault);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function selectTemplate(template) {
  emit('select', template.prompt);
  isOpen.value = false;
  toast.success(`Template "${template.name}" applied`);
}

function saveCurrentPrompt() {
  if (!newTemplateName.value.trim()) {
    toast.error('Please enter a name');
    return;
  }
  if (!props.currentPrompt.trim()) {
    toast.error('No prompt to save');
    return;
  }

  const newTemplate = {
    id: `user-${Date.now()}`,
    name: newTemplateName.value.trim(),
    prompt: props.currentPrompt,
    isDefault: false
  };

  templates.value.push(newTemplate);
  saveTemplates();
  newTemplateName.value = '';
  showSaveForm.value = false;
  toast.success('Template saved!');
}

function deleteTemplate(template) {
  if (template.isDefault) return;
  templates.value = templates.value.filter(t => t.id !== template.id);
  saveTemplates();
  toast.success('Template deleted');
}

function closeDropdown(event) {
  if (!event.target.closest('.template-dropdown')) {
    isOpen.value = false;
    showSaveForm.value = false;
  }
}
</script>

<template>
  <div class="relative template-dropdown" v-click-outside="closeDropdown">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-accent transition-colors"
      title="Prompt templates"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
      Templates
    </button>

    <Transition name="slide-up">
      <div
        v-if="isOpen"
        class="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-neu-surface rounded-neu-sm shadow-neu-raised-lg z-50 scrollbar-thin"
      >
        <!-- Save Current Prompt -->
        <div class="p-3 border-b border-neu-border">
          <div v-if="!showSaveForm">
            <button
              @click="showSaveForm = true"
              :disabled="!currentPrompt.trim()"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-sm text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Save Current Prompt
            </button>
          </div>
          <div v-else class="flex gap-2">
            <input
              v-model="newTemplateName"
              @keyup.enter="saveCurrentPrompt"
              placeholder="Template name..."
              class="flex-1 px-3 py-2 bg-neu-inset shadow-neu-inset-sm rounded-neu-sm text-sm"
            />
            <button @click="saveCurrentPrompt" class="px-3 py-2 bg-accent/20 text-accent rounded-neu-sm text-sm hover:bg-accent/30">
              Save
            </button>
            <button @click="showSaveForm = false" class="px-3 py-2 text-text-muted hover:text-text-primary text-sm">
              Cancel
            </button>
          </div>
        </div>

        <!-- User Templates -->
        <div v-if="userTemplates.length > 0" class="p-2">
          <p class="px-2 py-1 text-xs text-text-muted uppercase tracking-wide">My Templates</p>
          <button
            v-for="template in userTemplates"
            :key="template.id"
            class="w-full text-left p-2 rounded-neu-sm hover:bg-neu-inset transition-colors group"
          >
            <div class="flex items-start justify-between gap-2">
              <div @click="selectTemplate(template)" class="flex-1 min-w-0">
                <p class="font-medium text-sm text-text-primary group-hover:text-accent transition-colors">{{ template.name }}</p>
                <p class="text-xs text-text-muted truncate mt-0.5">{{ template.prompt }}</p>
              </div>
              <button
                @click.stop="deleteTemplate(template)"
                class="p-1 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </button>
        </div>

        <!-- Built-in Templates -->
        <div class="p-2 border-t border-neu-border">
          <p class="px-2 py-1 text-xs text-text-muted uppercase tracking-wide">Built-in Templates</p>
          <button
            v-for="template in builtInTemplates"
            :key="template.id"
            @click="selectTemplate(template)"
            class="w-full text-left p-2 rounded-neu-sm hover:bg-neu-inset transition-colors group"
          >
            <p class="font-medium text-sm text-text-primary group-hover:text-accent transition-colors">{{ template.name }}</p>
            <p class="text-xs text-text-muted truncate mt-0.5">{{ template.prompt }}</p>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
