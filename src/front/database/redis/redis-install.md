#### 一、Redis安装

##### 1、docker安装Redis

``` dockerfile
docker search redis
docker pull reids
docker run -d --name redis -p 6379:6379 redis:latest redis-server --appendonly yes --requirepass'123456'
docker exec -ti 59c75afbdfed redis-cli -h localhost -p 6379 -a '123456'

# 测试命令
localhost:6379> keys *
localhost:6379> set name snail
localhost:6379> get name
```

##### 2、安装Redis

###### 1、安装redis

``` shell
'''一、安装gcc依赖'''
[root@k8s-node2 ~]# yum install -y gcc 

'''二、下载并解压安装包'''
[root@k8s-node2 ~]# wget http://download.redis.io/releases/redis-5.0.3.tar.gz
[root@k8s-node2 ~]# tar -zxvf redis-5.0.3.tar.gz

'''三、cd切换到redis解压目录下，执行编译'''
[root@k8s-node2 ~]# cd redis-5.0.3
[root@k8s-node2 ~]# make

'''四、安装并指定安装目录 '''
[root@localhost redis-5.0.3]# make install PREFIX=/usr/local/redis

'''五、前台启动服务'''
[root@localhost redis-5.0.3]# cd /usr/local/redis/bin/
[root@localhost bin]# ./redis-server
```

###### 2、配置后台启动

``` sh
# 一：从 redis 的源码目录中复制 redis.conf 到 redis 的安装目录
[root@localhost bin]# cp /root/redis-5.0.3/redis.conf  /usr/local/redis/bin/
# 二：修改 redis.conf 文件，把 daemonize no 改为 daemonize yes
[root@localhost bin]# vi /usr/local/redis/bin/redis.conf
daemonize yes
# 三：后台启动
[root@localhost bin]# ./redis-server redis.conf
[root@k8s-node2 bin]# ps -ef|grep redis
root       7264      1  0 16:53 ?        00:00:00 ./redis-server 127.0.0.1:6379
```

###### 3、设置开机启动

- 添加redis管理脚本

``` sh
[root@k8s-node2 ~]# vi /etc/systemd/system/redis.service
[Unit]
Description=redis-server
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /usr/local/redis/bin/redis.conf
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

- 设置开机自动

``` sh
[root@k8s-node2 bin]# systemctl daemon-reload
[root@k8s-node2 bin]# systemctl start redis.service
[root@k8s-node2 bin]# systemctl enable redis.service
[root@k8s-node2 bin]# ln -s /usr/local/redis/bin/redis-cli /usr/bin/redis
```

###### 4、服务操作命令

``` sh
[root@k8s-node2 ~]# systemctl start redis.service         #启动redis服务
[root@k8s-node2 ~]# systemctl stop redis.service          #停止redis服务
[root@k8s-node2 ~]# systemctl restart redis.service         #重新启动服务
[root@k8s-node2 ~]# systemctl status redis.service         #查看服务当前状态
[root@k8s-node2 ~]# systemctl enable redis.service         #设置开机自启动
[root@k8s-node2 ~]# systemctl disable redis.service         #停止开机自启动
```

###### 5、将redis加入环境变量

``` sh
[root@k8s-node2 ~]# vi /etc/profile           # 在最后添加以下内容
export PATH=$PATH:/usr/local/redis/bin/
[root@k8s-node2 ~]# source /etc/profile         # 使配置生效
```

#### 二、Redis基本配置

- Redis的配置信息在``/usr/local/redis/bin/redis.conf `下。

``` sh
# 1）绑定ip：如果需要远程访问，可将此⾏注释，或绑定⼀个真实ip
bind 127.0.0.1
# 2）端⼝，默认为6379
port 6379
# 3）以守护进程运⾏，则不会在命令⾏阻塞，类似于服务,推荐设置为yes
daemonize yes
# 4）数据⽂件
dbfilename dump.rdb
# 5）数据⽂件存储路径
dir /var/lib/redis
# 6）⽇志⽂件
logfile "/var/log/redis/redis-server.log"
# 7）数据库，默认有16个
database 16
# 8）配置主从模式
slaveof
# 9）关闭包含模式，可以远程连接
protected-mode no
```

#### 三、win10安装redis

##### 1、下载Redis的软件

![img](http://v5blog.cn/assets/img/image-20210526141702190.16235f44.png)

##### 2、添加环境变量

![img](http://v5blog.cn/assets/img/image-20210526142719144.3e207b54.png)