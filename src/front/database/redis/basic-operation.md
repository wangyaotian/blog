####  一、Redis基本操作

##### 1、基本链接操作

``` go
import redis
pool = redis.ConnectionPool(host='1.1.1.2',port=6379)
r = redis.Redis(conection_pool=pool)

#1 查看当前Redis所有key
print(r.keys('*'))

#2 delete(*names)删除Redis对应的key值
r.delete('num16')

#3 exists(name) 检测redis的name是否存在
print(r.exists('name09')
      
#4 keys(pattern='*') 根据模型获取redis的name
#4 keys(pattern='*') 根据模型获取redis的name
# KEYS * 匹配数据库中所有 key 。
# KEYS h?llo 匹配 hello ， hallo 和 hxllo 等。
# KEYS h*llo 匹配 hllo 和 heeeeello 等。
# KEYS h[ae]llo 匹配 hello 和 hallo ，但不匹配 hillo
print(r.keys(pattern='name*'))        #打印出Redis中所有以name开通的key

#5 expire(name ,time) 为某个redis的某个name设置超时时间
r.expire('name09',1)            # 1秒后就会删除这个key值name09

#6 rename(src, dst) 对redis的name重命名为
r.rename('num13','num13new')
```

##### 2、redis中切换数据库

``` go
# redis 127.0.0.1:6379 > SEt db_number 0	#默认使用0号数据库

# redis 127.0.0.1:6379 > SELECT 1      #使用1号数据库

# redis 127.0.0.1:6379[1]> GET db_number       # 已经切换到 1 号数据库，注意 Redis 现在的命令提符多了个 [1]
 
# redis 127.0.0.1:6379[1]> SET db_number 1     # 设置默认使用 1 号数据库
 
# redis 127.0.0.1:6379[1]> GET db_number       # 获取当前默认使用的数据库号

#1 move(name, db)) 将redis的某个值移动到指定的db下（对方库中有就不移动）
127.0.0.1:6379> move name0 4


#2 type(name) 获取name对应值的类型
127.0.0.1:6379[4]> type name0
```

##### 3、操作redis两种方法

###### 1、第一种：操作模式

``` go
import redis

r= redis.Redis(host='1.1.1.3',port=6379)
r.set('foo','bar')
print(r.get('foo'))
```

###### 2、第二种：连接池

- redis-py使用connection pool来管理对一个redis server的所有连接，避免每次建立，释放连接的开销
- 默认，每个Redis实例都会维护一个自己的连接池
- 可以直接建立一个连接池，然后作为参数Redis，这样就可以实现多个Redis实例共享一个连接池

``` go
import redis

pool=reids.ConnectionPool(host='1.1.1.3',prot=6379)

r.redis.Redis(connection_pool=pool)
r.set('foo','bar')
print(r.get('foo'))
```

##### 4、StrictRedis与Redis

###### 1、Redis与StrictRedis

- redis-py提供两个类Redis和StrictRedis用于实现Redis的命令
- StrictRedis用于实现大部分官方的命令，并使用官方的语法和命令（比如，SET命令对应与StrictRedis.set方法）
- Redis是StrictRedis的子类，用于向后兼容旧版本的redis-py
- 简单说，官方推荐使用StrictRedis方法

###### 2、StrictRedis使用

``` go
import redis
pool=redis.ConnectionPool(host='1.1.1.3',prot=6379)

r=redis.StrictRedis(connection_pool=pool)
r.set('foo','bar')
print(r.get('foo'))
```

#### 二、pipeline

##### 1、pipeling原理

###### 1、redis发送数据原理

- Redis是建立在TCP协议基础上的CS架构，客户端client对redis server采取请求响应的方式交互
- 一般来说客户端从提交请求到得到服务器响应，需要传送两个tcp报文
- 设想这样的一个场景
    - 你要批量的执行一系列redis命令，例如执行100次get key，这时你要向redis请求100次+获取响应100次
    - 如果能一次性将100个请求提交给redis server，执行完成之后批量的获取响应
    - 只需要向redis请求1次，然后批量执行完命令，一次性结果，性能是不是好很多

###### 2、未使用pipeling执行N条命令

![img1](http://v5blog.cn/assets/img/image-20210618091449043.4f89d081.png)

###### 3、使用了pipeline执行N条命令

![img2](http://v5blog.cn/assets/img/image-20210618091548530.defe1203.png)

##### 2、pipeline性能代码展示

``` go
In [1]: from django_redis import get_redis_connection       # 导入get_redis_connection模块
In [2]: redis_client = get_redis_connection('default')      # 连接redis 0号库
    
'''方法1：使用普通方法执行'''
In [3]: for i in range(99999):
   ...:     redis_client.set(i,i)

'''方法2：使用pipeline执行'''
In [4]: p1 = redis_client.pipeline()           # 实例化一个pipeline对象             
In [5]: for i in range(99999):
   ...:     p1.set(i,i)                        # 把要执行的命令打包到pipeline
In [6]: p1.execute()
```

