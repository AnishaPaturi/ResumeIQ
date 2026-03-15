import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req,res) => {

  const {name,email,password} = req.body;

  const hashedPassword = await bcrypt.hash(password,10);

  const user = await User.create({
    name,
    email,
    password:hashedPassword
  });

  res.json({message:"User created"});
};

export const login = async (req,res) => {

  const {email,password} = req.body;

  const user = await User.findOne({email});

  if(!user){
    return res.status(400).json({message:"User not found"});
  }

  const valid = await bcrypt.compare(password,user.password);

  if(!valid){
    return res.status(400).json({message:"Invalid password"});
  }

  const token = jwt.sign(
    {id:user._id},
    process.env.JWT_SECRET,
    {expiresIn:"7d"}
  );

  res.json({
    token,
    user:{
      id:user._id,
      name:user.name,
      email:user.email
    }
  });
};
