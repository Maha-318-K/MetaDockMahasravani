const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  empId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  designation: { type: String, default: 'Employee' },
  role: [{ type: String }],
  status: { type: String, default: 'Active' },
  password: { type: String, required: true },
  avatar: { type: String },
  phoneCode: { type: String, default: '+91' },
  phoneNumber: { type: String },
  projects: [{ type: String }],
  zohoMail: { type: String }
}, { timestamps: true });

// Pre-save hook to generate avatar if not provided
userSchema.pre('save', function () {
  if (!this.avatar && this.name) {
    this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=7A2434&color=fff`;
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
