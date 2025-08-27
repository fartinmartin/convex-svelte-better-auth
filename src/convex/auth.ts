import {
  AuthFunctions,
  BetterAuth,
  PublicAuthFunctions,
} from "@convex-dev/better-auth";
import { api, components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import { DataModel, Id } from "./_generated/dataModel";

const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

export const betterAuthComponent = new BetterAuth(components.betterAuth, {
  authFunctions,
  publicAuthFunctions,
  verbose: false,
});

export const {
  createUser,
  deleteUser,
  updateUser,
  createSession,
  isAuthenticated,
} = betterAuthComponent.createAuthFunctions<DataModel>({
  onCreateUser: async (ctx, user) => {
    // todo: add additional user data to app db?
    return await ctx.db.insert("users", {});
  },
  onDeleteUser: async (ctx, userId) => {
    // todo: delete the user's data if the user is being deleted, e.g:
    // await asyncMap(todos, async (todo) => await ctx.db.delete(todo._id));
    await ctx.db.delete(userId as Id<"users">);
  },
  onUpdateUser: async (ctx, user) => {
    // todo: sync any additional user data with app db!
    // const userId = user.userId as Id<"users">;
    // await ctx.db.patch(userId, { email: user.email });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);

    if (!userMetadata) {
      return null;
    }

    const user = await ctx.db.get(userMetadata.userId as Id<"users">);
    return {
      ...user,
      ...userMetadata,
    };
  },
});
