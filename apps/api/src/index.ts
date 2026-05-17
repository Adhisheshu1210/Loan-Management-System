import { createServer } from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";

async function bootstrap() {
  await connectDatabase();
  const server = createServer(app);
  server.listen(env.PORT, () => {
    console.log(`API server running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
