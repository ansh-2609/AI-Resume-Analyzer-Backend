const db = require("../../config/db");

module.exports = class User {
  constructor(id, firstname, lastname, email, password, theme, created_at) {
    this.id = id;
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email; 
    this.password = password;
    this.theme = theme;
    this.created_at = created_at;
  }

  static fetchAll() {
    return db.execute("SELECT * FROM users");
  }

  insert() {
    return db.execute(
      "INSERT INTO users (firstname, lastname, email, password, theme) VALUES (?, ?, ?, ?, ?)",
      [this.firstname, this.lastname, this.email, this.password]
    );
  }

  static fetchEmail() {
    return db.execute("SELECT email FROM users");
  }

  static async findUser(email) {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async getFirstName(userId) {
    const [rows] = await db.execute("SELECT firstname FROM users WHERE id = ?", [
      userId,
    ]);
    return rows.length > 0 ? rows[0].firstname : '';
  }
  static async getLastName(userId) {
    const [rows] = await db.execute("SELECT lastname FROM users WHERE id = ?", [
      userId,
    ]);
    return rows.length > 0 ? rows[0].lastname : '';
  }

  static async updateProfile(userId, firstname, lastname){
    return db.execute("UPDATE users SET firstname = ?, lastname = ? WHERE id = ?", [
      firstname,
      lastname,
      userId,
    ]);
  }

  static async getEmail(userId){
    const [rows] = await db.execute("SELECT email FROM users WHERE id = ?", [
      userId,
    ]);
    return rows.length > 0 ? rows[0].email : '';
  }

  static async getPassword(userId){
    const [rows] = await db.execute("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);
    return rows.length > 0 ? rows[0].password : '';
  }

  static async updatePassword(userId, password){
    return db.execute("UPDATE users SET password = ? WHERE id = ?", [
      password,
      userId,
    ]);
  }

  static async updateTheme(userId, theme){
    return db.execute("UPDATE users SET theme = ? WHERE id = ?", [
      theme,
      userId,
    ]);
  }

  static async getTheme(userId){
    const [rows] = await db.execute("SELECT theme FROM users WHERE id = ?", [
      userId,
    ]);
    return rows.length > 0 ? rows[0].theme : '';
  }

  static async deleteAccount(userId){
    return db.execute("DELETE FROM users WHERE id = ?", [
      userId,
    ]);
  }
};