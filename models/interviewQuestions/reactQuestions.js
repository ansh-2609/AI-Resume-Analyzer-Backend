const db = require("../../config/db");

module.exports = class ReactQuestions {
  constructor(id, question, answer, goals, tip) {
    this.id = id;
    this.question = question;
    this.answer = answer;
    this.goals = goals;
    this.tip = tip;
  }

  static fetchAll() {
    return db.execute("SELECT * FROM react_interview_questions");
  }
};