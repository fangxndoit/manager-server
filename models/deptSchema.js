const mongoose = require('mongoose')
const deptSchema = new mongoose.Schema({
  deptName: String,
  userId: String,
  userName: String,
  userEmail: String,
  parentId: [mongoose.Types.ObjectId],
  createTime: {
    type: Date,
    default: Date.now()
  },
  updateTime: {
    type: Date,
    default: Date.now()
  }
})

module.exports = mongoose.model('depts', deptSchema)