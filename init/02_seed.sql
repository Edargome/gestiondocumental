-- Datos iniciales GestionDocumental
-- Usuario admin. password en claro: Admin123*
-- Hash bcrypt (cost 10) pre-computado, compatible con bcrypt de Node.
-- INSERT IGNORE evita fallo si el usuario ya existe (re-ejecuciones).

INSERT IGNORE INTO users (username, email, password_hash, accessLevel, isActive)
VALUES ('admin', 'admin@gestion.com', '$2b$10$RpaUOf7xv5IzQiW7VE.AUuLMpbI/wfP2gNNs2VUD9dp/rcUvKjbt.', 0, 1);
