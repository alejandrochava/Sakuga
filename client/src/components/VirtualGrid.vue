<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  itemHeight: {
    type: Number,
    default: 300
  },
  columns: {
    type: Number,
    default: 3
  },
  buffer: {
    type: Number,
    default: 2 // Number of rows to render above/below viewport
  }
});

const emit = defineEmits(['visible-range-change']);

const container = ref(null);
const scrollTop = ref(0);
const containerHeight = ref(0);

// Calculate rows from items based on columns
const rows = computed(() => {
  const result = [];
  for (let i = 0; i < props.items.length; i += props.columns) {
    result.push(props.items.slice(i, i + props.columns));
  }
  return result;
});

const totalHeight = computed(() => rows.value.length * props.itemHeight);

const visibleStartRow = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer);
});

const visibleEndRow = computed(() => {
  const end = Math.ceil((scrollTop.value + containerHeight.value) / props.itemHeight) + props.buffer;
  return Math.min(rows.value.length, end);
});

const visibleRows = computed(() => {
  return rows.value.slice(visibleStartRow.value, visibleEndRow.value).map((row, index) => ({
    items: row,
    index: visibleStartRow.value + index
  }));
});

const offsetY = computed(() => visibleStartRow.value * props.itemHeight);

function handleScroll(e) {
  scrollTop.value = e.target.scrollTop;
}

function updateContainerHeight() {
  if (container.value) {
    containerHeight.value = container.value.clientHeight;
  }
}

onMounted(() => {
  updateContainerHeight();
  window.addEventListener('resize', updateContainerHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight);
});

// Watch for items changes to update
watch(() => props.items.length, () => {
  nextTick(updateContainerHeight);
});

// Emit visible range for parent components
watch([visibleStartRow, visibleEndRow], () => {
  const startItem = visibleStartRow.value * props.columns;
  const endItem = Math.min(visibleEndRow.value * props.columns, props.items.length);
  emit('visible-range-change', { start: startItem, end: endItem });
});
</script>

<template>
  <div
    ref="container"
    class="overflow-y-auto scrollbar-thin"
    style="height: calc(100vh - 250px); min-height: 400px;"
    @scroll="handleScroll"
  >
    <!-- Total height spacer -->
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <!-- Visible rows -->
      <div
        :style="{
          position: 'absolute',
          top: `${offsetY}px`,
          left: 0,
          right: 0
        }"
      >
        <div
          v-for="row in visibleRows"
          :key="row.index"
          class="grid gap-4"
          :class="`grid-cols-${columns}`"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot
            v-for="(item, itemIndex) in row.items"
            :key="item.id || `${row.index}-${itemIndex}`"
            :item="item"
            :index="row.index * columns + itemIndex"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
</style>
