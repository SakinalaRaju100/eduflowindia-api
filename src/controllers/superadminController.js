const School = require('../models/School');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../utils/email');

// GET /api/superadmin/schools
exports.getSchools = async (req, res) => {
  try {
    const schools = await School.find().populate('principalId', 'firstName lastName email').sort('-createdAt');
    res.json({ success: true, data: schools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/superadmin/schools
exports.createSchool = async (req, res) => {
  try {
    const { name, email, address, phone, website, affiliationBoard, affiliationNumber,
      principalFirstName, principalLastName, principalEmail, principalPhone } = req.body;

    // Create school
    const school = await School.create({ name, email, address, phone, website, affiliationBoard, affiliationNumber });

    // Create principal user
    // const tempPassword = `Principal@${Math.floor(1000 + Math.random() * 9000)}`;
    const tempPassword = 'Principal@123';
    const principal = await User.create({
      email: principalEmail,
      password: tempPassword,
      role: 'principal',
      school: school._id,
      firstName: principalFirstName,
      lastName: principalLastName,
      phone: principalPhone,
      isFirstLogin: true,
    });

    school.principalId = principal._id;
    await school.save();

    await sendWelcomeEmail(principalEmail, `${principalFirstName} ${principalLastName}`, principalEmail, tempPassword, 'Principal');

    res.status(201).json({ success: true, data: school, message: 'School and principal account created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/superadmin/schools/:id
exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('principalId', 'firstName lastName email');
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/superadmin/schools/:id
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    await User.updateMany({ school: school._id }, { isActive: false });
    res.json({ success: true, message: 'School deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/superadmin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalSchools, activeSchools, totalUsers] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $ne: 'superadmin' } }),
    ]);
    res.json({ success: true, data: { totalSchools, activeSchools, totalUsers } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
