## 一、缓存读写策略
### 1、旁路缓存
#### 1、概述
- 旁路缓存使用比较多的一个缓存读写模式，比较适合请求比较多的场景
- 服务端需要同时维系db和cache，并且是以db的结果为准
- 读策略
  - 先读cache
  - cache找不到从db中读取最新数据缓存到cache(需要应用程序读取db写入cache)
- 写策略
  - 先更新db
  - 然后直接删除cache（下次读取更新到cache ）
- 特点
  - 实现简单，能够保证数据的强一致性
  - 有大量的写操作或者缓存失效的情况，可能会导致数据库压力大

#### 2、缺陷和解决
- **缺陷1：** 首次请求数据一定不在cache的问题
  - 可以将热点数据提现写入到cache中
- **缺陷2：**写操作比较频繁的话导致cache中的数据会被频繁被删除
  - 强一致性
    - 更新db的时候同样更新cache(加分布式锁)
  - 可以短暂地允许数据库和缓存数据不一致的场景
    - 更新db的时候同样更新cache，但是给缓存加一个比较短的过期时间
    
### 2、读写穿透
#### 1、概述
- 读写穿透是同步更新cache和db
- Redis本身并不支持直接读穿透策略，这需要通过客户端库或者中间件来实现
- 比如，使用go-cache或者一些其他的缓存框架，可以很方便地实现这种策略
- 在Python中也可以自己使用装饰器实现
-读写穿透中服务端把cache视为主要数据存储，从中读取数据并将数据写入其中
- cache服务负责将此数据读取和写入db，从而减轻了应用程序的职责
- 这种缓存读写策略小伙伴们应该也发现了在平时开发过程中非常少见
- 抛去性能方面的影响，大概率是因为我们经常使用的分布式缓存Redis并没有提供cache将数据写入db的功能

