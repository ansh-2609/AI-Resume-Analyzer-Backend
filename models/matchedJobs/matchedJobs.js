const db = require("../../config/db");

module.exports = class MatchedJobs {
  constructor(id, user_id,resume_id, jobs_json, created_at, updated_at) {
    this.id = id;
    this.user_id = user_id;
    this.resume_id = resume_id;
    this.jobs_json = jobs_json;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static fetchAll() {
    return db.execute("SELECT * FROM matched_jobs");
  }

  static save(userId, resumeId, jobs) {
    return db.query(
    `
    INSERT INTO matched_jobs (user_id, resume_id, jobs_json)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
    jobs_json = VALUES(jobs_json),
    updated_at = NOW()
    `,
    [userId, resumeId, JSON.stringify(jobs)]
  );
  }

  static findById(userId) {
    return db.execute("SELECT * FROM matched_jobs WHERE user_id = ? ORDER BY created_at DESC", [userId]);
  }
  static findByResumeId(resumeId) {
    return db.execute("SELECT * FROM matched_jobs WHERE resume_id = ? ORDER BY created_at DESC", [resumeId]);
  }

  static deleteByResumeId(resumeId) {
    return db.execute("DELETE FROM matched_jobs WHERE resume_id = ?", [resumeId]);
  }
};