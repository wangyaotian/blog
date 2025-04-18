#### 一、Redis主从

##### 1、主从原理

- 和MySql主从复制的原因一样，Redis虽然读取写入的速度都特别快，但是也会产生读压力特别大的情况
- 为了分担读压力，Redis支持主从复制，Redis的主从结构可以采用一主多从或者级联结构
- Redis主从复制可以根据是否是全量分为全量 同步和增量同步
- 注：redis主节点Master挂掉时，运维让从节点Slave接管（redis主从默认无法自动切换，需要运维手动切换）

![img](http://v5blog.cn/assets/img/image-20210115115211469.baf7fcca.png)

##### 2、主从复制优点

- 主从复制，主机会自动将数据同步到从机，可以进行读写分离
- 为了分载Master的读操作压力，Slave服务器可以为客户端提供只读操作的服务，写服务仍然必须由Master来完成

##### 3、主从复制缺点

- Redis不具备自动容错和恢复功能，主机从机的宕机都会导致前端部分读写请求失败
- 需要等待机器重启或者手动切换前端的IP才能恢复（也就是要人工介入）
- 主机宕机，宕机前有部分数据未能及时同步到从机，切换IP后还会引入数据不一致的问题，降低了系统的可用性

#### 二、哨兵模式

##### 1、sentinel作用

- 当用Redis做主从方案时，假如master宕机，Redis本身无法自动进行主备切换
- 而Redis-sentinel本身也是一个独立运行的进程，它能监控多个master-slave集群，发现master宕机后能进行自动切换

##### 2、sentinel原理

- sentinel负责持续监控主节点的健康，当主节点挂掉时，自动选择一个最优的从节点切换成主节点
- 从节点来连接集群时会首先连接sentinel，通过sentinel来查询主节点的地址
- 当主节点发生故障时，sentinel会将最新的主节点地址告诉客户端，可以实现无需重启自动切换Redis

##### 3、Sentinel支持集群

- 只使用单个sentinel进程来监控Redis集群时不可靠的，当sentinel进程宕机后sentinel本身也有单点问题
- 如果有多个sentinel，Redis的客户端可以随意地连接任意一个sentinel来获取关于redis集群中的信息

##### 4、Sentinel版本

- Sentinel当前稳定版本称为Sentinel 2，Reids2.8和Redis3.0附带稳定的哨兵版本
- 安装完redis-3.2.8后，Redis-3.2.8/src/redis-sentinel启动程序redis-3.2.8/sentinel.conf是配置文件

##### 5、哨兵模式的优缺点

- 优点
    - 哨兵模式是基于主从模式的，所有主从的优点，哨兵模式都具有
    - 主从可以自动切换，系统更健壮，可用性更高（可以看作自动版的主从复制）
- 缺点
    - Redis较难支持在线扩容，在集群容量达到上限时在线扩容会变得很复杂

#### 三、codis集群

##### 1、为什么会出现codis

- 在大数据高并发场景下，单个redis实例往往会无法应对
- 首先redis内存不易过大，内存太大会导致rdb文件过大，导致主从同步时间过长
- 其次在CPU利用率上，单个redis实例只能利用单核，数据量太大，压力就会特别大

##### 2、什么是codis

- codis是redis集群解决方案之一，codis是Go语言开发的代理中间件
- 当客户端向codis发送指令时，codis负责将指令转发给后面的redis实例来执行，并将返回结果转发给客户端
- Codis是由国人前豌豆荚大神开发的，采用中心化方式的集群方案
- 因为需要代理层Proxy来进行所有请求的转发，所以对Proxy的性能要求很高

##### 3、codis部署方案

- 单个codis代理支撑的QPS比较有限，通过启动多个codis代理可以显著增加整体QPS
- 多codis还能起到容灾功能，挂掉一个codis代理还有很多codis代理可以继续服务

![img](http://v5blog.cn/assets/img/image-20210119142519124.270eaf9c.png)

##### 4、codis分片的原理

- codis负责将特定key转发到特定redis实例，codis默认将所有key划分为1024个槽位
- 首先会对客户端传来的key进行crc32计算hash值，然后将hash后的整数值对1024进行取模，这个余数就是对应的key槽位
- 每个槽位都会唯一映射到后面的多个redis实例之一，codis会在内存中维护槽位和redis实例的映射关系
- 这样有了上面key对应的槽位，那么它应该转发到那个reids实例就很明确了
- 槽位数量默认是1024，如果集群中节点较多，建议将这个数值大一些，比如2048,4096

##### 5、不同codis槽位如何同步

- 如果codis槽位值存在内存中，那么不同的codis实例间的槽位关系得不到同步
- 所以coids还需要一个分布式配置存储的数据库专门来持久化槽位关系
- codis将槽位关系存储在zookeeper中，并且提供了一个dashboard可以来观察和修改槽位关系

#### 四、Cluster集群模式

##### 1、什么是redis集群

- Redis Cluster是一种服务器Sharding技术，3.0版本开始正式提供
- Redis的哨兵模式基本已经可以实现高可用，读写分离
- 但是在这种模式下每台Redis服务器都存储相同的数据，很浪费内存
- 所以在Redis3.0上加入了Clustger集群模式，实现了Redis的分布式存储
- 也就是说每台Redis节点上存储不同的内容

##### 2、cordis集群模式弊端

- codis采用中间加一层Proxy的中心化模式，这就对Proxy的要求很高
- 因为它一旦出现故障，那么操作这个Proxy的所有客户端都无法处理
- 要想实现Proxy的高可用，还需要另外的机制来实现，例如Keepalive
- 而且增加一层Proxy进行转发，必然会有一定的性能损耗

##### 3、Cluster集群模式

- Redis官方推出的Redis Cluster另辟蹊径，它没有采用中心化模式的Proxy方案
- 而是把请求转发逻辑一部分放在客户端，一部分放在了服务端，它们之间互相配合完成请求的处理
- Redis Cluster采用16384个槽位进行路由规则的转发
- 在这个图中，每一个蓝色的圈都代表着一个Redis的服务器节点
- 它们任何两个节点之间都是相互连通的
- 客户端可以与任何一个节点连接，然后就可以访问集群中的任何一个节点，对其进行存取和其他操作
- Redis集群有16384个哈希槽，每个key通过CRC16校验后对16384取模来决定放置那个槽
- 集群的每个节点负责一部分hash槽，举个例子，比如当前集群有3个节点，那么
    - 节点A包含0带5460号哈希槽
    - 节点B包含5461带10922号哈希槽
    - 节点C包含10923带16383号哈希槽

![img](http://v5blog.cn/assets/img/image-20210223230535009.812f7270.png)