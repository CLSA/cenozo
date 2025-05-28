DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Replacing current_sex column with gender_identity in participant table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "current_sex";

    IF @test = 1 THEN
      ALTER TABLE participant
      ADD COLUMN gender_identity
      ENUM('man', 'woman', 'trans man', 'trans woman', 'non-binary', 'genderqueer', 'two-spirit', 'other')
      NOT NULL AFTER current_sex;

      UPDATE participant SET gender_identity = IF(
        sex = "male",
        IF(current_sex = "male", "man", "trans woman"),
        IF(current_sex = "female", "woman", "trans man")
      );

      ALTER TABLE participant DROP COLUMN current_sex;
    END IF;

    SELECT "Adding new pronouns column to participant table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "pronouns";

    IF @test = 0 THEN
      ALTER TABLE participant
      ADD COLUMN pronouns VARCHAR(45) NULL DEFAULT NULL AFTER gender_identity;
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;
