import { defineConfig } from 'vitepress'
export const baseUrl = '/blog/'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: baseUrl,
  title: "笔记",
  description: "记录自己",
  srcDir: "src",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '示例', link: '/markdown-examples' },
      { text: 'flutter', link: '/flutter' },
    ],
    sidebar: [
      {
        text: '前端',
        items: [
          { text: 'vue', link: '/front/vue' },
          { text: '示例', link: '/api-examples' }
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/W2XiaoYu' }
    ]
  }
})
