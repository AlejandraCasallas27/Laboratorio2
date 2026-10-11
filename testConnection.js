
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT || 3306)
        });

        const [rows] = await connection.execute(
            'SELECT DATABASE() AS databaseName'
        );

        console.log('MySQL connection successful');
        console.log('Connected database:', rows[0].databaseName);
    } catch (error) {
        console.error('MySQL connection failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testConnection();
