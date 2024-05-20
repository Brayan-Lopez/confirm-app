const catchError = require('../utils/catchError');
const User = require('../models/User');
const EmailCode = require('../models/EmailCode')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/sendEmail');

const getAll = catchError(async(req, res) => {
    const users = await User.findAll();
    return res.json(users);
});

const create = catchError(async(req, res) => {
    const {email, password, firstName, lastName, country, image, frontBaseUrl} = req.body
    const encriptedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      email,
      password: encriptedPassword,
      firstName, lastName, country, image
    });

    const code = require('crypto').randomBytes(32).toString('hex')
    const link = `${frontBaseUrl}/${code}`

    await EmailCode.create({
      code: code,
      userId: user.id
    })

    await sendEmail({
      to: `${email}`,
      subject: "Verificate email for user app",
      html: `
      <h1> Hello ${firstName} ${lastName} </h1>
        <p>Thanks for sing up in user app.</p>
        <p>Para verificar tu email, haz click en el siguiente enlace:</p>
        <a href="${link}">${link}</a>
      `
    })
    return res.status(201).json(user);
});

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if(!user) return res.sendStatus(404);
    return res.json(user);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    await User.destroy({ where: {id} });
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const {email, firstName, lastName, country, image} = req.body
    const user = await User.update(
      {email, firstName, lastName, country, image},
      { where: {id}, returning: true }
    );
    if(user[0] === 0) return res.sendStatus(404);
    return res.json(user[1][0]);
});

const verifyCode = catchError(async(req, res)=>{
  const {code} = req.params
  const emailCode = await EmailCode.findOne({where: {code: code}})
  if(!emailCode) return res.status(401).json({message: "Invalid code"}) 
  
  const user = await User.findByPk(emailCode.userId)
  user.isVerified = true
  await user.save()
  // const user = await User.update(
  //   {isVerified: true},
  //   {where: emailCode.userId, returning:true}
  // )
  await emailCode.destroy()
  return res.json(user)
})

const login = catchError(async(req, res)=>{
  const {email, password} = req.body
  const user = await User.findOne({where: {email:email}})
  if(!user) return res.status(401).json({message: 'Invalid crdentials'})
  if(!user.isVerified) return res.status(401).json({message: 'User is not verified'})
  const correctPassword = await bcrypt.compare(password, user.password)
  if(!correctPassword) return res.status(401).json({message: 'Invalid crdentials'})
  const jwtToken = jwt.sign(
    {user},
    process.env.TOKEN_SECRET,
    {expiresIn: "1d"}
  )
  return res.json({user, jwtToken})
})

const loggedUser = catchError(async(req, res)=>{
  return res.json(req.user)
})

const linkToResetPassword = catchError(async(req, res)=>{
  const {email, frontBaseUrl} = req.body
  const user = await User.findOne({where: {email:email}})
  if(!user) return res.status(401).json({message: 'The email does not belong to any registered user'})

  const code = require('crypto').randomBytes(32).toString('hex')
  const link = `${frontBaseUrl}/${code}`

  await EmailCode.create({
    code: code,
    userId: user.id
  })
  await sendEmail({
    to: `${email}`,
    subject: "Recover your password for user app",
    html: `
    <h1> Hello ${user.firstName} ${user.lastName} </h1>
      <h3>Recover your password for user app.</h3>
      <p>Change your User App password through this link</p>
      <a href="${link}">${link}</a>
    `
  })
  return res.status(201).json(email);
})

const resetPassword = catchError(async(req, res)=>{
  const {code} = req.params
  const emailCode = await EmailCode.findOne({where: {code: code}})
  if(!emailCode) return res.status(401).json({message: "Invalid code"}) 
  const {password} = req.body
  const encriptedPassword = await bcrypt.hash(password ,10)
  const user = await User.findByPk(emailCode.userId)
  user.password = encriptedPassword
  await user.save()
  await emailCode.destroy()
  return res.json(user)
})

module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    verifyCode,
    login,
    loggedUser,
    linkToResetPassword,
    resetPassword
}