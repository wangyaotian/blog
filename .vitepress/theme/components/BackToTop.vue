<template>
    <button v-if="isVisible" @click="scrollToTop" class="back-to-top">
        返回顶部
    </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isVisible = ref(false);
const scrollThreshold = 300; // 滚动超过多少距离显示按钮

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth', // 使用平滑滚动
    });
};

const handleScroll = () => {
    isVisible.value = window.scrollY > scrollThreshold;
};

onMounted(() => {
    window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.back-to-top {
    position: fixed;
    bottom: 50%;
    right: 20px;
    background-color: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
}

.back-to-top:hover {
    background-color: var(--vp-c-bg);
}

.back-to-top[v-if='isVisible'] {
    opacity: 1;
    visibility: visible;
}

/* 可以根据您的喜好调整样式 */
</style>