#### 2、写穿透
- 先差cache，cache中不存在，直接更新db
- cache中存在，则先更新cache，然后cache服务自己更新db(同步更新cache和db)
- cache找不到从db中读取最新数据缓存到cache
- 住：应用只需要读取缓存，未命中缓存系统自己读取db吸入cache
![img](http://v5blog.cn/assets/img/image-20240318141826896.125db00e.png)

#### 3、读穿透
- 从cache中读取数据，读取到就直接返回
- 读取不到的话，先从db加载，写入到cache后返回响应
![img](http://v5blog.cn/assets/img/image-20240318142138885.ce194d30.png)

#### 4、读写穿透code

- 读写穿透和旁路缓存区别
    - 旁路缓存如果不存在数据，需要应用在业务逻辑中查询db写入cache
    - 读写穿透不是在业务逻辑中实现，而是在Redis的连接客户端中直接实现了，业务中可以直接使用即可
- eg:go-cache库 实现了读写穿透功能

~~~ go
package main
import (
	"fmt"
	"github.com/patrickmn/go-cache"
	"time"
)
func main() {
    //创建一个缓存，缓存像在5分钟后过期，每隔10分钟清理一次过期缓存
	c := cache.New(5*time.Minute, 10*time.Minute)
    //假设这是你的数据库查询函数
    queryFromDB := func(key string) (interface{}, error) {
      	fmt.Printf("Fetching data from db for key: %s\n", key)
		// 这里返回的数据就是需要从 MySQL 中查询的数据
		return fmt.Sprintf("Data for %s", key), nil
    }
   	// 使用cache的Add方法添加数据
	data, found := c.Get("product1")
	if !found {
		data, _ = queryFromDB("product1")
		c.Add("product1", data, cache.DefaultExpiration)
	}
	fmt.Println(data)

	// 再次获取数据，这次会从缓存中获取
	data, found = c.Get("product1")
	fmt.Println(data)
}
~~~

### 3、异步缓存写入
- 异步缓存写入和读写穿透很相似，两者都是由cache服务来负责cache和db的读写
- 但是，两个又有很大的不同：
  - 读写穿透是同步更新cache和db
  - 而异步缓存写入则是只更新缓存，不直接更新db，而是改为异步批量的方式来更新db
- 这种方式对数据一致性带来了更大的挑战，比如cache数据可能还没异步更新db的话，cache服务可能就挂掉了
- 这种策略在我们平时开发过程中也非常非常少见，但是不代表它的应用场景少
- 比如消息队列中消息的异步写入磁盘，Mysql的Innodb Buffer Pool机制都用到了这种策略
- 异步缓存写入下的db写性能非常高，非常适合一些数据经常变化又对数据一致性要求没那么高的场景，比如浏览量，点赞量

## 二、Redis缓存实现
>第一步：查询Redis缓存是否存在这个key\
>第二步：如果存在这个key，不用去MySQL中查询，直接从Redis中取出数据即可（减轻了MySQL压力)\
>第三步：如果查询的key不存在，先到MySQL中查询数据，让后设置到Redis中，下次查询就有了
 
### 1、2B青年操作
- 2B青年每一个需要使用缓存的数据，我都写一个方法获取数据，再写一个方法处理缓存。
- 若需要用到缓存的地方越来越多，每一个都需要这么写一套代码，代码冗余繁琐。

~~~ php
<?php
// 获取readed缓存
function get_readed_cache() {
    $key = 'readed';
    if (apcu_exists($key)) {
        return apcu_fetch($key);
     }else
     {
     // 不存在缓存时执行SQL查询（示例SQL）
     $data = "select name from tb";
     // 计算到下一个整小时的剩余秒数（与Python逻辑一致）
     $expire = 3600 - (time() % 3600);// 存储缓存apcu_store($key, $data, $expire);return $data;}

}

function test1() {return get_readed_cache();
}

function test2() {return get_readed_cache();
}

// 执行测试
test1();
test2();
?>

~~~ 

### 2、NB青年
- NB青年可以使用三级装饰器，在装饰器中判断key如果存在就从reids中获取，如果不存在就从数据库查询，并设置到reids中

~~~ 
<?php

require 'vendor/autoload.php'; // 引入Composer自动加载文件

use Predis\Client;

// 初始化Redis客户端
$redis = new Client([
    'scheme' => 'tcp',
    'host'   => '127.0.0.1',
    'port'   => 6379,
]);

// 获取Redis缓存的装饰器
function Redis_cache($key, $timeout, $callback) {
    global $redis;

    if ($redis->exists($key)) { // 判断缓存是否存在
        $data = $redis->get($key);
    } else {
        // 若不存在则执行获取数据的方法
        $data = call_user_func($callback); // 从数据库查询到数据设置到Redis中
        $redis->set($key, $data);
        $redis->expire($key, $timeout); // 设置缓存超时时间
    }
    return $data;
}

// 键值为test，超时时间为60秒
function get_test_data() {
    // 获取Blog模型随机排序前3条数据
    // (Blog模型是我自己的模型，具体代码根据自己需求获取数据)
    // values执行结果，将返回一个字典。字典可以直接存入Redis
    // $data = Blog::orderByRaw('RAND()')->take(3)->get(['id', 'caption']);
    $data = '从数据库查询到了数据';
    return $data;
}

// 键值为name，超时时间为60秒
function get_test_name() {
    // 获取Blog模型随机排序前3条数据
    // (Blog模型是我自己的模型，具体代码根据自己需求获取数据)
    // values执行结果，将返回一个字典。字典可以直接存入Redis
    // $data = Blog::orderByRaw('RAND()')->take(3)->get(['id', 'caption']);
    $data = '从数据库查询到了数据';
    return $data;
}

// 使用缓存装饰器
$testData = Redis_cache('test', 60, 'get_test_data');
$testName = Redis_cache('name', 60, 'get_test_name');

echo $testData . "\n";
echo $testName . "\n";

?>
~~~ 



