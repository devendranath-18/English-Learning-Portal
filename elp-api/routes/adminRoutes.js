const express = require("express");
const bcrypt = require("bcryptjs");
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

// Helper for transaction operations
const beginTransaction = () => new Promise((res, rej) => db.beginTransaction(err => err ? rej(err) : res()));
const commitTransaction = () => new Promise((res, rej) => db.commit(err => err ? rej(err) : res()));
const rollbackTransaction = () => new Promise((res) => db.rollback(() => res()));

// All routes here require admin role verification
router.use(verifyToken, authorizeRoles("admin"));

// GET /api/admin/analytics
// Returns platform-wide dashboard stats
router.get("/analytics", async (req, res) => {
  try {
    const studentsCount = await queryAsync("SELECT COUNT(*) as count FROM students");
    const facultyCount = await queryAsync("SELECT COUNT(*) as count FROM faculty");
    const coursesCount = await queryAsync("SELECT COUNT(*) as count FROM courses");
    const examsCount = await queryAsync("SELECT COUNT(*) as count FROM exams");
    const submissionsCount = await queryAsync("SELECT COUNT(*) as count FROM exam_results");

    res.status(200).json({
      totalStudents: studentsCount[0].count,
      totalFaculty: facultyCount[0].count,
      totalCourses: coursesCount[0].count,
      totalExams: examsCount[0].count,
      totalSubmissions: submissionsCount[0].count
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ message: "Server error fetching analytics" });
  }
});

// GET /api/admin/users
// Lists all students and faculty users
router.get("/users", async (req, res) => {
  try {
    const students = await queryAsync(
      `SELECT u.id as user_id, s.id as profile_id, u.name, u.email, u.role, u.created_at
       FROM users u JOIN students s ON u.id = s.user_id`
    );
    
    const faculty = await queryAsync(
      `SELECT u.id as user_id, f.id as profile_id, u.name, u.email, u.role, f.designation, u.created_at
       FROM users u JOIN faculty f ON u.id = f.user_id`
    );

    res.status(200).json({ students, faculty });
  } catch (error) {
    console.error("Admin list users error:", error);
    res.status(500).json({ message: "Server error fetching user list" });
  }
});

// POST /api/admin/users
// Create new student or faculty account inside a transaction
router.post("/users", async (req, res) => {
  const { name, email, password, role, designation } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!["student", "faculty"].includes(role)) {
    return res.status(400).json({ message: "Only student and faculty roles can be created here" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await beginTransaction();
    try {
      const userResult = await queryAsync(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role]
      );
      const userId = userResult.insertId;

      if (role === "student") {
        await queryAsync("INSERT INTO students (user_id) VALUES (?)", [userId]);
      } else {
        await queryAsync("INSERT INTO faculty (user_id, designation) VALUES (?, ?)", [userId, designation || "Lecturer"]);
      }

      await commitTransaction();
      res.status(201).json({ message: "User account created successfully" });
    } catch (err) {
      await rollbackTransaction();
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email is already registered" });
      }
      throw err;
    }
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ message: "Server error creating user account" });
  }
});

// DELETE /api/admin/users/:id
// Deletes user from users (cascades to role tables)
router.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await queryAsync("DELETE FROM users WHERE id = ?", [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ message: "Server error deleting user account" });
  }
});

// GET /api/admin/courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await queryAsync("SELECT * FROM courses");
    res.status(200).json(courses);
  } catch (error) {
    console.error("Admin get courses error:", error);
    res.status(500).json({ message: "Server error fetching courses" });
  }
});

// POST /api/admin/courses
router.post("/courses", async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Course title is required" });
  }

  try {
    const result = await queryAsync("INSERT INTO courses (title, description) VALUES (?, ?)", [title, description || ""]);
    res.status(201).json({ message: "Course created successfully", courseId: result.insertId });
  } catch (error) {
    console.error("Admin create course error:", error);
    res.status(500).json({ message: "Server error creating course" });
  }
});

