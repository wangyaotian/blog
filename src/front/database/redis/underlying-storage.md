#### 一、Redis描述数据类型

> 通常我们了解的数据结构有字符串、双端链表、字典、压缩列表、整数集合等
>
> 但是Redis为了加快读写速度，并没有直接使用这些数据结构，而是在此基础上又包装了一层称之为RedisObject
>
> RedisObject有五种对象：string、List、Hash、Set、Zset

- 首先Redis内部使用一个reidsObject对象来表示所有的key和value
- redisObject最主要的信息如下图所示
    - type代表一个value对象具体是何种数据类型
    - encoding是不同数据类型在Redis内部的存储方式
    - 普通字符串（type=string,encoding=row或int）
    - 如果是int则代表实际Redis内部是按数值型类存储，比如："123""456"这样的字符串
- 上面说的这种方法比较浪费内存，实际redis提供了其他方法

![img](http://v5blog.cn/assets/img/image-20220206113353875.e099c9ac.png)

#### 二、字符串（String）

##### 1、概述

1. 扩容机制
    1. 当字符串长度小于1M时，扩容就是加倍现有空间（扩容机制）
    2. 如果字符串长度操作1M时，扩容时最多扩容1M空间，字符串最大长度为512M
2. String使用场景
    1. string类型可以用来存储，比如数字、文本、二进制数据等
    2. 缓存数据：提高访问呢速度和降低数据库压力
    3. 计数器：String类型支持自增和自减操作，可以用来实现计数器功能
    4. 分布式锁:string类型可以通过SETNX命令来实现分布式锁的功能
    5. 会话管理：存储用户的会话信息，比如用户id、登录状态、令牌等，通过设置过期时间来控制会话的有效期
    6. 序列化对象：比如JSon、XML等格式的数据，可以使用Redis的序列化和反序列化功能来实现对象的读写操作
    7. 限流：利用expire命令实现时间窗口内的访问控制

##### 2、String三种存储结构

> String类型的值对象可以使用不同的底层结构来实现，包括embstr、raw、和int三种
>
> - String类型的值对象并不是数组，但是它的value数据结构确实类似于数组
> - value数据结构是一个字节数组（byte array），也就是一个连续的字节序列
> - 这和数组的底层实现类似，数组也是一段连续的内存空间
> - 和数组一样，Redis中的String类型的值对象的长度也是固定的，不支持动态扩容
> - 在创建String类型的值对象时，需要指定它的初始长度(数组可以动态扩容)

- int：存储整数类型
    - 当保存的是Long类型整数时，RedisObject中的指针就直接赋值为整数数据了
    - 这样就不用额外的指针在指向整数了，这种保存方式通常也叫做int编码方式
- embstr(小于等于44字节)
    - 当保存的是字符串数据，并且字符串小于等于44字节时
    - RedisObject中的元数据，指针和SDS是一块连续的内存区域，这样就可以避免内存碎片
- raw(大于44字节)
    - 当字符串大于44字节时，是会给SDS分配独立的空间，并用指针指向SDS结构

##### 3、embstr$raw结构图

1. embstr存储结构图

    1. 占用64Bytes的空间，存储44Bytes的数据
    2. 前19个byte用于存储embstr结构
    3. 中间的44个byte存储数据，最后为\0符号

   ![img](http://v5blog.cn/assets/img/image-20240313170836951.610db6c3.png)

1. raw结构

    1. 当字符串大于44字节时，是会给SDS分配独立的空间，并用指针指向SDS结构

   ![img](http://v5blog.cn/assets/img/image-20240313171017742.c596823a.png)

##### 4、SDS结构体

> 当你保存的数据中包含字符时，String类型就会用简单动态字符串（Simple Dynamic String，SDS）结构体来保存

- buf：字节数组，保存实际数据，在数组最后加一个'\0',会额外占用1个字节开销
- len:表示buf的已用长度，不包括'\0'
- alloc:表示buf的实际分配长度，不包括'\0'
- flags:占1个字节，标记当前字节数组的属性，是sdshdr8，还是sdshdr16等

下图表示：sdshdr8类型的字节数组，实际分配了8个长度，已使用5个长度

![img](http://v5blog.cn/assets/img/image-20240313172731107.d7c2d3a6.png)

- 结构图长下面这个样子（）

``` redis
struct __attribute__ ((__packed__)) hisdshdr8 {
 uint8_t len; /* used */
 uint8_t alloc; /* excluding the header and null terminator */
 unsigned char flags; /* 3 lsb of type, 5 unused bits */
 char buf[];
};
```

#### 三、list(列表)

- list类似双向链表结构，首尾增删改查O(1)，中间增删改查O(n)

##### 1、概述

- 结构替换
    - 在Redis3.2之前，list使用的是linkedlist和ziplist
    - 在Redis3.2~Redis7.0之间，list使用的quickList，是linkedlist和ziplist的结合
    - 在Redis7.0之后，list使用的也是quickList，只不过ziplist转为listpack
- list使用场景
    - 消息队列：可以作为消息队列使用
    - 最新列表：
        - Redis List类型可以用来存储最新的N个元素，比如最新的日志信息、最新的新闻，最新的评论等
        - 通过LPUSH和LTRIM命令可以实现在列表头部插入元素并保持列表长度不超过N
        - 历史列表：
            - Redis List类型可以用来存储历史记录，比如用户的浏览历史，购物历史等
            - 通过LPUSH命令可以在列表头部插入元素，通过LRANGE命令可以获取列表中的一段元素
    - 延时队列：
        - Redis List类型可以用来实现延时队列
        - 通过LPUSH和BRROP命令可以实现在列表头部插入元素并在列表尾部阻塞取出元素
        - 如果列表为空，BRROP命令会等待指定的超时时间
- 几种数据类型对比
    - linkedlist：本质是一个双向链表
    - ziplist：字节小于64字节，数量小于512个，使用ziplist存储（占用一块了连续的内存空间）
    - quicklist：“链表”+ziplist组成的quicklist来避免单个ziplist过大，降低连锁更新的影响范围
    - listpack：和ziplist类似，不记录上一项的长度，解决了ziplist连锁更新问题

##### 2、linkedlist（双端列表）

- linedlist实际上使用的就是双向链表数据结构类型存储
- likedlist弊端
    - linkedlist有prev、next两个指针，数据量小时，指针占用的空间会超过数据占用的空间
    - linkedlist是链表结构，在内存中不是连续的，遍历的效率低下

![img](http://v5blog.cn/assets/img/image-20240313184255028.53e41b0c.png)

##### 3、ziplist(压缩列表)

> List的每个元素的占用的字节小于64字节，数量小于512个，使用ziplist存储

1. ziplist压缩列表,是一种内存紧凑的数据结构，占用一块连续的内存空间，提升内存使用率
2. ziplist中可以包含多个entry节点，每个节点可以存放整数或者字符串
    1. zlbytes，占用4个字节，记录了整个ziplist占用的总字节数
    2. zltail，占用4个字节，指向最后一个entry偏移量，用于快速定位最后一个entry
    3. zllen,占用2字节，记录entry总数
    4. entry，列表元素
    5. zlend,ziplist结束标志，占用1字节，值等于255

![img](http://v5blog.cn/assets/img/image-20240313185541233.9b9eb25f.png)

1. 存储数据的entry结构长下面这样

    1. prevlen
        1. 记录前一个entry占用字节数
        2. 能实现逆序遍历就是靠这个字段确定往前移动多少字节拿到上一个entry首地址
        3. 这部分会根据上一个entry的长度进行变长编码
    2. encoding
        1. 当前entyr的类型和长度
        2. 当前两位值为11则表示entry存放的是int类型数据，其他表示存储的是string
    3. entry-data
        1. 实际存放数据的区域
        2. 注意：如果entry int类型，encoding和entry-data会合并到encoding中，没有entry-data字段

   ![img](http://v5blog.cn/assets/img/image-20240313185921961.93b1adf3.png)

2. ziplist比linkedlist优势在哪里

    1. 与linkedlist相比，少了prev.next指针
    2. ziplist连续存储的，因此可以在O(1)的时间复杂度内访问和修改节点
    3. 注意：但是中间插入和删除数据可能需要对整个ziplist重排

3. ziplist不能保存过多数据

    1. ziplist存储空间是连续的，当插入新的entry时
    2. 内存空间不足就需要重新分配一块连续的内存空间，引发连锁更新的问题

4. 连锁更新

    1. 每个entry都用prevlen记录了上一个entry的长度
    2. 从当前entryB前面插入一个新的entryA时，会导致B的prevlen改变，也会导致entry B大小发生变化
    3. entryB后的一个entryC的prevlen也需要改变，以此类推，就可能造成了连锁更新
    4. 连锁更新会导致ziplist的内存空间需要多次重新分配，直接影响ziplist的查询性能

##### 4、quicklist

- quicklist是综合考虑了时间效率与空间效率引入的新型数据结构
- 结合了原先linkedlist与ziplist各自的优势，本质还是一个链表，只不过链表的每个节点是一个ziplist
- 链表+ziplist组成的quicklist来避免单个ziplist过大，降低连锁更新的影响范围
- 其实这样实现依旧没有解决ziplist连锁更新的问题
- 最后7.0设计了另一个内存紧凑型数据结构listpack版本替换掉ziplist

##### 5、listpack

1. listpack和ziplist类似，也是用一块连续的内存空间来保存数据

2. 一共四部分组成

    1. tot-bytes：记录listpack占用的总字节数
    2. num-elements:占用2字节，记录listpack elements元素个数
    3. elements：listpack元素，保存数据的部分
    4. listpack-end-byte：结束标志，占用1字节，值固定为255

   ![img](http://v5blog.cn/assets/img/image-20240314103947983.dae2a4bb.png)

3. listpack如何解决连锁更新问题

    1. listpack和ziplist类似，最大的区别是elements部分
    2. 每个element只记录自己的长度，不像ziplist的entry，记录上一项的长度
    3. 当修改或者新增元素的时候，不会影响后续element的长度变化，解决了连锁更新的问题

#### 四、hash(字典)

##### 1、概述

- hash说明
    - redis中的字典也是HashMap(数组+列表)的二维结构
    - 不同的是redis的字典的值只能是字符串
    - 最多可以存储2^32-1个字段
- Hash类型的底层实现有三种
    - ziplist：redis7.0之前使用
    - listpack：reids7.0之后使用
    - hashtable:哈希表，类似map
        - 个数超过512或任意一个键或者值的长度大于64个才会使用hashtable存储
        - 这样做是因为数据量小时使用ziplist更节省内存
- 应用场景
    - 用户信息：利用hset和hget命令实现对象属性的增删改查
    - 购物车“利用hincrby命令实现商品数量的增减
    - 配置信息：利用hmset和hmget命令实现批量设置和获取配置项

##### 2、ziplist&listpack

1. ziplist所有的字段和值顺序地存储在一块连续的内存中

2. 每个字段都用一个字节数组来存储，数组包含了两部分数据，即key和value

3. 查询操作的时间复杂度是O(N),其中N是Hash中的字段数量

4. 显然是ziplist在field个数太大，key太长，value太长三者有其一的时候会有以下问题

    1. ziplist每次插入都有开辟空间，连续的
    2. 查询的时候，需要从头开始计算，查询速度变慢
    3. 所以个数超过512时会使用ziplist存储，节省内存

   ![img](http://v5blog.cn/assets/img/image-20240314115732512.7ff6bb1f.png)

- listpack和ziplist类似，不记录上一项的长度，解决了ziplist连锁更新问题

![img](http://v5blog.cn/assets/img/image-20240314115930371.e03e3d98.png)

##### 3、hashTable

- hashtable是一种散列表结构，它将字段和值分别存储在两个数组中，并通过哈希函数计算字段在数组中的索引
- 如果field的个数超过512个或者field中任意一个键或者值是长度大于64个byte会使用hashTable存储

![img](http://v5blog.cn/assets/img/image-20240314120324317.a5561bae.png)

> hashTable扩容

- 初始化新的hash表
    - 首先，Redis会创建一个新的hash表，这个hash表的大小是当前hash表大小的2倍
    - 所以当负载因子（元素数量/哈希桶数量）超过1时，就需要扩容来减少哈希冲突
- 迁移数据
    - Redis会逐步将旧hash表中的数据迁移到新的hash表中
    - 这个过程是逐步进行的，而不是一次性完成，主要是为了避免在迁移数据时阻塞Redis的其他操作
    - 处理命令前，Redis会迁移一部分数据，然后再去处理命令请求（包子服务可用的同时迁移数据）
    - 实现方案
        - 具体来说，Redis会维护一个rehash索引，这个索引表示当前已经迁移的哈希桶的位置
        - 每次迁移数据时，都会从这个位置开始，迁移一部分数据，然后更新这个索引
- 当所有的数据都迁移到新的hash表后，就完成了rehash过程
- 这个时候，Redis会释放旧的hash表，将新的hash表设置为当前的hash表
- 对于读操作，Redis会首先在新的hash表中查找，如果没有找到，再去旧的hash表中查找
- 对于写操作，Redis会直接在新的hash表中进行

#### 五、set(集合)

1. set介绍
    1. set是一个无序的字符串集合，它不允许重复的元素
    2. 一个set类型的键最多可以存储 2^32 - 1 个元素
2. set底层结构
    1. intset、整数集合
        1. intset是一种紧凑的数组结构，它只保存int类型的数据
        2. 它将所有的元素按照从小到大的顺序存储在一块连续的内存中
    2. hashtable（哈希表）
        1. 哈希表和hash类型的哈希表相同，它将元素存储在一个数组中
        2. 并通过哈希函数计算元素在数组中的索引
3. set应用场景
    1. 去重，利用sadd和scard命令实现元素的添加和计数
    2. 交集，并集，差集，利用sinter，sunion和sdiff命令实现集合间的运算
    3. 随机抽取，利用srandmember命令实现随机抽奖或者抽样

#### 六、zset（有序集合）

------

##### 1、概述

- zset说明

    - zset是一种有序集合类型，它可以存储不重复的字符串元素
    - 通过权重值来为集合中的元素进行从小到大的排序
    - zset的成员是唯一的，但权重值可以重复
    - 一个zset类型的键最多可以存储 2^32 - 1 个元素

- 结构说明

    - ziplist(redis7.0之前使用)和listpack（redis7.0之后使用）
        - 元素个数小于128，长度小于64时使用
    - skiplist

- zset应用场景

    - 排行榜，利用zadd和zrange命令实现分数的更新和排名的查询
    - 延时队列，利用zadd和zpopmin命令实现任务的添加和执行，并且可以定期地获取已经到期的任务
    - 访问统计，可以使用zset来存储网站或者文章的访问次数，并且可以按照访问量进行排序和筛选

- value的数据结构（跳跃列表+字典）

    - zset一方是一个set，保证了内部的唯一性
    - 另一方面它可以给每一个value赋予一个score，代表这个value的权重
    - zset内部实现用的是一种叫做跳跃列表的数据结构

    - zset最后一个元素被移除后，数据结构就会被自动删除，内存也会被回收

##### 2、普通有序链表演变

- 普通有序链表演变
    - 假如我们每相邻两个节点增加一个指针，让指针指向下下节点
    - 新增加的指针连成了一个新的链表，但是它包含的节点个数只有原来的一半

![img](http://v5blog.cn/assets/img/image-20240314163153519.3ab1aebc.png)

- 但是新插入一个节点之后，就会打乱上下相邻两层链表上节点个数严格的2:1的对应关系
- 如果要维持这种对应关系，就必须吧新插入的节点后面的所有节点（也包括新插入的节点）重新进行调整
- 这会让时间复杂度重新退化为O(N),删除数据也有同样的问题
- skiplist方案
    - skiplist为了避免这一问题，它不要求上下相邻两层链表之间的节点个数有严格的对应关系
    - 而是为每个节点随机出一个层数（level），新插入的节点就会根据自己的层数决定该节点是否在这层的链表上

##### 3、skiplist跳跃表

- Redis的跳跃表是由redis.h/zskiplistNode和redis.h/zskiplist两个结构定义
- zskiplistNode用于表示跳跃节点
- 而zskiplist结构则用于保存跳跃表节点的相关信息（如节点数量，头位指针）
    - 比如节点的数量以及指向表头节点和表尾节点的指针等等
- zikiplist（跳跃节点）
    - header：指向跳跃表的表头节点
    - tail：指向跳跃表的表尾节点
    - level：记录目前跳跃表内，层数最大的那个节点层数（表头节点的层数不计算在内）
    - length：记录跳跃表的长度，也就是跳跃表目前包含节点的数量（表头节点不计算在内）

![img](http://v5blog.cn/assets/img/image-20240314165018646.5a8716c3.png)

- zskiplistNode（位于zskiplist结构右侧）
    - 层（level）
        - 节点中用L1、L2、L3等字样标记节点的各个层
        - 每个层都带有两个属性：前进指针和跨度
            - 前进指针用于访问位于表尾方向的其他节点
            - 跨度则记录了前进指针所指向节点和当前节点的距离
    - 后退（backward）指针
        - 节点中用BW字样标识节点的后退指针，它指向位于当前节点的前一个节点
        - 后退指针在程序从表尾向表头遍历时使用
    - 分值（score）
        - 各个节点中的1.0、2.0和3.0是节点所保存的分值
        - 在跳跃表中，节点按各自所保存的分值从小到大排列
    - 成员对象（obj）
        - 各个节点中的o1、o2和o3是节点所保存的成员对象

##### 4、skiplist插入数据

- 查找数据
    - 在skiplist中查询一个元素的时间复杂度为O(log N),其中N是skiplist中的节点数量
    - 第一，首先从skiplist的顶层开始，遍历每一层的节点
    - 第二，如果当前节点的下一个节点的值大于要查询的值，就转到当前节点的下一层继续搜索
    - 第三，直到找到要查询的节点或者搜索到了最底层
- 插入数据
    - 在skiplist中插入一个元素的时间复杂度也为O(log N)
    - 第一，从skiplist的顶层开始，查找插入位置
    - 第二，然后将新元素插入到适当的位置中
        - 插入节点，并调整手影响节点每层的forward指针和span
        - 调整backward
    - 第三，插入新元素时，需要随机生成一个层数，然后将新元素插入到这个层数及其以下的所有层中

![img](http://v5blog.cn/assets/img/image-20240314171008529.df0abb27.png)

#### 七、Bitmap

1. 概述
    1. bitmap不是一个独立的数据类型，而是一种特殊的string类型
    2. 它可以将一个string类型的值看作是一个由二进制位组成的数组，并提供了一系列操作二进制位的命令
    3. 一个bitmap类型的键最多可以存储 2^32 - 1 个二进制位
    4. 它和string类型相同，只是在操作时会将每个字节拆分成8个二进制位
2. 应用场景
    1. 统计用户活跃度，利用setbit和bitcount命令实现每天或每月用户登录次数的统计
    2. 实现布隆过滤器，利用setbit和getbit命令实现快速判断一个元素是否存在于一个集合中
    3. 实现位图索引，利用bitop和bitops命令实现对多个条件进行位运算和定位
3. bitmap存储结构

![img](http://v5blog.cn/assets/img/image-20240314172506677.f84b2b8c.png)

#### 八、stream

- 概述
    - stream是一个类似于日志的数据结构，它可以记录一系列的键值对，每个键值对都有一个唯一的ID
    - 一个stream类型的键最多可以存储2^64 - 1 个键值对
    - stream类型的底层实现是rax（基数树），它是一种压缩的前缀树结构
    - 它将所有的键值对按照ID的字典序存储在一个树形结构中
    - rax可以快速地定位、插入、删除任意位置的键值对
- 应用场景
    - 消息队列，利用xadd和xread命令实现生产者消费者模式
    - 操作日志，利用xadd和xrange命令实现操作记录和回放
    - 数据同步，利用xadd和xreadgroup命令实现多个消费者之间的数据同步

#### 九、Hyperloglog

- 概述
    - HyperLogLog是一种概率数据结构，用于在恒定的内存大小下估计集合的基数（不同元素的个数）
    - 它不是一个独立的数据类型。而是一种特殊的string类型
    - 它可以使用极小的空间来统计一个集合中不同元素的数量，也就是基数
    - 一个hyperloglog类型的键最多可以存储12kb的数据
    - 注：hyperloglog误差率为0.81%（真实基数为1000，结果在981到1019）
- 应用场景
    - 统计网站的独立访客数（UV）
    - 统计在线游戏的活跃用户数（DAU）
    - 统计电商平台的商品浏览量
    - 统计社交网络的用户关注数
    - 统计日志分析中的不同事件数

#### 十、GEO

- 概述
    - geospatial是一种用于存储和查询地理空间位置的数据类型
    - 它基于sorted set数据结构实现，利用geohash算法将经纬度编码为二进制字符串，并作为sorted set的score值
    - Redis geospatial提供了一系列的命令来添加、删除、搜索和计算地理空间位置
- 应用场景
    - 统计某个区域的商家或用户数量
    - 查询某个位置附近的餐馆或酒店
    - 计算两个位置之间的距离或行驶时间
    - 显示某个位置周围的景点或活动