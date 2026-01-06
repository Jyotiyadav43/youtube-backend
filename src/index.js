//require("dotenv").config({path: "./env"});

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({path: "./env"})


connectDB()
.then(()=>{
  app.on("error", (error)=>{
    console.log("Error in starting the server ", error);
    throw error;

  })
  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`⚙️  Sever is running at port : ${process.env.PORT}`);
    
  })
})
.catch((err)=>{
  console.log("Mongo DB connection failed", err);
})