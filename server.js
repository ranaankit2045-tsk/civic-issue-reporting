const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const { MongoMemoryServer } = require("mongodb-memory-server");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
dotenv.config();
const app = express();
const PREFERRED_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_TRIES = 50;
const MONGO_URI = process.env.MONGO_URI;
const RETRY_MS = 5000;
let memoryServer = null;
let httpServer = null;
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
// Prevent API calls before DB connects
//app.use("/api", (req, res, next) => {
//  if (req.path === "/health") return next();

  //if (mongoose.connection.readyState !== 1) {
    //return res.status(503).json({
      //message: "Database not connected yet. Try again in a few seconds."
    //});
  //}

  //next();
//});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Server running",
    dbState: mongoose.connection.readyState
  });
});

// Disable buffering
mongoose.set("bufferCommands", false);


async function connectWithRetry() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(" MongoDB connection error:", error.message);
    const isSrvDnsError =
      error?.message?.includes("querySrv") ||
      error?.message?.includes("ENOTFOUND") ||
      error?.message?.includes("ECONNREFUSED");

    if (isSrvDnsError) {
      try {
        console.log("⚠️ Falling back to in-memory MongoDB for development...");
        memoryServer = await MongoMemoryServer.create();
        const memoryUri = memoryServer.getUri("civic_issues");

        await mongoose.connect(memoryUri);
        console.log(" Connected to in-memory MongoDB");
        return;
      } catch (memoryError) {
        console.error(" In-memory MongoDB fallback failed:", memoryError.message);
      }
    }

    console.log(`Retrying in ${RETRY_MS / 1000}s...`);
    setTimeout(connectWithRetry, RETRY_MS);
  }
}

async function shutdown() {
  if (memoryServer) {
    await memoryServer.stop();
  }
  if (httpServer) {
    httpServer.close(() => process.exit(0));
    return;
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function startListening(port) {
  if (port > PREFERRED_PORT + MAX_PORT_TRIES) {
    console.error(
      ` No free port found between ${PREFERRED_PORT} and ${PREFERRED_PORT + MAX_PORT_TRIES}. Close other apps or set PORT in .env.`
    );
    process.exit(1);
  }

  httpServer = http.createServer(app);

  httpServer.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Port ${port} is already in use, trying ${port + 1}...`);
      try {
        httpServer.close();
      } catch (_) {
        /* ignore */
      }
      httpServer = null;
      startListening(port + 1);
      return;
    }
    console.error(" Server error:", err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    httpServer.removeAllListeners("error");
    httpServer.on("error", (err) => {
      console.error(" HTTP server error:", err);
    });
    console.log(`🚀 Server running on http://localhost:${port}`);
    connectWithRetry();
  });
}

startListening(PREFERRED_PORT);