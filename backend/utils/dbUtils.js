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

// Call a stored procedure with parameters
// If the stored procedure returns multiple result sets (tables),
// this function will return all of them as an array.
// For backward compatibility, if only one result set is returned, it returns just that set (array of rows).
const callProcedure = async (procedureName, params = [], connection = null) => {
  const shouldRelease = !connection;
  try {
    if (!connection) {
      connection = await pool.getConnection();
    }
    const placeholders = params.map(() => '?').join(', ');
    const sql = `CALL ${procedureName}(${placeholders})`;
    const [results] = await connection.query(sql, params);
    // If results is an array of arrays (multiple tables), return all
    if (Array.isArray(results) && results.length > 1 && Array.isArray(results[0]) && Array.isArray(results[1])) {
      return results;
    }
    // If only one result set, return just that set (for backward compatibility)
    return results[0] || results;
  } catch (error) {
    console.error('Stored procedure call error:', {
      procedureName,
      params,
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    if (shouldRelease && connection) {
      connection.release();
    }
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

// Get a single record from a stored procedure
const getOneProcedure = async (procedureName, params = [], connection = null) => {
  try {
    const results = await callProcedure(procedureName, params, connection);
    return results[0] || null;
  } catch (error) {
    console.error('GetOneProcedure error:', {
      procedureName,
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
  callProcedure,
  getOne,
  getOneProcedure,
  insert,
  update,
  remove,
  beginTransaction,
  commit,
  rollback
}; 