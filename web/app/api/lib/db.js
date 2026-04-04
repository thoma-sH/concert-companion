import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "companion",
    password: "password123!",
    database: "concert_companion"
});

export default pool;