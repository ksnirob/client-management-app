const db = require('../config/db.config');

class User {
  static async create(userData) {
    try {
      const [result] = await db.execute(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [userData.name, userData.email]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM users');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userData) {
    try {
      const [result] = await db.execute(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [userData.name, userData.email, id]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User; 