import { app } from './app.js';
import { config } from './config/index.js';
import { migrate } from './db/migrate.js';
import { deleteExpiredSessions } from './models/sessionModel.js';

async function start() {
  await migrate();

  // Clean up expired sessions every hour
  setInterval(() => {
    deleteExpiredSessions().catch((err) => console.error('Session cleanup error:', err));
  }, 60 * 60 * 1000);

  app.listen(config.port, () => {
    console.log(`Webhook Listener running on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
