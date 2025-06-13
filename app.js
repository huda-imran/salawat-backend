const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const tokenRoutes = require('./routes/token.routes');
const coreRoutes = require('./routes/coreUser.routes');
const builderRoutes = require('./routes/builder.routes');
const memberRoutes = require('./routes/member.routes')

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/core', coreRoutes);
app.use('/api/builder', builderRoutes);
app.use('/api/member', memberRoutes);


module.exports = app;