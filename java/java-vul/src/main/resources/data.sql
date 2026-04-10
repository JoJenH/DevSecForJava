-- 初始化 SQL 注入演示数据
-- 注意: H2 数据库在 Spring Boot 中默认使用 MySQL 兼容模式

-- 重建 users 表（确保结构正确）
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(255)
);

-- 插入演示用户数据
INSERT INTO users (username, password, email, role) VALUES
    ('admin', 'admin123', 'admin@example.com', 'ADMIN'),
    ('test', 'test123', 'test@example.com', 'USER'),
    ('john', 'john123', 'john@example.com', 'USER'),
    ('jane', 'jane123', 'jane@example.com', 'USER'),
    ('alice', 'alice123', 'alice@example.com', 'GUEST'),
    ('bob', 'bob123', 'bob@example.com', 'GUEST');

-- 创建另一个示例表用于 UNION 注入演示
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    price DECIMAL(10,2),
    description VARCHAR(500)
);

INSERT INTO products (name, price, description) VALUES
    ('Laptop', 999.99, 'High-performance laptop'),
    ('Phone', 599.99, 'Smartphone with latest features'),
    ('Tablet', 399.99, 'Portable tablet device'),
    ('Keyboard', 49.99, 'Mechanical keyboard'),
    ('Mouse', 29.99, 'Wireless mouse');