// POST /api/admin/assign
// Map student to course or map student to faculty
router.post("/assign", async (req, res) => {
  const { type, studentId, targetId } = req.body; // type is 'course' or 'faculty'

  if (!type || !studentId || !targetId) {
    return res.status(400).json({ message: "All fields (type, studentId, targetId) are required" });
  }

  try {
    if (type === "course") {
      await queryAsync("INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)", [studentId, targetId]);
      res.status(200).json({ message: "Student enrolled in course successfully" });
    } else if (type === "faculty") {
      // Clean up previous faculty assignments for this student to maintain single-instructor constraint
      await queryAsync("DELETE FROM faculty_students WHERE student_id = ?", [studentId]);
      await queryAsync("INSERT INTO faculty_students (faculty_id, student_id) VALUES (?, ?)", [targetId, studentId]);
      res.status(200).json({ message: "Student assigned to faculty successfully" });
    } else {
      res.status(400).json({ message: "Invalid assignment type" });
    }
  } catch (error) {
    console.error("Admin assign error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "This mapping already exists" });
    }
    res.status(500).json({ message: "Server error executing assignment" });
  }
});

// GET /api/admin/exams
router.get("/exams", async (req, res) => {
  try {
    const exams = await queryAsync(
      `SELECT e.*, c.title as course_title, 
              (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as question_count 
       FROM exams e JOIN courses c ON e.course_id = c.id`
    );
    res.status(200).json(exams);
  } catch (error) {
    console.error("Admin get exams error:", error);
    res.status(500).json({ message: "Server error fetching exams" });
  }
});

