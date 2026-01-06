<script setup>
defineProps({
  type: {
    type: String,
    default: 'card', // 'card' | 'text' | 'circle' | 'image' | 'stat'
    validator: (value) => ['card', 'text', 'circle', 'image', 'stat'].includes(value)
  },
  count: {
    type: Number,
    default: 1
  },
  className: {
    type: String,
    default: ''
  }
});
</script>

<template>
  <!-- Card skeleton -->
  <template v-if="type === 'card'">
    <div
      v-for="i in count"
      :key="i"
      class="card p-4 space-y-3"
      :class="className"
    >
      <div class="skeleton h-40 rounded-neu-sm"></div>
      <div class="skeleton h-4 w-3/4 rounded"></div>
      <div class="skeleton h-3 w-1/2 rounded"></div>
    </div>
  </template>

  <!-- Image grid skeleton -->
  <template v-else-if="type === 'image'">
    <div
      v-for="i in count"
      :key="i"
      class="aspect-square skeleton rounded-neu-sm"
      :class="className"
    ></div>
  </template>

  <!-- Text line skeleton -->
  <template v-else-if="type === 'text'">
    <div class="space-y-2" :class="className">
      <div
        v-for="i in count"
        :key="i"
        class="skeleton h-4 rounded"
        :style="{ width: `${Math.random() * 40 + 60}%` }"
      ></div>
    </div>
  </template>

  <!-- Circle skeleton -->
  <template v-else-if="type === 'circle'">
    <div
      v-for="i in count"
      :key="i"
      class="skeleton rounded-full"
      :class="className || 'w-10 h-10'"
    ></div>
  </template>

  <!-- Stat card skeleton -->
  <template v-else-if="type === 'stat'">
    <div
      v-for="i in count"
      :key="i"
      class="card p-6 space-y-3"
      :class="className"
    >
      <div class="flex items-center justify-between">
        <div class="skeleton h-4 w-24 rounded"></div>
        <div class="skeleton w-8 h-8 rounded-full"></div>
      </div>
      <div class="skeleton h-8 w-20 rounded"></div>
      <div class="skeleton h-3 w-16 rounded"></div>
    </div>
  </template>
</template>
