"use strict";
// start: nodemon index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
const Calculate = require("./src/calculate");

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const appUri = process.env.APP_URI;
app.use(express.json());

app.get("/optimize", async (req, res) => {
    try {
        const optimizedPicking = await Calculate.calculate(req.body);
        res.status(200).json(optimizedPicking);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error: " + error);
    }
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at  ${appUri}:${port}`);
});
