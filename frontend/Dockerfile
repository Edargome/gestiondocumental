# Usa la imagen de Node.js para construir la aplicación
FROM node:16 AS build

# Configura el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de la aplicación al directorio de trabajo
COPY . .

# Compila la aplicación Angular
# RUN npm run build -- --prod
RUN npm run build --

# Usa una imagen de servidor web para servir la aplicación compilada
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

#COPY ssl /etc/nginx/ssl

# Copia los archivos compilados desde la etapa de construcción
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Expone el puerto en el que Nginx sirve la aplicación
EXPOSE 80

# Inicia Nginx
CMD ["nginx", "-g", "daemon off;"]