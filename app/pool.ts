import  {Pool} from 'pg'

export const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
});

export const readPool = new Pool({
    user: process.env.READ_USER,
    password: process.env.READ_PASSWORD,
    host: process.env.READ_HOST,
    port: process.env.DB_PORT,
    database: process.env.READ_DATABASE,
});