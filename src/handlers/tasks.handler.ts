import { Hono } from "hono";
import { authentication } from "../middleware/auth.middleware";
import { getUser } from "../contexts/user.context";
import { validate } from "../utils";
import { z } from "zod";
import { Task, User } from "../models";
import { AppDataSource } from "../data-source";

const tasks = new Hono();

tasks.use(authentication());

/**
 * Get all tasks for the authenticated user
 *
 * @param {Object} context - The Hono context object
 * @returns {Promise<Object>} - The JSON response object
 */
tasks.get("/", async (context) => {
  const { per_page, page } = await context.req.query();

  console.log(per_page, page);

  // Get the authenticated user
  const user = getUser();

  // Define the query parameters for retrieving tasks
  const query = {
    where: { user }, // Filter by the authenticated user
    take: parseInt(per_page) || 10, // Limit the number of tasks returned
    skip: ((parseInt(page) || 1) - 1) * (parseInt(per_page) || 10), // Skip the first N tasks
    relations: ["user"], // Include the user information in the response
  };

  // Retrieve tasks from the database
  const tasks = await AppDataSource.manager.find(Task, {
    ...query, // Merge the query parameters with the default options
    order: { createdAt: "DESC" }, // Sort the tasks by creation date in descending order
  });

  // Return the tasks as a JSON response
  return context.json({
    status: "success",
    data: {
      tasks,
    },
  });
});

/**
 * Create a new task
 *
 * @param {Object} context - The Hono context object
 * @returns {Promise<Object>} - The JSON response object
 */
tasks.post(
  "/",
  validate(
    z.object({
      /**
       * The title of the task
       * @type {string}
       */
      title: z.string().min(1),
      /**
       * The description of the task
       * @type {string}
       */
      description: z.string().min(1),
    }),
  ),
  async (context) => {
    // Parse the request body as JSON
    const { title, description } = await context.req.json();
    // Get the authenticated user
    const user = getUser();

    // Create a new task object
    const newTask = new Task();
    newTask.title = title;
    newTask.description = description;
    newTask.user = user;
    newTask.completed = false;
    newTask.createdAt = new Date();

    // Save the new task to the database
    await AppDataSource.manager.save(newTask);

    // Return the success response with the new task
    return context.json({
      status: "success",
      data: { task: newTask },
    });
  },
);

/**
 * Update an existing task
 *
 * @description
 * This handler updates an existing task with the given id.
 * It expects a JSON payload with the following properties:
 * - title: A string representing the new title of the task
 * - description: A string representing the new description of the task
 * - completed: A boolean indicating whether the task is completed or not
 *
 * @returns {Object} - The JSON response object with the following properties:
 * - status: A string indicating the success of the update
 * - data: An object containing the updated task
 */
tasks.put(
  "/:id",
  /**
   * Validates the request body as JSON
   */
  validate(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      completed: z.boolean().optional(),
    }),
  ),
  /**
   * Updates an existing task with the given id
   *
   * @param {Request} context - The request context
   *
   * @returns {Object} - The JSON response object with the following properties:
   * - status: A string indicating the success of the update
   * - data: An object containing the updated task
   */
  async (context) => {
    const taskId = parseInt(context.req.param("id"));
    const task = await AppDataSource.manager.findOneBy(Task, {
      id: taskId,
      user: getUser(),
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const { title, description, completed } = await context.req.json();

    task.title = title;
    task.description = description;
    task.completed = completed;
    task.updatedAt = new Date();

    await AppDataSource.manager.save(task);

    return context.json({
      status: "success",
      data: { task },
    });
  },
);

/**
 * Deletes a task by its id
 *
 * @param {Request} context - The request context
 *
 * @returns {Object} - The JSON response object with the following properties:
 * - status: A string indicating the success of the deletion
 * - data: An object containing the deleted task
 *
 * @throws {Error} - If the task is not found
 */
tasks.delete("/:id", async (context) => {
  const taskId = parseInt(context.req.param("id"));
  const user = getUser();
  const task = await AppDataSource.manager.findOneBy(Task, {
    id: taskId,
    user,
  });

  if (!task) {
    return context.json(
      {
        message: "Task not found",
      },
      400,
    );
  }

  await AppDataSource.manager.remove(task);

  return context.json({
    status: "success",
    data: { task },
  });
});

/**
 * Export the tasks handler
 */
export default tasks;
