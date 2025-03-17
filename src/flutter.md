
# Flutter

## 打包&&运行

```bash
# 对应渠道打包
flutter build apk --flavor xxxxx --dart-define=channel=xxxxx 
# 对应渠道运行
flutter run apk --flavor xxxxx --dart-define=channel=xxxxx 

# 更换Java SDK路径
flutter config --jdk-dir "D:\APP\jdk-17.0.12_windows-x64_bin\jdk-17.0.12"
# 拉去远程仓库指定分支到本地并且文件名为分支名字
git clone -b xxxname --single-branch https://gitee.com/test.git xxxname

```

## 安卓端获取OAID问题

```kt

//app\build.gradle 文件添加
dependencies {
    implementation("com.github.gzu-liyujiang:Android_CN_OAID:4.2.7")
}
//在build.gradle添加
repositories {
    google()
    mavenCentral()
    maven { url 'https://developer.huawei.com/repo/' }
    maven { url 'https://jitpack.io' }
}

//kotlin文件夹中的MainActivity文件中加
import android.content.Intent
import android.net.Uri
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
class MainActivity : FlutterActivity() {
    private val deviceIdentityUtil by lazy { DeviceIdentityUtil(this) }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "device_identity").apply {
            setMethodCallHandler { call, result ->
                when (call.method) {
                    "getOAID" -> {//获取oaid
                        deviceIdentityUtil.getOAID {
                            result.success(it)
                        }
                    }
                    //跳转微信原生方法
                    "startLink" -> {
                        startLink(call.arguments.toString())
                        result.success(null)
                    }
                }
            }
        }
    }

    private fun startLink(link: String?) {
        Intent(Intent.ACTION_VIEW).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            data = Uri.parse(link ?: "")
            startActivity(this)
        }
    }
}

//在上文件同级下 创建DeviceIdentityUtil
import android.content.Context
import com.github.gzuliyujiang.oaid.DeviceID
import com.github.gzuliyujiang.oaid.IGetter


class DeviceIdentityUtil(private val context: Context) {
    fun getOAID(callback: (result: String) -> Unit) {
        DeviceID.getOAID(context, object : IGetter {
            override fun onOAIDGetComplete(result: String?) {
                callback(result ?: "")
            }

            override fun onOAIDGetError(error: Exception) {
                callback("")
            }
        })
    }
}
```

在flutter代码中调用

```dart
class OAID {
  static const MethodChannel _channel = MethodChannel('device_identity');
  static Future<String> getOAID() async {
    return await _channel.invokeMethod('getOAID') ?? "";
  }
}
```

## 安卓端 连续两次返回实现退出应用

```dart
DateTime? _lastPressedAt;
bool canPop = false;

PopScope(
  canPop: canPop,
  onPopInvokedWithResult: (didPop, _) async {
    LoggerUtils.e('返回拦截1111');
    if (AppConfig.isIos()) return;
    if (_currentIndex != 0) {
      setState(() {
        _currentIndex = 0;
      });
      _pageController.jumpToPage(0);
      return;
    }
    if (_lastPressedAt == null ||
        DateTime.now().difference(_lastPressedAt!) >
            const Duration(seconds: 2)) {
      // 两次点击间隔超过 2 秒或者是第一次点击
      _lastPressedAt = DateTime.now();
      showToast(message: '再次按返回键将退出应用');
    } else {
      _lastPressedAt = null;
      // 两次点击间隔小于 2 秒，退出应用
      Commons.exitApp();
    }
  },
  child:....
  )
```

## 生成App图标

```yaml
# 安装依赖
  flutter_launcher_icons: 0.11.0
# 配置信息
  flutter_icons:
    android: true
    ios: true
    image_path_ios: "assets/app/ios.png"
    image_path_android: "assets/app/android.png"
#执行生成
flutter pub run flutter_launcher_icons

```

## 打印数据

可打印json并且格式化，可解决打印超出截断问题 <br/>
需要用到common_utils插件，请先自行安装

