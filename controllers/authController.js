import User from "../models/User.js";
import OTP from "../models/Otp.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import bcrypt from "bcryptjs";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
// console.log("Email:", process.env.EMAIL_USERNAME);
// console.log(
//   "Password:",
//   process.env.EMAIL_PASSWORD ? "✅ present" : "❌ missing"
// );

// signup user
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "User already exists. Please login instead.",
      });
    }

    //   Create user
    const newUser = await User.create({
      name,
      email,
      password,
    });

    //   Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    //   save otp to database
    await OTP.create({
      email,
      otp,
    });

    // Send OTP to user's email
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Verify Your Email",
      text: `Your OTP for email verification is: ${otp}`,
      html: `<p>Your OTP for email verification is: <strong>${otp}</strong></p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      status: "success",
      message:
        "OTP sent to your email. Please verify to complete registration.",
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          wallet: newUser.wallet,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// verify OTP and Complete Registration
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    //   find the most recent OTP for the email
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({
        status: "fail",
        message: "No OTP found for this email. Please request a new OTP.",
      });
    }

    //   check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid OTP. Please try again.",
      });
    }

    //   mark user as verified
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    //   Delete all OTPS for this mail
    await OTP.deleteMany({ email });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.status(200).json({
      status: "success",
      message: "Email verified successfully. Account created!",
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "No user found with this email.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: "fail",
        message: "Email is already verified.",
      });
    }

    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    // Save OTP to database
    await OTP.create({
      email,
      otp,
    });

    // Send OTP to user's email
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "New OTP for Email Verification",
      text: `Your new OTP for email verification is: ${otp}`,
      html: `<p>Your new OTP for email verification is: <strong>${otp}</strong></p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: "success",
      message: "New OTP sent to your email.",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password",
      });
    }
    // 2) Check if user exists and password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    // 3) Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        status: "fail",
        message: "Email not verified. Please verify your email first.",
      });
    }
    // 4) If everything ok, send token to client
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

//get users
export const getUserDetaiils = async (req, res) => {
  try {
    // User is already available in req.user from the protect middleware
    const user = req.user;

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          emai: user.email,
          wallet: user.wallet,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// update user name
export const updateUserName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: "fail",
        message: "Please provide a valid name",
      });
    }

    // update the user's name
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      status: "success",
      message: "Name updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// change user password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // check if passwords are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide both current and new password",
      });
    }

    // Get user from collection
    const user = await User.findById(req.user.id).select("+password");

    // check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: "fail",
        message: "Your current password is incorrect",
      });
    }

    // check if new password is different
    if (currentPassword === newPassword) {
      return res.status(400).json({
        status: "fail",
        message: "New password must be different from current password",
      });
    }

    // 5) Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        status: "fail",
        message: "Password must be at least 8 characters",
      });
    }

    // update password
    user.password = newPassword;
    await user.save();

    // 7) Create new JWT token (optional but recommended)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
      token, // Send new token if you want to invalidate old one
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
