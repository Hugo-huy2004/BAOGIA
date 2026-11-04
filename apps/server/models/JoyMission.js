import mongoose from 'mongoose';

// Nhiệm vụ JOY trong ngày (giờ Việt Nam). Một dòng mỗi thành viên; sang ngày mới
// thì `claimed` được làm trống ở lượt nhận đầu tiên.
const JoyMissionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  date: { type: String, default: '' },
  claimed: { type: [String], default: [] },
  treeBonusDate: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('JoyMission', JoyMissionSchema);
