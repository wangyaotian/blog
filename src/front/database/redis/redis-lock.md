## Redis分布式锁

### 一、Redis事务介绍

#### 1.事务介绍

- Redis事务是可以一次执行多个命令，本质是一组命令的集合
- 一个事务中的所有命令都会序列化，按顺序串行化的执行而不会被其他命令插入
- **作用：** 一个队列中，一次性、顺序性、排他性的执行一系列命令

~~~ shell
# Multi 命令用于标记一个事务块的开始事务块内的多条命令会按照先后顺序被放进一个队列当中，最后由 EXEC 命令原子性(atomic)地执行。
> multi # 开始一个Redis事务
incr books
incr books

> exec # 执行一个Redis事务
> discard # 取消一个Redis事务

~~~
- Redis事务提供以下几个命令

~~~ shell
MULTI # 开启事务
EXEC # 执行事务
DISCARD # 取消事务
UNWATCH # 取消watch命令对所有key的监视
WATCH key [key ...] # 监视一个(或多个) key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断

~~~

#### 2.如何解决Redis事务的缺陷
- Redis从2.6版本开始支持执行Lua脚本，它的功能和事务非常类似
- 我们可以利用Lua脚本来批量执行多条Redis命令
- 一段Lua脚本可以视作一条命令执行
- 一段Lua脚本执行过程中不会有其他脚本或Redis命令同时执行，保证了操作不会被其他指令插入或打扰
- 不过，如果Lua脚本运行时出错并中途结束，出错之后的命令是不会被执行的
- 并且，出错之前执行的命令是无法被撤销的，无法实现类似关系型数据库执行失败可以回滚的那种原子性操作
- 因此，严格意义上讲，Redis的事务并不能完全实现关系型数据库的事务功能
- 如果想要让Lua脚本中的命令全部执行，必须保证语句语法和命令都是正确的，否则，Lua脚本执行过程中出错，错误之前执行的命令是会被执行的

#### watch乐观锁
- **实质：** WATCH只会在数据被其他客户端抢先修改了的情况下通知执行命令的这个客户端 **（通过WatchError异常）** 但不会阻止其他客户端对数据的修改
- **原理**
  - 当用户购买时，通过WATCH监听用户库存，如果库存在watch监听后发生改变，就会捕获异常而放弃对库存减一操作
  - 如果库存没有监听到变化并且数量大于1，则库存数量减一，并执行任务
- **弊端**
  - Redis在尝试完成一个事务的时候,可能会因为事务的失败而重复尝试重新执行
  - 保证商品的库存量正确是一件很重要的事情，但是单纯的使用WATCH这样的机制对服务器压力过大
  
> 使用redis的watch+multi指令实现超卖

~~~ php
<?php

require 'vendor/autoload.php'; // 引入 Predis 自动加载文件

use Predis\Client;

function sale($redis) {
    while (true) {
        try {
            $redis->watch('apple'); // 监听 key 值为 apple 的数据数量改变
            $count = (int)$redis->get('apple');
            echo "拿取到了苹果的数量: $count\n";

            $redis->multi(); // 事务开始
            if ($count > 0) { // 如果此时还有库存
                $redis->set('apple', $count - 1);
                $redis->exec(); // 执行事务
            }
            $redis->unwatch();
            break; // 当库存成功减一或没有库存时跳出执行循环
        } catch (Exception $e) { // 当出现 watch 监听值出现修改时，抛出异常
            echo "[Error]: " . $e->getMessage() . "\n";
            continue; // 继续尝试执行
        }
    }
}

$redis = new Client([
    'host' => '127.0.0.1',
    'port' => 6379,
]); // 连接 Redis

$redis->set('apple', 1000); // 首先在 Redis 中设置某商品 apple 对应数量 value 值为 1000
sale($redis);
~~~

#### setnx分布式锁
- 分布式锁本质是占一个坑，当别的进程也要来占坑时发现已经被占，就会放弃或者稍后重试
- 占坑一般使用setnx(set if not exists)指令，只允许被一个客户端占坑
- 先来先占，用完了在调用del指令释放坑

~~~ shell
> setnx lock:codehole true // 尝试获取锁
.... do something critical ....
> del lock:codehole // 释放锁
~~~

