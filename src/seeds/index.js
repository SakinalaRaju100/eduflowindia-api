require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});
const mongoose = require("mongoose");
const User = require("../models/User");
const School = require("../models/School");
const Classroom = require("../models/Classroom");
const StudentProfile = require("../models/StudentProfile");
const TeacherProfile = require("../models/TeacherProfile");
const { CalendarEvent, Announcement } = require("../models/Misc");
const { Exam } = require("../models/Exam");
const FeeRecord = require("../models/FeeRecord");

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("🌱 Starting seed...");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    School.deleteMany({}),
    Classroom.deleteMany({}),
    StudentProfile.deleteMany({}),
    TeacherProfile.deleteMany({}),
    CalendarEvent.deleteMany({}),
    Announcement.deleteMany({}),
    Exam.deleteMany({}),
    FeeRecord.deleteMany({}),
  ]);

  // ── Super Admin ──────────────────────────────────────────────
  const superadmin = await User.create({
    email: "superadmin@edu.com",
    password: "Superadmin@123",
    role: "superadmin",
    firstName: "Super",
    lastName: "Admin",
    isFirstLogin: false,
  });
  console.log("✅ Superadmin created:", superadmin.email);

  // ── Demo School ──────────────────────────────────────────────
  const school = await School.create({
    institutionUniqueId: "2024GREE",
    name: "Greenwood International School",
    email: "admin@greenwood.edu",
    phone: "+91-9876543210",
    website: "www.greenwood.edu",
    affiliationBoard: "CBSE",
    affiliationNumber: "CB-2024-001",
    address: {
      street: "123 Education Lane",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400001",
    },
    currentAcademicYear: "2024-2025",
    academicYears: [
      {
        year: "2024-2025",
        startDate: new Date("2024-04-01"),
        endDate: new Date("2025-03-31"),
        isCurrent: true,
      },
    ],
  });

  // ── Principal ────────────────────────────────────────────────
  const principal = await User.create({
    email: "principal@greenwood.edu",
    password: "Principal@123",
    role: "principal",
    school: school._id,
    firstName: "Dr. Priya",
    lastName: "Sharma",
    phone: "+91-9876500001",
    isFirstLogin: false,
  });
  school.principalId = principal._id;
  await school.save();
  console.log("✅ Principal created:", principal.email);

  // ── Teachers ─────────────────────────────────────────────────
  const teacherData = [
    {
      firstName: "Anjali",
      lastName: "Mehta",
      email: "anjali@greenwood.edu",
      subjects: ["Mathematics", "Physics"],
      designation: "Senior Teacher",
    },
    {
      firstName: "Rajesh",
      lastName: "Kumar",
      email: "rajesh@greenwood.edu",
      subjects: ["English", "History"],
      designation: "Teacher",
    },
    {
      firstName: "Sunita",
      lastName: "Patel",
      email: "sunita@greenwood.edu",
      subjects: ["Chemistry", "Biology"],
      designation: "Teacher",
    },
    {
      firstName: "Vikram",
      lastName: "Singh",
      email: "vikram@greenwood.edu",
      subjects: ["Computer Science"],
      designation: "HOD",
    },
  ];

  const teachers = [];
  for (let i = 0; i < teacherData.length; i++) {
    const td = teacherData[i];
    const u = await User.create({
      email: td.email,
      password: "Teacher@1234",
      role: "teacher",
      school: school._id,
      firstName: td.firstName,
      lastName: td.lastName,
      isFirstLogin: false,
    });
    const tp = await TeacherProfile.create({
      userId: u._id,
      school: school._id,
      teacherId: `TCH-2024-00${i + 1}`,
      qualifications: [
        { degree: "M.Sc", institution: "Delhi University", year: 2010 },
      ],
      subjectsExpertise: td.subjects,
      designation: td.designation,
      employmentType: "full-time",
      joiningDate: new Date("2020-06-01"),
      gender: i % 2 === 0 ? "female" : "male",
    });
    teachers.push({ user: u, profile: tp });
  }
  console.log("✅ Teachers created:", teachers.length);

  // ── Classrooms ───────────────────────────────────────────────
  const classroomDefs = [
    {
      grade: "10",
      section: "A",
      roomNumber: "R-101",
      classTeacher: teachers[0].user._id,
    },
    {
      grade: "10",
      section: "B",
      roomNumber: "R-102",
      classTeacher: teachers[1].user._id,
    },
    {
      grade: "9",
      section: "A",
      roomNumber: "R-201",
      classTeacher: teachers[2].user._id,
    },
    {
      grade: "8",
      section: "A",
      roomNumber: "R-301",
      classTeacher: teachers[3].user._id,
    },
  ];

  const defaultSubjects = [
    { name: "Mathematics", code: "MATH", maxMarks: 100 },
    { name: "English", code: "ENG", maxMarks: 100 },
    { name: "Science", code: "SCI", maxMarks: 100 },
    { name: "Social Studies", code: "SS", maxMarks: 100 },
    { name: "Computer Science", code: "CS", maxMarks: 100 },
  ];

  const classrooms = [];
  for (const cd of classroomDefs) {
    const cr = await Classroom.create({
      ...cd,
      school: school._id,
      academicYear: "2024-2025",
      capacity: 40,
      description: `Grade ${cd.grade} Section ${cd.section}`,
      subjects: defaultSubjects,
      defaultFees: 50000,
      startTime: "08:30 AM",
      endTime: "03:00 PM",
      academicStartDate: new Date("2024-04-01"),
      academicEndDate: new Date("2025-03-31"),
      feeStructure: [
        { feeType: "Tuition Fee", amount: 40000, installment: 1 },
        { feeType: "Library Fee", amount: 5000, installment: 1 },
        { feeType: "Sports Fee", amount: 5000, installment: 1 },
      ],
    });
    classrooms.push(cr);
    // Assign class to teacher
    await TeacherProfile.findOneAndUpdate(
      { userId: cd.classTeacher },
      { $addToSet: { assignedClasses: cr._id } },
    );
  }
  console.log("✅ Classrooms created:", classrooms.length);

  // ── Students ─────────────────────────────────────────────────
  const studentNames = [
    ["Aarav", "Gupta"],
    ["Priya", "Nair"],
    ["Rohan", "Joshi"],
    ["Sneha", "Reddy"],
    ["Karan", "Malhotra"],
    ["Ananya", "Iyer"],
    ["Dev", "Sharma"],
    ["Pooja", "Verma"],
    ["Arjun", "Kapoor"],
    ["Meera", "Pillai"],
    ["Siddharth", "Rao"],
    ["Kavya", "Menon"],
  ];

  const parentUser = await User.create({
    email: "parent@greenwood.edu",
    password: "Parent@1234",
    role: "parent",
    school: school._id,
    firstName: "Suresh",
    lastName: "Gupta",
    isFirstLogin: false,
  });

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const [fn, ln] = studentNames[i];
    const classroom = classrooms[Math.floor(i / 3)];
    const dob = new Date(
      2008,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1,
    );
    const u = await User.create({
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.greenwood.edu`,
      password: "Student@1234",
      role: "student",
      school: school._id,
      firstName: fn,
      lastName: ln,
      isFirstLogin: false,
    });
    const sp = await StudentProfile.create({
      userId: u._id,
      school: school._id,
      classroom: classroom._id,
      rollNumber: String(i + 1).padStart(2, "0"),
      studentId: `STU-2024-${String(i + 1).padStart(4, "0")}`,
      dateOfBirth: dob,
      gender: i % 2 === 0 ? "male" : "female",
      bloodGroup: ["A+", "B+", "O+", "AB+"][i % 4],
      academicYear: "2024-2025",
      admissionDate: new Date("2024-04-01"),
      guardians: [
        {
          relationship: "father",
          userId: i === 0 ? parentUser._id : null,
          name: `${ln} Father`,
          phone: `+91-98765${String(43210 + i).padStart(5, "0")}`,
          email: `parent${i}@example.com`,
        },
      ],
    });
    await Classroom.findByIdAndUpdate(classroom._id, {
      $addToSet: { students: u._id },
    });

    // Create fee record
    await FeeRecord.create({
      school: school._id,
      student: u._id,
      classroom: classroom._id,
      academicYear: "2024-2025",
      feeType: "Annual Fee",
      totalAmount: 50000,
      dueDate: new Date("2024-06-30"),
      installments: [
        {
          installmentNo: 1,
          amount: 20000,
          dueDate: new Date("2024-06-30"),
          isPaid: i < 6 ? true : false,
          paidDate: i < 6 ? new Date("2024-06-15") : null,
          paymentMode: "online",
          receiptNo: `RCP-${Date.now()}-${i}`,
        },
        {
          installmentNo: 2,
          amount: 15000,
          dueDate: new Date("2024-10-31"),
          isPaid: i < 3 ? true : false,
        },
        {
          installmentNo: 3,
          amount: 15000,
          dueDate: new Date("2025-01-31"),
          isPaid: false,
        },
      ],
    });
    students.push({ user: u, profile: sp });
  }
  console.log("✅ Students created:", students.length);
  console.log("✅ Parent created:", parentUser.email);

  // ── Calendar Events ──────────────────────────────────────────
  const events = [
    {
      title: "Republic Day",
      type: "holiday",
      startDate: new Date("2025-01-26"),
      color: "#F44336",
    },
    {
      title: "Independence Day",
      type: "holiday",
      startDate: new Date("2024-08-15"),
      color: "#FF9800",
    },
    {
      title: "Gandhi Jayanti",
      type: "holiday",
      startDate: new Date("2024-10-02"),
      color: "#4CAF50",
    },
    {
      title: "Diwali Break",
      type: "festival",
      startDate: new Date("2024-11-01"),
      endDate: new Date("2024-11-05"),
      color: "#9C27B0",
    },
    {
      title: "Parent-Teacher Meeting",
      type: "ptm",
      startDate: new Date("2024-09-20"),
      color: "#2196F3",
    },
    {
      title: "Annual Sports Day",
      type: "event",
      startDate: new Date("2024-12-10"),
      color: "#00BCD4",
    },
    {
      title: "Mid-Term Exams",
      type: "exam",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2024-09-10"),
      color: "#FF5722",
    },
    {
      title: "Annual Day",
      type: "event",
      startDate: new Date("2025-02-15"),
      color: "#8BC34A",
    },
  ];
  for (const ev of events) {
    await CalendarEvent.create({
      ...ev,
      school: school._id,
      createdBy: principal._id,
      isPublic: true,
      targetRoles: ["all"],
    });
  }
  console.log("✅ Calendar events created:", events.length);

  // ── Announcements ────────────────────────────────────────────
  await Announcement.create([
    {
      school: school._id,
      title: "Welcome to Academic Year 2024-25",
      content:
        "We are pleased to welcome all students and staff to the new academic year. Classes begin on April 5th.",
      targetRoles: ["all"],
      createdBy: principal._id,
      priority: "important",
    },
    {
      school: school._id,
      title: "Mid-Term Exam Schedule Released",
      content:
        "Mid-term exams will be held from Sept 1-10. Time tables are now available in the portal.",
      targetRoles: ["student", "teacher", "parent"],
      createdBy: principal._id,
      priority: "important",
    },
    {
      school: school._id,
      title: "Staff Meeting - Friday 3PM",
      content:
        "Mandatory staff meeting this Friday at 3:00 PM in the conference hall.",
      targetRoles: ["teacher"],
      createdBy: principal._id,
      priority: "urgent",
    },
  ]);
  console.log("✅ Announcements created");

  // ── Sample Exam ──────────────────────────────────────────────
  await Exam.create({
    school: school._id,
    classroom: classrooms[0]._id,
    title: "Unit Test 1",
    type: "unit-test",
    academicYear: "2024-2025",
    term: "Term 1",
    scheduledBy: teachers[0].user._id,
    isPublished: true,
    publishedAt: new Date(),
    subjects: [
      {
        subjectName: "Mathematics",
        subjectCode: "MATH",
        date: new Date("2024-09-05"),
        startTime: "09:00",
        endTime: "12:00",
        maxMarks: 100,
        passingMarks: 35,
      },
      {
        subjectName: "English",
        subjectCode: "ENG",
        date: new Date("2024-09-06"),
        startTime: "09:00",
        endTime: "12:00",
        maxMarks: 100,
        passingMarks: 35,
      },
      {
        subjectName: "Science",
        subjectCode: "SCI",
        date: new Date("2024-09-07"),
        startTime: "09:00",
        endTime: "12:00",
        maxMarks: 100,
        passingMarks: 35,
      },
    ],
  });
  console.log("✅ Sample exam created");

  console.log("\n🎉 Seed complete!\n");
  console.log("─".repeat(50));
  console.log("📌 LOGIN CREDENTIALS");
  console.log("─".repeat(50));
  console.log("SuperAdmin : superadmin@edu.com       / Superadmin@123");
  console.log("Principal  : principal@greenwood.edu   / Principal@123");
  console.log("Teacher    : anjali@greenwood.edu       / Teacher@1234");
  console.log("Student    : aarav.gupta@student.greenwood.edu / Student@1234");
  console.log("Parent     : parent@greenwood.edu       / Parent@1234");
  console.log("─".repeat(50));

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
