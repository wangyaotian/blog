import {defineConfig} from 'vitepress'

export const baseUrl = '/blog/'
import timeline from "vitepress-markdown-timeline";
// https://vitepress.dev/reference/site-config
// @ts-ignore
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
        image: {
            // 默认禁用；设置为 true 可为所有图片启用懒加载。
            lazyLoading: true
        }
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
            text: "最近更新",
            formatOptions: {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            },
        },
        outline: {
            level: [2, 6], // 显示 2 到 6 级标题作为大纲
            label: '目录' // 大纲标题

        },
        // 移动端切换主题展示文本
        darkModeSwitchLabel: "切换主题",
        // 移动端切换语言展示文本
        langMenuLabel: "切换语言",
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
            {text: 'Golang', link: '/front/vue'},
        ],
        sidebar: {
            '/front/database/': [
                {
                    text: '数据库',
                    items: [
                        {
                            text: 'MySQL',
                            collapsed: false,   // 默认展开
                            items: [
                                {text: '安装MySQL', link: '/front/database/MySQL/mysql1'},
                                {text: 'MySQL事务', link: '/front/database/MySQL/mysql-transaction'},
                                {text: 'MySQL锁', link: '/front/database/MySQL/mysql-lock'},
                                {text: 'MySQL索引', link: '/front/database/MySQL/mysql-index'},
                                {text: 'MySQL慢查询', link: '/front/database/MySQL/mysql-slow-query'},
                                {text: 'MySQL优化', link: '/front/database/MySQL/mysql-optimize'},
                                {text: 'binlog redolog undolog', link: '/front/database/MySQL/mysql-log'},
                                {text: 'MVCC原理', link: '/front/database/MySQL/mysql-mvcc'},
                                {text: 'SQL执行过程', link: '/front/database/MySQL/mysql-execution-process'},
                                {text: 'MySQL主从同步', link: '/front/database/MySQL/master-slave-synchronization'},
                                {text: 'MySQL主从配置', link: '/front/database/MySQL/master-slave-config'},
                                {text: 'MySQL和Redis一致性', link: '/front/database/MySQL/mysql-consistency'},
                                {text: 'MySQL查询缓存', link: '/front/database/MySQL/mysql-query-cache'},
                            ]
                        },
                        {
                            text: 'Redis',
                            collapsed: false,   // 默认展开
                            items: [
                                {text: 'Redis安装', link: '/front/database/redis/redis-install'},
                                {text: 'Redis基础', link: '/front/database/redis/redis-basics'},
                                {text: 'Redis底层存储', link: '/front/database/redis/underlying-storage'},
                                {text: 'Redis数据类型操作', link: '/front/database/redis/data-type-operation'},
                                {text: 'Redis连接和基本操作', link: '/front/database/redis/basic-operation'},
                                {text: 'Redis线程模型', link: '/front/database/redis/thread-model'},
                                {text: 'Redis持久化', link: '/front/database/redis/persistence'},
                                {text: 'Redis集群', link: '/front/database/redis/cluster'},
                                {text: '雪崩穿透击穿', link: '/front/database/redis/redis-avalanche-guard'},
                                {text: 'Redis锁', link: '/front/database/redis/redis-lock'},
                                {text: 'Redis缓存', link: '/front/database/redis/redis-cache'},
                            ]
                        }
                    ]
                },
            ],
            '/front/golang/': [
                {
                    text: 'Golang',
                    items: [
                        {text: 'Golang基础', link: '/front/golang/basic'},
                        {text: 'Golang并发', link: '/front/golang/concurrency'},
                        {text: 'Golang网络编程', link: '/front/golang/network'},
                        {text: 'Golang性能优化', link: '/front/golang/performance'},
                    ]
                }
            ]
        },


        socialLinks: [
            {icon: 'github', link: 'https://github.com/W2XiaoYu'}
        ]
    },
})
