import * as zod from "zod";
import { GetCurrentAuthUserResponse } from "./generated/api";

export type AuthUser = zod.infer<typeof GetCurrentAuthUserResponse>;

export const ExchangeMobileAuthorizationCodeBody = zod.object({
  code: zod.string(),
  code_verifier: zod.string(),
  state: zod.string(),
  nonce: zod.string().optional(),
  redirect_uri: zod.string(),
});

export const ExchangeMobileAuthorizationCodeResponse = zod.object({
  token: zod.string(),
});

export const LogoutMobileSessionResponse = zod.object({
  success: zod.boolean(),
});
