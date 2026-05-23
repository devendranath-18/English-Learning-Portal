const express = require("express");
const db = require("../config/db");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Helper function to query DB using promises
const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// All routes here require faculty role verification
router.use(verifyToken, authorizeRoles("faculty"));

// GET /api/faculty/students
// Fetch assigned students, their courses, and progress
router.get("/students", async (req, res) => {
  const facultyId = req.user.profileId;

  try {
    const students = await queryAsync(
      `SELECT s.id as student_id, u.name, u.email, c.id as course_id, c.title as course_title, sc.progress_percentage
       FROM faculty_students fs
       JOIN students s ON fs.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN student_courses sc ON s.id = sc.student_id
       LEFT JOIN courses c ON sc.course_id = c.id
       WHERE fs.faculty_id = ?`,
      [facultyId]
    );

    // Group student courses list
    const studentMap = {};
    students.forEach(row => {
      if (!studentMap[row.student_id]) {
        studentMap[row.student_id] = {
          studentId: row.student_id,
          name: row.name,
          email: row.email,
          courses: []
        };
      }
      if (row.course_id) {
        studentMap[row.student_id].courses.push({
          courseId: row.course_id,
          title: row.course_title,
          progress: row.progress_percentage
        });
      }
    });

    res.status(200).json(Object.values(studentMap));
  } catch (error) {
    console.error("Faculty get students error:", error);
    res.status(500).json({ message: "Server error fetching students list" });
  }
});

// GET /api/faculty/results
// View exam results for assigned students
router.get("/results", async (req, res) => {
  const facultyId = req.user.profileId;

  try {
    const results = await queryAsync(
      `SELECT er.id, er.score, er.total_questions, er.submitted_at, 
              e.title as exam_title, u.name as student_name, c.title as course_title
       FROM exam_results er
       JOIN exams e ON er.exam_id = e.id
       JOIN students s ON er.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       JOIN faculty_students fs ON s.id = fs.student_id
       WHERE fs.faculty_id = ?
       ORDER BY er.submitted_at DESC`,
      [facultyId]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Faculty view results error:", error);
    res.status(500).json({ message: "Server error fetching exam results" });
  }
});

// POST /api/faculty/materials
// Upload study resource link/metadata
router.post("/materials", async (req, res) => {
  const facultyId = req.user.profileId;
  const { courseId, title, fileName } = req.body;

  if (!courseId || !title || !fileName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await queryAsync(
      "INSERT INTO study_materials (course_id, title, file_name, uploaded_by) VALUES (?, ?, ?, ?)",
      [courseId, title, fileName, facultyId]
    );

    res.status(201).json({ message: "Study material added successfully" });
  } catch (error) {
    console.error("Faculty material upload error:", error);
    res.status(500).json({ message: "Server error saving study material" });
  }
});

// GET /api/faculty/courses
// Fetch all courses in the platform to let faculty select one for uploads or student progression
router.get("/courses", async (req, res) => {
  try {
    const courses = await queryAsync("SELECT id, title, description FROM courses");
    res.status(200).json(courses);
  } catch (error) {
    console.error("Faculty fetch courses error:", error);
    res.status(500).json({ message: "Server error fetching courses list" });
  }
});

// PUT /api/faculty/students/:studentId/progress
// Update progress percentage for a student's course
router.put("/students/:studentId/progress", async (req, res) => {
  const facultyId = req.user.profileId;
  const studentId = req.params.studentId;
  const { courseId, progressPercentage } = req.body;

  if (!courseId || progressPercentage === undefined) {
    return res.status(400).json({ message: "Course ID and progress percentage are required" });
  }

  if (progressPercentage < 0 || progressPercentage > 100) {
    return res.status(400).json({ message: "Progress percentage must be between 0 and 100" });
  }

  try {
    // 1. Verify this student is assigned to this faculty
    const assignment = await queryAsync(
      "SELECT * FROM faculty_students WHERE faculty_id = ? AND student_id = ?",
      [facultyId, studentId]
    );

    if (assignment.length === 0) {
      return res.status(403).json({ message: "You are not authorized to manage this student" });
    }

    // 2. Update progress
    const updateResult = await queryAsync(
      "UPDATE student_courses SET progress_percentage = ? WHERE student_id = ? AND course_id = ?",
      [progressPercentage, studentId, courseId]
    );

    if (updateResult.affectedRows === 0) {
      // If course link doesn't exist, we can create it
      await queryAsync(
        "INSERT INTO student_courses (student_id, course_id, progress_percentage) VALUES (?, ?, ?)",
        [studentId, courseId, progressPercentage]
      );
    }

    res.status(200).json({ message: "Progress updated successfully" });
  } catch (error) {
    console.error("Update student progress error:", error);
    res.status(500).json({ message: "Server error updating progress" });
  }
});

module.exports = router;
