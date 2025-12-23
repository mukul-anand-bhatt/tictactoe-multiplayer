import "dotenv/config";
import http from "http";
import express from 'express';
import { Request, Response } from 'express';
import { initWS } from "./ws";


const app = express();

const server = http.createServer(app);

app.get("/health", (req: Request, res: Response) => {
    res.status(200).send("ok")
})

initWS(server);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})