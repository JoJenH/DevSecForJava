# SQL 注入

## SQL 注入 - JDBC

### 描述

测试

### 漏洞代码

```java
test
```

### 修复代码

```java
fixed
```

### 审计要点

- 检查点

### 修复要点

- 修复点

### POC

```
admin OR 1=1
```

这是POC说明

---

## SQL 注入 - MyBatis XML

### 描述

在 MyBatis 的 XML 映射文件中，使用 ${} 占位符会直接拼接字符串，如果其中包含用户输入，将导致 SQL 注入漏洞。

### 漏洞代码

```java
<select id="getUser" resultType="User">
    SELECT * FROM users WHERE username = ${username}
</select>
```

### 修复代码

```java
<select id="getUser" resultType="User">
    SELECT * FROM users WHERE username = #{username}
</select>
```

### 审计要点

- 检查 MyBatis XML 文件中是否使用 ${} 占位符
- 关注 ${} 中的参数是否来自用户输入
- 审查动态 SQL 标签（如 、）中的变量使用

### 修复要点

- 使用 #{} 占位符代替 ${}，启用预编译参数绑定
- 对于必须使用的 ${}（如动态表名/列名），进行严格的白名单校验
- 在应用层对用户输入进行过滤和验证

### POC

传入参数: username = "'admin' OR '1'='1"
生成的 SQL:SELECT * FROM users WHERE username = 'admin' OR '1'='1'
这将返回所有用户记录。

---

## SQL 注入 - MyBatis 注解

### 描述

在 MyBatis 的注解方式中，同样需要注意 ${} 和 #{} 的区别。使用 @Select 等注解时，字符串拼接方式会导致 SQL 注入。

### 漏洞代码

```java
@Select("SELECT * FROM users WHERE id = ${userId}")
User getUserById(@Param("userId") String userId);
```

### 修复代码

```java
@Select("SELECT * FROM users WHERE id = #{userId}")
User getUserById(@Param("userId") String userId);
```

### 审计要点

- 检查 @Select、@Insert、@Update、@Delete 注解中的 SQL 语句
- 查找注解中使用 ${} 的情况
- 审查 @Param 参数是否被不安全地使用

### 修复要点

- 将 ${} 替换为 #{} 进行参数绑定
- 对于动态 SQL 场景，考虑使用 SQL 构建器或 XML 方式
- 对传入参数进行类型检查和验证

### POC

传入参数: userId = "1 OR 1=1"
生成的 SQL:SELECT * FROM users WHERE id = 1 OR 1=1
这将返回表中所有用户数据。

---

## SQL 注入 - MyBatis Plus

### 描述

MyBatis Plus 提供了便捷的 CRUD 操作，但在使用自定义 SQL 或条件构造器时，仍需要注意 SQL 注入风险。

### 漏洞代码

```java
// 不安全的自定义 SQL
@Select("SELECT * FROM " + tableName + " WHERE id = #{id}")
User getUser(@Param("tableName") String tableName, @Param("id") Long id);

// 不安全的条件构造
queryWrapper.apply("id = " + userId);
```

### 修复代码

```java
// 使用安全的表名校验
@Select("SELECT * FROM ${tableName} WHERE id = #{id}")
User getUser(@Param("tableName") String tableName, @Param("id") Long id);
// 在 service 层校验 tableName 是否在白名单中

// 使用参数化条件
queryWrapper.eq("id", userId);
```

### 审计要点

- 检查自定义 SQL 中 ${} 的使用场景
- 审查 apply()、last() 等方法的使用
- 关注动态表名、列名的处理逻辑

### 修复要点

- 对动态表名/列名使用白名单校验机制
- 使用 MyBatis Plus 提供的安全 API（eq、like 等）
- 避免在 apply() 中直接拼接用户输入

### POC

传入参数: tableName = "users; DROP TABLE orders; --"
生成的 SQL:SELECT * FROM users; DROP TABLE orders; -- WHERE id = 1
这将导致 orders 表被删除。

---

## SQL 注入 - JPA

### 描述

JPA 和 Spring Data JPA 通常能有效防止 SQL 注入，但在使用原生查询或动态 JPQL 时仍需谨慎。

### 漏洞代码

```java
// 不安全的原生查询
@Query(value = "SELECT * FROM users WHERE name = '" + name + "'", nativeQuery = true)
List<User> findByName(String name);

// 不安全的 JPQL 拼接
String jpql = "SELECT u FROM User u WHERE u.name = '" + userName + "'";
```

### 修复代码

