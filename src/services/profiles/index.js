/**
PROFILES:
- GET https://yourapi.herokuapp.com/api/profile/
Retrieves list of profiles
- GET https://yourapi.herokuapp.com/api/profile/{userId}
Retrieves the profile with userId = {userId}
- POST https://yourapi.herokuapp.com/api/profile/
Create the user profile with all his details
- PUT https://yourapi.herokuapp.com/api/profile/
Update current user profile details
- POST https://yourapi.herokuapp.com/api/profile/{userId}/picture
Replace user profile picture (name = profile)
- GET https://yourapi.herokuapp.com/api/profile/{userId}/CV
Generates and download a PDF with the CV of the user (details, picture, experiences)
*/
const express = require("express");
const jwt = require("jsonwebtoken");
const profileSchema = require("./mongo");
const experienceSchema = require("../experience/schema");
const {cloudinary} = require("../../../utils/cloudinary");
//const fs = require("fs");
//const experienceSchema = require("../experience");
//const postSchema = require("../posts");
const router = express.Router();
require("dotenv/config");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const profiles = await profileSchema.find();
    res.send(profiles);
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const profiles = await profileSchema.find();
    const resp = res.json(
      profiles.filter((profile) => profile.username === req.user.name)
    );
    res.send(resp);
  } catch (error) {
    next(error);
  }
});
router.post("/me/picture", authenticateToken, async (req, res, next) => {
    try {
        const fileStr = req.body.data;
        const uploadedResp = await cloudinary.uploader.upload(fileStr, {
            upload_preset:"dev_setups"
        })
        console.log(uploadedResp)
        res.json({msg: "image uploaded"})
    } catch (error) {
        next(error)
    }
})

router.post("/", async (req, res, next) => {
  try {
    const postProfile = new profileSchema({...req.body, experiences:[]});
    const { _id } = await postProfile.save();
    const username = req.body.username;
    const user = { name: username };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    res.json({ accessToken: accessToken });
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const profile = await profileSchema.findById(req.params.id);
    res.send(profile);
  } catch (error) {
    next(error);
  }
});
router.put("/:id", authenticateToken, async (req, res, next) => {
  try {
    const profile = await profileSchema.findByIdAndUpdate(
      req.params.id,
      req.body,
      { runValidators: true, new: true }
    );
    if (profile) {
      res.send(profile);
    } else {
      const err = new Error("Profile not found");
      err.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});
router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const profile = await profileSchema.findByIdAndDelete(req.params.id);
    if (profile) {
      res.send("deleted");
    } else {
      const error = new Error(`Profile with ${req.params.id} is not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});


// router.get("/:uid/experience", authenticateToken, async (req, res, next) => {
//   try {
//     const { experiences} = await profileSchema.findById(req.params.uid, {
//       experiences: 1,
//       _id: 0,
//     })
//     res.send(experiences)
//   } catch (error) {
//     console.log(error)
//     next(error)
//   }
// })

module.exports = router;
