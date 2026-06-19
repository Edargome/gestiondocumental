CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    accessLevel INT DEFAULT 1,
    isActive TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE folders (
    folder_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_folder_id INT NULL,
    created_by INT NOT NULL,
    updated_by INT,
    isDelete TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);
CREATE TABLE files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    folder_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    extname VARCHAR(20),
    created_by INT NOT NULL,
    updated_by INT,
    isDelete TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);
CREATE TABLE permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    folder_id INT NULL,
    file_id INT NULL,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    CHECK (folder_id IS NOT NULL OR file_id IS NOT NULL)
);
CREATE TABLE file_versions (
    version_id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NOT NULL,
    version_number INT NOT NULL,
    content VARCHAR(255),
    size BIGINT,
    mime VARCHAR(100),
    original_name VARCHAR(100),
    extname VARCHAR(20),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE
);
CREATE TABLE trash (
    trash_id INT AUTO_INCREMENT PRIMARY KEY,
    item_type ENUM('folder', 'file') NOT NULL,
    item_id INT NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_delete_at TIMESTAMP DEFAULT NULL
);
CREATE TABLE tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE file_tags (
    file_tag_id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NULL,
    folder_id INT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE,
    CHECK (file_id IS NOT NULL OR folder_id IS NOT NULL)
);
CREATE TABLE file_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NOT NULL,
    user_id INT NOT NULL,
    action ENUM('CREACIÓN', 'ACTUALIZACIÓN', 'VERSIÓN NUEVA', 'DESCARGA', 'DESCARGA VERSIÓN') NOT NULL,
    version_number INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- =============================================
-- ALTER TABLE para bases de datos ya existentes
-- =============================================
ALTER TABLE users
    ADD COLUMN accessLevel INT DEFAULT 1,
    ADD COLUMN isActive TINYINT(1) DEFAULT 1;

ALTER TABLE folders
    ADD COLUMN isDelete TINYINT(1) DEFAULT 0;

ALTER TABLE files
    ADD COLUMN extname VARCHAR(20),
    ADD COLUMN isDelete TINYINT(1) DEFAULT 0;

ALTER TABLE file_versions
    ADD COLUMN size BIGINT,
    ADD COLUMN mime VARCHAR(100);

ALTER TABLE file_history
    ADD COLUMN version_number INT;

ALTER TABLE file_history 
MODIFY COLUMN action ENUM('CREACIÓN', 'ACTUALIZACIÓN', 'VERSIÓN NUEVA', 'DESCARGA', 'DESCARGA VERSIÓN') NOT NULL;

ALTER TABLE file_versions
  ADD COLUMN original_name VARCHAR(100),
  ADD COLUMN extname VARCHAR(20);

-- Backfill con la extensión actual (aproximado para versiones ya existentes)
UPDATE file_versions fv
  JOIN files f ON fv.file_id = f.file_id
  SET fv.original_name = f.name, fv.extname = f.extname;