```java
// 使用参数绑定
@Query(value = "SELECT * FROM users WHERE name = :name", nativeQuery = true)
List<User> findByName(@Param("name") String name);

// 或使用 ?1 占位符
@Query(value = "SELECT * FROM users WHERE name = ?1", nativeQuery = true)
List<User> findByName(String name);

// 使用 Criteria API 构建动态查询
CriteriaBuilder cb = entityManager.getCriteriaBuilder();
CriteriaQuery<User> query = cb.createQuery(User.class);
Root<User> root = query.from(User.class);
query.where(cb.equal(root.get("name"), userName));
```

### 审计要点

- 检查 @Query 注解中的 SQL/JPQL 语句是否使用字符串拼接
- 查找 EntityManager.createNativeQuery() 的使用
- 审查 Criteria API 的使用是否正确

### 修复要点

- 使用命名参数 :param 或位置参数 ?1 进行参数绑定
- 优先使用 Spring Data JPA 的派生查询方法
- 复杂动态查询使用 Criteria API 或 QueryDSL

### POC

传入参数: name = "admin' UNION SELECT * FROM credit_cards--"
生成的 SQL:SELECT * FROM users WHERE name = 'admin' UNION SELECT * FROM credit_cards--'
这将导致 credit_cards 表数据泄露。

---

# RCE

## RCE - Runtime

### 描述

使用 Runtime.exec() 或 ProcessBuilder 执行系统命令时，如果命令参数包含用户输入，攻击者可能注入恶意命令，导致远程代码执行。

### 漏洞代码

```java
String cmd = "ping " + request.getParameter("host");
Process process = Runtime.getRuntime().exec(cmd);
```

### 修复代码

```java
String host = request.getParameter("host");
// 对输入进行严格校验
if (!isValidHost(host)) {
    throw new IllegalArgumentException("Invalid host");
}
Process process = Runtime.getRuntime().exec(new String[]{"ping", host});
```

### 审计要点

- 查找 Runtime.getRuntime().exec() 的调用
- 检查 ProcessBuilder 的使用
- 关注命令字符串是否包含用户输入

### 修复要点

- 使用命令数组代替字符串拼接
- 对用户输入进行严格的白名单校验
- 避免直接执行用户传入的命令

### POC

传入参数: host = "127.0.0.1; cat /etc/passwd"
执行的命令:ping 127.0.0.1; cat /etc/passwd
这将执行额外的 cat 命令，泄露系统敏感信息。

---

## RCE - ScriptEngine

### 描述

Java 的 ScriptEngine 允许执行动态脚本（如 JavaScript、Groovy 等），如果执行的内容包含用户输入，将导致严重的 RCE 漏洞。

### 漏洞代码

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");
String script = request.getParameter("code");
engine.eval(script);
```

### 修复代码

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

// 使用沙箱环境，限制访问
Bindings bindings = new SimpleBindings();

String userCode = request.getParameter("code");
// 对代码进行语法检查和危险操作检测
if (containsDangerousOps(userCode)) {
    throw new SecurityException("Dangerous operation detected");
}
engine.eval(userCode, bindings);
```

### 审计要点

- 查找 ScriptEngine.eval() 的调用
- 检查 GroovyShell、PythonInterpreter 等脚本执行类
- 关注动态代码编译（如 JavaCompiler）

### 修复要点

- 尽量避免使用脚本引擎执行用户代码
- 实施严格的沙箱安全策略
- 对代码进行静态分析和危险操作检测

### POC

传入代码: code = "java.lang.Runtime.getRuntime().exec('calc')"
这将执行系统命令，打开计算器程序。在 Linux 系统上可执行任意命令。

---

# SpEL 注入

## SpEL 注入

### 描述

Spring Expression Language (SpEL) 是一种强大的表达式语言，如果表达式内容包含用户输入，攻击者可以执行任意代码。

### 漏洞代码

```java
ExpressionParser parser = new SpelExpressionParser();
String userInput = request.getParameter("expr");
Expression exp = parser.parseExpression(userInput);
Object result = exp.getValue();
```

### 修复代码

```java
ExpressionParser parser = new SpelExpressionParser();
String userInput = request.getParameter("expr");

// 使用 SimpleEvaluationContext 限制功能
SimpleEvaluationContext context = SimpleEvaluationContext
    .forReadOnlyDataBinding()
    .build();

Expression exp = parser.parseExpression(userInput);
Object result = exp.getValue(context);
```

### 审计要点

- 查找 SpelExpressionParser 的使用
- 检查 @Value、@PreAuthorize 等注解中的表达式
- 关注 StandardEvaluationContext 的使用

### 修复要点

- 使用 SimpleEvaluationContext 代替 StandardEvaluationContext
- 对表达式进行白名单校验
- 避免直接解析用户输入的表达式

