const express = require("express")
const app = express()
const sql = require("mssql")
const cors = require("cors");

app.use(cors()); 
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

const config = {
   
    server : "DESKTOP-FJSBPON\\SQLEXPRESS",
    database: "POS System",
    options: {
        trustServerCertificate: true,
    },
    port:1433
}

sql.connect(config,function(err){
    if(err)console.log(err);
    var request = new sql.Request();
    request.query("select * from product",function(err,records){
        if(err)console.log(err);
        else console.log(records.recordset);
    });

})



app.post('/update/addProduct', async (req, res) => {
    const { name, price, vendorId, stockQuantity } = req.body;

    if (!name || !price || !vendorId || !stockQuantity) {
        return res.status(400).send({ message: "All fields are required" });
    }

    try {
        const productRequest = new sql.Request();
        const productQuery = `
            INSERT INTO Product (name, price, vendorId)
            VALUES (@name, @price, @vendorId);
            SELECT SCOPE_IDENTITY() AS productId;
        `;

        productRequest.input('name', sql.VarChar(70), name);
        productRequest.input('price', sql.Int, price);
        productRequest.input('vendorId', sql.Int, vendorId);

        const productResult = await productRequest.query(productQuery);
        const productId = productResult.recordset[0].productId;

        const stockRequest = new sql.Request();
        const stockQuery = `
            INSERT INTO stock (productId, stockQuantity)
            VALUES (@productId, @stockQuantity);
        `;

        stockRequest.input('productId', sql.Int, productId);
        stockRequest.input('stockQuantity', sql.Int, stockQuantity);

        await stockRequest.query(stockQuery);

        res.status(201).send({ message: "Product and stock added successfully" });
    } catch (err) {
        console.error("SQL error: ", err);
        res.status(500).send({ message: "Error adding product and stock", error: err.message });
    }
});

app.post('/update/addVendor', async (req, res) => {
    const { name, phoneNo, address, city } = req.body;

    if (!name || !phoneNo || !address || !city) {
        return res.status(400).send({ message: "All fields are required" });
    }

    try {
        const request = new sql.Request();
        const query = `
            INSERT INTO Vendor (name, phoneNo, address, city)
            VALUES (@name, @phoneNo, @address, @city);
        `;

        request.input('name', sql.VarChar(60), name);
        request.input('phoneNo', sql.VarChar(18), phoneNo);
        request.input('address', sql.VarChar(40), address);
        request.input('city', sql.VarChar(20), city);

        await request.query(query);

        res.status(201).send({ message: "Vendor added successfully" });
    } catch (err) {
        console.error("SQL error: ", err);
        res.status(500).send({ message: "Error adding vendor", error: err.message });
    }
});

// Add this endpoint to your existing server code

app.get('/products', async (req, res) => {
    try {
        const productRequest = new sql.Request();
        const productQuery = `
            SELECT p.productId, p.name AS productName, p.price, v.name AS vendorName, s.stockQuantity
            FROM Product p
            JOIN Vendor v ON p.vendorId = v.vendorId
            JOIN Stock s ON p.productId = s.productId;
        `;

        const productResult = await productRequest.query(productQuery);

        res.status(200).send(productResult.recordset);
    } catch (err) {
        console.error("SQL error: ", err);
        res.status(500).send({ message: "Error fetching products", error: err.message });
    }
});
app.post('/addInvoice', async (req, res) => {
    try {
        // Extract data from the request body
        const { totalPrice, products } = req.body;

        // Check if products array is empty
        if (products.length === 0) {
            return res.status(400).json({ error: 'No products provided.' });
        }

        // Start a new transaction
        const transaction = new sql.Transaction();
        await transaction.begin();

        try {
            // Query to get the current maximum invoiceId
            const maxInvoiceIdResult = await transaction.request().query(`
                SELECT ISNULL(MAX(invoiceId), 0) AS maxInvoiceId FROM Invoice
            `);
            const maxInvoiceId = maxInvoiceIdResult.recordset[0].maxInvoiceId;
            const invoiceId = maxInvoiceId + 1;

            // Calculate GST
            const gst = totalPrice * 0.17; // Assuming GST is 17%

            // Insert data into the Invoice table
            await transaction.request().query(`
                INSERT INTO Invoice (invoiceId, gst, totalPrice)
                VALUES (${invoiceId}, ${gst}, ${totalPrice})
            `);

            // Insert data into the OrderDetails table for each product
            for (const product of products) {
                await transaction.request().query(`
                    INSERT INTO OrderDetails (invoiceId, productId, quantity)
                    VALUES (${invoiceId}, ${product.productId}, ${product.quantity})
                `);

                // Update stock in the Product table
                await transaction.request().query(`
                    UPDATE stock
                    SET stockQuantity = stockQuantity - ${product.quantity}
                    WHERE productId = ${product.productId}
                `);
            }

            // Commit the transaction
            await transaction.commit();

            res.status(200).json({ message: 'Invoice data added successfully.', invoiceId });
        } catch (error) {
            // Rollback the transaction if any error occurs
            await transaction.rollback();
            throw error; // Throw the error to the catch block below
        }
    } catch (error) {
        console.error('Error adding invoice data:', error);
        res.status(500).json({ error: 'Error adding invoice data.' });
    }
});

app.get('/recentOrders', async (req, res) => {
      try {
          const request = new sql.Request();
          const query = `
              SELECT *
              FROM [Recent Orders]
          `;
          const result = await request.query(query);
  
          res.status(200).json(result.recordset);
      } catch (error) {
          console.error('Error fetching recent orders:', error);
          res.status(500).json({ error: 'Error fetching recent orders.' });
      }
  });  