```dart
class Log {
  //标识
  //AppConfig.isProduction 判断是否为生产环境
  static const String tag = 'hhy';

  static void init() {
    LogUtil.init(isDebug: !AppConfig.isProduction(), maxLen: 512);
  }

  static void e(String msg, {String tag = tag}) {
    if (!AppConfig.isProduction()) {
      LogUtil.e(msg, tag: tag);
    }
  }

  static void json(String msg, {String tag = tag}) {
    if (!AppConfig.isProduction()) {
      try {
        final dynamic data = convert.json.decode(msg);
        if (data is Map) {
          _printMap(data);
        } else if (data is List) {
          _printList(data);
        } else {
          LogUtil.v(msg, tag: tag);
        }
      } catch (e) {
        LogUtil.e(msg, tag: tag);
      }
    }
  }

  static void _printMap(Map<dynamic, dynamic> data,
      {String tag = tag,
      int tabs = 1,
      bool isListItem = false,
      bool isLast = false}) {
    final bool isRoot = tabs == 1;
    final String initialIndent = _indent(tabs);
    tabs++;

    if (isRoot || isListItem) {
      LogUtil.v('$initialIndent{', tag: tag);
    }

    data.keys.toList().asMap().forEach((index, dynamic key) {
      final bool isLast = index == data.length - 1;
      dynamic value = data[key];
      if (value is String) {
        value = '"$value"';
      }
      if (value is Map) {
        if (value.isEmpty) {
          LogUtil.v('${_indent(tabs)} $key: $value${!isLast ? ',' : ''}',
              tag: tag);
        } else {
          LogUtil.v('${_indent(tabs)} $key: {', tag: tag);
          _printMap(value, tabs: tabs);
        }
      } else if (value is List) {
        if (value.isEmpty || value.length > 50) {
          LogUtil.v('${_indent(tabs)} $key: $value', tag: tag);
        } else {
          LogUtil.v('${_indent(tabs)} $key: [', tag: tag);
          _printList(value, tabs: tabs);
          LogUtil.v('${_indent(tabs)} ]${isLast ? '' : ','}', tag: tag);
        }
      } else {
        final msg = value.toString().replaceAll('\n', '');
        LogUtil.v('${_indent(tabs)} $key: $msg${!isLast ? ',' : ''}', tag: tag);
      }
    });

    LogUtil.v('$initialIndent}${isListItem && !isLast ? ',' : ''}', tag: tag);
  }

  static void _printList(List<dynamic> list, {String tag = tag, int tabs = 1}) {
    list.asMap().forEach((i, dynamic e) {
      final bool isLast = i == list.length - 1;
      if (e is Map) {
        if (_canFlattenMap(e, list)) {
          LogUtil.v('${_indent(tabs)}  $e${!isLast ? ',' : ''}', tag: tag);
        } else {
          _printMap(e, tabs: tabs + 1, isListItem: true, isLast: isLast);
        }
      } else {
        LogUtil.v('${_indent(tabs + 2)} $e${isLast ? '' : ','}', tag: tag);
      }
    });
  }

  /// 避免一秒内输出过多行数的日志被限制显示
  /// Single process limit 250/s drop 66 lines.
  static bool _canFlattenMap(Map<dynamic, dynamic> map, List<dynamic> list) {
    return list.length * map.length > 100;
  }

  static String _indent([int tabCount = 1]) => '  ' * tabCount;
}

//使用
Log.json(data.toString());
```

## 代码片段

### 网络检测组件

网络检测组件，支持点击重试

先安装依赖 connectivity_plus: ^6.1.3

```dart
import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

/// 网络监听组件
class NetworkListener extends StatefulWidget {
  final WidgetBuilder builder;

  const NetworkListener({super.key, required this.builder});

  @override
  State<NetworkListener> createState() => _NetworkListenerState();
}

class _NetworkListenerState extends State<NetworkListener> {
  bool isFirst = true;
  StreamSubscription<List<ConnectivityResult>>? subscription;
  late Future<List<ConnectivityResult>> _connectivityFuture;

  final validConnectivityResults = [
    ConnectivityResult.mobile,
    ConnectivityResult.wifi,
  ];

  @override
  void initState() {
    super.initState();
    _connectivityFuture = Connectivity().checkConnectivity();
  }

  void _retryConnection() {
    setState(() {
      _connectivityFuture = Connectivity().checkConnectivity();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ConnectivityResult>>(
      future: _connectivityFuture,
      builder: (context, snapshot) {
        final state = snapshot.connectionState;
        if (state == ConnectionState.waiting) {
          return const Center(child: CupertinoActivityIndicator());
        }

        final isConnected = snapshot.hasData &&
            snapshot.data!.any((result) => validConnectivityResults.contains(result));

        if (isConnected) {
          return widget.builder(context);
        }

        _setupConnectivityListener();

        return _buildErrorUI();
      },
    );
  }

  Widget _buildErrorUI() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('网络异常，请检查网络'),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: _retryConnection,
            child: const Text('点击重试'),
          ),
        ],
      ),
    );
  }

  void _setupConnectivityListener() {
    subscription ??= Connectivity().onConnectivityChanged.listen((results) {
      if (!isFirst) {
        final isConnected = results.any((result) => validConnectivityResults.contains(result));
        if (isConnected && mounted) {
          setState(() {});
          subscription?.cancel();
          subscription = null;
        }
      } else {
        isFirst = false;
      }
    });
  }

  @override
  void dispose() {
    subscription?.cancel();
    super.dispose();
  }
}


///使用案例
NetworkListener(
  builder: (ctx) {
    return DouyinHome();
  },
)
```
