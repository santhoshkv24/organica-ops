const { pool } = require('../config/database');

// Execute a query with parameters
const query = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', {
      sql,
      params,
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    connection.release();
  }
};

// Get a single record
const getOne = async (sql, params = []) => {
  try {
    const results = await query(sql, params);
    return results[0] || null;
  } catch (error) {
    console.error('GetOne error:', {
      sql,
      params,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Insert a record and return the inserted ID
const insert = async (table, data) => {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    const [result] = await pool.execute(sql, values);
    return result.insertId;
  } catch (error) {
    console.error('Insert error:', {
      table,
      data,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Update a record
const update = async (table, data, whereClause, whereParams = []) => {
  try {
    const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams];
    
    const sql = `UPDATE ${table} SET ${sets} WHERE ${whereClause}`;
    
    const [result] = await pool.execute(sql, values);
    return result.affectedRows;
  } catch (error) {
    console.error('Update error:', {
      table,
      data,
      whereClause,
      whereParams,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Delete a record
const remove = async (table, whereClause, whereParams = []) => {
  try {
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    const [result] = await pool.execute(sql, whereParams);
    return result.affectedRows;
  } catch (error) {
    console.error('Delete error:', {
      table,
      whereClause,
      whereParams,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Begin transaction
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    return connection;
  } catch (error) {
    connection.release();
    console.error('Begin transaction error:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Commit transaction
const commit = async (connection) => {
  try {
    await connection.commit();
  } catch (error) {
    console.error('Commit error:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    connection.release();
  }
};

// Rollback transaction
const rollback = async (connection) => {
  try {
    await connection.rollback();
  } catch (error) {
    console.error('Rollback error:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  query,
  getOne,
  insert,
  update,
  remove,
  beginTransaction,
  commit,
  rollback
}; 