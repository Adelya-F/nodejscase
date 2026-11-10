CREATE DATABASE IF NOT EXISTS nodejscase_db;
USE nodejscase_db;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200),
  price INT,
  stock INT
);

INSERT INTO products (name, price, stock) VALUES
('Kopi Susu', 18000, 20),
('Teh Tarik', 15000, 15),
('Roti Bakar', 22000, 10),
('Mie Goreng', 20000, 12),
('Es Jeruk', 10000, 25);
