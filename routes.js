const express = require('express');
const router = express.Router();
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authenticateToken = require('./auth');

// Auth Routes
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'strict' });
        res.json({ message: 'Logged in successfully', username: user.username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, (req, res) => {
    res.json(req.user);
});

router.get('/token', authenticateToken, (req, res) => {
    res.json({ token: req.cookies.token });
});

// User Management Routes
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.post('/users', authenticateToken, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username already exists' });
        res.status(500).json({ error: 'Database error' });
    }
});

router.delete('/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    if (req.user.id == id) return res.status(400).json({ error: 'Cannot delete yourself' });

    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.put('/change-password', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        const validPass = await bcrypt.compare(oldPassword, user.password);
        if (!validPass) return res.status(401).json({ error: 'كلمة المرور القديمة غير صحيحة' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Visa Info CRUD
router.get('/visa-info/all', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM visa_info');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/visa-info', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM visa_info');
        const [rows] = await db.query('SELECT * FROM visa_info LIMIT ? OFFSET ?', [limit, offset]);
        res.json({
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.post('/visa-info', authenticateToken, async (req, res) => {
    const { question, answer, visa_name, eligible_for, visa_type } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO visa_info (question, answer, visa_name, eligible_for, visa_type) VALUES (?, ?, ?, ?, ?)',
            [question, answer, visa_name, eligible_for, visa_type]
        );
        res.status(201).json({ id: result.insertId, message: 'Visa info created' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.post('/visa-info/bulk', authenticateToken, async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected an array of items' });

    try {
        for (const item of items) {
            const { question, answer, visa_name, eligible_for, visa_type } = item;
            await db.query(
                'INSERT INTO visa_info (question, answer, visa_name, eligible_for, visa_type) VALUES (?, ?, ?, ?, ?)',
                [question, answer, visa_name, eligible_for, visa_type]
            );
        }
        res.status(201).json({ message: `${items.length} visa info items created` });
    } catch (err) {
        res.status(500).json({ error: 'Database error during bulk insert' });
    }
});

router.put('/visa-info/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { question, answer, visa_name, eligible_for, visa_type } = req.body;
    try {
        await db.query(
            'UPDATE visa_info SET question = ?, answer = ?, visa_name = ?, eligible_for = ?, visa_type = ? WHERE id = ?',
            [question, answer, visa_name, eligible_for, visa_type, id]
        );
        res.json({ message: 'Visa info updated' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.delete('/visa-info/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM visa_info WHERE id = ?', [id]);
        res.json({ message: 'Visa info deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// General Info CRUD
router.get('/general-info/all', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM general_info');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/general-info', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM general_info');
        const [rows] = await db.query('SELECT * FROM general_info LIMIT ? OFFSET ?', [limit, offset]);
        res.json({
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.post('/general-info', authenticateToken, async (req, res) => {
    const { question, answer } = req.body;
    try {
        const [result] = await db.query('INSERT INTO general_info (question, answer) VALUES (?, ?)', [question, answer]);
        res.status(201).json({ id: result.insertId, message: 'General info created' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.post('/general-info/bulk', authenticateToken, async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected an array of items' });

    try {
        for (const item of items) {
            const { question, answer } = item;
            await db.query('INSERT INTO general_info (question, answer) VALUES (?, ?)', [question, answer]);
        }
        res.status(201).json({ message: `${items.length} general info items created` });
    } catch (err) {
        res.status(500).json({ error: 'Database error during bulk insert' });
    }
});

router.put('/general-info/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { question, answer } = req.body;
    try {
        await db.query('UPDATE general_info SET question = ?, answer = ? WHERE id = ?', [question, answer, id]);
        res.json({ message: 'General info updated' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.delete('/general-info/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM general_info WHERE id = ?', [id]);
        res.json({ message: 'General info deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
