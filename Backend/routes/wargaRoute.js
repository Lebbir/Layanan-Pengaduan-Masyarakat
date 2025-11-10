import express from "express"
import { loginUser,registerUser } from "../controller/wargaController.js";

const wargaRouter = express.Router()

wargaRouter.post("/login",loginUser)
wargaRouter.post("/register",registerUser)

export default wargaRouter;