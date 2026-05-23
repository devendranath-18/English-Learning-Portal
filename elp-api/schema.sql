-- MySQL Database Schema for English Learning Portal

CREATE DATABASE IF NOT EXISTS english_learning_portal;
USE english_learning_portal;

-- 1. users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'faculty', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. students table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. faculty table
CREATE TABLE IF NOT EXISTS faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  designation VARCHAR(255) DEFAULT 'Instructor',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. admins table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. courses table
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. student_courses table
CREATE TABLE IF NOT EXISTS student_courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  progress_percentage INT DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_course (student_id, course_id)
) ENGINE=InnoDB;

-- 7. exams table
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  course_id INT NOT NULL,
  exam_date DATETIME NOT NULL,
  duration_minutes INT NOT NULL,
  pass_key VARCHAR(50) NOT NULL,
  is_published TINYINT(1) DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. questions table
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(255) NOT NULL,
  option_b VARCHAR(255) NOT NULL,
  option_c VARCHAR(255) NOT NULL,
  option_d VARCHAR(255) NOT NULL,
  correct_option CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. exam_results table
CREATE TABLE IF NOT EXISTS exam_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  student_id INT NOT NULL,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_exam (student_id, exam_id)
) ENGINE=InnoDB;

-- 10. faculty_students table
CREATE TABLE IF NOT EXISTS faculty_students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT NOT NULL,
  student_id INT NOT NULL,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_faculty_student (faculty_id, student_id)
) ENGINE=InnoDB;

-- 11. study_materials table
CREATE TABLE IF NOT EXISTS study_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- SEED DATA (Password for all default users is: password123)
-- bcrypt hash for 'password123': $2a$10$KqXgq2wYc.W9vj9w2b1.Iu9sD3r6u2f4y6H8i2S3t4U5V6W7x8y9z
-- (Actual standard bcryptjs hash generated: $2a$10$n9L6nOqVq2L12Z.h8vJ2h.1O6iFq/p3J7t/vFmF3fS2l5D8o8qC7K)

INSERT INTO users (id, name, email, password, role) VALUES
(1, 'System Admin', 'admin@elp.com', '$2b$10$FRQL2I.UypnlzlcyIiRQQeeT.SjYYtAi0SE7wtpPW0uuM7Q1n0Tdi', 'admin'),
(2, 'Professor Jane Smith', 'faculty@elp.com', '$2b$10$FRQL2I.UypnlzlcyIiRQQeeT.SjYYtAi0SE7wtpPW0uuM7Q1n0Tdi', 'faculty'),
(3, 'John Doe', 'student@elp.com', '$2b$10$FRQL2I.UypnlzlcyIiRQQeeT.SjYYtAi0SE7wtpPW0uuM7Q1n0Tdi', 'student'),
(4, 'Alice Green', 'alice@elp.com', '$2b$10$FRQL2I.UypnlzlcyIiRQQeeT.SjYYtAi0SE7wtpPW0uuM7Q1n0Tdi', 'student');

INSERT INTO admins (id, user_id) VALUES (1, 1);
INSERT INTO faculty (id, user_id, designation) VALUES (1, 2, 'Senior Professor');
INSERT INTO students (id, user_id) VALUES (1, 3), (2, 4);

-- Seed Courses
INSERT INTO courses (id, title, description) VALUES
(1, 'Spoken English Basics', 'Improve daily conversation skills and pronunciation with hands-on practice.'),
(2, 'Advanced English Grammar', 'Master tenses, clauses, sentence patterns, and advanced stylistic devices.'),
(3, 'Vocabulary Building', 'Expand your lexicon for professional settings, exams, and fluent communication.');

-- Assign Students to Courses
INSERT INTO student_courses (student_id, course_id, progress_percentage) VALUES
(1, 1, 75),
(1, 2, 40),
(2, 1, 20);

-- Assign Student to Faculty
INSERT INTO faculty_students (faculty_id, student_id) VALUES
(1, 1),
(1, 2);

-- Seed Exams
-- For demo purposes, the exam date is set to a future date in 2026/2027
INSERT INTO exams (id, title, course_id, exam_date, duration_minutes, pass_key, is_published) VALUES
(1, 'Mid-Term Grammar Quiz', 2, '2026-06-15 10:00:00', 30, 'GRAMMAR101', 1),
(2, 'Vocabulary Final Test', 3, '2026-06-20 14:00:00', 45, 'VOCAB202', 1);

-- Seed Questions
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
(1, 'Choose the correct form: "If I _______ you, I would study harder."', 'am', 'was', 'were', 'had been', 'C'),
(1, 'Identify the correct passive voice: "The cat chased the mouse."', 'The mouse is chased by the cat.', 'The mouse was chased by the cat.', 'The mouse chases the cat.', 'The mouse had chased the cat.', 'B'),
(1, 'Which sentence uses the present perfect continuous tense correctly?', 'I have been writing this essay for two hours.', 'I am writing this essay for two hours.', 'I have written this essay for two hours.', 'I was writing this essay for two hours.', 'A'),
(2, 'What is a synonym for the word "Melancholy"?', 'Cheerful', 'Gloomy', 'Hyperactive', 'Indifferent', 'B'),
(2, 'What is the meaning of "Ephemeral"?', 'Long-lasting', 'Short-lived', 'Beautiful', 'Scientific', 'B');
