<script setup>
defineProps({
  icon: {
    type: String,
    default: 'image', // 'image' | 'folder' | 'clock' | 'search' | 'sparkles' | 'heart'
    validator: (value) => ['image', 'folder', 'clock', 'search', 'sparkles', 'heart'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  actionLabel: {
    type: String,
    default: ''
  }
});

defineEmits(['action']);
</script>

<template>
  <div class="empty-state">
    <!-- Icon -->
    <div class="empty-state-icon">
      <!-- Image/Camera icon -->
      <svg v-if="icon === 'image'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      <!-- Folder icon -->
      <svg v-else-if="icon === 'folder'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>

      <!-- Clock icon -->
      <svg v-else-if="icon === 'clock'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      <!-- Search icon -->
      <svg v-else-if="icon === 'search'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      <!-- Sparkles icon -->
      <svg v-else-if="icon === 'sparkles'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>

      <!-- Heart icon -->
      <svg v-else-if="icon === 'heart'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </div>

    <!-- Title -->
    <h3 class="empty-state-title">{{ title }}</h3>

    <!-- Description -->
    <p v-if="description" class="empty-state-description">{{ description }}</p>

    <!-- Action button -->
    <button
      v-if="actionLabel"
      @click="$emit('action')"
      class="btn btn-primary mt-6"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
