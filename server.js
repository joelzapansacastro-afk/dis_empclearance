require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Teacher = require("./models/Teacher");
//const Signatory = require("./models/Signatory");

const app = express();
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= MONGODB ================= */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

/* ================= TEACHER CRUD ================= */

// CREATE TEACHER
app.post("/addTeacher", async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        await teacher.save();
        res.send("Teacher saved");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error saving teacher");
    }
});

// GET ALL
app.get("/teachers", async (req, res) => {
    const data = await Teacher.find();
    res.json(data);
});

// SEARCH
app.get("/search/:key", async (req, res) => {
    const key = req.params.key;

    const data = await Teacher.find({
        $or: [
            { employeenumber: key },
            { employeelastname: { $regex: key, $options: "i" } },
            { employeename: { $regex: key, $options: "i" } }
        ]
    });

    res.json(data);
});

// UPDATE TEACHER (IMPORTANT FOR CLEARANCES)
app.put("/update/:id", async (req, res) => {
    try {
        const updated = await Teacher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.send("Updated successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send("Update error");
    }
});

// DELETE
app.delete("/delete/:id", async (req, res) => {
    await Teacher.findByIdAndDelete(req.params.id);
    res.send("Deleted");
});

/* ================= SIGNATORY ================= */




const User = require("./models/User");

/* ================= CREATE USER ================= */
app.post("/addUser", async (req, res) => {
    try {
        const existing = await User.findOne({ username: req.body.username });

        if (existing) {
            return res.status(400).send("Username already exists");
        }

        await new User(req.body).save();
        res.send("User saved successfully");

    } catch (err) {
        console.log(err);
        res.status(500).send("Error saving user");
    }
});

/* ================= SEARCH USER ================= */
app.get("/searchUser/:key", async (req, res) => {
    try {
        const data = await User.find({
            username: { $regex: req.params.key, $options: "i" }
        });

        res.json(data);

    } catch (err) {
        console.log(err);
        res.status(500).send("Error searching user");
    }
});

/* ================= UPDATE USER ================= */
app.put("/updateUser/:id", async (req, res) => {
    try {
    await User.findByIdAndUpdate(req.params.id, req.body);
    res.send("User updated");
    } catch (err) {
    res.status(500).send("Update error");
    }
});

/* ================= DELETE USER ================= */
app.delete("/deleteUser/:id", async (req, res) => {
    try {
    await User.findByIdAndDelete(req.params.id);
    res.send("User deleted");
    } catch (err) {
    res.status(500).send("Delete error");
    }
});


//const User = require("./models/User");

/* LOGIN */
/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        console.log("LOGIN ATTEMPT:", req.body); // 🔍 DEBUG

        const user = await User.findOne({
            username,
            password,
            role
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        return res.json({
            username: user.username,
            name: user.name,
            role: user.role
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});


app.get("/getTeacherByEmpNo/:empno", async (req, res) => {

    try {
        const teacher = await Teacher.findOne({
            employeenumber: req.params.empno
        });

        res.json(teacher);

    } catch (err) {
        res.status(500).send("Error");
    }
});

const multer = require("multer");
const xlsx = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() });

app.post("/bulkUploadExcel", upload.single("file"), async (req, res) => {
    try {

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

       const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const map = {};

// 🔥 SKIP HEADER ROW + SAFE VALIDATION
rows.slice(1).forEach(row => {

    if (!row || row.length < 7) return;

    const empno = String(row[0]).trim();
    if (!empno) return;

    const lname = row[1] || "";
    const fname = row[2] || "";
    const dept = row[3] || "";
    const intent = row[4] || "";
    const cDept = row[5] || "";
    const signatory = row[6] || "";

    if (!map[empno]) {
        map[empno] = {
            employeenumber: empno,
            employeelastname: lname,
            employeename: fname,
            department: dept,
            intent: intent,
            clearances: []
        };
    }

    map[empno].clearances.push({
        clearingdept: cDept,
        clearingemployee: signatory,
        status: "Pending",
        comments: ""
    });
});

        const teachers = Object.values(map);

        await Teacher.insertMany(teachers);

        res.send("Excel uploaded successfully");

    } catch (err) {
        console.log(err);
        res.status(500).send("Excel upload error");
    }
});

app.post("/bulkAddUsers", async (req, res) => {
    try {

        const users = req.body.users;

        if (!users || !users.length) {
            return res.status(400).send("No data found");
        }

        await User.insertMany(users);

        res.send("Bulk users uploaded successfully");

    } catch (err) {
        console.log(err);
        res.status(500).send("Bulk upload error");
    }
});


app.post("/bulkTeachers", async (req, res) => {
    try {
        await Teacher.insertMany(req.body);
        res.send("Bulk upload successful");
    } catch (err) {
        console.log(err);
        res.status(500).send("Bulk upload failed");
    }
});


app.get("/teachersBySignatory/:name", async (req, res) => {
    try {
        const name = req.params.name;

        const teachers = await Teacher.find({
            "clearances.clearingemployee": name
        });

        res.json(teachers);

    } catch (err) {
        console.log(err);
        res.status(500).send("Error fetching teachers");
    }
});

app.put("/updateClearanceBySignatory", async (req, res) => {
    try {

        const { teacherId, dept, signatory, status, comments } = req.body;

        const teacher = await Teacher.findById(teacherId);

        teacher.clearances = teacher.clearances.map(c => {
            if (
                c.clearingdept === dept &&
                c.clearingemployee === signatory
            ) {
                return {
                    ...c.toObject(),
                    status,
                    comments
                };
            }
            return c;
        });

        await teacher.save();

        res.send("Updated successfully");

    } catch (err) {
        console.log(err);
        res.status(500).send("Update failed");
    }
});

/* ================= SERVER START ================= */
/*
app.listen(process.env.PORT, () => {
    console.log("🚀 Server running on port " + process.env.PORT);
});
*/
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});