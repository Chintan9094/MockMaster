const mongoose = require('mongoose');

function getDbUserId(user) {
  const id = user?._id ?? user?.id;
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    return null;
  }
  return id;
}

function iterateTopicAnalysis(topicAnalysis, callback) {
  if (!topicAnalysis) return;

  if (typeof topicAnalysis.forEach === 'function') {
    topicAnalysis.forEach(callback);
    return;
  }

  Object.entries(topicAnalysis).forEach(([key, value]) => callback(value, key));
}

module.exports = { getDbUserId, iterateTopicAnalysis };
