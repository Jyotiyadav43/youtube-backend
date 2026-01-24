import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"; 
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 



const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    user.save({ validateBeforeSave: false})
    return { accessToken, refreshToken}

    
  } catch (error) {
    throw new ApiError(500, "something went wrong while generating Access and Refresh token")
    
  }

}

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


const loginUser = asyncHandler ( async (req, res) => {

  // get email and password from req.body
  // validation - not empty
  // check user is exists with given email
  // check for password correctness
  // generate access token
  // generate refresh token
  // save refresh token in db against user
  // send cookies and response

  const {email, username, password} = req.body

  if (!username && !email) {
    throw new ApiError(400, "Username and email are required")

  }
  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if (!user) {
    throw new ApiError(404, "user not found with given email or username")
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password)
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials, password is incorrect")

  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    )
  

})

const logoutUser = asyncHandler (async () => {
  await User.findByIdAndUpdate(
    req.user._id, {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: true
  }
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged out successfully"))


})








export { 
  registerUser,
  loginUser,
  logoutUser
}