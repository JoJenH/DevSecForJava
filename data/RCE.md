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

## ProcessBuilder

使用 ProcessBuilder 执行命令时，若未正确处理用户输入可能导致命令注入

### vulnerable-code

```java
ProcessBuilder pb = new ProcessBuilder("ping " + host);
pb.start();
```

### fixed-code

```java
ProcessBuilder pb = new ProcessBuilder("ping", host);
pb.start();
```

### 审计点

1. 检查 ProcessBuilder 构造函数参数
2. 验证用户输入不包含 shell 元字符

### 修复点

1. 使用数组形式的构造函数
2. 对输入进行白名单验证

### 利用方式

传入 host = "127.0.0.1 && whoami"

### payload

```
127.0.0.1 && whoami
```

## 反射机制

使用 Java 反射机制动态执行类方法时，若类名或方法名来自用户输入可能导致 RCE

### vulnerable-code

```java
Class<?> clazz = Class.forName(className);
Method method = clazz.getMethod(methodName);
method.invoke(null);
```

### fixed-code

```java
if (!isValidClass(className) || !isValidMethod(methodName)) {
    throw new IllegalArgumentException("Invalid input");
}
Class<?> clazz = Class.forName(className);
Method method = clazz.getMethod(methodName);
method.invoke(null);
```

### 审计点

1. 检查 Class.forName 和 Method.invoke 调用
2. 追踪 className 和 methodName 的来源

### 修复点

1. 实现类名和方法名白名单
2. 限制可反射调用的类和方法

### 利用方式

传入 className = "java.lang.Runtime" 和相关方法

### payload

```
java.lang.Runtime
```