app.post('/update-product', async (req, res) => {
    const { productId, name, price } = req.body;

    if (!productId || !name || !price) {
        return res.status(400).send({ message: "Invalid input data" });
    }

    try {
        const productRequest = new sql.Request();
        const updateQuery = `
            UPDATE Product
            SET name = @name, price = @price
            WHERE productId = @productId;
        `;

        productRequest.input('productId', sql.Int, productId);
        productRequest.input('name', sql.NVarChar, name);
        productRequest.input('price', sql.Decimal, price);

        await productRequest.query(updateQuery);

        res.status(200).send({ message: "Product updated successfully" });
    } catch (err) {
        console.error("SQL error: ", err);
        res.status(500).send({ message: "Error updating product", error: err.message });
    }
});

app.put('/update/product', async (req, res) => {
    const { productId, price, stockQuantity } = req.body;

    if (!productId) {
        return res.status(400).send({ message: "Product ID is required" });
    }

    // if (price === undefined && stockQuantity === undefined) {
    //     return res.status(400).send({ message: "Price or stock quantity must be provided" });
    // }

    const transaction = new sql.Transaction();

    try {
        await transaction.begin();

        if (price !== undefined) {
            const productRequest = new sql.Request(transaction);
            const productQuery = `
                UPDATE Product
                SET price = @price
                WHERE productId = @productId;
            `;

            productRequest.input('productId', sql.Int, productId);
            productRequest.input('price', sql.Int, price);
            
            await productRequest.query(productQuery);
        }

        if (stockQuantity !== undefined) {
            const stockRequest = new sql.Request(transaction);
            const stockQuery = `
                UPDATE stock
                SET stockQuantity = @stockQuantity
                WHERE productId = @productId;
            `;

            stockRequest.input('productId', sql.Int, productId);
            stockRequest.input('stockQuantity', sql.Int, stockQuantity);

            await stockRequest.query(stockQuery);
        }

        await transaction.commit();

        res.status(200).send({ message: "Product and/or stock updated successfully" });
    } catch (err) {
        console.error("SQL error: ", err);
        await transaction.rollback();
        res.status(500).send({ message: "Error updating product and/or stock", error: err.message });
    }
});

app.delete('/delete/product/:productId', async (req, res) => {
    const productId = req.params.productId;

    if (!productId) {
        return res.status(400).send({ message: "Product ID is required" });
    }

    const transaction = new sql.Transaction();

    try {
        await transaction.begin();

        const deleteProductRequest = new sql.Request(transaction);
        const deleteProductQuery = `
            DELETE FROM Product
            WHERE productId = @productId;
        `;

        deleteProductRequest.input('productId', sql.Int, productId);
        await deleteProductRequest.query(deleteProductQuery);

        const deleteStockRequest = new sql.Request(transaction);
        const deleteStockQuery = `
            DELETE FROM Stock
            WHERE productId = @productId;
        `;

        deleteStockRequest.input('productId', sql.Int, productId);
        await deleteStockRequest.query(deleteStockQuery);

        await transaction.commit();

        res.status(200).send({ message: "Product and associated stock deleted successfully" });
    } catch (err) {
        console.error("SQL error: ", err);
        await transaction.rollback();
        res.status(500).send({ message: "Error deleting product and associated stock", error: err.message});
}
});

app.get('/products/count', async (req, res) => {
    try {
        const request = new sql.Request();
        const query = 'SELECT COUNT(*) AS totalProducts FROM Product';
        const result = await request.query(query);
        const totalProducts = result.recordset[0].totalProducts;
        res.status(200).send({ totalProducts });
    } catch (err) {
        console.error("SQL error: ", err);
        res.status(500).send({ message: "Error retrieving total number of products", error: err.message });
    }
});
app.get('/invoices/count', async (req, res) => {
    try {
        const request = new sql.Request();
        const query = 'SELECT COUNT(*) AS totalInvoices FROM Invoice';
        const result = await request.query(query);
        const totalInvoices = result.recordset[0].totalInvoices;
        res.status(200).send({ totalInvoices });
    } catch (err) {
        console.error("SQL error: ", err);
        res.status(500).send({ message: "Error retrieving total number of invoices", error: err.message });
    }
});
app.get('/vendors/count', async (req, res) => {
    try {
        const request = new sql.Request();
        const query = 'SELECT COUNT(*) AS totalVendors FROM Vendor';
        const result = await request.query(query);
        const totalVendors = result.recordset[0].totalVendors;
        res.status(200).send({ totalVendors });
    } catch (err) {
        console.error("SQL error: ", err);
        res.status(500).send({ message: "Error retrieving total number of vendors", error: err.message });
    }
});


app.post('/signup/cashier', async (req, res) => {
    const { fName, lName, password } = req.body;

    if (!fName || !lName || !password) {
        return res.status(400).send({ message: "All fields are required" });
    }

    try {
        const request = new sql.Request();
        const query = `
            INSERT INTO CashierLogin (fName, lName, password)
            VALUES (@fName, @lName, @password);
        `;

        request.input('fName', sql.VarChar(50), fName);
        request.input('lName', sql.VarChar(50), lName);
        request.input('password', sql.VarChar(100), password);

        await request.query(query);

        res.status(201).send({ message: "Cashier signed up successfully" });
    } catch (err) {
        console.error("SQL error: ", err);
        res.status(500).send({ message: "Error signing up cashier", error: err.message });
    }
});

app.listen(PORT, () => {
    console.log('Server is running on port:'+PORT);
});