import { defineConfig } from 'vitepress'
export const baseUrl = '/blog/'
import timeline from "vitepress-markdown-timeline";
// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: baseUrl,
  title: "奔跑的蜗牛",
  description: "记录自己",
  head: [
      ['link', {rel: 'icon', href: baseUrl + 'Run-snail.ico'}]
  ],
  srcDir: "src",
  lang: "zh-CN",
    ignoreDeadLinks: true,
    markdown: {
      lineNumbers: true,
      config(md) {
          md.use(timeline)
      },
  },
  themeConfig: {
      search: {
          provider: 'local',
          options: {
              locales: {}
          }
      },
      //最后更新时间
      lastUpdated: {
          text: "最后更新",
          formatOptions: {
              dateStyle: "short",
              timeStyle: "short",
          },
      },
      outline: {
          level: [2, 6], // 显示 2 到 6 级标题作为大纲
          label: '目录' // 大纲标题

      },
      // 返回顶部 Return to top
      returnToTopLabel: "返回顶部",

      // 菜单  Menu
      sidebarMenuLabel: "菜单",
      notFound: {
          title: "界面未找到",
          quote: "您好像迷失在网络的小胡同里啦，别着急，赶紧回头是岸！",
          linkText: "返回首页"
      },
      docFooter: {
          prev: "上一页",
          next: "下一页"
      },
      logo: '/image/20240319141015.jpg',
      nav: [
          {text: '首页', link: '/'},
          {
              text: '数据库', items: [
                  {
                      text: "MySQL",
                      link: '/front/database/mysql'
                  },
                  {
                      text: "Redis",
                      link: '/front/database/redis'
                  },
                  {
                      text: "Elasticsearch",
                      link: '/front/database/elasticsearch'
                  },
                  {
                      text: "RabbitMQ",
                      link: '/front/database/rabbitmq'
                  },
              ]
          },
          {text: 'Golang', link: '/golang'},
      ],
      sidebar: [
          {
              text: '数据库',
              items: [
                  {text: 'MySQL',
                      collapsible: true, // 允许折叠
                      collapsed: false,   // 默认展开
                   items: [
                          {text: '安装MySQL', link: '/front/database/MySQL/mysql1'},
                          {text: 'MySQL事务', link: '/front/database/MySQL/mysql-transaction'},
                          {text: 'MySQL锁', link: '/front/database/MySQL/mysql-lock'},
                          {text: 'MySQL索引', link: '/front/database/MySQL/mysql-index'},
                          {text: 'MySQL慢查询', link: '/front/database/MySQL/mysql-slow-query'},
                          {text: 'MySQL优化', link: '/front/database/MySQL/mysql-optimize'},
                          {text: 'binlog redolog undolog', link: '/front/database/MySQL/mysql-log'},
                      ]},
                  {text: 'Redis', link: '/front/database/redis'}
              ]
          },
      ],

      socialLinks: [
          {icon: 'github', link: 'https://github.com/W2XiaoYu'}
      ]
  },
})
