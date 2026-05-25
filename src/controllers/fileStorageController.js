const { put } = require("@vercel/blob");

exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const { originalname, buffer, mimetype } = file;

    const { url } = await put(`uploads/${originalname}`, buffer, {
      access: "public",
      // Securely use environment variables instead of a hardcoded token
      token: "vercel_blob_rw_rVjJwbcVRINVDGxq_DfDbbDevayXXXCtPbFybk7v8XVDecA", // your actual token
      //   token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true, // to prevent name collision
      contentType: mimetype,
    });

    res
      .status(200)
      .json({ success: true, message: "Uploaded successfully!", url });
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ success: false, message: "Upload failed", error: error.message });
  }
};
