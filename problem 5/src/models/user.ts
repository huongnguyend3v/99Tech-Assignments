import { randomUUID } from 'crypto';
import db from './db';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

// Queries
/**
 * Create a new user with name and email
 * @param {string} name - User name
 * @param {string} email - User email
 * @returns {Promise<User>} The created user
 */
export const createUser = async (name: string, email: string): Promise<User> => {
  const id = randomUUID();
  const stmt = db.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)');
  stmt.run(id, name, email);
  return Promise.resolve({
    id,
    name,
    email,
  });
};

/**
 * Get a list of users with pagination, filtering, and sorting
 * @param {number} limit - Number of users to return
 * @param {number} offset - Number of users to skip (page)
 * @param {string} filterColumn - Column to filter by (name or email)
 * @param {string} filterValue - Value to filter by (partial match)
 * @param {string} sortColumn - Column to sort by (name, email)
 * @param {string} sortOrder - Sort order (ASC or DESC)
 * @returns {Promise<User[]>} A list of users
 */
export const getUsers = async (
  limit: number = 10,
  offset: number = 0,
  filterColumn?: 'name' | 'email',
  filterValue?: string,
  sortColumn?: 'name' | 'email',
  sortOrder: 'ASC' | 'DESC' = 'DESC'
): Promise<User[]> => {
  let query = 'SELECT * FROM users';
  const params: any[] = [];

  if (filterColumn && filterValue) {
    if (filterColumn === 'name' || filterColumn === 'email') {
      query += ` WHERE ${filterColumn} LIKE ?`;
      params.push(`%${filterValue}%`);
    }
  }

  const orderBy = sortColumn || 'created_at';
  query += ` ORDER BY ${orderBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return Promise.resolve(stmt.all(...params) as User[]);
};

/**
 * Get a user by ID
 * @param {string} id - User ID
 * @returns {Promise<User | undefined>} The user with the specified ID, or undefined if not found
 */
export const getUserById = async (id: string): Promise<User | undefined> => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return new Promise((resolve) => {
    const user = stmt.get(id) as User | undefined;
    resolve(user);
  });
};

/**
 * Update a user by ID
 * @param {string} id - User ID
 * @param {string} name - New user name (optional)
 * @param {string} email - New user email (optional)
 * @returns {Promise<User | null>} The updated user, or null if not found
 */
export const updateUser = async (id: string, name?: string, email?: string): Promise<User | null> => {
  const user = await getUserById(id);
  if (!user) return Promise.resolve(null);

  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }

  
  if (updates.length === 0) return Promise.resolve(user);

  params.push(id);
  const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...params);

  // Mock async behavior by returning a promise
  return new Promise(async (resolve) => {
    const updatedUser =  await getUserById(id);
    resolve(updatedUser || null);
  });
}

/**
 * Delete a user by ID
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if the user was deleted, false otherwise
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(id);
  // Mock async behavior by returning a promise
  return Promise.resolve(result.changes > 0);
};