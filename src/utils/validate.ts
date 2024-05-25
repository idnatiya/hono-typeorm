import { MiddlewareHandler } from "hono";
import { ZodError, ZodSchema } from "zod";

/**
 * Validate middleware for Hono framework
 *
 * @param {ZodSchema} schema - The Zod schema to validate the request body
 * @return {MiddlewareHandler} The middleware function
 */
export const validate = (schema: ZodSchema): MiddlewareHandler => {
  return async (ctx, next) => {
    try {
      // Parse the request body as JSON
      const data = await ctx.req.json();
      // Validate the parsed data using the provided schema
      await schema.parseAsync(data);
      // Call the next middleware
      await next();
    } catch (error) {
      return ctx.body(error, 400);
    }
  };
};
