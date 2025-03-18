#### 一、安装mysql主从服务器

##### 1、初始化docker中mysql挂载目录

``` dockerfile
# 新建2个目录，存放master和salver的配置和数据
cd ~   # ~ 代表家目录   /home/你的用户名/
mkdir mysql_master
mkdir mysql_slave

cd mysql_master
mkdir data
cp -r /etc/mysql/mysql.conf.d ./

cd ../mysql_slave
mkdir data
cp -r /etc/mysql/mysql.conf.d ./
```

##### 2、MySQL主机配置和从机配置

- 主机配置

``` dockerfile
# vim /root/mysql_master/mysql.conf.d/mysqld.cnf
# 端口
port = 3307
# 开启日志
general_log_file = /var/log/mysql/mysql.log
general_log = 1
# 主机唯一编号
server-id = 1
# binlog日志文件
log_bin = /var/log/mysql/mysql-bin.log
```

- 从机配置

``` dockerfile
# 从机配置  /root/mysql_slave/mysql.conf.d/mysqld.cnf
port = 3308
general_log = 0  
server-id = 2
```

##### 3、使用docker安装mysql主从

``` dockerfile
#1.下载mysql 5.7.32版本的mysql
docker pull mysql:5.7.32                     # 直接通过官方下载

#2.启动master
sudo docker run  -d --name mysql-master -e MYSQL_ROOT_PASSWORD=1 --network=host -v /root/mysql_master/data:/var/lib/mysql -v /root/mysql_master/mysql.conf.d:/etc/mysql/mysql.conf.d mysql:5.7.32
            
#3.启动slave         
sudo docker run  -d --name mysql-slave -e MYSQL_ROOT_PASSWORD=1 --network=host -v /root/mysql_slave/data:/var/lib/mysql -v /root/mysql_slave/mysql.conf.d:/etc/mysql/mysql.conf.d mysql:5.7.32
            
#4.测试master/slave  (密码是1)
mysql -uroot -p1 -h 192.168.56.100 --port=3307
mysql -uroot -p1 -h 192.168.56.100 --port=3308

#5.导出导入数据
#5.1 从主机导出
mysqldump -uroot -p1 -h192.168.56.100 -P3307 --all-databases --lock-all-tables > ~/master_db.sql
#5.2 导入从机
mysql -uroot -p1 -h192.168.56.100 -P3308 < ~/master_db.sql
```

##### 4、配置Mysql主从

- 配置mysql master

``` dockerfile
# 配置master

# 登录到主机
mysql –uroot –p -h 192.168.56.100 -P 3307
# 创建从机账号
GRANT REPLICATION SLAVE ON *.* TO 'slave'@'%' identified by 'slave';
# 刷新权限
FLUSH PRIVILEGES;

# 查看二进制日志信息, 记录 文件名 和 偏移量, 后面会用到
mysql> SHOW MASTER STATUS;
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000003 |      722 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
```

- 配置mysql slave

```
# 配置slave
# 登录到从机
$ mysql -uroot -p1 -h192.168.56.100 -P3308
# 从机连接到主机
$ change master to master_host='192.168.56.100', master_port=3307, master_user='slave', master_password='slave',master_log_file='mysql-bin.000003', master_log_pos=722;
# 开启从机服务
$ start slave;
# 展示从机服务状态
$ show slave status \G

mysql> show slave status \G
*************************** 1. row ***************************
               Slave_IO_State: Waiting for master to send event
                  Master_Host: 192.168.56.100
                  Master_User: slave
                  Master_Port: 3307
                Connect_Retry: 60
              Master_Log_File: mysql-bin.000003
          Read_Master_Log_Pos: 722
               Relay_Log_File: dev-relay-bin.000002
                Relay_Log_Pos: 320
        Relay_Master_Log_File: mysql-bin.000003
             Slave_IO_Running: Yes
            Slave_SQL_Running: Yes
```

#### 二、diango使用mysql主从

##### 1、django中配置mysql主从

``` shell
# 配置django
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'syl',
        'HOST': '127.0.0.1',
        'PORT': '3307',
        'USER': 'root',
        'PASSWORD': '1',
    },
    'slave': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'syl',
        'HOST': '127.0.0.1',
        'PORT': '3308',
        'USER': 'root',
        'PASSWORD': '1',
    }
}

# 数据库路由配置
DATABASE_ROUTERS = ['utils.db_router.MasterSlaveDBRouter']
```

##### 2、编辑mysql路由文件

``` shell
# utils/db_router.py
class MasterSlaveDBRouter(object):
    """数据库读写路由"""

    def db_for_read(self, model, **hints):
        """读"""
        return "slave"

    def db_for_write(self, model, **hints):
        """写"""
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        """是否运行关联操作"""
        return True
```

