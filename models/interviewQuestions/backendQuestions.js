const db = require("../../config/db");

module.exports = class BackendQuestions {
  constructor(id, question, answer, goals, tip) {
    this.id = id;
    this.question = question;
    this.answer = answer;
    this.goals = goals;
    this.tip = tip;
  }

  static fetchAll() {
    return db.execute("SELECT * FROM backend_interview_questions");
  }
};