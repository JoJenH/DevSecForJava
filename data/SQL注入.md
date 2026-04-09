# SQL 注入

## JDBC

使用 JDBC 直接拼接 SQL 语句可能导致 SQL 注入

### vulnerable-code

```java
String sql = "SELECT * FROM users WHERE name = '" + username + "'";
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(sql);
```

### fixed-code

```java
String sql = "SELECT * FROM users WHERE name = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setString(1, username);
ResultSet rs = pstmt.executeQuery();
```

### 审计点

1. 检查是否使用 Statement 而非 PreparedStatement
2. 追踪用户输入如何传递到 SQL 语句

### 修复点

1. 使用 PreparedStatement 参数化查询
2. 避免字符串拼接构建 SQL

### 利用方式

传入 username = "admin' OR '1'='1"

### payload

```
admin' OR '1'='1
```

## MyBatis

使用 MyBatis 时，若使用 ${} 而非 #{} 可能导致 SQL 注入

### vulnerable-code

```xml
<select id="findUser" parameterType="String" resultType="User">
    SELECT * FROM users WHERE name = '${name}'
</select>
```

### fixed-code

```xml
<select id="findUser" parameterType="String" resultType="User">
    SELECT * FROM users WHERE name = #{name}
</select>
```

### 审计点

1. 检查 Mapper XML 中是否使用 ${} 语法
2. 检查注解方式是否使用字符串拼接

### 修复点

1. 使用 #{} 参数化查询
2. 使用 @Param 注解传参

### 利用方式

传入 name = "admin' OR '1'='1"

### payload

```
admin' OR '1'='1
```

## JPA

使用 JPA 时，若使用 @Query 注解且使用字符串拼接可能导致 SQL 注入

### vulnerable-code

```java
@Query("SELECT u FROM User u WHERE u.name = '" + name + "'")
User findByName(String name);
```

### fixed-code

```java
@Query("SELECT u FROM User u WHERE u.name = :name")
User findByName(@Param("name") String name);
```

### 审计点

1. 检查 @Query 注解中的 SQL/HQL 语句
2. 验证是否使用参数绑定

### 修复点

1. 使用命名参数
2. 使用 Criteria API

### 利用方式

传入 name = "admin' OR '1'='1"

### payload

```
admin' OR '1'='1
```

## Hibernate

使用 Hibernate 原生 SQL 查询时，若拼接字符串可能导致 SQL 注入

### vulnerable-code

```java
String sql = "SELECT * FROM users WHERE name = '" + username + "'";
Query query = session.createSQLQuery(sql);
```

### fixed-code

```java
String sql = "SELECT * FROM users WHERE name = :username";
Query query = session.createSQLQuery(sql);
query.setParameter("username", username);
```

### 审计点

1. 检查 createSQLQuery 调用
2. 追踪 SQL 语句的构建方式

### 修复点

1. 使用参数化查询
2. 使用 HQL 替代原生 SQL

### 利用方式

传入 username = "admin' OR '1'='1"

### payload

```
admin' OR '1'='1
```
