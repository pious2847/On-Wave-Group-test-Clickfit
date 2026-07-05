
  CREATE DATABASE IF NOT EXISTS clickfitDB;
  USE clickfitDB;


  DROP PROCEDURE IF EXISTS addUser;
  DROP TABLE IF EXISTS users;


  CREATE TABLE users (
    userId    INT AUTO_INCREMENT PRIMARY KEY,
    email     VARCHAR(255) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    type      ENUM('member', 'coach', 'admin') NOT NULL DEFAULT 'member',
    active    TINYINT(1) NOT NULL DEFAULT 1,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_unicode_ci;

  CREATE INDEX idx_users_type   ON users(type);
  CREATE INDEX idx_users_active ON users(active);

  DELIMITER $$

  CREATE PROCEDURE addUser
  (
    IN  p_email    VARCHAR(255),
    IN  p_password VARCHAR(255),
    IN  p_type     ENUM('member', 'coach', 'admin'),
    IN  p_active   TINYINT(1),
    OUT p_newId    INT
  )
  BEGIN
    DECLARE v_dup TINYINT DEFAULT 0;

    DECLARE CONTINUE HANDLER FOR 1062
    BEGIN
      SET v_dup = 1;
    END;

    INSERT INTO users (email, password, type, active)
    VALUES (p_email, p_password, p_type, p_active);

    IF v_dup = 1 THEN
      SET p_newId = 0;
    ELSE
      SET p_newId = LAST_INSERT_ID();
    END IF;
  END$$

  DELIMITER ;


  CALL addUser(
    'abdul@clickfit.com',
    '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV1234567890ab',  -- bcrypt hash
    'member',
    1,
    @newUserId
  );
  SELECT @newUserId AS newUserId, email, type, active FROM users WHERE userId = @newUserId;

  CALL addUser(
    'hafis@clickfit.com',
    '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV1234567890ab',
    'coach',
    1,
    @newUserId2
  );
  SELECT @newUserId2 AS newUserId, email, type, active FROM users WHERE userId = @newUserId2;

  CALL addUser(
    'abdul@clickfit.com',
    'anotherhash',
    'member',
    1,
    @dupId
  );
  SELECT @dupId AS expectedZero;


  SELECT * FROM users;
