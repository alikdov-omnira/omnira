import pino, { type Logger } from "pino";
import { z } from "zod";

const configurationSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  OIDC_ISSUER_URL: z.string().url(),
  OIDC_AUDIENCE: z.string().min(1),
  OTEL_SERVICE_NAME: z.string().min(1).default("odls-platform")
});

export type PlatformConfiguration = z.infer<typeof configurationSchema>;

export function loadPlatformConfiguration(environment: NodeJS.ProcessEnv = process.env): PlatformConfiguration {
  return configurationSchema.parse(environment);
}

export function createLogger(service: string, level: PlatformConfiguration["LOG_LEVEL"]): Logger {
  return pino({ level, base: { service }, redact: ["req.headers.authorization", "password", "token"] });
}

export interface AuthenticationPrincipal {
  subjectId: string;
  tenantId: string;
  scopes: readonly string[];
}

export interface TokenVerifier {
  verify(authorizationHeader?: string): Promise<AuthenticationPrincipal>;
}

export interface AuthorizationService {
  assert(principal: AuthenticationPrincipal, permission: string, resourceId?: string): Promise<void>;
}

export class Container {
  private readonly values = new Map<string, unknown>();
  register<T>(key: string, value: T): void { this.values.set(key, value); }
  resolve<T>(key: string): T {
    const value = this.values.get(key);
    if (value === undefined) throw new Error(`Dependency not registered: ${key}`);
    return value as T;
  }
}
