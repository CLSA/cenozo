DROP PROCEDURE IF EXISTS patch_relation_type;
DELIMITER //
CREATE PROCEDURE patch_relation_type()
  BEGIN

    SELECT "Creating new relation_type table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "relation_type";

    IF 0 = @total THEN
      CREATE TABLE IF NOT EXISTS relation_type (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        rank INT(10) UNSIGNED NOT NULL,
        name VARCHAR(255) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_rank (rank ASC),
        UNIQUE INDEX uq_name (name ASC))
      ENGINE = InnoDB;
    END IF;

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "relation_type"
    AND column_name = "rank";

    IF 0 = @total THEN
      ALTER TABLE relation_type ADD COLUMN rank INT(10) UNSIGNED NOT NULL AFTER create_timestamp;
      ALTER TABLE relation_type ADD UNIQUE KEY uq_rank (rank);
    END IF;

  END //
DELIMITER ;

CALL patch_relation_type();
DROP PROCEDURE IF EXISTS patch_relation_type;
