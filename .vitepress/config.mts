import { defineConfig } from 'vitepress'
export const baseUrl = '/blog/'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: baseUrl,
  title: "笔记",
  description: "记录自己",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  srcDir: "src",
  lang: "zh-CN",
  
  themeConfig: {
    notFound: {
      title: "界面未找到",
      quote: "您好像迷失在网络的小胡同里啦，别着急，赶紧回头是岸！",
      linkText: "返回首页"
    },
    docFooter: {
      prev: "上一页",
      next: "下一页"
    },
    logo: '/image/8858-82f0b068a02e745a3716c87d871cf979.jpg',
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
