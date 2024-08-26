const mongoose = require("mongoose");
const Document = require("./Document");
const dotenv = require('dotenv');


dotenv.config();

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database Connected");
  });

  

const io = require("socket.io")(process.env.PORT, {
  cors: {
    origin: process.env.FRONTEND_URL,
    method: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);
    
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

const defaultValue = "";

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);

  if (document) return document;
  return await Document.create({ _id: id, defaultValue });
}
