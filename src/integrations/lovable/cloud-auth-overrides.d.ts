// Augment the cloud-auth-js module to accept "microsoft" as a valid provider
// This resolves the type mismatch in the auto-generated lovable/index.ts
import "@lovable.dev/cloud-auth-js";

declare module "@lovable.dev/cloud-auth-js" {
  export type OAuthProvider = "google" | "apple" | "microsoft";
}
