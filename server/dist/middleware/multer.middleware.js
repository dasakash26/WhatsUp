"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default.v2,
    params: {
        public_id: (req, file) => {
            const filename = `${Date.now()}-${file.originalname}`;
            return `WhatsUp/${filename}`;
        },
        // Bypassing type checking with a type assertion
        transformation: [
            {
                quality: "auto:low",
                fetch_format: "auto",
            },
        ],
    },
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
});
