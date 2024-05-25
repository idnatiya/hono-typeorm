/**
 * This is the entry point of the application.
 * It initializes the database connection and starts the server.
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { AppDataSource } from "./data-source";
import { auth } from "./handlers";
import tasks from "./handlers/tasks.handler";
import { JwtTokenExpired } from "hono/utils/jwt/types";

// Initialize the database connection
AppDataSource.initialize()
  .then(async () => {
    // Create a new instance of Hono
    const app = new Hono();

    app.onError((err, c) => {
      if (err instanceof JwtTokenExpired) {
        return c.json({ message: "Token expired" }, 401);
      }
      return c.body(err, 500);
    });

    // Define the root route and associate it with the user router
    app.route("/auth", auth);
    app.route("/tasks", tasks);

    // Specify the port on which the server will run
    const port = 3000;

    // Log the server status
    console.log(`Server is running on port ${port}`);

    // Start the server
    serve({
      fetch: app.fetch,
      port,
    });
  })
  .catch((error) => console.log("this", error));
