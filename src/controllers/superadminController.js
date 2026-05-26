const Institution = require("../models/Institution");
const User = require("../models/User");
const { sendWelcomeEmail } = require("../utils/email");

// GET /api/superadmin/schools
exports.getInstitutions = async (req, res) => {
  try {
    const schools = await Institution.find()
      .populate("principalId", "firstName lastName email")
      .sort("-createdAt");
    res.json({ success: true, data: schools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/superadmin/schools
exports.createInstitution = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      phone,
      website,
      affiliationBoard,
      affiliationNumber,
      principalFirstName,
      principalLastName,
      principalEmail,
      principalPhone,
    } = req.body;

    // Create institution
    const institution = await Institution.create({
      name,
      email,
      address,
      phone,
      website,
      affiliationBoard,
      affiliationNumber,
    });

    // Create principal user
    // const tempPassword = `Principal@${Math.floor(1000 + Math.random() * 9000)}`;
    const tempPassword = "Principal@123";
    const principal = await User.create({
      email: principalEmail,
      password: tempPassword,
      role: "principal",
      institution: institution._id,
      firstName: principalFirstName,
      lastName: principalLastName,
      phone: principalPhone,
      isFirstLogin: true,
    });

    institution.principalId = principal._id;
    await institution.save();

    await sendWelcomeEmail(
      principalEmail,
      `${principalFirstName} ${principalLastName}`,
      principalEmail,
      tempPassword,
      "Principal",
    );

    res.status(201).json({
      success: true,
      data: institution,
      message: "Institution and principal account created",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/superadmin/schools/:id
exports.updateInstitution = async (req, res) => {
  try {
    const institution = await Institution.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    ).populate("principalId", "firstName lastName email");
    if (!institution)
      return res
        .status(404)
        .json({ success: false, message: "Institution not found" });
    res.json({ success: true, data: institution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/superadmin/schools/:id
exports.deleteInstitution = async (req, res) => {
  try {
    const institution = await Institution.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!institution)
      return res
        .status(404)
        .json({ success: false, message: "Institution not found" });
    await User.updateMany(
      { institution: institution._id },
      { isActive: false },
    );
    res.json({ success: true, message: "Institution deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/superadmin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalInstitutions, activeInstitutions, totalUsers] =
      await Promise.all([
        Institution.countDocuments(),
        Institution.countDocuments({ isActive: true }),
        User.countDocuments({ role: { $ne: "superadmin" } }),
      ]);
    res.json({
      success: true,
      data: { totalInstitutions, activeInstitutions, totalUsers },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
