const mongoose = require('mongoose');

const signatorySchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
        type: String,
        default: "SIGNATORY"
    }
}, { timestamps: true });

module.exports = mongoose.model('collsignatories', signatorySchema);