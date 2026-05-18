const mongoose = require("mongoose");

const clearanceSchema = new mongoose.Schema({
    clearingdept: { type: String, required: true },
    clearingemployee: { type: String, required: true },

    status: {
        type: String,
        enum: ["Pending", "Cleared", "Not Cleared"],
        default: "Pending"
    },

    comments: {
        type: String,
        default: ""
    }
}, { _id: true });

const teacherSchema = new mongoose.Schema({
    employeenumber: { type: String, required: true },
    employeelastname: { type: String, required: true },
    employeename: { type: String, required: true },
    department: { type: String, required: true },
    intent: String,

    clearances: [clearanceSchema]
}, { timestamps: true });

module.exports = mongoose.model("collteacherslist", teacherSchema);