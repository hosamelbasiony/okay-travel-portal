-- SQLite Schema Arabic

CREATE TABLE IF NOT EXISTS visa_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT,
    visa_name TEXT,
    eligible_for TEXT,
    visa_type TEXT
);

CREATE TABLE IF NOT EXISTS general_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Insert Admin User (password: admin123)
-- Using bcrypt hash for 'admin123'
INSERT OR REPLACE INTO users (username, password) 
VALUES ('admin', '$2b$10$V3h6NJWrn7M9/JONZbW7aOd0tyw79mt6Fb3Qhc1egxmVWovAvVPMC');

-- Sample Data (Arabic)
INSERT INTO visa_info (question, answer, visa_name, eligible_for, visa_type) 
VALUES ('ما هي تفاصيل تأشيرة تنزانيا؟', 'السعر: 80 ريال عماني...', 'تأشيرة تنزانيا السياحية', 'لليمنيين المقيمين في أي مكان في العالم.', 'تأشيرة سياحية');

INSERT INTO general_info (question, answer) 
VALUES ('ما هي مواعيد العمل في المكتب؟', 'مكتبنا مفتوح من الساعة 9 صباحاً حتى 6 مساءً، من الأحد إلى الخميس.');
