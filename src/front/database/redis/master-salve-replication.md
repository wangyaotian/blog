## 一、配置集群
- VMware版本号：16.0.0

| Master/Slave |     系统     | IP | Redis版本     |
|--------------|:----------:|--|-------------|
| Master       | CentOS 7.5 |  192.168.8.21 | Redis-5.0.3 |
| Slave        | CentOs 7.5 |  192.168.8.21 | Redis-5.0.3 |

### 1、安装Redis
- 在master和slave中分别安装好Redis-server
- [安装Redis](/front/database/redis/redis-install)

### 2、Master配置
- Master都是基本的配置，但要将bind 127.0.0.1改为bind 0.0.0.0,要不然Slave会连不上
- 日志提示"Error condition on socket for SYNC: Connection refused"
~~~ shell
[root@master bin]# vim /etc/redis.conf
bind 0.0.0.0 
~~~

### 3、Slave配置
- Slave除基本的配置外，需要增加 slaveof 192.168.8.22 6379
- 如果有密码就配置 masterauth
~~~ shell
[root@master bin]# vim /etc/redis.conf
bind 192.168.8.21
slaveof 192.168.8.22 6379
~~~

### 4、查看主从信息

~~~ shell
[root@master bin] # systemctl restart Redis
[root@master bin] # Redis -h 192.168.8.22 info Replication
# Replication
role:master
connected_slaves:1
slave0:ip=192.168.8.21,port=6379,state=online,offset=10,lag=1 #这里可以看到Redis从服务器信息
master_replid:11567360684815617959
master_replid2:0
master_repl_offset:10
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:10
~~~

### 5、测试是否自动同步

~~~ shell
[root@master bin] # redis -h 192.158.8.21 
192.158.8.21:6379> get name
"test"
192.158.8.21:6379> set name "test2"  #slave上写入会报错
(error) READONLY You can't write against a read only replica.

#在master上写入，在slave上可以获取
[root@master bin] # redis -h 192.158.8.22
192.158.8.22:6379> set name test
OK 
~~~

## 二、主从概念
### 1、Redis主从概念
- 一个master可以拥有多个slave，一个slave也可以拥有多个slave，如此下去，形成了一个树状的结构，即Redis的主从复制
- master用来写数据，slave用来读数据，经统计：网站的读写比率是10:1
- 通过主从配置可以实现读写分离
![img](http://v5blog.cn/assets/img/image-20210223212337922.1ec3453a.png)

### 2、Redis主从弊端
- 缺点：主节点宕机，无法继续使用
- 因为只有master可以进行写入