type Secrets = {
  VITE_CLERK_PUBLISHABLE_KEY: string;
};

function validateSecret(key: keyof Secrets): string {
  const value = import.meta.env[key];
  if (!value) {
    console.error(`❌ Missing required environment variable: ${key}`);
    throw new Error(`Missing ${key} in environment variables`);
  }
  console.log(`✅ Found environment variable: ${key}`);
  return value;
}

export const secrets = {
  CLERK_KEY: validateSecret("VITE_CLERK_PUBLISHABLE_KEY"),
} as const;

console.log("🔐 All required environment variables are present");
