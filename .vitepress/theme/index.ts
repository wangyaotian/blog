// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import CustomLayout from './layout/CustomLayout.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: CustomLayout, // 直接将 CustomLayout 作为 Layout
  enhanceApp({ app, router, siteData }) {
    // ...
  }
} satisfies Theme
