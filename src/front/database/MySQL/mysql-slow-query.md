## 一、MySQL慢查询

##### 1、mysql慢查询

- 什么是慢查询
    - mysql的慢查询日志，用来记录在MySQL中响应时间超过阀值的语句
    - 具体指运行时间超过long_query_time值的SQL，则会被记录到慢查询日志中
    - long_query_time的默认值为10，意思是运行10秒以上（不含10秒）的语句
- 慢查询日志作用
    - 作用是，帮助我们发现那些执行时间特别长的SQL查询，并且有针对性地进行优化
    - 当我们运行变慢的时候，检查一下慢查询日志，找到那些慢查询，对解决问题很有帮助

##### 2、开启慢查询

``` mysql
-- 查看慢查询配置
show variables like "%slow_query_log%";
-- 开启慢查询日志
set global slow_query_log="ON";
-- 查看long_query_time阈值
show variables like "%long_queru_time%";
-- 修改long_query_time阈值
set global long_query_time = 1;
-- 查看long_query_time阈值
show global variables like '%long_query_time%';l
```

- 查询sql慢查询

``` mysql
-- 查看已经被记录的慢查询数量
mysql> SHOW GLOBAL STATUS LIKE '%Slow_queries%';
-- 模拟慢查询
mysql> select sleep(4);
mysql> select sleep(6);
-- 查看慢查询日志位置
mysql> show variables like '%slow_query_log%';
```

- 查看慢查询日志
    - User@Host：表示用户和慢查询的连接地址(root用户，locakhost地址，ID为9)
    - Query_time:表示SQL查询的耗时，单位为秒
        - Lock_time:表示获取锁的时间，单位为秒
        - Rows_sent:表示发送给客户端的行数
        - Rows_examined:表示服务器检查的行数
    - SET timestamp:表示慢SQL记录时的时间戳
    - select sleep（4）：最后一行表示慢查询SQL语句

```
tom@tomdeMBP ~ % sudo more /usr/local/mysql-8.0.29-macos12-arm64/data/tomdeMBP-slow.log
Time                 Id Command    Argument
# Time: 2024-07-07T09:12:15.910446Z
# User@Host: root[root]@localhost []  Id:     8
# Query_time: 4.005642  Lock_time: 0.000000 Rows_sent: 1  Rows_examined: 1
SET timestamp=1709802731;
select sleep(4);
```

##### 3、查找那些语句慢

``` mysql
-- 比如，得到返回记录集最多的10个SQL
mysqldumpslow -s r -t 10 /database/mysql/mysql06_slow.log

-- 得到访问次数最多的10个SQL
mysqldumpslow -s c -t 10 /database/mysql/mysql06_slow.log

-- 得到按照时间排序的前10条里面含有左连接的查询语句
mysqldumpslow -s t -t 10 -g “left join” /database/mysql/mysql06_slow.log

-- 另外建议在使用这些命令时结合 | 和more 使用 ，否则有可能出现刷屏的情况
mysqldumpslow -s r -t 20 /mysqldata/mysql/mysql06-slow.log | more
```

## 二、EXPLAIN

##### 1、explain基础

- 在select语句之前增加explain关键字，Mysql会在查询上设置一个标记
- 执行查询时，会返回执行计划的信息，而不是执行这条SQL
- 如果from中包含子查询，仍会执行该子查询，将结果放到临时表中

###### 1、创建表

