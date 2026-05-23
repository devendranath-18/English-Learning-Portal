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

// All routes here require student role verification
router.use(verifyToken, authorizeRoles("student"));

// Prevent dynamic client-side caching
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// GET /api/student/dashboard
router.get("/dashboard", async (req, res) => {
  const studentId = req.user.profileId;

  try {
    // 1. Total Courses
    const courses = await queryAsync(
      "SELECT COUNT(*) as count FROM student_courses WHERE student_id = ?",
      [studentId]
    );
    const totalCourses = courses[0].count;

    // 2. Average Progress
    const progress = await queryAsync(
      "SELECT AVG(progress_percentage) as avg_progress FROM student_courses WHERE student_id = ?",
      [studentId]
    );
    const progressPercentage = Math.round(progress[0].avg_progress || 0);

    // 3. Total Exams (Exams linked to enrolled courses)
    const exams = await queryAsync(
      `SELECT COUNT(*) as count FROM exams e
       JOIN student_courses sc ON e.course_id = sc.course_id
       WHERE sc.student_id = ?`,
      [studentId]
    );
    const totalExams = exams[0].count;

    // 4. Assigned Faculty details
    const faculty = await queryAsync(
      `SELECT u.name, u.email, f.designation FROM faculty_students fs
       JOIN faculty f ON fs.faculty_id = f.id
       JOIN users u ON f.user_id = u.id
       WHERE fs.student_id = ?`,
      [studentId]
    );

    res.status(200).json({
      totalCourses,
      totalExams,
      progressPercentage,
      faculty: faculty.length > 0 ? faculty : null
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
});

// GET /api/student/courses
router.get("/courses", async (req, res) => {
  const studentId = req.user.profileId;

  try {
    const courses = await queryAsync(
      `SELECT c.id, c.title, c.description, sc.progress_percentage 
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = ?`,
      [studentId]
    );
    res.status(200).json(courses);
  } catch (error) {
    console.error("Student courses error:", error);
    res.status(500).json({ message: "Server error fetching courses" });
  }
});

// GET /api/student/exams
router.get("/exams", async (req, res) => {
  const studentId = req.user.profileId;

  try {
    // Fetch exams for student courses, including completed status
    const exams = await queryAsync(
      `SELECT e.id, e.title, e.exam_date, e.duration_minutes, c.title as course_title,
              (SELECT COUNT(*) FROM exam_results WHERE exam_id = e.id AND student_id = ?) as has_taken
       FROM exams e
       JOIN student_courses sc ON e.course_id = sc.course_id
       JOIN courses c ON e.course_id = c.id
       WHERE sc.student_id = ?`,
      [studentId, studentId]
    );

    // Add status flag: upcoming, active, closed
    const now = new Date();
    const formattedExams = exams.map(exam => {
      const examTime = new Date(exam.exam_date);
      const endTime = new Date(examTime.getTime() + exam.duration_minutes * 60000);
      
      let status = "upcoming";
      if (now >= examTime && now <= endTime) {
        status = "active";
      } else if (now > endTime) {
        status = "closed";
      }

      return {
        ...exam,
        status
      };
    });

    res.status(200).json(formattedExams);
  } catch (error) {
    console.error("Student exams error:", error);
    res.status(500).json({ message: "Server error fetching exams" });
  }
});

// POST /api/student/exams/attend
router.post("/exams/attend", async (req, res) => {
  const { examId, passKey } = req.body;
  const studentId = req.user.profileId;

  if (!examId || !passKey) {
    return res.status(400).json({ message: "Exam ID and Pass Key are required" });
  }

  try {
    // 1. Fetch exam
    const exams = await queryAsync("SELECT * FROM exams WHERE id = ?", [examId]);
    if (exams.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const exam = exams[0];

    // 2. Verify pass key
    if (exam.pass_key !== passKey) {
      return res.status(401).json({ message: "Invalid pass key" });
    }

    // 3. Verify active time window
    const now = new Date();
    const examTime = new Date(exam.exam_date);
    const endTime = new Date(examTime.getTime() + exam.duration_minutes * 60000);

    if (now < examTime) {
      return res.status(403).json({ message: "This exam has not started yet" });
    }

    if (now > endTime) {
      return res.status(403).json({ message: "This exam session has closed" });
    }

    // 4. Verify student hasn't already taken the exam
    const results = await queryAsync(
      "SELECT * FROM exam_results WHERE exam_id = ? AND student_id = ?",
      [examId, studentId]
    );

    if (results.length > 0) {
      return res.status(403).json({ message: "You have already submitted this exam" });
    }

    res.status(200).json({ message: "Access granted", duration_minutes: exam.duration_minutes });
  } catch (error) {
    console.error("Attend exam error:", error);
    res.status(500).json({ message: "Server error during exam validation" });
  }
});

// GET /api/student/exams/:id
// Returns exam info and list of questions WITHOUT correct options for security
router.get("/exams/:id", async (req, res) => {
  const examId = req.params.id;

  try {
    const exams = await queryAsync("SELECT id, title, duration_minutes FROM exams WHERE id = ?", [examId]);
    if (exams.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Fetch questions without the correct_option field
    const questions = await queryAsync(
      "SELECT id, question_text, option_a, option_b, option_c, option_d FROM questions WHERE exam_id = ?",
      [examId]
    );

    res.status(200).json({
      exam: exams[0],
      questions
    });
  } catch (error) {
    console.error("Fetch exam questions error:", error);
    res.status(500).json({ message: "Server error fetching questions" });
  }
});

// POST /api/student/exams/:id/submit
// Auto evaluates submission and records result
router.post("/exams/:id/submit", async (req, res) => {
  const examId = req.params.id;
  const studentId = req.user.profileId;
  const { answers } = req.body; // Object mapping question ID -> selected option (e.g. {1: 'A', 2: 'C'})

  if (!answers) {
    return res.status(400).json({ message: "No answers submitted" });
  }

  try {
    // 1. Check if already submitted
    const existing = await queryAsync(
      "SELECT * FROM exam_results WHERE exam_id = ? AND student_id = ?",
      [examId, studentId]
    );

    if (existing.length > 0) {
      return res.status(403).json({ message: "Exam already submitted" });
    }

    // 2. Fetch correct options
    const questions = await queryAsync("SELECT id, correct_option FROM questions WHERE exam_id = ?", [examId]);
    
    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found for this exam" });
    }

    // 3. Auto evaluation
    let score = 0;
    const totalQuestions = questions.length;

    questions.forEach(q => {
      const studentAnswer = answers[q.id];
      if (studentAnswer && studentAnswer.toUpperCase() === q.correct_option.toUpperCase()) {
        score++;
      }
    });

    // 4. Save result
    await queryAsync(
      "INSERT INTO exam_results (exam_id, student_id, score, total_questions) VALUES (?, ?, ?, ?)",
      [examId, studentId, score, totalQuestions]
    );

    res.status(200).json({
      message: "Exam submitted successfully"
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    res.status(500).json({ message: "Server error saving exam results" });
  }
});

// GET /api/student/courses/:courseId/materials
router.get("/courses/:courseId/materials", async (req, res) => {
  const courseId = req.params.courseId;
  const studentId = req.user.profileId;

  try {
    // 1. Verify that the student is actually enrolled in this course
    const enrollment = await queryAsync(
      "SELECT * FROM student_courses WHERE student_id = ? AND course_id = ?",
      [studentId, courseId]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({ message: "You are not enrolled in this course track" });
    }

    // 2. Fetch course materials
    const materials = await queryAsync(
      "SELECT id, title, file_name, uploaded_at FROM study_materials WHERE course_id = ? ORDER BY uploaded_at DESC",
      [courseId]
    );

    res.status(200).json(materials);
  } catch (error) {
    console.error("Student fetch materials error:", error);
    res.status(500).json({ message: "Server error fetching materials list" });
  }
});

// GET /api/student/courses/:courseId/chapters
router.get("/courses/:courseId/chapters", async (req, res) => {
  const courseId = req.params.courseId;
  const studentId = req.user.profileId;

  try {
    // 1. Verify that the student is actually enrolled in this course
    const enrollment = await queryAsync(
      "SELECT * FROM student_courses WHERE student_id = ? AND course_id = ?",
      [studentId, courseId]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({ message: "You are not enrolled in this course track" });
    }

    // 2. Fetch course chapters
    const chapters = await queryAsync(
      "SELECT id, title, content, sort_order, video_url, audio_url FROM course_chapters WHERE course_id = ? ORDER BY sort_order ASC",
      [courseId]
    );

    res.status(200).json(chapters);
  } catch (error) {
    console.error("Student fetch chapters error:", error);
    res.status(500).json({ message: "Server error fetching chapters list" });
  }
});

module.exports = router;
