/**
 * Handler for user registration
 *
 * @description
 * This handler handles the registration of a new user.
 * It expects a JSON payload with the following properties:
 * - firstName: A string representing the first name of the user
 * - lastName: A string representing the last name of the user
 * - email: A string representing the email of the user
 * - password: A string representing the password of the user
 *
 * @example
 * POST /register
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john.doe@example.com",
 *   "password": "password123"
 * }
 *
 * @returns {Object} - The JSON response object with the following properties:
 * - message: A string indicating the success of the registration
 * - user: An object representing the registered user
 *
 * @throws {Error} - If the registration fails for any reason
 */
import { Hono } from "hono";
import { hashHmac, sendMail, validate } from "../utils";
import { object, z } from "zod";
import { User } from "../models";
import { AppDataSource } from "../data-source";
import { sign } from "hono/jwt";
import { RefreshToken } from "../models/refresh-token.model";
import { addDays } from "../utils/date";
import { randomUUID } from "crypto";

const bcrypt = require("bcrypt");

const auth = new Hono();

/**
 * Generates a JWT token and a refresh token for a given user
 *
 * @description
 * This function generates a JWT token and a refresh token for a given user.
 * The JWT token has an expiration time of one hour, and the refresh token
 * expires in one day.
 *
 * @param {User} user - The user for which the tokens are generated
 * @returns {Promise<{token: string, refreshToken: string}>} - A promise that resolves
 * to an object containing the generated JWT token and refresh token
 *
 * @throws {Error} - If the generation of the tokens fails for any reason
 */
