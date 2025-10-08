// server.js --- S3 INTEGRATED VERSION ---

const path = require('path');
const crypto = require('crypto'); // For generating unique filenames
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// --- AWS S3 CLIENT SETUP ---
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// --- S3 UPLOAD HELPER FUNCTION ---
async function uploadFileToS3(fileBuffer, originalname, mimetype) {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const filename = `${randomBytes}-${originalname}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: fileBuffer,
        ContentType: mimetype,
        ACL: 'public-read'
    });

    await s3Client.send(command);
    
    // Construct the public URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
}


const app = express();
const port = process.env.PORT || 5000;
const host = '0.0.0.0';

const allowedOrigins = [
    'https://d28gnj3ee0v7hm.cloudfront.net',
    'http://localhost:3000'
];
const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('This origin is not allowed by CORS.'));
        }
    },
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`[BACKEND-LOG] ${req.method} ${req.originalUrl}`);
    next();
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
    process.exit(1);
}

// --- Helper Functions & Middleware ---
async function updateDailyCollection(client, userId, date, cashAmount = 0, onlineAmount = 0) {
    if (cashAmount === 0 && onlineAmount === 0) return;
    const query = `
        INSERT INTO student_management.daily_collections (user_id, date, total_cash, total_online)
        VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, date) DO UPDATE SET
        total_cash = student_management.daily_collections.total_cash + EXCLUDED.total_cash,
        total_online = student_management.daily_collections.total_online + EXCLUDED.total_online;`;
    await client.query(query, [userId, date, cashAmount, onlineAmount]);
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: 'No token provided.' });
    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) return res.status(403).json({ error: 'Invalid token.' });
        req.user = userPayload.user;
        if (!req.user || !req.user.id) return res.status(403).json({ error: 'Token payload invalid.' });
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.is_admin === true) next();
    else res.status(403).json({ error: "Forbidden: Admin access required." });
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });
const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).valueOf());

async function sendWhatsAppReminderToStudent(studentId) {
    console.log(`Initiating reminder for student ID: ${studentId}`);
    if (!process.env.MSG91_AUTH_KEY || !process.env.MSG91_TEMPLATE_ID || !process.env.MSG91_INTEGRATED_NUMBER || !process.env.MSG91_NAMESPACE) {
        throw new Error("MSG91 environment variables are incomplete.");
    }
    let dbClient;
    try {
        dbClient = await pool.connect();
        const { rows } = await dbClient.query(`
            SELECT s.name AS student_name, s.mobile_no AS student_mobile, s.next_due_date, s.user_id, 
                   c.business_name, c.business_type, c.mobile_no AS owner_mobile
            FROM student_management.students s JOIN student_management.credentials c ON s.user_id = c.id
            WHERE s.id = $1`, [studentId]);
        if (rows.length === 0) throw new Error(`Student with ID ${studentId} not found.`);
        const student = rows[0];
        if (!student.student_mobile || student.student_mobile.length !== 10) {
             throw new Error(`Invalid mobile for student ${student.student_name}.`);
        }
        const today = new Date().toISOString().slice(0, 10);
        const formattedDate = new Date(student.next_due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const apiUrl = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';
        const payload = {
            "integrated_number": process.env.MSG91_INTEGRATED_NUMBER, "content_type": "template",
            "payload": { "messaging_product": "whatsapp", "type": "template", "template": {
                "name": process.env.MSG91_TEMPLATE_ID, "language": { "code": "en", "policy": "deterministic" },
                "namespace": process.env.MSG91_NAMESPACE, "to_and_components": [{
                    "to": [`91${student.student_mobile}`], "components": {
                        "body_1": { "type": "text", "value": student.student_name },
                        "body_2": { "type": "text", "value": student.business_type || 'your activity' },
                        "body_3": { "type": "text", "value": formattedDate },
                        "body_4": { "type": "text", "value": student.business_name },
                        "body_5": { "type": "text", "value": student.owner_mobile }
                    }}]}}};
        const headers = { 'authkey': process.env.MSG91_AUTH_KEY, 'Content-Type': 'application/json' };
        await dbClient.query(`INSERT INTO student_management.whatsapp_log (student_name, student_mobile, sent_on, status, user_id) VALUES ($1, $2, $3, 'attempted', $4)`, [student.student_name, student.student_mobile, today, student.user_id]);
        const response = await axios.post(apiUrl, payload, { headers });
        await dbClient.query(`UPDATE student_management.whatsapp_log SET status = 'sent', message_sid = $1 WHERE student_mobile = $2 AND sent_on = $3`, [response.data.request_id || 'N/A', student.student_mobile, today]);
        console.log(`Successfully sent message to ${student.student_name}.`);
        return { success: true, message: `Reminder sent to ${student.student_name}.` };
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        console.error(`ERROR for student ID ${studentId}:`, errorMessage);
        if (dbClient && student.student_mobile) {
            await dbClient.query(`UPDATE student_management.whatsapp_log SET status = 'failed', error_message = $1 WHERE student_mobile = $2 AND sent_on = $3`, [errorMessage, student.student_mobile, new Date().toISOString().slice(0, 10)]);
        }
        throw err;
    } finally {
        if (dbClient) dbClient.release();
    }
}

// --- API Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password, businessName, businessType, mobileNo } = req.body;
    if (!username || !password || !businessName || !businessType || !mobileNo) {
        return res.status(400).json({ error: 'All fields are required, including business type.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (!/^\d{10,15}$/.test(mobileNo)) {
        return res.status(400).json({ error: 'Please provide a valid mobile number.' });
    }
    let client;
    try {
        client = await pool.connect();
        const userExistsResult = await client.query(
            'SELECT id FROM student_management.credentials WHERE username = $1 OR mobile_no = $2',
            [username.toLowerCase(), mobileNo]
        );
        if (userExistsResult.rows.length > 0) {
            return res.status(409).json({ error: 'A user with that username or mobile number already exists.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUserResult = await client.query(
            `INSERT INTO student_management.credentials 
              (username, password_hash, business_name, business_type, mobile_no, access_expires_on) 
             VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 month') 
             RETURNING id, username`,
            [username.toLowerCase(), passwordHash, businessName.trim(), businessType.trim(), mobileNo]
        );
        res.status(201).json({
            message: 'User registered successfully. Please login.',
            user: { id: newUserResult.rows[0].id, username: newUserResult.rows[0].username }
        });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === '23505') { 
             return res.status(409).json({ error: 'A user with that username or mobile number already exists.' });
        }
        res.status(500).json({ error: 'Server error during registration.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    let client;
    try {
        client = await pool.connect();
        const userResult = await client.query(
            'SELECT id, username, password_hash, registration_date, is_active, access_expires_on, is_admin, set_payment FROM student_management.credentials WHERE username = $1',
            [username.toLowerCase()]
        );
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        if (user.is_active === false) {
            return res.status(403).json({ 
                error: 'Your account is inactive. Please contact an administrator.',
                errorCode: 'ACCOUNT_INACTIVE'
            });
        }
        const now = new Date();
        let isExpired = false;
        if (user.access_expires_on) {
            if (now > new Date(user.access_expires_on)) {
                isExpired = true;
            }
        } else if (user.registration_date) {
            const oneMonthFromRegistration = new Date(user.registration_date);
            oneMonthFromRegistration.setMonth(oneMonthFromRegistration.getMonth() + 1);
            if (now > oneMonthFromRegistration) {
                isExpired = true;
            }
        }
        if (isExpired) {
            return res.status(403).json({ 
                error: 'Your subscription has expired. Please contact administration to renew.',
                errorCode: 'SUBSCRIPTION_EXPIRED'
            });
        }
        const payload = { user: { id: user.id, username: user.username, is_admin: user.is_admin, set_payment: user.set_payment } };
        if (!JWT_SECRET) {
            return res.status(500).json({ error: 'Server configuration error (JWT).' });
        }
        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to generate token.' });
            }
            res.json({ message: "Login successful", token, user: payload.user });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

app.get('/api/collection/today', authenticateToken, async (req, res) => {
     let client;
     try {
         const loggedInUserId = req.user.id;
         const today = new Date().toISOString().slice(0, 10);
         client = await pool.connect();
         const onlineQuery = `
             SELECT COUNT(*) AS online_count
             FROM student_management.student
             WHERE DATE(date) = $1 AND online = TRUE AND user_id = $2;
         `;
         const cashQuery = `
             SELECT COUNT(*) AS cash_count
             FROM student_management.student
             WHERE DATE(date) = $1 AND cash = TRUE AND user_id = $2;
         `;
         const [onlineResult, cashResult] = await Promise.all([
             client.query(onlineQuery, [today, loggedInUserId]),
             client.query(cashQuery, [today, loggedInUserId])
         ]);
         const onlineCount = parseInt(onlineResult.rows[0]?.online_count || "0", 10);
         const cashCount = parseInt(cashResult.rows[0]?.cash_count || "0", 10);
         res.json({ onlineCount, cashCount });
     } catch (err) {
         res.status(500).json({ error: 'Failed to fetch today\'s collection data', details: err.message });
     } finally {
         if (client) client.release();
     }
 });

app.get('/api/collection/:date', authenticateToken, async (req, res) => {
    const { date } = req.params;
    const loggedInUserId = req.user.id;
    let client;
    if (!isValidDate(date)) { return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' }); }
    try {
        client = await pool.connect();
        const collectionQuery = `
            SELECT total_cash, total_online
            FROM student_management.daily_collections
            WHERE user_id = $1 AND date = $2;
        `;
        const result = await client.query(collectionQuery, [loggedInUserId, date]);
        const data = result.rows[0] || { total_cash: 0, total_online: 0 };
        res.json({
            totalCash: parseFloat(data.total_cash),
            totalOnline: parseFloat(data.total_online),
            cashCount: 0, 
            onlineCount: 0 
        });
    } catch (err) {
        console.error('Error fetching collection data:', err);
        res.status(500).json({ error: 'Failed to fetch collection data', details: err.message });
    } finally {
        if (client) client.release();
    }
});


// GET STUDENTS - Modified to return S3 URLs
app.get('/api/students', authenticateToken, async (req, res) => {
    let client;
    try {
        const loggedInUserId = req.user.id;
        client = await pool.connect();
        const result = await client.query(`
            SELECT 
                s.id, s.name, s.grade, s.admission_date, s.mobile_no, s.address, s.user_id,
                s.student_photo, s.id_proof,
                EXISTS (
                    SELECT 1 
                    FROM student_management.student p 
                    WHERE p.name = s.name AND p.user_id = s.user_id AND p.suspend = TRUE
                ) AS is_suspended
            FROM 
                student_management.students s
            WHERE 
                s.user_id = $1
            ORDER BY 
                s.name ASC
        `, [loggedInUserId]);
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students' });
    } finally {
        if (client) client.release();
    }
});

// SEARCH STUDENTS - Modified to return S3 URLs
app.get('/api/students/search', authenticateToken, async (req, res) => {
    const searchTerm = req.query.name;
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
        return res.status(400).json({ error: 'Search term cannot be empty.' });
    }
    let client;
    try {
        const loggedInUserId = req.user.id;
        client = await pool.connect();
        const queryText = `
            SELECT 
                s.id, s.name, s.grade, s.admission_date, s.mobile_no, s.address, s.user_id,
                s.student_photo, s.id_proof,
                EXISTS (
                    SELECT 1 
                    FROM student_management.student p 
                    WHERE p.name = s.name AND p.user_id = s.user_id AND p.suspend = TRUE
                ) AS is_suspended
            FROM 
                student_management.students s
            WHERE 
                LOWER(s.name) LIKE $1 AND s.user_id = $2
            ORDER BY 
                s.name ASC
        `;
        const values = [`%${searchTerm.toLowerCase().trim()}%`, loggedInUserId];
        const result = await client.query(queryText, values);
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to search for students.' });
    } finally {
        if (client) client.release();
    }
});

// GET STUDENTS BY ADMISSION DATE - Modified to return S3 URLs
app.get('/api/students/admitted/:date', authenticateToken, async (req, res) => {
     const admissionDate = req.params.date;
     if (!isValidDate(admissionDate)) {
         return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
     }
     let client;
     try {
         const loggedInUserId = req.user.id;
         client = await pool.connect();
         const result = await client.query(
             `SELECT id, name, grade, admission_date, mobile_no, address, user_id,
                     student_photo, id_proof
              FROM student_management.students
              WHERE DATE(admission_date) = $1 AND user_id = $2
              ORDER BY name ASC`,
             [admissionDate, loggedInUserId]
         );
         res.json(result.rows);
     } catch (err) {
         res.status(500).json({ error: 'Failed to fetch students by admission date' });
     } finally {
         if (client) client.release();
     }
 });

app.get('/api/students/manageable-on-date/:date', authenticateToken, async (req, res) => {
    const { date: requestedDate } = req.params;
    const loggedInUserId = req.user.id;
    let client;
    if (!isValidDate(requestedDate)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    try {
        client = await pool.connect();
        const relevantStudentsQuery = `
            WITH suspended_students AS (
                SELECT DISTINCT name FROM student_management.student WHERE user_id = $2 AND suspend = TRUE
            )
            SELECT 
                s.id, s.name, s.is_special, s.fee_amount, s.plan_duration_months
            FROM student_management.students s
            WHERE 
                s.user_id = $2 AND DATE(s.admission_date) <= $1
                AND s.name NOT IN (SELECT name FROM suspended_students)
                AND (
                    EXTRACT(DAY FROM s.admission_date) = EXTRACT(DAY FROM $1::date)
                    OR
                    (
                        $1::date = (date_trunc('month', $1::date) + interval '1 month' - interval '1 day')::date
                        AND
                        EXTRACT(DAY FROM s.admission_date) >= EXTRACT(DAY FROM $1::date)
                    )
                )
            ORDER BY s.name ASC;
        `;
        const relevantStudentsResult = await client.query(relevantStudentsQuery, [requestedDate, loggedInUserId]);
        const relevantStudents = relevantStudentsResult.rows;
        const cleanStudentNamesForQuery = relevantStudents
            .map(student => student.name ? student.name.trim().toLowerCase() : null)
            .filter(name => name !== null);
        let statusesOnDateRaw = [];
        if (cleanStudentNamesForQuery.length > 0) {
            const statusQuery = `
                SELECT name, cash, online, suspend
                FROM student_management.student
                WHERE DATE(date) = $1 AND LOWER(TRIM(name)) = ANY($2::text[]) AND user_id = $3
            `;
            const statusResult = await client.query(statusQuery, [requestedDate, cleanStudentNamesForQuery, loggedInUserId]);
            statusesOnDateRaw = statusResult.rows;
        }
        const pendingStudents = [], paidStudents = [], suspendedStudents = [];
        relevantStudents.forEach(student => {
            if (!student.name) return;
            const studentCleanName = student.name.trim().toLowerCase();
            const statusInfo = statusesOnDateRaw.find(s => s.name && s.name.trim().toLowerCase() === studentCleanName);
            const studentDataForList = student; 
            if (statusInfo) {
                if (statusInfo.suspend) suspendedStudents.push(studentDataForList);
                else if (statusInfo.cash || statusInfo.online) paidStudents.push({ ...studentDataForList, paymentType: statusInfo.cash ? 'cash' : 'online' });
                else pendingStudents.push(studentDataForList);
            } else { 
                pendingStudents.push(studentDataForList);
           }
        });
        res.json({ pending: pendingStudents, paid: paidStudents, suspended: suspendedStudents });
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch student status for ${requestedDate}.`, details: err.message });
    } finally {
        if (client) client.release();
    }
});

 app.put('/api/student-payment-status/:date/:studentName', authenticateToken, async (req, res) => {
    const { date, studentName: rawStudentName } = req.params;
    const { cash, online, suspend } = req.body; 
    const loggedInUserId = req.user.id;
    const studentName = rawStudentName ? rawStudentName.trim() : '';
    if (!isValidDate(date)) { return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' }); }
    if (typeof cash !== 'boolean' || typeof online !== 'boolean' || typeof suspend !== 'boolean') { return res.status(400).json({ error: 'Request body must include cash, online, and suspend as boolean values.' }); }
    if (!studentName) { return res.status(400).json({ error: 'Invalid or missing student name.' }); }
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const studentOwnerCheck = await client.query(
           `SELECT id FROM student_management.students WHERE name = $1 AND user_id = $2`,
           [studentName, loggedInUserId]
        );
        if (studentOwnerCheck.rows.length === 0) {
           await client.query('ROLLBACK');
           return res.status(403).json({ error: 'Permission denied. Student does not belong to this user or does not exist.' });
        }
        const checkResult = await client.query(
            'SELECT name FROM student_management.student WHERE DATE(date) = $1 AND name = $2 AND user_id = $3',
            [date, studentName, loggedInUserId]
        );
        if (checkResult.rows.length > 0) {
            await client.query(
                'UPDATE student_management.student SET cash = $1, online = $2, suspend = $3 WHERE DATE(date) = $4 AND name = $5 AND user_id = $6',
               [cash, online, suspend, date, studentName, loggedInUserId]
            );
        } else {
            await client.query(
                'INSERT INTO student_management.student (name, cash, online, suspend, date, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
                [studentName, cash, online, suspend, date, loggedInUserId]
            );
        }
        await client.query('COMMIT');
        res.json({ message: `Payment status processed for ${studentName} on ${date}.` });
    } catch (err) {
         if (client) await client.query('ROLLBACK');
        console.error(`Error processing payment status for ${studentName} on ${date}:`, err);
        res.status(500).json({ error: 'Failed to update or insert student payment status.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

app.put('/api/student-payment/:studentId/:date', authenticateToken, async (req, res) => {
    const studentId = parseInt(req.params.studentId, 10);
    const { date } = req.params;
    const { paymentType, updatePlan, feeAmount, planDuration } = req.body;
    const loggedInUserId = req.user.id;
    let client;
    if (isNaN(studentId) || !isValidDate(date)) {
        return res.status(400).json({ error: 'Invalid student ID or date format.' });
    }
    if (!['cash', 'online', 'suspend'].includes(paymentType)) {
        return res.status(400).json({ error: 'Invalid paymentType.' });
    }
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const studentResult = await client.query(`SELECT name, fee_amount, plan_duration_months FROM student_management.students WHERE id = $1 AND user_id = $2`, [studentId, loggedInUserId]);
        if (studentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Student not found.' });
        }
        const student = studentResult.rows[0];
        let monthsToPay = 1;
        let amountPaidPerMonth = 0;
        if (updatePlan) {
            monthsToPay = parseInt(planDuration, 10);
            amountPaidPerMonth = parseFloat(feeAmount);
            await client.query(`UPDATE student_management.students SET fee_amount = $1, plan_duration_months = $2, is_special = TRUE WHERE id = $3`, [amountPaidPerMonth, monthsToPay, studentId]);
        } else if (student.fee_amount && student.plan_duration_months) {
            monthsToPay = student.plan_duration_months;
            amountPaidPerMonth = student.fee_amount;
        } else {
            const ownerResult = await client.query('SELECT set_payment FROM student_management.credentials WHERE id = $1', [loggedInUserId]);
            monthsToPay = 1;
            amountPaidPerMonth = parseFloat(ownerResult.rows[0]?.set_payment) || 0;
        }
        if (paymentType === 'suspend') {
            await client.query(`INSERT INTO student_management.student (name, date, user_id, suspend) VALUES ($1, $2, $3, TRUE) ON CONFLICT (name, date, user_id) DO UPDATE SET suspend = TRUE, cash = FALSE, online = FALSE`, [student.name, date, loggedInUserId]);
        } else {
            let lastPaymentDate = new Date(date);
            for (let i = 0; i < monthsToPay; i++) {
                const paymentDate = new Date(date);
                paymentDate.setMonth(paymentDate.getMonth() + i);
                const paymentDateString = paymentDate.toISOString().slice(0, 10);
                lastPaymentDate = paymentDate;
                await client.query(
                    `INSERT INTO student_management.student (name, date, user_id, cash, online, amount_paid) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (name, date, user_id) DO UPDATE SET cash = EXCLUDED.cash, online = EXCLUDED.online, amount_paid = EXCLUDED.amount_paid, suspend = FALSE`,
                    [student.name, paymentDateString, loggedInUserId, paymentType === 'cash', paymentType === 'online', amountPaidPerMonth]
                );
                const cashAmount = paymentType === 'cash' ? amountPaidPerMonth : 0;
                const onlineAmount = paymentType === 'online' ? amountPaidPerMonth : 0;
                await updateDailyCollection(client, loggedInUserId, paymentDateString, cashAmount, onlineAmount);
            }
            const nextDueDate = new Date(lastPaymentDate);
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            const nextDueDateString = nextDueDate.toISOString().slice(0, 10);
            await client.query(
                `UPDATE student_management.students SET next_due_date = $1 WHERE id = $2`,
                [nextDueDateString, studentId]
            );
        }
        await client.query('COMMIT');
        res.json({ message: 'Action completed successfully.' });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error processing student payment:', err);
        res.status(500).json({ error: 'Failed to process payment.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

// ADD STUDENT - Modified to upload to S3 first
app.post('/api/students', authenticateToken, upload.fields([{ name: 'student_photo', maxCount: 1 }, { name: 'id_proof', maxCount: 1 }]), async (req, res) => {
    const { name, admissionDate, mobile_no, address, grade, admissionFee, feeAmount, planDuration } = req.body;
    const studentPhotoFile = req.files?.['student_photo']?.[0];
    const idProofFile = req.files?.['id_proof']?.[0];
    const loggedInUserId = req.user.id;
    
    if (!name || !admissionDate || !mobile_no) {
        return res.status(400).json({ error: 'Missing required fields: name, admissionDate, mobile_no.' });
    }
    if (!isValidDate(admissionDate)) {
        return res.status(400).json({ error: 'Invalid admission date format. Use YYYY-MM-DD.' });
    }

    let client;
    try {
        // Upload files to S3 and get URLs first
        let photoUrl = null;
        if (studentPhotoFile) {
            photoUrl = await uploadFileToS3(studentPhotoFile.buffer, studentPhotoFile.originalname, studentPhotoFile.mimetype);
        }
        let idProofUrl = null;
        if (idProofFile) {
            idProofUrl = await uploadFileToS3(idProofFile.buffer, idProofFile.originalname, idProofFile.mimetype);
        }

        client = await pool.connect();
        await client.query('BEGIN');

        const isSpecialStudent = !!(feeAmount && planDuration);
        let nextDueDateString = null;
        const monthsInPlan = isSpecialStudent ? parseInt(planDuration, 10) : 1;
        const nextDueDate = new Date(admissionDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + monthsInPlan);
        nextDueDateString = nextDueDate.toISOString().slice(0, 10);

        const studentQueryText = `
            INSERT INTO student_management.students
              (name, grade, admission_date, mobile_no, address, student_photo, id_proof, user_id, fee_amount, plan_duration_months, is_special, next_due_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
        const studentValues = [
            name.trim(), grade?.trim(), admissionDate, mobile_no, address?.trim(),
            photoUrl, idProofUrl, loggedInUserId, // Use S3 URLs
            isSpecialStudent ? parseFloat(feeAmount) : null,
            isSpecialStudent ? parseInt(planDuration, 10) : 1,
            isSpecialStudent, nextDueDateString
        ];
        const studentResult = await client.query(studentQueryText, studentValues);
        const newStudent = studentResult.rows[0];

        const oneTimeAdmissionFee = parseFloat(admissionFee) || 0;
        if (oneTimeAdmissionFee > 0) {
            await client.query(
                `INSERT INTO student_management.student (name, date, user_id, cash, amount_paid, amount_for_new) VALUES ($1, $2, $3, TRUE, $4, $4)`,
                [newStudent.name, newStudent.admission_date, loggedInUserId, oneTimeAdmissionFee]
            );
            await updateDailyCollection(client, loggedInUserId, newStudent.admission_date, oneTimeAdmissionFee, 0);
        }

        const recurringFee = parseFloat(feeAmount) || 0;
        const monthsToPayFor = isSpecialStudent ? parseInt(planDuration, 10) : 0;
        if (isSpecialStudent && recurringFee > 0) {
            for (let i = 0; i < monthsToPayFor; i++) {
                const paymentDate = new Date(admissionDate);
                paymentDate.setMonth(paymentDate.getMonth() + i);
                const paymentDateString = paymentDate.toISOString().slice(0, 10);
                await client.query(
                    `INSERT INTO student_management.student (name, date, user_id, cash, amount_paid) VALUES ($1, $2, $3, TRUE, $4)`,
                    [newStudent.name, paymentDateString, loggedInUserId, recurringFee]
                );
                await updateDailyCollection(client, loggedInUserId, paymentDateString, recurringFee, 0);
            }
        }
        await client.query('COMMIT');
        res.status(201).json(studentResult.rows[0]);

    } catch (err) {
        if (client) { await client.query('ROLLBACK'); }
        console.error('Error adding student with S3 upload:', err);
        res.status(500).json({ error: 'Failed to add new student.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

// GET SINGLE STUDENT - Modified to return S3 URLs
 app.get('/api/students/:id', authenticateToken, async (req, res) => {
     const studentId = parseInt(req.params.id, 10);
     const loggedInUserId = req.user.id;
     if (isNaN(studentId)) {
         return res.status(400).json({ error: 'Invalid student ID.' });
     }
     let client;
     try {
         client = await pool.connect();
         const queryText = `
             SELECT id, name, grade, admission_date, mobile_no, address, user_id,
                    student_photo, id_proof
             FROM student_management.students
             WHERE id = $1 AND user_id = $2 
         `;
         const result = await client.query(queryText, [studentId, loggedInUserId]);
         if (result.rows[0]) {
              res.json(result.rows[0]);
         } else {
             res.status(404).json({ error: 'Student not found or you do not have permission to access this student.' });
         }
     } catch (err) {
         res.status(500).json({ error: 'Failed to fetch student.', details: err.message });
     } finally {
         if (client) client.release();
     }
 });

// EDIT STUDENT - Modified to upload to S3
app.put('/api/students/:id', authenticateToken, upload.fields([{ name: 'student_photo', maxCount: 1 }, { name: 'id_proof', maxCount: 1 }]), async (req, res) => {
    const studentId = parseInt(req.params.id, 10);
    const { name, grade, mobile_no, address } = req.body;
    const studentPhotoFile = req.files?.['student_photo']?.[0];
    const idProofFile = req.files?.['id_proof']?.[0];

    if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID.' });
    }

    let client;
    try {
        client = await pool.connect();
        
        // First, verify the student belongs to the logged-in user
        const ownerCheck = await client.query(
            'SELECT id FROM student_management.students WHERE id = $1 AND user_id = $2',
            [studentId, req.user.id]
        );
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Permission denied. You do not own this student record.' });
        }

        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (name) { fields.push(`name = $${queryIndex++}`); values.push(name.trim()); }
        if (grade) { fields.push(`grade = $${queryIndex++}`); values.push(grade.trim()); }
        if (mobile_no) { fields.push(`mobile_no = $${queryIndex++}`); values.push(mobile_no); }
        if (address) { fields.push(`address = $${queryIndex++}`); values.push(address.trim()); }

        if (studentPhotoFile) {
            const photoUrl = await uploadFileToS3(studentPhotoFile.buffer, studentPhotoFile.originalname, studentPhotoFile.mimetype);
            fields.push(`student_photo = $${queryIndex++}`);
            values.push(photoUrl);
        }
        if (idProofFile) {
            const idProofUrl = await uploadFileToS3(idProofFile.buffer, idProofFile.originalname, idProofFile.mimetype);
            fields.push(`id_proof = $${queryIndex++}`);
            values.push(idProofUrl);
        }

        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

        values.push(studentId, req.user.id);
        const updateQuery = `UPDATE student_management.students SET ${fields.join(', ')} WHERE id = $${queryIndex} AND user_id = $${queryIndex + 1} RETURNING *;`;
        
        const result = await client.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found or update failed.' });
        }
        
        res.json({ message: 'Profile updated.', student: result.rows[0] });

    } catch (err) {
        console.error('Error updating student with S3:', err);
        res.status(500).json({ error: 'Server error during update.' });
    } finally {
        if (client) client.release();
    }
});

 app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(`
            SELECT id, username, created_at, registration_date, is_active, access_expires_on, is_admin
            FROM student_management.credentials
            ORDER BY id ASC
        `);
        const users = result.rows.map(user => ({
            ...user,
            created_at: user.created_at ? new Date(user.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
            registration_date: user.registration_date ? new Date(user.registration_date).toLocaleDateString('en-CA') : null,
            access_expires_on: user.access_expires_on ? new Date(user.access_expires_on).toLocaleDateString('en-CA') : null,
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    } finally {
        if (client) client.release();
    }
});

 app.put('/api/admin/users/:userId/activate', authenticateToken, isAdmin, async (req, res) => {
    const { userId } = req.params;
    if (isNaN(parseInt(userId, 10))) {
        return res.status(400).json({ error: 'Invalid user ID format.' });
    }
    let client;
    try {
        client = await pool.connect();
        const newExpiryDate = new Date();
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
        const result = await client.query(
            `UPDATE student_management.credentials
             SET is_active = TRUE, access_expires_on = $1
             WHERE id = $2
             RETURNING id, username, is_active, access_expires_on`,
            [newExpiryDate, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ message: 'User activated successfully. Access extended by one month.', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to activate user.' });
    } finally {
        if (client) client.release();
    }
});

app.get('/api/calendar/status-summary', authenticateToken, async (req, res) => {
    const loggedInUserId = req.user.id;
    const { year, month } = req.query;
    if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
        return res.status(400).json({ error: 'Year and month query parameters are required.' });
    }
    const yearInt = parseInt(year);
    const monthInt = parseInt(month);
    if (monthInt < 1 || monthInt > 12) {
        return res.status(400).json({ error: 'Month must be between 1 and 12.' });
    }
    let client;
    try {
        client = await pool.connect();
        const pendingQuery = `
            WITH suspended_students AS (
                SELECT DISTINCT name FROM student_management.student
                WHERE user_id = $3 AND suspend = TRUE
            ),
            monthly_fee_dates AS (
                SELECT s.name, make_date($1, $2, EXTRACT(DAY FROM s.admission_date)::int) AS fee_date_in_month
                FROM student_management.students s
                WHERE s.user_id = $3
                    AND s.admission_date <= (make_date($1, $2, 1) + INTERVAL '1 month' - INTERVAL '1 day')
                    AND s.name NOT IN (SELECT name FROM suspended_students)
            )
            SELECT EXTRACT(DAY FROM m.fee_date_in_month) AS day
            FROM monthly_fee_dates m
            LEFT JOIN student_management.student p
            ON m.name = p.name AND p.date = m.fee_date_in_month AND p.user_id = $3
            WHERE m.fee_date_in_month < CURRENT_DATE + INTERVAL '1 day'
                AND (p.name IS NULL OR (p.cash = FALSE AND p.online = FALSE AND p.suspend = FALSE))
            GROUP BY day ORDER BY day;
        `;
        const pendingResult = await client.query(pendingQuery, [yearInt, monthInt, loggedInUserId]);
        const pendingDays = pendingResult.rows.map(row => parseInt(row.day, 10));
        res.json({ pendingDays: pendingDays });
    } catch (err) {
        console.error('SERVER: Error fetching calendar status summary:', err);
        res.status(500).json({ error: 'Failed to fetch calendar status data', details: err.message });
    } finally {
        if (client) client.release();
    }
});

app.get('/api/reminders/daily-status', authenticateToken, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const today = new Date().toISOString().slice(0, 10);
        const loggedInUserId = req.user.id;
        const dueQuery = `SELECT count(*) FROM student_management.students WHERE user_id = $1 AND next_due_date = $2`;
        const dueResult = await client.query(dueQuery, [loggedInUserId, today]);
        const totalDueToday = parseInt(dueResult.rows[0].count, 10);
        const sentQuery = `SELECT count(*) FROM student_management.whatsapp_log WHERE user_id = $1 AND sent_on = $2 AND status = 'sent'`;
        const sentResult = await client.query(sentQuery, [loggedInUserId, today]);
        const totalSentToday = parseInt(sentResult.rows[0].count, 10);
        const failedQuery = `SELECT student_name, student_mobile, error_message FROM student_management.whatsapp_log WHERE user_id = $1 AND sent_on = $2 AND status = 'failed'`;
        const failedResult = await client.query(failedQuery, [loggedInUserId, today]);
        const failedMessages = failedResult.rows;
        res.json({ totalDueToday, totalSentToday, failedMessages });
    } catch (error) {
        console.error("[ERROR] in /api/reminders/daily-status:", error);
        res.status(500).json({ error: "Server error fetching reminder status." });
    } finally {
        if (client) client.release();
    }
});

 app.put('/api/user/payment-setting', authenticateToken, async (req, res) => {
    const { newPaymentAmount } = req.body;
    const loggedInUserId = req.user.id;
    const paymentAmount = parseFloat(newPaymentAmount);
    if (isNaN(paymentAmount) || paymentAmount < 0) {
        return res.status(400).json({ error: 'Invalid payment amount provided. Must be a non-negative number.' });
    }
    let client;
    try {
        client = await pool.connect();
        const updateQuery = `
            UPDATE student_management.credentials SET set_payment = $1 WHERE id = $2
            RETURNING id, username, set_payment;
        `;
        const result = await client.query(updateQuery, [paymentAmount, loggedInUserId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const updatedUser = result.rows[0];
        res.json({
            message: 'Payment setting updated successfully.',
            user: { id: updatedUser.id, username: updatedUser.username, set_payment: updatedUser.set_payment }
        });
    } catch (err) {
        console.error('Error updating payment setting:', err);
        res.status(500).json({ error: 'Failed to update payment setting.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

app.post('/api/user/change-password', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'All password fields are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New passwords do not match.' });
    }
    let client;
    try {
        client = await pool.connect();
        const userResult = await client.query(
            'SELECT password_hash FROM student_management.credentials WHERE id = $1',
            [userId]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const currentPasswordHash = userResult.rows[0].password_hash;
        const isMatch = await bcrypt.compare(oldPassword, currentPasswordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect old password.' });
        }
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        await client.query(
            'UPDATE student_management.credentials SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, userId]
        );
        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Server error during password change.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

// --- REMINDER SETTINGS ROUTES ---
app.get('/api/reminders/settings', authenticateToken, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(
            'SELECT reminders_active FROM student_management.credentials WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ isRemindersActive: result.rows[0].reminders_active });
    } catch (error) {
        console.error("Error fetching reminder settings:", error);
        res.status(500).json({ error: 'Failed to fetch settings.' });
    } finally {
        if (client) client.release();
    }
});

app.put('/api/reminders/settings', authenticateToken, async (req, res) => {
    const { isRemindersActive } = req.body;
    if (typeof isRemindersActive !== 'boolean') {
        return res.status(400).json({ error: 'Invalid value provided. Must be true or false.' });
    }
    let client;
    try {
        client = await pool.connect();
        await client.query(
            'UPDATE student_management.credentials SET reminders_active = $1 WHERE id = $2',
            [isRemindersActive, req.user.id]
        );
        res.json({ message: 'Reminder settings updated successfully.' });
    } catch (error) {
        console.error("Error updating reminder settings:", error);
        res.status(500).json({ error: 'Failed to update settings.' });
    } finally {
        if (client) client.release();
    }
});

// --- OTHER REMINDER ROUTES ---
app.get('/api/reminders/due-today', authenticateToken, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const today = new Date().toISOString().slice(0, 10);
        const loggedInUserId = req.user.id;
        const { rows: dueStudents } = await client.query(
            `SELECT id, name, mobile_no FROM student_management.students WHERE user_id = $1 AND next_due_date = $2`,
            [loggedInUserId, today]
        );
        res.json(dueStudents);
    } catch (error) {
        console.error("Error fetching due students:", error);
        res.status(500).json({ error: "Server error fetching students due for reminder." });
    } finally {
        if (client) client.release();
    }
});

app.post('/api/reminders/send-manual/:studentId', authenticateToken, async (req, res) => {
    const studentId = parseInt(req.params.studentId, 10);
    if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID." });
    }
    try {
        const client = await pool.connect();
        const checkResult = await client.query(
            'SELECT id FROM student_management.students WHERE id = $1 AND user_id = $2',
            [studentId, req.user.id]
        );
        client.release();
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: "Student not found or you do not have permission." });
        }
        const result = await sendWhatsAppReminderToStudent(studentId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to send reminder.", details: error.message });
    }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
    const { username, businessName, businessType, mobileNo } = req.body;
    const loggedInUserId = req.user.id;
    let client;

    if (!username && !businessName && !businessType && !mobileNo) {
        return res.status(400).json({ error: 'No fields provided for update.' });
    }

    try {
        client = await pool.connect();

        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (username) { fields.push(`username = $${queryIndex++}`); values.push(username.trim().toLowerCase()); }
        if (businessName) { fields.push(`business_name = $${queryIndex++}`); values.push(businessName.trim()); }
        if (businessType) { fields.push(`business_type = $${queryIndex++}`); values.push(businessType.trim()); }
        if (mobileNo) { fields.push(`mobile_no = $${queryIndex++}`); values.push(mobileNo.trim()); }

        const updateQuery = `
            UPDATE student_management.credentials
            SET ${fields.join(', ')}
            WHERE id = $${queryIndex}
            RETURNING id, username, business_name, business_type, mobile_no, is_admin, set_payment;
        `;
        values.push(loggedInUserId);

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found or update failed.' });
        }
        
        const updatedUser = result.rows[0];
        const payload = { user: { 
            id: updatedUser.id, 
            username: updatedUser.username, 
            is_admin: updatedUser.is_admin, 
            set_payment: updatedUser.set_payment 
        }};

        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to generate new token after update.' });
            }
            res.json({
                message: 'Profile updated successfully.',
                user: payload.user,
                token: token
            });
        });

    } catch (err) {
        console.error('Error updating user profile:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username or mobile number is already taken.' });
        }
        res.status(500).json({ error: 'Server error during profile update.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(
            'SELECT id, username, business_name, business_type, mobile_no FROM student_management.credentials WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Failed to fetch user profile.' });
    } finally {
        if (client) client.release();
    }
});

app.put('/api/students/:studentId/make-active', authenticateToken, async (req, res) => {
    const studentId = parseInt(req.params.studentId, 10);
    const loggedInUserId = req.user.id;
    let client;

    if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID.' });
    }

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const studentResult = await client.query(
            'SELECT name FROM student_management.students WHERE id = $1 AND user_id = $2',
            [studentId, loggedInUserId]
        );

        if (studentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Student not found or you do not have permission.' });
        }
        const studentName = studentResult.rows[0].name;

        const deleteResult = await client.query(
            'DELETE FROM student_management.student WHERE name = $1 AND user_id = $2 AND suspend = TRUE',
            [studentName, loggedInUserId]
        );

        await client.query('COMMIT');

        res.json({ 
            message: `${studentName} has been made active.`,
            recordsRemoved: deleteResult.rowCount 
        });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error(`Error making student active (ID: ${studentId}):`, err);
        res.status(500).json({ error: 'Server error while reactivating student.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

app.get('/api/logs', authenticateToken, async (req, res) => {
    const { startDate, endDate } = req.query;
    const loggedInUserId = req.user.id;
    let client;

    if (!startDate || !endDate || !isValidDate(startDate) || !isValidDate(endDate)) {
        return res.status(400).json({ error: 'Valid start and end dates are required in YYYY-MM-DD format.' });
    }

    try {
        client = await pool.connect();
        const query = `
            SELECT student_name, student_mobile, sent_on, status, error_message, message_sid
            FROM student_management.whatsapp_log
            WHERE user_id = $1 AND sent_on BETWEEN $2 AND $3
            ORDER BY sent_on DESC;
        `;
        const result = await client.query(query, [loggedInUserId, startDate, endDate]);

        const logs = result.rows.map(log => ({
            ...log,
            sent_on: new Date(log.sent_on).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
        }));
        
        res.json(logs);

    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ error: 'Server error while fetching logs.', details: err.message });
    } finally {
        if (client) client.release();
    }
});

// --- CRON JOB ---
const cron = require('node-cron');
async function sendAllDueReminders() {
    console.log('CRON JOB (7:00 AM): Starting daily reminder process...');
    if (!process.env.MSG91_AUTH_KEY || !process.env.MSG91_TEMPLATE_ID || !process.env.MSG91_INTEGRATED_NUMBER || !process.env.MSG91_NAMESPACE) {
        console.error("CRON JOB ERROR: MSG91 env variables are incomplete.");
        return;
    }
    let dbClient;
    try {
        dbClient = await pool.connect();
        const today = new Date().toISOString().slice(0, 10);
        const query = `
            SELECT s.id, s.name AS student_name FROM student_management.students s
            JOIN student_management.credentials c ON s.user_id = c.id
            WHERE s.next_due_date = $1 AND c.is_active = TRUE
            AND c.access_expires_on >= CURRENT_DATE AND c.reminders_active = TRUE;`;
        const { rows: studentsToSend } = await dbClient.query(query, [today]);

        if (studentsToSend.length === 0) {
            console.log('CRON JOB: No reminders to send for active, opted-in users today.');
            return;
        }
        console.log(`CRON JOB: Found ${studentsToSend.length} members for automated reminders.`);
        for (const student of studentsToSend) {
            try {
                await sendWhatsAppReminderToStudent(student.id);
            } catch (err) {
                console.error(`CRON JOB ERROR for student ${student.student_name} (ID: ${student.id}).`);
            }
        }
        console.log('CRON JOB: Finished processing all reminders for today.');
    } catch (error) {
        console.error("CRON JOB: A major error occurred:", error);
    } finally {
        if (dbClient) dbClient.release();
    }
}
cron.schedule('0 7 * * *', sendAllDueReminders, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});
console.log('AUTOMATED WhatsApp reminder job scheduled for 7:00 AM IST daily.');

// --- Server Listen & Shutdown ---
const server = app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
});