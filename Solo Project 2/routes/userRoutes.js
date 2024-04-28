import express from 'express';
import * as userController from '../controllers/userController.js'
import userModel from "../models/userModel.js";

const router = express.Router();

//Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserByID);

//Creating a new user
router.post('/', userController.createUser);

//Login
router.post('/login', userController.login);

export default router;