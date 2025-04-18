## 一般规模ES集群
### 一般规模ES集群架构图
- 一般规模的生产环境，可以使用三台ES集群来部署集群
- 每台机器都有三个角色：主节点、数据节点、协调节点
![img](http://v5blog.cn/assets/img/image-20210427215750856.eb4e8a06.png)
### 一般规模生产环境配置
~~~
[root@snail-node2]# vi /esdb/esapp/esapp9203/config/elasticsearch.yml
Cluster.name: fgescluster1 #配置集群名称，三台集群一样
node.name:fgesdb01-node-3  #节点名称，集群内唯一，最好是IP地址
path.data:/esdb/esdata/esdata9203
path.logs:/esdb/eslog/eslog9203
node.master:true    #设置当前节点角色是master
node.data:true      #设置当前节点角色是data
cluster.remote.connect:false #设置当前节点不连接其他节点
bootstrap.memory_lock: true  #设置内存锁定，防止JVM内存交换
bootstrap.system_call_filter: false  #设置系统调用过滤器，防止JVM内存交换
network.host: 0.0.0.0  #设置网络主机，0.0.0.0表示所有主机
http.port: 9203  #设置HTTP端口，默认9200
transport.tcp.port: 9303  #设置TCP端口，默认9300
http.cors.enabled: true  #设置CORS跨域访问，默认false
~~~

### 一般规模ES集群扩容
- 一般是增加CPU、内存
- 然后增加两个数据节点，变成五个数据节点，但是其实还是三天机器
- 就是在其中两台机器中，再分别开启一个ES data角色的实例
- 只不过使用不同的端口号即可

## 超大型ES集群
### 超大型ES集群架构
- 超大群集群架构中至少需要9台机器
- 主节点Master：至少三台单独机器(node.master:true)
- 协调节点Coordinating：至少三台独立服务器（node.data:true）
- 数据节点Data：至少4台，后续不够用可以随时扩容，数据节点最好不要超过100台
- 注：如果当前节点设置的node.master和node.data都是false，那么就是协调节点角色
![img](http://v5blog.cn/assets/img/image-20210427141215737.28818d5f.png)
### 配置文件
~~~ sh
[root@k8s-node2]# vi /esdb/esapp/esapp9200/config/elasticsearch.yml
cluster.name: fgescluster1         # 集群名称，同一集群中集群名称必须相同
node.name: 192.168.1.71           # node节点中的名字，最好是ip地址
network.host: 192.168.1.71
http.port: 9200
transport.tcp.port: 9300
path.data: /esdb/esdata/esdata9200
path.logs: /esdb/eslog/eslog9200
node.master: false              # 当前节点不是主节点（如果这两个配置都是false就是协调节点）
node.data: true                # 当前节点是数据节点（如果这两个配置都是false就是协调节点）
cluster.remote.connect: false
http.cors.enabled: true
http.cors.allow-origin: "*"
bootstrap.memory_lock: true
bootstrap.system_call_filter: false
cluster.initial_master_nodes:
192.168.l.86:9300"]
discovery.seed_hosts: ["192.168.l.84:9300", "192.168.l.85:9300", "192.168.l.86:9300"]
~~~