### POC

传入表达式: expr = "T(java.lang.Runtime).getRuntime().exec('id')"
这将执行系统 id 命令，返回当前用户信息。攻击者可利用此执行任意系统命令。

---

# SSRF

## SSRF - URLConnection

### 描述

服务端请求伪造（SSRF）允许攻击者让服务器发起任意请求。当应用程序使用用户输入的 URL 进行网络请求时，可能导致内网扫描、敏感信息泄露等。

### 漏洞代码

```java
String url = request.getParameter("url");
URLConnection conn = new URL(url).openConnection();
InputStream is = conn.getInputStream();
```

### 修复代码

```java
String url = request.getParameter("url");
URL parsedUrl = new URL(url);

// 校验协议
if (!parsedUrl.getProtocol().equals("http")
    && !parsedUrl.getProtocol().equals("https")) {
    throw new IllegalArgumentException("Invalid protocol");
}

// 校验主机（禁止内网 IP）
String host = parsedUrl.getHost();
if (isInternalIp(host)) {
    throw new IllegalArgumentException("Internal IP not allowed");
}

// 使用白名单限制域名
if (!isInWhitelist(host)) {
    throw new IllegalArgumentException("Host not in whitelist");
}

URLConnection conn = parsedUrl.openConnection();
```

### 审计要点

- 查找 URL、URLConnection、HttpClient 的使用
- 检查 RestTemplate、WebClient 的请求目标
- 关注图片下载、文件导入等功能

### 修复要点

- 对目标 URL 进行严格的协议校验（仅允许 http/https）
- 禁止访问内网 IP 地址
- 使用域名白名单机制

### POC

传入 URL: url = "http://169.254.169.254/latest/meta-data/"
这将访问云服务商的元数据服务，可能获取到敏感凭证信息。
或: url = "file:///etc/passwd"这将读取服务器本地文件。

---

# XXE

## XXE - DocumentBuilder

### 描述

XML 外部实体注入（XXE）允许攻击者利用 XML 解析器的外部实体功能，读取本地文件、执行 SSRF 攻击等。

### 漏洞代码

```java
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
DocumentBuilder builder = factory.newDocumentBuilder();
Document doc = builder.parse(request.getInputStream());
```

### 修复代码

```java
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
// 禁用外部实体
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
factory.setXIncludeAware(false);
factory.setExpandEntityReferences(false);

DocumentBuilder builder = factory.newDocumentBuilder();
Document doc = builder.parse(request.getInputStream());
```

### 审计要点

- 查找 DocumentBuilderFactory、SAXParserFactory、XMLReader 的使用
- 检查 TransformerFactory、Validator 的配置
- 关注 XMLInputFactory（StAX）的配置

### 修复要点

- 禁用 DOCTYPE 声明
- 禁用外部实体和外部 DTD
- 考虑使用 JSON 等替代格式

### POC

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<foo>&xxe;</foo>
这将导致服务器返回 /etc/passwd 文件内容。

---

# 反序列化

## Java 原生反序列化

### 描述

Java 原生反序列化漏洞允许攻击者通过构造恶意序列化数据，在反序列化时执行任意代码。这是 Java 应用中最危险的漏洞之一。

### 漏洞代码

```java
ObjectInputStream ois = new ObjectInputStream(request.getInputStream());
Object obj = ois.readObject();
```

### 修复代码

```java
// 方案1: 使用白名单机制
ObjectInputStream ois = new ObjectInputStream(request.getInputStream()) {
    @Override
    protected Class<?> resolveClass(ObjectStreamClass desc) {
        String className = desc.getName();
        // 只允许特定类
        if (!isInWhitelist(className)) {
            throw new InvalidClassException("Class not allowed", className);
        }
        return super.resolveClass(desc);
    }
};
Object obj = ois.readObject();

// 方案2: 使用安全的序列化格式（如 JSON）
ObjectMapper mapper = new ObjectMapper();
User user = mapper.readValue(request.getInputStream(), User.class);
```

### 审计要点

- 查找 ObjectInputStream.readObject() 的调用
- 检查 readUnshared、ObjectInputFilter 的使用
- 关注第三方库的序列化操作（如 Apache Commons Collections）

### 修复要点

- 使用白名单限制可反序列化的类
- 使用 JSON、Protobuf 等安全格式替代 Java 原生序列化
- 升级存在漏洞的依赖库

### POC

攻击者构造包含恶意 Commons Collections 链的序列化数据，在 readObject() 执行时触发 RCE。
常用工具: ysoserial
java -jar ysoserial.jar CommonsCollections1 'calc.exe' > payload.bin

---

