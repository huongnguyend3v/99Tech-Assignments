import { Request, Response } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../models/user';


export const getUsersHandler = async (req: Request, res: Response) => {
  try {
    const { limit, offset, filterColumn, filterValue, sortColumn, sortOrder } = req.query as any;
    const users = await getUsers(limit, offset, filterColumn, filterValue, sortColumn, sortOrder);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getUserByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const createUserHandler = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const user = await createUser(name, email);
    res.status(201).json(user);
  } catch (error) {
    if ((error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};


export const updateUserHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email } = req.body;
    const user = await updateUser(id, name, email);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    if ((error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};


export const deleteUserHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = await deleteUser(id);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
