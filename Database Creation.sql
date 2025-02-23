create database [POS System]
use [POS System]

CREATE TABLE AdminLogin (
cashierId INT PRIMARY KEY IDENTITY(1,1) not null,
fName varchar(50),
lName varchar(50),
password VARCHAR(100) NOT NULL
);

create table Vendor(
vendorId int primary key IDENTITY(1,1) not null,
name varchar(60),
phoneNo varchar(18),
address varchar(40),
city varchar(20),
)

create table UserLogin (
customerId int primary key not NULL,
name varchar(30),
emial varchar(30),
phoneNo varchar(20),
address varchar(50)
)

create table Product (
productId int primary key IDENTITY(1,1) not NULL,
name varchar(70),
Price int,
vendorId int foreign key references vendor(vendorId)
)

CREATE TABLE stock (
    productId INT PRIMARY KEY NOT NULL,
    stockQuantity INT,
    FOREIGN KEY (productId) REFERENCES Product(productId)
);

create table Invoice(
invoiceId int primary key not null,
gst int,
totalPrice int,
)

create table OrderDetails(
orderId int primary key IDENTITY(1,1) not null,
invoiceId int foreign key references Invoice(invoiceId),
productId int foreign key references Product(productId),
quantity int
)

create table Returns(
returnId int primary key IDENTITY(1,1) not null,
reason text,
dateReturn date,
invoiceId int foreign key references Invoice(invoiceId)
)

select * from Invoice
select * from stock
select * from orderDetails

-- Insert fictional vendor values
INSERT INTO Vendor (name, phoneNo, address, city) VALUES
('ABC Electronics', '123-456-7890', '123 Main Street', 'New York'),
('XYZ Supplies', '987-654-3210', '456 Elm Street', 'Los Angeles'),
('Quick Tech', '555-123-4567', '789 Oak Avenue', 'Chicago'),
('Best Gadgets Inc.', '111-222-3333', '321 Pine Road', 'Houston'),
('Tech Solutions', '777-888-9999', '555 Maple Avenue', 'San Francisco'),
('Global Electronics', '444-555-6666', '888 Cedar Street', 'Miami'),
('Smart Devices LLC', '666-777-8888', '999 Walnut Street', 'Seattle'),
('Easy Electronics', '333-444-5555', '777 Birch Road', 'Dallas'),
('Modern Gadgets', '222-333-4444', '666 Oak Lane', 'Atlanta'),
('Tech Gear', '888-999-0000', '123 Elm Avenue', 'Boston'),
('Innovative Electronics', '555-666-7777', '444 Pine Street', 'Philadelphia'),
('Ace Tech Supplies', '999-000-1111', '555 Cedar Road', 'Phoenix'),
('Superior Electronics', '111-222-3333', '222 Birch Street', 'Denver'),
('Smart Tech Inc.', '000-111-2222', '777 Elm Road', 'Las Vegas'),
('Tech World', '333-444-5555', '888 Maple Lane', 'Detroit');


	INSERT INTO Product (name, Price, vendorId) VALUES
	('Laptop', 1000, 2),
	('Smartphone', 800, 5),
	('Tablet', 500, 8),
	('Desktop Computer', 1200, 3),
	('Printer', 300, 1),
	('External Hard Drive', 150, 4),
	('Wireless Mouse', 30, 6),
	('Bluetooth Speaker', 50, 7),
	('Headphones', 100, 9),
	('Digital Camera', 400, 10),
	('Smartwatch', 200, 11),
	('Fitness Tracker', 80, 12),
	('Gaming Console', 300, 13),
	('LED TV', 600, 14),
	('Home Theater System', 800, 15),
	('Drone', 700, 2),
	('Electric Scooter', 400, 3),
	('Coffee Maker', 60, 4),
	('Blender', 40, 5),
	('Toaster', 25, 6),
	('Microwave Oven', 120, 7),
	('Refrigerator', 800, 8),
	('Vacuum Cleaner', 150, 9),
	('Air Purifier', 200, 10),
	('Smart Thermostat', 100, 11);

INSERT INTO stock (productId, stockQuantity) VALUES
(8, 45),
(9, 35),
(10, 25),
(11, 65),
(12, 55),
(13, 45),
(14, 35),
(15, 25),
(16, 60),
(17, 50),
(18, 40),
(19, 30),
(20, 20),
(21, 70),
(22, 55),
(23, 45),
(24, 35),
(25, 25),
(26, 30),
(27, 20),
(28, 70),
(29, 55),
(30, 45),
(31, 35),
(32, 25)

EXEC sp_configure 'remote access', 1;
RECONFIGURE;
