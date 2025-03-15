import { defineConfig } from 'vitepress'
export const baseUrl = '/blog/'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: baseUrl,
  title: "笔记",
  description: "记录自己",
  head: [
    // 修改这里的 href 指向新的图标文件
    ['link', { rel: 'icon', href: '/favicon.ico' }] 
  ],
  srcDir: "src",
  lang: "zh-CN",
  
  themeConfig: {
    docFooter:{
      prev:"上一页",
      next:"下一页"
    },
    logo: '/image/8858-82f0b068a02e745a3716c87d871cf979.jpg',
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
