const { check, validationResult } = require("express-validator");
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users/user');

exports.signup = [
    check("firstname")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters long")
    .matches(/^[A-Za-z]+$/)
    .withMessage("First name must contain only alphabetic characters"),

  check("lastname")
    .trim()
    .matches(/^[A-Za-z]*$/)
    .withMessage("Last name must contain only alphabetic characters"),

    check("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .custom(async (email) => {
        const existingUser = await User.findUser(email);
        if (existingUser) {
            throw new Error("User already exists");
        }
    })
    .normalizeEmail(),
    
    check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[\W_]/)
    .withMessage("Password must contain at least one special character")
    .trim(),

    check("confirmpassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

    async (req, res) => {
    const { firstname, lastname, email, password, confirmpassword } =
      req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.json({
        success: false,
        errorMessages: errors.array().map((error) => error.msg),
        oldInput: {
          firstname,
          lastname,
          email,
          password,
        },
      });
    }

    bcryptjs.hash(password, 12, async (err, hashedPassword) => {
      try {
        const user = new User(
          null,
          firstname,
          lastname,
          email,
          hashedPassword,
          'light'
        );

        await user.insert();

        res.status(201).json({ success: true, message: "Signup successful" });
      } catch (err) {
        console.error("Error inserting user:", err);
        return res.status(500).json({ success: false });
      }
    });
  },
];

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const users = await User.findUser(email);
        console.log(users);
        if (!users) {
            return res.status(401).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcryptjs.compare(password, users.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { userId: users.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ success: true, token: token, userId: users.id});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}; 