##### 分布式锁的解决超卖

- setnx+watch+multi解决超卖问题   

~~~ php

<?php
require 'predis/autoload.php';
Predis\Autoloader::register();

use Predis\Client;

// 1. 初始化连接函数
function get_conn($host, $port = 6379) {
    $rs = new Client([
        'host' => $host,
        'port' => $port,
    ]);
    return $rs;
}

// 2. 构建Redis锁
function acquire_lock($rs, $lock_name, $expire_time = 10) {
    $identifier = uniqid();
    $end = microtime(true) + $expire_time;
    while (microtime(true) < $end) {
        if ($rs->setnx($lock_name, $identifier)) {
            return $identifier;
        }
        usleep(1000); // 休眠1毫秒
    }
    return false;
}

// 3. 释放锁
function release_lock($rs, $lockname, $identifier) {
    $rs->watch($lockname);
    if ($rs->get($lockname) == $identifier) {
        $rs->multi();
        $rs->del($lockname);
        $rs->exec();
        return true;
    }
    $rs->unwatch();
    return false;
}

// 在业务函数中使用上面的锁
function sale($rs) {
    $start = microtime(true); // 程序启动时间
    while (true) {
        $lock = acquire_lock($rs, 'lock');
        if (!$lock) { // 持锁失败
            continue;
        }
        try {
            $count = intval($rs->get('apple')); // 取量
            $rs->set('apple', $count - 1); // 减量
            echo '当前库存量: ' . $count . PHP_EOL;
            break;
        } finally {
            release_lock($rs, 'lock', $lock);
        }
    }
    echo '[time]: ' . (microtime(true) - $start) . PHP_EOL;
}

$rs = get_conn('127.0.0.1', 6379); // 连接Redis
$rs->set('apple', 1000); // 首先在Redis中设置某商品apple 对应数量value值为1000
sale($rs);
?>
~~~

##### 优化
- 给分布式锁加超时时间防止死锁
~~~ php

<?php
require 'predis/autoload.php';
Predis\Autoloader::register();

use Predis\Client;

// 获取 Redis 连接
function get_conn($host, $port = 6379) {
    $rs = new Client([
        'host' => $host,
        'port' => $port,
    ]);
    return $rs;
}

// 获取带有过期时间的锁
function acquire_expire_lock($rs, $lock_name, $expire_time = 10, $locked_time = 10) {
    $identifier = uniqid(); // 生成唯一标识符
    $end = microtime(true) + $expire_time; // 获取锁的超时时间

    while (microtime(true) < $end) {
        if ($rs->setnx($lock_name, $identifier)) { // 尝试获取锁
            $rs->expire($lock_name, $locked_time); // 设置锁的过期时间
            return $identifier; // 返回锁的唯一标识符
        }
        usleep(1000); // 休眠 1 毫秒
    }
    return false; // 获取锁失败
}

// 示例：使用锁
$rs = get_conn('127.0.0.1', 6379); // 连接 Redis
$lock_name = 'my_lock';
$identifier = acquire_expire_lock($rs, $lock_name, 10, 10); // 获取锁

if ($identifier) {
    echo "成功获取锁，标识符: $identifier\n";
    // 在这里执行业务逻辑
    // 释放锁
    $rs->del($lock_name);
    echo "锁已释放\n";
} else {
    echo "获取锁失败\n";
}
?>


~~~

### 二、Redis分布式锁不可靠

#### 1.Redis分布式锁不可靠产生的原因
- **锁超时：** 线程A获取了锁，并设置了超时时间，由于执行时间长,导致锁的超时时间到期
- **锁释放：** 线程A的锁超时，系统自动将锁释放，但是此时线程A的业务逻辑可能还没有执行完成
- **其他线程获取锁：** 在锁被释放的瞬间，其他线程B获取了锁
- **线程A继续执行：**线程A完成后释放锁，由于锁已经被线程B获取，线程A误释放了线程B持有的锁

#### 2.解决误释放其他线程锁的方法
- 加锁时指定锁标识
- 是否锁是判断当前持有的锁是否是自己的锁标识

~~~ php
require 'vendor/autoload.php';

    use Predis\Client;

