import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"; 
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 

const registerUser = asyncHandler (async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: note: username, email 
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // ckeck for user creation 
  // return response
  console.log("REQ FILES 👉", req.files);
console.log("REQ BODY 👉", req.body);

  const {username, email, fullname, password} = req.body
  console.log("email:", email);

  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }
  
  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (existingUser) {
    throw new ApiError(409, "User with given username or email already exists")
  }
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  console.log("CLOUDINARY AVATAR 👉", avatar);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "avatar is required")

  }
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()

  })
  const createdUser = await User.findById(user._id).select("-password -refreshToken")
  if (!createdUser) {
    throw new ApiError(500, "User creation failed, please try again")
  }
  return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"))

})


export { registerUser}