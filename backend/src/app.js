const express = require('express');
var morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const PROD = process.env.PROD === 'true' ? true : false;
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'https://gesdoc.intekgrow.com', //servidor que deseas que consuma o (*) en caso que sea acceso libre
    credentials: false,
  })
);

// setup the logger
app.use(morgan('combined'));

// read the routes to users
const usersRoutes = require('./routes/user.routes');
app.use('/users', usersRoutes);

// read the routes to control files
const filesRoutes = require('./routes/file.routes');
app.use('/files', filesRoutes);
// read the routes to control folders
const foldersRoutes = require('./routes/folder.routes');
app.use('/folders', foldersRoutes);
// read the routes to control folders
const permissionsRoutes = require('./routes/permission.routes');
app.use('/permissions', permissionsRoutes);
// read the routes to control trash (admin)
const trashRoutes = require('./routes/trash.routes');
app.use('/trash', trashRoutes);

app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