// POST /api/admin/exams
// Create exam and insert questions inside transaction
router.post("/exams", async (req, res) => {
  const { title, courseId, examDate, durationMinutes, passKey, questions } = req.body;

  if (!title || !courseId || !examDate || !durationMinutes || !passKey) {
    return res.status(400).json({ message: "All exam metadata fields are required" });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "At least one question is required for an exam" });
  }

  try {
    await beginTransaction();
    try {
      // 1. Create Exam
      const examResult = await queryAsync(
        "INSERT INTO exams (title, course_id, exam_date, duration_minutes, pass_key, is_published) VALUES (?, ?, ?, ?, ?, 1)",
        [title, courseId, examDate, durationMinutes, passKey]
      );
      const examId = examResult.insertId;

      // 2. Create Questions
      for (const q of questions) {
        if (!q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctOption) {
          throw new Error("Missing question options or correct choice");
        }
        await queryAsync(
          `INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [examId, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption.toUpperCase()]
        );
      }

      await commitTransaction();
      res.status(201).json({ message: "Exam and questions created successfully", examId });
    } catch (err) {
      await rollbackTransaction();
      console.error("Transaction failed: ", err);
      return res.status(400).json({ message: err.message || "Failed to create exam" });
    }
  } catch (error) {
    console.error("Admin create exam error:", error);
    res.status(500).json({ message: "Server error creating exam" });
  }
});

// GET /api/admin/mappings
router.get("/mappings", async (req, res) => {
  try {
    const courseEnrollments = await queryAsync(
      `SELECT sc.id, u.name as student_name, u.email as student_email, c.title as course_title, sc.progress_percentage
       FROM student_courses sc
       JOIN students s ON sc.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN courses c ON sc.course_id = c.id`
    );

    const facultyMappings = await queryAsync(
      `SELECT fs.id, s_u.name as student_name, s_u.email as student_email, f_u.name as faculty_name, f.designation
       FROM faculty_students fs
       JOIN students s ON fs.student_id = s.id
       JOIN users s_u ON s.user_id = s_u.id
       JOIN faculty f ON fs.faculty_id = f.id
       JOIN users f_u ON f.user_id = f_u.id`
    );

    res.status(200).json({ courseEnrollments, facultyMappings });
  } catch (error) {
    console.error("Admin get mappings error:", error);
    res.status(500).json({ message: "Server error fetching mappings" });
  }
});

// DELETE /api/admin/mappings/:type/:id
router.delete("/mappings/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  try {
    if (type === "course") {
      await queryAsync("DELETE FROM student_courses WHERE id = ?", [id]);
      res.status(200).json({ message: "Course enrollment removed successfully" });
    } else if (type === "faculty") {
      await queryAsync("DELETE FROM faculty_students WHERE id = ?", [id]);
      res.status(200).json({ message: "Student-faculty assignment removed successfully" });
    } else {
      res.status(400).json({ message: "Invalid mapping type" });
    }
  } catch (error) {
    console.error("Admin delete mapping error:", error);
    res.status(500).json({ message: "Server error deleting mapping link" });
  }
});

// GET /api/admin/results
router.get("/results", async (req, res) => {
  try {
    const results = await queryAsync(
      `SELECT er.id, er.exam_id, u.name as student_name, u.email as student_email, c.title as course_title, e.title as exam_title, er.score, er.total_questions, er.submitted_at
       FROM exam_results er
       JOIN students s ON er.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN exams e ON er.exam_id = e.id
       JOIN courses c ON e.course_id = c.id
       ORDER BY er.submitted_at DESC`
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Admin get results error:", error);
    res.status(500).json({ message: "Server error fetching results" });
  }
});

// GET /api/admin/courses/:courseId/materials
router.get("/courses/:courseId/materials", async (req, res) => {
  const courseId = req.params.courseId;
  try {
    const materials = await queryAsync(
      "SELECT * FROM study_materials WHERE course_id = ? ORDER BY uploaded_at DESC",
      [courseId]
    );
    res.status(200).json(materials);
  } catch (error) {
    console.error("Admin fetch materials error:", error);
    res.status(500).json({ message: "Server error fetching materials" });
  }
});

// POST /api/admin/courses/:courseId/materials
router.post("/courses/:courseId/materials", async (req, res) => {
  const courseId = req.params.courseId;
  const { title, fileName } = req.body;

  if (!title || !fileName) {
    return res.status(400).json({ message: "Title and fileName are required" });
  }

  try {
    await queryAsync(
      "INSERT INTO study_materials (course_id, title, file_name, uploaded_by) VALUES (?, ?, ?, NULL)",
      [courseId, title, fileName]
    );
    res.status(201).json({ message: "Course material added successfully" });
  } catch (error) {
    console.error("Admin add material error:", error);
    res.status(500).json({ message: "Server error adding course material" });
  }
});

// DELETE /api/admin/materials/:id
router.delete("/materials/:id", async (req, res) => {
  const materialId = req.params.id;
  try {
    await queryAsync("DELETE FROM study_materials WHERE id = ?", [materialId]);
    res.status(200).json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Admin delete material error:", error);
    res.status(500).json({ message: "Server error deleting material" });
  }
});

// GET /api/admin/courses/:courseId/chapters
router.get("/courses/:courseId/chapters", async (req, res) => {
  const courseId = req.params.courseId;
  try {
    const chapters = await queryAsync(
      "SELECT * FROM course_chapters WHERE course_id = ? ORDER BY sort_order ASC",
      [courseId]
    );
    res.status(200).json(chapters);
  } catch (error) {
    console.error("Admin fetch chapters error:", error);
    res.status(500).json({ message: "Server error fetching chapters" });
  }
});

// POST /api/admin/courses/:courseId/chapters
router.post("/courses/:courseId/chapters", async (req, res) => {
  const courseId = req.params.courseId;
  const { title, content, sortOrder, videoUrl, audioUrl } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    await queryAsync(
      "INSERT INTO course_chapters (course_id, title, content, sort_order, video_url, audio_url) VALUES (?, ?, ?, ?, ?, ?)",
      [courseId, title, content, parseInt(sortOrder) || 0, videoUrl || null, audioUrl || null]
    );
    res.status(201).json({ message: "Chapter added successfully" });
  } catch (error) {
    console.error("Admin add chapter error:", error);
    res.status(500).json({ message: "Server error adding chapter" });
  }
});

// PUT /api/admin/chapters/:id
router.put("/chapters/:id", async (req, res) => {
  const chapterId = req.params.id;
  const { title, content, sortOrder, videoUrl, audioUrl } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    await queryAsync(
      "UPDATE course_chapters SET title = ?, content = ?, sort_order = ?, video_url = ?, audio_url = ? WHERE id = ?",
      [title, content, parseInt(sortOrder) || 0, videoUrl || null, audioUrl || null, chapterId]
    );
    res.status(200).json({ message: "Chapter updated successfully" });
  } catch (error) {
    console.error("Admin update chapter error:", error);
    res.status(500).json({ message: "Server error updating chapter" });
  }
});

// DELETE /api/admin/chapters/:id
router.delete("/chapters/:id", async (req, res) => {
  const chapterId = req.params.id;
  try {
    await queryAsync("DELETE FROM course_chapters WHERE id = ?", [chapterId]);
    res.status(200).json({ message: "Chapter deleted successfully" });
  } catch (error) {
    console.error("Admin delete chapter error:", error);
    res.status(500).json({ message: "Server error deleting chapter" });
  }
});

module.exports = router;
