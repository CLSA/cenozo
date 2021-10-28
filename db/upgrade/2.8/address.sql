DROP PROCEDURE IF EXISTS patch_address;
DELIMITER //
CREATE PROCEDURE patch_address()
  BEGIN

    SELECT "Replacing international_country column with international_country_id in address table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "address"
    AND column_name = "international_country";

    IF 1 = @total THEN
      ALTER TABLE address ADD COLUMN international_country_id INT UNSIGNED NULL DEFAULT NULL AFTER international_country;

      ALTER TABLE address ADD INDEX fk_international_country_id (international_country_id ASC);

      ALTER TABLE address
      ADD CONSTRAINT fk_address_international_country_id
        FOREIGN KEY (international_country_id)
        REFERENCES country (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;

      UPDATE address
      JOIN country ON address.international_country = country.name
      SET address.international_country_id = country.id;

      ALTER TABLE address DROP COLUMN international_country;
    END IF;

  END //
DELIMITER ;

CALL patch_address();
DROP PROCEDURE IF EXISTS patch_address;
