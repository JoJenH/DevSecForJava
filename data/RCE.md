# RCE

## Runtime.exec

使用 Runtime.exec() 执行系统命令时存在命令注入风险

### vulnerable-code

```java
String cmd = "ping " + host;
Runtime.getRuntime().exec(cmd);
```

### fixed-code

```java
String[] cmd = {"ping", host};
Runtime.getRuntime().exec(cmd);
```

### 审计点

1. 检查命令拼接
2. 查找 Runtime.exec 调用

### 修复点

1. 使用命令数组
2. 验证输入参数

### 利用方式

传入 host = "127.0.0.1; cat /etc/passwd"

### payload

```
127.0.0.1; cat /etc/passwd
```
