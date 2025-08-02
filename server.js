import express from 'express';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import userRoutes from './routes/user.js'
import cors from 'cors'
const app = express();

config({ path: '.env' });
app.use(cors());
app.use(express.json());
app.use('/api/user', userRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI,{
    dbName:"Intern-Dasboard",
}).then(()=>{
    console.log("connected")
}).catch((err)=>console.log(err))


// Test route
app.get("/", (req, res) => {
  res.send("API is working!");
});
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
