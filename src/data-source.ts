/**
 * This module is responsible for setting up the database connection.
 * It exports an instance of the DataSource class from the TypeORM library.
 * The DataSource is configured to connect to a MySQL database.
 *
 * The configuration is loaded from environment variables.
 * The environment variables used are DB_HOST, DB_PORT, DB_USER, DB_PASS, and DB_NAME.
 * If any of these environment variables are not set, default values are used.
 *
 * The DataSource is configured to synchronize the database schema with the entities.
 * However, the synchronization is currently turned off.
 * To enable synchronization, set the synchronize property to true.
 *
 * The DataSource is also configured to log SQL queries.
 * However, the logging is currently turned off.
 * To enable logging, set the logging property to true.
 *
 * The DataSource is configured to use the User entity.
 *
 * The DataSource is not configured to use any migrations or subscribers.
 * If you want to use migrations or subscribers, you can add them to the corresponding properties.
 *
 * @module data-source
 */
import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";
import { User, Task } from "./models";
import { RefreshToken } from "./models/refresh-token.model";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "hono",
  synchronize: true,
  logging: false,
  entities: [User, Task, RefreshToken],
  migrations: [],
  subscribers: [],
});
