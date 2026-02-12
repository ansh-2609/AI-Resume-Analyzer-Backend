const db = require("../../config/db");

module.exports = class FrontendQuestions {
  constructor(id, question, answer, goals, tip) {
    this.id = id;
    this.question = question;
    this.answer = answer;
    this.goals = goals;
    this.tip = tip;
  }

  static fetchAll() {
    return db.execute("SELECT * FROM frontend_interview_questions");
  }
};