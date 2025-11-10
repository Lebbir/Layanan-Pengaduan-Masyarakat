import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import wargaRouter from "./routes/wargaRoute.js"
import 'dotenv/config'

// app config
const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(cors())

// db connection
connectDB();

//API endpoint
app.use("/api/warga",wargaRouter)

app.get("/", (req,res) => {
    res.send("API Working")
})

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`)
})