``` mysql
CREATE TABLE `film` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `actor` (
  `id` int(11) NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `film_actor` (
  `id` int(11) NOT NULL,
  `film_id` int(11) NOT NULL,
  `actor_id` int(11) NOT NULL,
  `remark` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_film_actor_id` (`film_id`,`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

- 插入测试数据

``` mysql
INSERT INTO film (name) VALUES ('MovieName');
INSERT INTO actor (id, name, update_time) VALUES (1, 'ActorName', '2024-03-08 12:00:00');
INSERT INTO film_actor (id, film_id, actor_id, remark) VALUES (1, 1, 1, 'SomeRemark');
```

###### 2、explain字段注解

```
mysql> explain select * from film where id = 'abc' \G;
*************************** 1. row ***************************
           id: 1    -- SELECT语句的查询序列号，每个SELECT语句都有一个唯一的序列号，从1开始递增
  select_type: SIMPLE  -- 显示了查询的类型
                    -- SIMPLE: 简单查询，不包含子查询或UNION操作
                    -- PRIMARY: 包含子查询或UNION操作的查询的最外层查询
                    -- SUBQUERY: 子查询中的第一个查询
                    -- DERIVED: 子查询中的派生表
                    -- UNION: UNION操作的第二个或后面的查询
                    -- UNION RESULT: 从union临时表检索结果的select
        table: NULL -- 显示了查询的表名
   partitions: NULL -- 显示了查询的分区情况，如果表没有被分区，则为NULL
   
         type: NULL -- 显示了查询使用的访问方式
                    -- NULL: 
                    	-- MySQL无法确定使用哪种访问方式，通常因为没有使用索引或者使用了不适合的索引
                    	-- 或者mysql能够在优化阶段分解查询语句，在执行阶段`用不着再访问表或索引`
                    -- const: 索引匹配唯一数据，system可以匹配多条数据
                    -- eq_ref: 多表联合查询时，使用了唯一索引或主键索引
                    -- ref: 多表联合查询时，使用非唯一索引
                    -- range: 使用索引范围查询的访问方式
                    -- index: 查询操作只需要访问索引，而不需要访问数据行
                    -- all: 使用聚集索引，所以`type: ALL`实际上是通过扫描主键索引来完成的
                    
possible_keys: NULL -- 显示了MySQL可以使用哪些索引来执行查询，多个索引之间用逗号分隔

          key: NULL -- 显示了MySQL实际使用的索引，如果为NULL则表示没有使用索引
          
      key_len: NULL -- 显示了MySQL使用的索引长度，通常是指索引字段的字节数
          ref: NULL -- 显示了MySQL使用的索引列与查询条件之间的关系（例：film.id）
         rows: NULL -- mysql估计要读取并检测的行数，注意这个不是结果集里的行数
     filtered: NULL -- 显示了MySQL估算出的结果集的行数占总表行数的比例
     
        Extra: no matching row in const table -- 显示了MySQL的一些额外信息
                    -- Using index: 查询的列被索引覆盖，是性能高的表现
                    -- Using index condition: where 条件中使用到了部分索引
                    
                    -- Using where: 查询的列未被索引覆盖，where筛选条件非索引的前导列
                    -- Using where; Using index: 查询被索引覆盖，where不是索引前导列，无法使用索引
                    -- Using temporary: MySQL需要使用临时表来完成查询，通常是排序或分组操作(可以索引优化)
                    -- Using filesort: 一般指order by 操作字段没有索引导致的(可以索引优化)
                    -- Using join buffer: MySQL使用了连接缓存来优化连接操作
                    -- Impossible where: 查询条件不可能存在，导致MySQL没有扫描任何行
                    -- Select tables optimized away: 查询优化器优化了查询，表没有被访问
                    -- No matching min/max row: MySQL无法通过索引优化MIN/MAX操作
                    -- NULL: 味着查询中没有特殊的情况需要显示
                        -- 查询的列未被索引覆盖，并且where筛选条件是索引的前导列
                        -- 意味着用到了索引，但是部分字段未被索引覆盖，必须通过“回表”来实现
```

###### 3、show warnigs

``` mysql
mysql> show warnings \G;
-- 1.row 截断错误的DOUBLE值:'abc'
*************************** 1.row ***************************
  Level: Warning
   Code: 1292
Message: Truncated incorrect DOUBLE value: 'abc'

-- 2.row 这个告警可以忽略，可能是MySQL不同版本导致的
*************************** 2.row ***************************
  Level: Note
   Code: 1003
Message: /* select#1 */ select NULL AS `id`,NULL AS `name` from `mall`.`film` where (NULL = 0)
2 rows in set (0.01 sec)
```

##### 2、Id列

- id列是MySQL EXPLAIN结果中的一列，用于标识查询计划中各个操作的唯一编号，从1开始递增
- id列本身并不会对查询的执行产生影响，它仅仅是EXPLAIN结果中的一个信息列
- id列还可以帮助我们了解查询计划中各个操作的执行顺序和关系，更好地理解查询的执行过程和性能问题
- 注意：总的来说，id列在查询优化和性能分析方面具有重要的作用

##### 3、select_type列

- select_type表示对应行是简单还是复杂的查询

```
select_type:SIMPLE --显示了查询的类型
-- SIMPLE:简单查询，不包含子查询或UNION操作
-- PRIMARY：包含子查询或UNION操作的查询的最外层查询(主查询)
-- SUBQUERY：SUBQUERY表示子查询，即嵌套在主查询中的一个子查询语句
-- DERIVED：子查询中的派生表
-- UNION: UNION操作的第二个或后面的查询
-- UNION RESULT: 从union临时表检索结果的select
```

###### 1、SIMPLE

``` mysql
mysql> explain select * from film where id = 2 \G;
           id: 1
  select_type: SIMPLE -- 简单查询，不包含子查询或UNION操作
        table: film
   partitions: NULL
         type: const
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 4
          ref: const
         rows: 1
     filtered: 100.00
        Extra: NULL
```

###### 2、PRIMARY和SUBQUERY

``` mysql
mysql> explain select (select 1 from actor where id = 1) from (select * from film where id = 1) der \G;
*************************** 1. row ***************************
           id: 1
  select_type: PRIMARY  -- 包含子查询或UNION操作的查询的最外层查询
        table: film
   partitions: NULL
         type: const
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 4
          ref: const
         rows: 1
     filtered: 100.00
        Extra: Using index
*************************** 2. row ***************************
           id: 2
  select_type: SUBQUERY -- SUBQUERY表示子查询，即嵌套在主查询中的一个子查询语句
        table: actor
   partitions: NULL
         type: const
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 4
          ref: const
         rows: 1
     filtered: 100.00
        Extra: Using index
```

###### 3、PRIMARY和UNION

- 这个查询语句是一个UNION ALL操作，用于将两个SELECT语句的结果合并在一起

``` mysql
mysql> explain select 1 union all select 1 \G;
*************************** 1. row ***************************
           id: 1
  select_type: PRIMARY  -- 包含子查询或UNION操作的查询的最外层查询（主查询）
*************************** 2. row ***************************
           id: 2
  select_type: UNION    -- UNION操作的第二个或后面的查询
```

##### 4、type列

- 这一列表表示关联类型或访问类型，即MySQL决定如何查找表中的行，查找数据行记录的大概范围
- 依次从最优到最差分别为：
    - system>const>eq_ref>ref>range>index>ALL一般来说，需要保证查询达到range级别，最好达到ref

``` mysql
type:NULL -- 显示了查询使用的访问方式
-- NULL：mysql无法确定使用那种访问方式，通常因为没有使用索引或者使用了不适合的索引
-- const: 当Mysql能够通过索引或常量关系只匹配一行数据时使用的访问方式
-- eq_ref:使用了唯一索引或主键索引，只匹配一行数据的访问方式
-- ref：使用非唯一索引，匹配多行数据的访问方式
-- range:使用索引范围查询的访问方式
-- index：使用索引扫描的访问方式
-- all：全表扫描的访问方式，通常是最慢的一种访问方式
```

###### 1、NULL

- mysql能够在优化阶段分解查询语句，在执行阶段用不着再访问表或索引
- 例如：在索引列中选取最小值，可以单独查找索引来完成，不需要在执行访问表

``` mysql
mysql>  explain select min(id) from film \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
         type: NULL
         -- MySQL的查询优化器会寻找到主键索引的第一个条目，这个条目的id是所有条目中最小的
         -- 因此，MySQL并不需要扫描整个表或者整个索引，而是直接找到了结果
```

```
select id from table1 where status =1;
-- 如果table1表中有一个名为status的索引，并且该索引包含了id列
-- MySQL就可以使用该索引来优化查询，不需要再回表获取数据
```

###### 2、const,system

> const类型通常用于对primary key或者unique key的所有列与常数比较的情况下

- system：表只有一行，这是最好的可能情况，查询性能最高
- const：表中有一个或多个具有相同值的索引

``` mysql
mysql> explain select * from film where id = 2 \G;
           id: 1
  select_type: SIMPLE -- 简单查询，不包含子查询或UNION操作
        table: film
   partitions: NULL
         type: const
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 4
          ref: const
         rows: 1
     filtered: 100.00
        Extra: NULL
```

###### 3、eq_ref

> primary key或unique key索引的所有部分被连接使用，最多只返回一条符合条件的记录

- 在连接操作中，MySQL在查询时对于每个连接的行组合，都可以从表中使用唯一索引或主键查找到一行
- 这可能是在const之外最好的连接类型了，简单的select查询不会出现这种type

``` mysql
ysql> explain select * from film_actor left join film on film_actor.film_id = film.id \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film_actor
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: NULL
*************************** 2. row ***************************
           id: 1
  select_type: SIMPLE
        table: film
   partitions: NULL
         type: eq_ref  -- primary key 或 unique key 索引的所有部分被连接使用
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 4
          ref: mall.film_actor.film_id
         rows: 1
     filtered: 100.0
```

###### 4、ref

- 这种查询类型可以返回多行，它使用普通索引或者唯一索引的一部分来查找行

``` mysql
mysql> explain select * from film where name = "film1" \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film
   partitions: NULL
         type: ref  -- 使用普通索引或者唯一性索引的部分前缀
possible_keys: idx_name
          key: idx_name
      key_len: 33
          ref: const
         rows: 1
     filtered: 100.00
        Extra: Using index
```

- 关联表查询，idx_film_actor_id是film_id和actor_id的联合索引

```
KEY `idx_film_actor_id` (`film_id`,`actor_id`)
-- 这里使用到了film_actor的左边前缀film_id部分
```

```
mysql> explain select film_id from film left join film_actor on film.id = film_actor.film_id \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film
   partitions: NULL
         type: index
possible_keys: NULL
          key: idx_name
      key_len: 33
          ref: NULL
         rows: 2
     filtered: 100.00
        Extra: Using index
*************************** 2. row ***************************
           id: 1
  select_type: SIMPLE
        table: film_actor
   partitions: NULL
         type: ref  -- 这里使用到了film_actor的左边前缀film_id部分
possible_keys: idx_film_actor_id
          key: idx_film_actor_id
      key_len: 4
          ref: mall.film.id
         rows: 1
     filtered: 100.00
        Extra: Using index
```

###### 5、range

- 范围扫描通常出现在in(),between,>,<,>=等操作中(使用一个索引来检索给定范围的行)

``` mysql
mysql> explain select * from actor where id > 1 \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: actor
   partitions: NULL
         type: range
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 4
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: Using where
```

###### 6、index

- 查询操作只需要访问索引，而不需要访问数据行
- 这里的film表中只有两个字段，id:主键索引，name：普通索引
- 所以这里直接从索引中就可以获取，无需访问主键中的数据行

``` mysql
mysql> explain select * from film \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film
   partitions: NULL
         type: index  -- index是从索引中读取的，而不需要访问数据行
possible_keys: NULL
          key: idx_name
      key_len: 33
          ref: NULL
         rows: 2
     filtered: 100.00
        Extra: Using index
```

###### 7、ALL

- MySQL需要获取表中的所有列，因此无法只查询所以就能获取，还需要访问主键索引叶子节点的行数据
- ALL确实表示MySQL需要读取表中的所有行，但这并不一定意味着Mysql需要进行全表扫描
- 对于MyISAM存储引擎，由于它使用的是非聚集索引，所以type:ALL确实意味着全表扫描
- InnoDB存储引擎，使用聚集索引，所以type:ALL实际上是通过扫描主键索引来完成的

``` mysql
mysql> explain select * from actor \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: actor
   partitions: NULL
         type: ALL  -- 实际上是通过扫描主键索引来完成的
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: NULL
```

##### 4、possible_keys列

- 这一列显示查询可能使用那些索引来查找
- explain时可能出现possible_keys有列，而key显示NULL的情况
- 这种情况是因为表中数据不多，mysql认为索引对此查询帮组不大，选择了全表查询
- 如果该列是NULL，可以通过检查where子句看是否可以创造一个适当的索引来提高查询性能

##### 5、key列

- 这一列显示mysql实际采用那个索引来优化对该表的访问
- 如果没有使用索引，则该列是NULL
- 如果想强制mysql使用或忽视possible_keys列中的索引，在查询中使用force index、ignore index

###### 6、Extra列

###### 1、Using index

- 查询的列被索引覆盖，并且where筛选条件是索引的前导列，是性能高的表现
- 一般是使用了覆盖索引（索引包含了所有查询的字段）
- 对于innodb来说，如果是辅助索引性能会有不少提高

``` mysql
mysql> explain select film_id from film_actor where film_id = 1 \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film_actor
   partitions: NULL
         type: ref
possible_keys: idx_film_actor_id
          key: idx_film_actor_id
      key_len: 4
          ref: const
         rows: 1
     filtered: 100.00
        Extra: Using index  -- 索引包含了所有查询的字段
```

###### 2、Using where

- 查询的列未被索引覆盖，where筛选条件非索引的前导列

``` mysql
mysql> explain select * from actor where name = 'a' \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: actor
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: Using where  -- name列没有创建索引，无法匹配索引查找
```

###### 3、Using where Using index

- 查询被索引覆盖，where不是索引迁到列，无法使用索引

``` mysql
mysql> explain select film_id from film_actor where actor_id = 1 \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film_actor
   partitions: NULL
         type: index
possible_keys: idx_film_actor_id
          key: idx_film_actor_id
      key_len: 8
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: Using where; Using index  -- where不是索引前导列，`无法使用索引`
```

###### 4、NULL

- 查询的列未被索引覆盖，并且where筛选条件是索引的前导列
- 意味着用到了索引，但是部分字段未被索引覆盖，必须通过回表来实现

``` mysql
mysql> explain select * from film_actor where film_id = 1 \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film_actor
   partitions: NULL
         type: ref
possible_keys: idx_film_actor_id
          key: idx_film_actor_id
      key_len: 4
          ref: const
         rows: 1
     filtered: 100.00
        Extra: NULL  -- 用到了最左前缀
```

###### 5、Using index condition

- 与Using where类似，查询的列不完全被索引覆盖，where条件中是一个前导列的范围

``` mysql
mysql> explain select * from film_actor where film_id > 1 \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film_actor
   partitions: NULL
         type: range
possible_keys: idx_film_actor_id
          key: idx_film_actor_id
      key_len: 4
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: Using index condition  -- 查询的列不完全被索引覆盖，where条件中是一个前导列的范围
```

###### 6、Using temporary

- mysql需要创建一张临时表来处理查询
- 出现这种情况一般是要进行优化的，首先想到用索引来优化

- actor.name没有索引，此时创建了张临时表来distinct

``` mysql
mysql> explain select distinct name from actor \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: actor
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1
     filtered: 100.00
        Extra: Using temporary  -- actor.name没有索引，此时创建了张临时表来distinct
```

- film.name建立了idx_name索引，此时查询时extra是using index,没有用临时表

``` mysql
mysql> explain select distinct name from film \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film
   partitions: NULL
         type: index
possible_keys: idx_name
          key: idx_name
      key_len: 33
          ref: NULL
         rows: 2
     filtered: 100.00
        Extra: Using index -- film.name建立了idx_name索引，查询时extra是using index,没有用临时表
```

###### 7、Using filesort

- mysql会对结果使用一个外部索引排序，而不是按索引次序从表里读取行
- 此时mysql会根据连接类型浏览所有符合条件的记录，并保存排序关键字和行指针，然后排序关键字按顺序检索行信息
- 这种i情况下一般也是要考虑使用索引来优化的
- actor.name未创建索引，会浏览actor整个表，保存排序关键字name和对应的id，然后排序name并检索行记录

``` mysql
mysql>  explain select * from actor order by name \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: actor
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 1
     filtered: 100.00  -- actor.name未创建索引，会浏览actor整个表
```

- film.name建立了idx_name索引,此时查询时extra是using index

``` mysql
mysql> explain select * from film order by name \G;
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film
   partitions: NULL
         type: index
possible_keys: NULL
          key: idx_name
      key_len: 33
          ref: NULL
         rows: 2
     filtered: 100.00
        Extra: Using index -- film.name建立了idx_name索引,此时查询时extra是using index
```

