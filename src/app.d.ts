import type { ConvexHttpClient } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import type { api } from "$convex/_generated/api";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      convex: ConvexHttpClient;
      user?: FunctionReturnType<typeof api.auth.getCurrentUser>;
    }
    interface PageData {
      user?: FunctionReturnType<typeof api.auth.getCurrentUser>;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
