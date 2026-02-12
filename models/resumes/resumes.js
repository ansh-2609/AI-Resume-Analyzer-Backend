const db = require("../../config/db");

module.exports = class Resume {
  constructor(id, user_id, name, file_path, raw_text, parsed_data,  created_at) {
    this.id = id;
    this.user_id = user_id;
    this.name = name;
    this.file_path = file_path;
    this.raw_text = raw_text;
    this.parsed_data = parsed_data;
    this.created_at = created_at;
  }

  static fetchAll() {
    return db.execute("SELECT * FROM resumes");
  }

  insert() {
    return db.execute(
      "INSERT INTO resumes (user_id, name, file_path, raw_text, parsed_data) VALUES (?, ?, ?, ?, ?)",
      [this.user_id, this.name,this.file_path, this.raw_text, this.parsed_data]
    );
  }

  static findById(userId) {
    return db.execute("SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC", [userId]);
  }
  static findByResumeId(resumeId) {
    return db.execute("SELECT * FROM resumes WHERE id = ? ORDER BY created_at DESC", [resumeId]);
  }

  static findFileById(id, userId) {
    return db.execute("SELECT file_path FROM resumes WHERE id = ? AND user_id = ?",
      [id, userId]);
  }

  static updateParsedData(id, parsedData) {
    return db.execute("UPDATE resumes SET parsed_data = ? WHERE id = ?", [parsedData, id]);
  }

  static findParsedDataByResumeId(resumeId) {
    return db.execute("SELECT parsed_data FROM resumes WHERE id = ?", [resumeId]);
  }

  static deleteResume(resumeId) {
    return db.execute("DELETE FROM resumes WHERE id = ?", [resumeId]);
  }

  static async updateResumeEvaluation(resumeId, score, feedback) {
    return db.execute(
      `
      UPDATE resumes
      SET resume_score = ?,
          resume_feedback = ?
      WHERE id = ?
      `,
      [score, JSON.stringify(feedback), resumeId]
    );
  }

};