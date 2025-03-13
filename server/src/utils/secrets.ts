import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "DATABASE_URL",
  "PORT",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_PEM_PUBLIC_KEY",
] as const;

const checkEnvVariables = (vars: readonly string[]) => {
  vars.forEach((variable) => {
    if (!process.env[variable]) {
      console.log(`Missing required environment variable: ${variable}`);
      process.exit(1);
    }
    console.log(`✓ ${variable} is set`);
  });
};

checkEnvVariables(requiredEnvVars);

export const DATABASE_URL = process.env.DATABASE_URL!;
export const PORT = Number(process.env.PORT!);
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;
export const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY!;
export const CLIENT_URL = process.env.CLIENT_URL!;
export const CLERK_PEM_PUBLIC_KEY = process.env.CLERK_PEM_PUBLIC_KEY!;

console.log("> All required environment variables are set.");
