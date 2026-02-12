const db = require("../../config/db");

module.exports = class DevOpsQuestions {
  constructor(id, question, answer, goals, tip) {
    this.id = id;
    this.question = question;
    this.answer = answer;
    this.goals = goals;
    this.tip = tip;
  }

  static fetchAll() {
    return db.execute("SELECT * FROM devops_engineer_interview_questions");
  }
};