class DistributedLock
{
    private $redis;
    private $lockKey;
    private $lockValue;

    public function __construct($redisHost = '127.0.0.1', $redisPort = 6379, $redisDb = 0, $lockKey = 'distributed_lock')
    {
        $this->redis = new Client(['host' => $redisHost, 'port' => $redisPort, 'database' => $redisDb,]);
        $this->lockKey = $lockKey;
        $this->lockValue = null;
    }

    public function acquireLock($timeout = 10)
    {
        $identifier = uniqid(); // 锁标识$endTime = microtime(true) + $timeout; // 过期超时时间while (microtime(true) < $endTime) {// 当获取锁的行为超过有效时间，则退出循环，本次取锁失败，返回 falseif ($this->redis->set($this->lockKey, $identifier, 'NX', 'EX', $timeout)) {$this->lockValue = $identifier;return true;}usleep(100000); // 等待 0.1 秒}return false;}public function releaseLock(){// 使用 Lua 脚本确保释放锁的操作是原子性的$luaScript = <<<LUAif redis.call("get", KEYS[1]) == ARGV[1] thenreturn redis.call("del", KEYS[1])elsereturn 0end
        LUA;
        try {
            $this->redis->eval($luaScript, 1, $this->lockKey, $this->lockValue);
        } catch (Exception $e) {// 处理异常}}
        }

// 使用示例
        $lock = new DistributedLock();

        try {
            if ($lock->acquireLock()) {// 执行需要加锁的操作echo "Lock acquired successfully\n";sleep(5);} else {echo "Failed to acquire lock within timeout\n";}
            }
        catch
            (Exception $e) {
                echo "An error occurred: " . $e->getMessage() . "\n";
            } finally {
                $lock->releaseLock();
                echo "Lock released\n";
            }

~~~

#### 3.抢购业务中如何解决此问题
- 进入业务后业务先将库存减1存入库存（就是先假设商品能卖成功）
- 分布式锁不仅判断锁也能判断库存，如果库存不够也不准进入
- 举例：
  - 比如库存10个，每个请求进来后都将缓存库存-1，这时12个请求过来。第11、12个是进不来的
  - 但这个时候卖失败两个，缓存库存+2
  - 后面的第13、14个请求就能进来了要注意的是库存+-是否安全的
- 主要利用Redis在哈希表中的字段上执行增加或减少操作的原子性来实现
~~~ shell
# 创建一个名为key：info的哈希表，并设置其中的sotock字段的初始值为10
HSET key:info count 10
# 对名为key:info的哈希表中的count字段递减1操作
HINCRBY key:info count -1
~~~

### 三、看门狗（Watchdog）
- Redis分布式锁可以引入看门狗机制（watchdog）,通过动态延长锁的过期时间，确保在业务逻辑执行期间，锁不会过期
- 看门狗的作用是在锁的有效时间内，不断地延长锁的过期时间，以防止锁在业务逻辑执行期间被自动释放
- 看门狗的实现原理是在获取锁时，同时启动一个后台线程，定期检查锁的过期时间，并根据需要进行续期
- 当业务逻辑执行完毕后，看门狗线程会被终止，锁的过期时间不会被延长
- **加锁操作：** Redis加锁方式是使用SET key value NX PX expire_time命令，其中NX表示只在键不存在时设置值，PX表示设置过期时间的单位为毫秒
- **启动看门狗：**
  - 当客户端成功获取到锁后，会启动一个后台线程（看门狗），这个线程定期检查锁是否仍然持有
  - 如果仍然持有，就会向Redis发生续约请求（延长锁的过期时间）
  - 这样，锁的过期时间在看门狗的管理下动态延长。直到业务逻辑执行完毕
- **定期续约：**
  - 看门狗线程会以一个小于锁过期时间的间隔定期向Redis发送续约请求
  - 例如，如果锁的初始过期时间是30秒，客户端每隔15秒就会向Redis发送续约请求，将锁的过期时间重新设置为30秒
- **释放锁：** 当业务逻辑执行完毕后，客户端显式地调用DEL命令释放锁，同时停止看门狗线程

### 四.Redlock
- Redlock的主要作用是在多个Redis实例上实现分布式锁
- 确保在网络分区、部分节点不可用、网络延迟等复杂分布式环境下，仍能提供一种安全且高效的分布式锁机制
- 其核心思想是在多节点Redis集群中通过一定的策略，确保锁只被一个客户端持有，从而避免多个客户端同时执行临界区代码

#### 1、Redlock工作原理
Redlock的工作流程大致分为以下几个步骤
- **部署多实例Redis：**
  - 首先需要在不同的物理机器或虚拟机上部署多个Redis实例（至少3个，一般建议使用5个Redis实例）
  - 这些实例互相独立，不需要主从同步，也不需要复制数据，它们只作为独立的锁存储单元
- **获取锁：**
  - 客户端生成一个UUID，然后依次向多个Redis实例发送SET resource_name UUID NX PX ttl命令请求加锁
  - NX确保锁定资源时，只有资源未被其他客户端占用才会成功
  - PX ttl设置锁的过期时间，防止客户端在持有锁期间崩溃或网络分区导致锁无法释放
  - 锁请求的超时时间通常较短（如10毫秒），以避免因网络延迟导致的阻塞
- **判断锁是否成功：**
  - 客户端必须至少在半数以上的Redis实例上成功获取锁（假设是5个实例，则至少需要在3个实例上获取到锁）
  - 只有当客户端能够在一个合理的时间窗口内（比如锁的有效期）成功获取到多个实例的锁时，才会认为加锁成功
- **计算是否加锁成功：**
- 客户端在多个Redis实例上获取锁，并且获取过程中时长小于锁的TTL时，认为成功获取了全局锁
- 若加锁失败，客户端应及时释放已经获取的锁，避免资源被长时间占用
- **释放锁：**
  - 当客户端完成对共享资源的操作后，需要释放锁
  - 客户端向所有Redis实例发送DEL resource_name命令，以释放锁
  - 无论加锁是否成功，客户端都应该在操作完成后释放锁，以避免资源被长时间占用

#### 2、Redlock正确性保证
- **防止网络分区问题:**
  - 即使某些Redis实例因为网络问题或故障无法响应请求
  - 客户端依然可以通过与多数Redis实例的交互来确保锁的安全性
- **容错性：**
  - Redlock机制要求客户端必须在大多数实例上获取锁
  - 这意味着即使部分节点发生故障（如有一个节点宕机）,也不会影响锁的安全性
- **锁的自动失效：**
  - Redis提供的TTL机制确保即使客户端崩溃，锁也会在超时时间到期后自动释放，防止死锁
- **锁的唯一性：**
  - 每次获取锁时，客户端生成的UUID确保即使在多个Redis实例上获取同一咨询的锁，每个客户端持有的锁都是唯一的

#### 3、Redlock使用场景
- **分布式任务调度：**
  - 在分布式环境中，多个工作节点可能会并发执行同一个任务
  - 通过Redlock，确保只有一个节点能执行任务，其他节点会被阻塞
- **电商系统中的订单处理：**
  - 在电商系统中，多个用户可能会同时尝试购买库存有限的商品
  - 通过Redlock，可以确保每个商品的库存更新是原子性的，避免出现超卖的情况
- **分布式缓存更新：**
  - 在分布式缓存中，多个服务实例可能会同时更新同一个缓存条目
  - 通过Redlock，确保缓存更新操作的顺序性和唯一性，避免出现数据不一致问题
- **跨区域分布式系统：**
  - 在跨区域的分布式系统中，由于网络延迟和分区问题，可能会导致多个节点同时持有锁
  - 使用Redlock，可以在网络延迟较大的环境中确保锁的安全性和一致性

#### 4、Redlock的局限性
- **网络延迟问题：**
  - Redlock依赖于客户端在多个实例上的时间窗口判断锁的有效性
  - 若网络延迟较大，可能导致客户端误判锁的获取状态
- **Redis实例故障：**
  - 如果在加锁过程中，Redis实例大规模宕机，Redlock可能无法及时释放锁，影响其他客户端获取锁
- **时间一致性假设：**
  - Redlock机制假设Redis实例之间的时钟同步是大致一致的，这在大规模分布式环境中可能不完成成立