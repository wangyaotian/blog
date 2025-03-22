## 一、机器配置
- [Redis各种集群模式](/front/database/redis/cluster)
-  VMware版本号：16.0.0
- 在两台机器上分别安装好Redis服务
- [安装Redis](/front/database/redis/redis-install)

| 系统         | IP           |         运行实例端口         | Redis版本    |
|------------|--------------|:----------------------:|------------|
| Centos 7.5 | 192.168.8.21 | 7000<br/>7001<br/>7002 | Redis-5.0.3 |
| Centos 7.5 | 192.168.8.22 | 7003<br/>7004<br/>7005 | Redis-5.0.3|

## 二、192.168.8.21配置
- 创建conf配置文件夹
- 三个文件的配置分别在 prot、pidfile、cluster-config-flie三项
~~~ shell
[root@master bin]# mkdir /root/conf/
~~~ 

#### 1、7000.conf
~~~ shell
[root@master bin]# vim /root/conf/7000.conf
port 7000
bind 192.168.8.21 //绑定IP
daemonize yes //后台运行
pidfile 7000.pid //进程ID
cluster-enabled yes //开启集群
cluster-config-file 7000.conf //配置文件
cluster-node-timeout 5000 //节点超时时间
appendonly yes  //开启AOF持久化
~~~

### 2、7001.conf
~~~ shell
[root@master bin]# vim /root/conf/7001.conf
port 7001 
bind 192.168.8.21   //绑定IP
daemonize yes       //后台运行
pidfile 7001.pid    //进程ID
cluster-enabled yes //开启集群
cluster-config-file 7001.conf   //配置文件
cluster-node-timeout 5000       //节点超时时间
appendonly yes                 //开启AOF持久化
~~~

### 3、7002.conf
~~~ shell
[root@master bin]# vim /root/conf/7002.conf
port 7002
bind 192.168.8.21   //绑定IP
daemonize yes       //后台运行
pidfile 7002.pid    //进程ID
cluster-enabled yes //开启集群
cluster-config-file 7002.conf   //配置文件
cluster-node-timeout 5000       //节点超时时间
appendonly yes                 //开启AOF持久化
~~~

### 4、启动Redis服务

~~~ shell
[root@master conf]# Redis-server 7000.conf
[root@master conf]# Redis-server 7001.conf
[root@master conf]# Redis-server 7002.conf
~~~

## 三、192.168.8.22配置
- 创建conf配置文件夹
- 三个文件的配置分别在 prot、pidfile、cluster-config-flie三项
~~~ shell
[root@master bin]# mkdir /root/conf/
~~~
### 1、7003.conf
~~~ shell
[root@master bin]# vim /root/conf/7003.conf
port 7003
bind 192.168.8.22   //绑定IP
daemonize yes       //后台运行
pidfile 7003.pid    //进程ID
cluster-enabled yes //开启集群
cluster-config-file 7003.conf   //配置文件
cluster-node-timeout 5000       //节点超时时间
appendonly yes                 //开启AOF持久化
~~~

### 2、7004.conf
~~~ shell
[root@master bin]# vim /root/conf/7004.conf
port 7004
bind 192.168.8.22   //绑定IP
daemonize yes       //后台运行
pidfile 7004.pid    //进程ID
cluster-enabled yes //开启集群
cluster-config-file 7004.conf   //配置文件
cluster-node-timeout 5000       //节点超时时间
appendonly yes                 //开启AOF持久化
~~~

### 3、7005.conf
~~~ shell
[root@master bin]# vim /root/conf/7005.conf
port 7005
bind 192.168.8.22   //绑定IP
daemonize yes       //后台运行
pidfile 7005.pid    //进程ID
cluster-enabled yes //开启集群
cluster-config-file 7005.conf   //配置文件
cluster-node-timeout 5000       //节点超时时间
appendonly yes                 //开启AOF持久化
~~~

### 4、启动Redis服务
~~~ shell
[root@master conf]# Redis-server 7003.conf
[root@master conf]# Redis-server 7004.conf
[root@master conf]# Redis-server 7005.conf
~~~
## 四、集群搭建
### 1、1创建集群
- Redis-trib.rb是官方提供的Redis Cluster的管理工具，无需额外下载，默认位于源码包的src目录下
~~~ shell
'''将Redis-trib.rb复制到/usr/local/bin/下，以便在任何⽬录下调⽤此命令'''
[root@k8s-node1 conf]# cp /root/Redis-5.0.3/src/Redis-trib.rb  /usr/local/bin/
~~~ 
- 因该命令需要使用ruby环境，所以需要安装ruby环境
~~~ shell
[root@k8s-node1 conf]# yum install ruby -y
~~~
- 启动集群
~~~ shell
[root@k8s-node2 src]# Redis-cli --cluster create 192.168.56.65:7000 192.168.56.65:7001 192.168.56.65:7002 192.168.56.66:7003 192.168.56.66:7004 192.168.56.66:7005 --cluster-replicas 1
~~~

