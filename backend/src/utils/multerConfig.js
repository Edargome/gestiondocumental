const multer = require('multer');
const path = require('path');

const CURRENT_DIR = path.dirname(__dirname);
// Configuración de almacenamiento de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(CURRENT_DIR, '../uploads')); // Carpeta 'uploads' en la raíz del proyecto
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nombre único para cada archivo
  },
});
// Exporta la instancia de multer configurada
const upload = multer({ storage });

module.exports = upload;
