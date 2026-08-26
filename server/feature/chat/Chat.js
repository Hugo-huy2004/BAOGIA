import { Chat, Message } from "./model"

export class ChatService {
    constructor(router) { }

    send(req, res) {
        const { from, to, content } = req.body;
        if (!from || !to || !content) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (from === to) {
            return res.status(400).json({ error: "Cannot send message to yourself" });
        }
        

    
    }
}   