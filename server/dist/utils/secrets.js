"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLERK_PEM_PUBLIC_KEY = exports.CLIENT_URL = exports.CLERK_PUBLISHABLE_KEY = exports.CLERK_SECRET_KEY = exports.PORT = exports.DATABASE_URL = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnvVars = [
    "DATABASE_URL",
    "PORT",
    "CLERK_SECRET_KEY",
    "CLERK_PUBLISHABLE_KEY",
    "CLERK_PEM_PUBLIC_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
];
const checkEnvVariables = (vars) => {
    vars.forEach((variable) => {
        if (!process.env[variable]) {
            console.log(`Missing required environment variable: ${variable}`);
            process.exit(1);
        }
        console.log(`✓ ${variable} is set`);
    });
};
checkEnvVariables(requiredEnvVars);
exports.DATABASE_URL = process.env.DATABASE_URL;
exports.PORT = Number(process.env.PORT);
exports.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
exports.CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;
exports.CLIENT_URL = process.env.CLIENT_URL;
exports.CLERK_PEM_PUBLIC_KEY = process.env.CLERK_PEM_PUBLIC_KEY;
console.log("> All required environment variables are set.");