export const generateUserToken = async (
  user: User,
): Promise<{ token: string; refreshToken: string }> => {
  /**
   * Generate a JWT token using the given user data and the secret key
   * stored in the environment variable JWT_SECRET
   */
  const token = await sign(
    {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    process.env.JWT_SECRET,
  );

  /**
   * Create a new refresh token with a random token and the given user
   * and expiration date
   */
  const refreshToken = new RefreshToken();
  refreshToken.token = randomUUID();
  refreshToken.user = user;
  refreshToken.createdAt = new Date();
  refreshToken.expiredAt = addDays(new Date(), 1);

  /**
   * Save the refresh token to the database
   */
  await AppDataSource.manager.save(refreshToken);

  /**
   * Return an object containing the generated JWT token and refresh token
   */
  return {
    token,
    refreshToken: refreshToken.token,
  };
};

/**
 * Handler for user registration
 *
 * @description
 * This handler handles the registration of a new user.
 * It expects a JSON payload with the following properties:
 * - firstName: A string representing the first name of the user
 * - lastName: A string representing the last name of the user
 * - email: A string representing the email of the user
 * - password: A string representing the password of the user
 *
 * @returns {Object} - The JSON response object with the following properties:
 * - message: A string indicating the success of the registration
 * - user: An object representing the registered user
 *
 * @throws {Error} - If the registration fails for any reason
 */
auth.post(
  "/register",
  validate(
    z.object({
      // First name of the user
      firstName: z.string().min(1),
      // Last name of the user
      lastName: z.string().min(1),
      // Email of the user
      email: z
        .string()
        .min(1)
        .email()
        .refine(async (email) => {
          // Check if the email already exists in the database
          return !(await AppDataSource.manager.existsBy(User, {
            email: email,
          }));
        }, "Email already exists!"),
      // Password of the user
      password: z.string().min(6),
    }),
  ),
  async (c) => {
    // Create a new query runner
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      // Connect to the database
      await queryRunner.connect();
      // Start a new transaction
      await queryRunner.startTransaction();

      const payload: any = await c.req.json();

      const user = new User();
      user.firstName = payload.firstName;
      user.lastName = payload.lastName;
      user.email = payload.email;
      // Hash the password using bcrypt
      user.password = await bcrypt.hash(payload.password, 12);

      // Save the user to the database
      await queryRunner.manager.save(user);

      // Commit the transaction
      await queryRunner.commitTransaction();

      const token = await generateUserToken(user);

      return c.json({
        message: "Successfully registration user",
        data: { ...token },
      });
    } catch (error) {
      // Rollback the transaction if an error occurs
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  },
);

/**
 * Handler for user login
 *
 * @description
 * This handler handles the login of an existing user.
 * It expects a JSON payload with the following properties:
 * - email: A string representing the email of the user
 * - password: A string representing the password of the user
 *
 * @returns {Object} - The JSON response object with the following properties:
 * - message: A string indicating the success of the login
 * - data: An object containing the JWT token for the logged in user
 *
 * @throws {Error} - If the login fails for any reason
 */
auth.post(
  "/login",
  validate(
    z.object({
      // Email of the user
      email: z.string().min(1).email(),
      // Password of the user
      password: z.string().min(6),
    }),
  ),
  async (context) => {
    // Parse the request body as JSON
    const { email, password } = await context.req.json();

    // Find the user by email in the database
    const matchedUser = await AppDataSource.manager.findOneBy(User, { email });

    // Check if the user exists and the password is correct
    if (
      !matchedUser ||
      !(await bcrypt.compare(password, matchedUser.password))
    ) {
      // Return error response if the user does not exist or the password is incorrect
      return context.json({ message: "Invalid email or password" }, 400);
    }

    const token = await generateUserToken(matchedUser);

    // Return success response with the JWT token
    return context.json({
      message: "Successfully logged in",
      data: {
        ...token,
      },
    });
  },
);

/**
 * Handler for requesting email verification
 *
 * @description
 * This handler handles the request for email verification.
 * It expects a JSON payload with the following property:
 * - email: A string representing the email of the user
 *
 * @returns {Object} - The JSON response object with the following properties:
 * - status: A string indicating the success of the request
 *
 * @throws {Error} - If the user is not found
 */
auth.post(
  "/request-verification",
  validate(
    z.object({
      email: z.string().email(),
    }),
  ),
  async (context) => {
    // Parse the request body as JSON
    const { email } = await context.req.json();

    // Find the user by email in the database with emailVerifiedAt as null
    const user = await AppDataSource.manager.findOneBy(User, {
      email,
      emailVerifiedAt: null,
    });

    // Return error response if the user is not found
    if (!user) {
      return context.json({ message: "User not found" }, 404);
    }

    // Generate the verification URL with request date and signature
    const loggedDate = new Date().getTime();
    const verificationUrl = `${process.env.APP_URL}/auth/verify
      ?email=${user.email}
      &request_at=${loggedDate}
      &signature=${hashHmac(`${user.email}#${loggedDate}`)}`;

    // Send the verification email
    await sendMail(user.email, "Email Verification", verificationUrl);

    // Return success response
    return context.json({ status: "success" });
  },
);

/**
 * Handler for email verification
 *
 * @description
 * This handler handles the verification of an email.
 * It expects a query string with the following properties:
 * - email: A string representing the email of the user
 * - request_at: A string representing the timestamp of the request
 * - signature: A string representing the HMAC signature of the request
 *
 * @returns {Object} - The JSON response object with the following properties:
 * - status: A string indicating the success of the verification
 *
 * @throws {Error} - If the signature is invalid or the request has expired
 * @throws {Error} - If the user is not found
 */
auth.get("/verify", async (context) => {
  // Parse the query string
  const { email, request_at, signature } = context.req.query();

  // Parse the request date and calculate the time difference
  const requestDate = new Date(parseInt(request_at));
  const currentDate = new Date();
  const timeDiff = currentDate.getTime() - requestDate.getTime();

  // Check if the signature is valid and the request has not expired
  if (hashHmac(`${email}#${request_at}`) !== signature) {
    return context.json({ message: "Invalid signature" }, 400);
  }

  if (timeDiff > 1000 * 60 * 10) {
    return context.json({ message: "Request expired" }, 400);
  }

  // Find the user by email in the database
  const user = await AppDataSource.manager.findOneBy(User, { email });

  // Return error response if the user is not found
  if (!user) {
    return context.json({ message: "User not found" }, 404);
  }

  // Update the emailVerifiedAt field and save the user to the database
  user.emailVerifiedAt = currentDate;
  await AppDataSource.manager.save(user);

  // Return success response
  return context.json({ status: "success" });
});

export default auth;
