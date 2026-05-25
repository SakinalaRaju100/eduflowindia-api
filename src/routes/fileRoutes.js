const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadFile } = require("../controllers/fileStorageController");
const { protect } = require("../middleware/authMiddleware");

const upload = multer(); // Uses memory storage by default, keeping the buffer for Vercel Blob

router.post("/upload", protect, upload.single("file"), uploadFile);

module.exports = router;
