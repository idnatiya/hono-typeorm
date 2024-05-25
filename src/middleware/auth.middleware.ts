import { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { AppDataSource } from "../data-source";
import { User } from "../models";
import { setUser } from "../contexts/user.context";

export const authentication = (): MiddlewareHandler => {
  return async (ctx, next) => {
    const token: string = ctx.req.header().authorization?.split(" ")[1];
    const decodedPayload = await verify(token, process.env.JWT_SECRET);
    const user = await AppDataSource.manager.findOneBy(User, {
      email: String(decodedPayload.email), // decodedPayload.email
    });

    setUser(user);

    await next();
  };
};
