const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const { initCloudbase } = require('./cloudbase');
const authMiddleware = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
const dynamicsRoutes = require('./routes/dynamics');
const commentsRoutes = require('./routes/comments');
const competitionsRoutes = require('./routes/competitions');
const checkinsRoutes = require('./routes/checkins');
const contentRoutes = require('./routes/content');
const tierRoutes = require('./routes/tier');
const configRoutes = require('./routes/config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('short'));

app.use('/api', authMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dynamics', dynamicsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/competitions', competitionsRoutes);
app.use('/api/checkins', checkinsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/tiers', tierRoutes);
app.use('/api/config', configRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`[server] 管理后台已启动: http://localhost:${config.port}`);
  initCloudbase();
});
