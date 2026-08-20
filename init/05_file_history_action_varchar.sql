-- La tabla file_history.action se creó como ENUM con literales acentuados
-- ('CREACIÓN', etc.) que en producción quedaron guardados con bytes
-- corruptos (doble-codificación UTF-8/Windows-1252), por lo que ningún
-- valor generado correctamente por la aplicación calza con el ENUM y el
-- INSERT falla con "Data truncated for column 'action'".
-- Se convierte a VARCHAR para no depender de un match exacto de bytes.
--
-- Los scripts de /init solo corren en la creación inicial del volumen de MySQL.
-- Si ya tienes un volumen existente, aplica este archivo manualmente:
--   docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PWD" "$DBNAME" < init/05_file_history_action_varchar.sql

SET @is_enum = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'file_history' AND COLUMN_NAME = 'action' AND DATA_TYPE = 'enum'
);
SET @sql = IF(
  @is_enum = 1,
  'ALTER TABLE file_history MODIFY COLUMN action VARCHAR(50) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
