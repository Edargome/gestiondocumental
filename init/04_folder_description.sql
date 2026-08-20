-- Agrega descripción a carpetas.
-- Los scripts de /init solo corren en la creación inicial del volumen de MySQL.
-- Si ya tienes un volumen existente, aplica este archivo manualmente:
--   docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PWD" "$DBNAME" < init/04_folder_description.sql

SET @has_description = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'folders' AND COLUMN_NAME = 'description'
);
SET @sql = IF(
  @has_description = 0,
  'ALTER TABLE folders ADD COLUMN description VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
