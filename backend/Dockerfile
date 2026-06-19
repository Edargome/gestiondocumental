# Usa una imagen base oficial de Node.js 16.14.0-alpine desde Docker Hub
FROM node:16.14.0-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias de Node.js
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install --production

# Copia el código fuente de la aplicación
COPY . .

# Asegúrate de que la carpeta uploads exista
RUN mkdir -p /app/uploads

# Expone el puerto en el que la aplicación estará corriendo
EXPOSE 8000

# Declara un volumen para la carpeta `uploads`
VOLUME ["/app/uploads"]

# Define el comando para iniciar la aplicación
CMD ["node", "index.js"]


#docker run -d -p 8000:8000 -v /home/gesdocfiles:/app/uploads --name gesDocAPI backendgesdoc
#docker inspect gesDocAPI | grep Mounts -A 5