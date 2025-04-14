# ES安装
# 一、安装Docker
## 1、yum安装docker
~~~ shell
[root@snail ~]# yum -y install wget
[root@snail ~]# wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -O /etc/yum.repos.d/docker-ce.repo
[root@snail ~]# yum -y install docker-ce
[root@snail ~]# systemctl start docker && systemctl enable docker
~~~
- 配置镜像下载加速器
~~~ shell
[root@snail ~]#  cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": ["https://b9pmyelo.mirror.aliyuncs.com"]
}
EOF
[root@snail ~]#  systemctl restart docker
[root@snail ~]#  docker info
~~~

## 2、添加阿里云YUM软件源
~~~ shell
[root@snail ~]#  cat > /etc/yum.repos.d/elastic.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
~~~

# 二、docker安装ES
## 1、docker安装es
- docker安装es
~~~ shell
[root@snail ~]#  docker pull elasticsearch:7.2.0
[root@snail ~]#  docker run --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -d elasticsearch:7.2.0
~~~
- 修改配置，解决跨域问题
  - 首先新入到容器中，然后进入到指定目录修改elasticsearch.yml文件
~~~ shell
[root@snail ~]# docker pull elasticsearch:7.2.0

[root@snail ~]# docker exec -it elasticsearch /bin/bash
[root@de5bba3e2d81 elasticsearch]#  cd /usr/share/elasticsearch/config/
[root@de5bba3e2d81 elasticsearch]#  vi elasticsearch.yml
# 追加一下内容,解决跨域问题
http.cors.enabled: true
http.cors.allow-origin: "*"
[root@de5bba3e2d81 elasticsearch]#  exit
[root@snail ~]# docker restart elasticsearch
~~~
## 2、安装ik分词器
- es自带的分词器对中文分词不是很友好，所以我们下载开源的ik分词器来解决这个问题
- 首先进入到plugins目录中下载分词器，下载完成后然后解压，再重启es即可
- 注意：elasticsearch的版本和ik分词器的版本需要保持一致，不然再重启的时候会失败
~~~ shell
[root@snail ~]# cd /usr/share/elasticsearch/plugins/
[root@de5bba3e2d81 elasticsearch]# elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.2.0/elasticsearch-analysis-ik-7.2.0.zip
[root@de5bba3e2d81 elasticsearch]#  exit
[root@snail ~]# docker restart elasticsearch
~~~
## 3、安装kibana
~~~ shell
[root@snail ~]# docker pull kibana:7.2.0
[root@snail ~]# docker run --name kibana --link-elasticsearch:text -p 5601:5601 -d kibana:7.2.0
[root@snail ~]# docker start kibana
~~~
- 访问网址
  - 访问ES:http://192.168.8.21:9200/
  - 访问kibana：http://192.168.8.21:5601/

# 三、mac M1安装ES
## 1、docker安装es
~~~ shell
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.13.1
docker run --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -d elasticsearch:7.13.1
~~~
- 修改配置，解决跨域问题
  - 首先新入到容器中，然后进入到指定目录修改elasticsearch.yml文件
~~~ shell
docker exec -it elasticsearch /bin/bash
cd /usr/share/elasticsearch/config/
vi elasticsearch.yml
# 追加一下内容,解决跨域问题
http.cors.enabled: true
http.cors.allow-origin: "*"
exit
docker restart elasticsearch
~~~
## 安装kibana
~~~ shell
docker pull docker.elastic.co/kibana/kibana:7.13.1
docker run --name kibana --link-elasticsearch:text -p 5601:5601 -d kibana:7.13.1
docker start kibana
~~~
- 访问网址
  
  - 访问ES：  http://127.0.0.1:9200/
  - 访问kibana：http://127.0.0.1:5601/

# 四、Linux安装ES
## 1、ES安装说明
- ES 5，安装需要 JDK 8 以上
- ES 6.5，安装需要 JDK 11 以上
- ES 7.2.1，内置了 JDK 12
- 下载地址：https://www.elastic.co/cn/downloads/elasticsearch
![img](http://v5blog.cn/assets/img/image-20210427102021626.ea33fc92.png)

## 2、下载elasticsearch
~~~ shell
[root@snail opt]# mkdir /opt/software
[root@snail opt]# cd /opt/software/
[root@snail aaa]# wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.12.0-linux-x86_64.tar.gz
[root@snail software]# tar -xvf elasticsearch-7.12.0-linux-x86_64.tar.gz 
[root@snail elasticsearch-7.12.0]# cd /opt/software/elasticsearch-7.12.0
bin             # 脚本文件，包括 ES 启动 & 安装插件等等
config           # elasticsearch.yml（ES 配置文件）、jvm.options（JVM 配置文件）、日志配置文件等等
jdk             # 内置的 JDK，JAVA_VERSION="12.0.1"
lib             # 类库
logs            # 日志文件
modules          # ES 所有模块，包括 X-pack 等
plugins          # ES 已经安装的插件。默认没有插件
~~~

## 3、启动用户
~~~ shell
[root@snail elasticsearch-7.12.0]# groupadd elasticsearch
[root@snail elasticsearch-7.12.0]# useradd -g elasticsearch elasticsearch
[root@snail elasticsearch-7.12.0]# chown -R elasticsearch:elasticsearch ../elasticsearch-7.12.0
[root@snail elasticsearch-7.12.0]# su elasticsearch
[elasticsearch@snail elasticsearch-7.12.0]$ ./bin/elasticsearch
~~~
## 4、elasticsearch.yml基本配置
- 常用配置文件
~~~ shell
[root@snail elasticsearch-7.12.0]# vim config/elasticsearch.yml 

cluster.name: elasticsearch
# 配置的集群名称，默认是elasticsearch

node.name: "Franz Kafka"
# 当前配置所在机器的节点名，最好设置当前机器的ip地址

network.host: 192.168.0.1
# 监听地址，这个参数是用来同时设置bind_host和publish_host上面两个参数。

path.data: /path/to/data
# 设置索引数据的存储路径，默认是es根目录下的data文件夹，可以设置多个存储路径，用逗号隔开

path.logs: /path/to/logs
# 设置日志文件的存储路径，默认是es根目录下的logs文件夹 

http.port: 9200
# 设置对外服务的http端口，默认为9200。

transport.tcp.port: 9300
# 设置节点之间交互的tcp端口，默认是9300
~~~