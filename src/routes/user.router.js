const { 
  getAll, create, getOne, update, remove, 
  verifyCode, login, loggedUser, linkToResetPassword, resetPassword
} = require('../controllers/user.controllers');
const express = require('express');
const verifyJWT = require('../utils/verifyJWT')


const userRouter = express.Router();

userRouter.route('/users')
  .get(verifyJWT, getAll)
  .post(create)

userRouter.route('/users/reset_password')
  .post(linkToResetPassword)

userRouter.route('/users/me')
  .get(verifyJWT, loggedUser)

userRouter.route('/users/login')
  .post(login)

userRouter.route('/users/reset_password/:code')
  .post(resetPassword)

userRouter.route('/users/verify/:code')
  .get(verifyCode)

userRouter.route('/users/:id')
  .get(verifyJWT, getOne)
  .put(verifyJWT, update)
  .delete(verifyJWT, remove)

module.exports = userRouter;