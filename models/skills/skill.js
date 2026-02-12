const db = require("../../config/db");

module.exports = class Skill {
  constructor(id, user_id, resume_id, skill_name, category, confidence_score) {
    this.id = id;
    this.user_id = user_id;
    this.resume_id = resume_id;
    this.skill_name = skill_name;
    this.category = category;
    this.confidence_score = confidence_score;
  }

  static fetchAll() {
    return db.execute("SELECT * FROM skills");
  }

  insert() {
    return db.execute(
      "INSERT INTO skills (user_id, resume_id, skill_name, category, confidence_score) VALUES (?, ?, ?, ?, ?)",
      [this.user_id, this.resume_id, this.skill_name, this.category, this.confidence_score]
    );
  }

  static findById(id) {
    return db.execute("SELECT * FROM skills WHERE resume_id = ?", [id]);
  }

  static deleteSkillsByResumeId(resumeId) {
    return db.execute("DELETE FROM skills WHERE resume_id = ?", [resumeId]);
  }
};