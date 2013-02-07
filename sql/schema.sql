SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='';

DROP SCHEMA IF EXISTS `cenozo` ;
CREATE SCHEMA IF NOT EXISTS `cenozo` ;
USE `cenozo` ;

-- -----------------------------------------------------
-- Table `cenozo`.`user`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`user` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `name` VARCHAR(45) NOT NULL ,
  `password` VARCHAR(255) NULL DEFAULT NULL ,
  `first_name` VARCHAR(255) NOT NULL ,
  `last_name` VARCHAR(255) NOT NULL ,
  `active` TINYINT(1) NOT NULL DEFAULT 1 ,
  `language` ENUM('any','en','fr') NOT NULL DEFAULT 'en' ,
  `theme` VARCHAR(45) NULL DEFAULT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_name` (`name` ASC) ,
  INDEX `dk_active` (`active` ASC) ,
  INDEX `dk_language` (`language` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cenozo`.`role`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`role` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`role` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `name` VARCHAR(45) NOT NULL ,
  `tier` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1 = normal, 2 = site admin, 3 = global admin' ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_name` (`name` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cenozo`.`service`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`service` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`service` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `name` VARCHAR(45) NOT NULL ,
  `version` VARCHAR(45) NOT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_name` (`name` ASC) )
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`site`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`site` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`site` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `name` VARCHAR(45) NOT NULL ,
  `service_id` INT UNSIGNED NOT NULL ,
  `timezone` ENUM('Canada/Pacific','Canada/Mountain','Canada/Central','Canada/Eastern','Canada/Atlantic','Canada/Newfoundland') NOT NULL ,
  `title` VARCHAR(45) NULL ,
  `phone_number` VARCHAR(45) NULL ,
  `address1` VARCHAR(512) NULL ,
  `address2` VARCHAR(512) NULL ,
  `city` VARCHAR(100) NULL ,
  `region_id` INT UNSIGNED NULL ,
  `postcode` VARCHAR(10) NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_name_service_id` (`name` ASC, `service_id` ASC) ,
  INDEX `fk_service_id` (`service_id` ASC) ,
  INDEX `fk_site_region_id` (`region_id` ASC) ,
  CONSTRAINT `fk_site_service_id`
    FOREIGN KEY (`service_id` )
    REFERENCES `cenozo`.`service` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_site_region_id`
    FOREIGN KEY (`region_id` )
    REFERENCES `cenozo`.`region` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`region`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`region` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`region` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `name` VARCHAR(45) NOT NULL ,
  `abbreviation` VARCHAR(5) NOT NULL ,
  `country` VARCHAR(45) NOT NULL ,
  `site_id` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Which site manages participants.' ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_name` (`name` ASC) ,
  UNIQUE INDEX `uq_abbreviation` (`abbreviation` ASC) ,
  INDEX `fk_site_id` (`site_id` ASC) ,
  CONSTRAINT `fk_region_site`
    FOREIGN KEY (`site_id` )
    REFERENCES `cenozo`.`site` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`cohort`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`cohort` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`cohort` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `name` VARCHAR(45) NOT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_name` (`name` ASC) )
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`access`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`access` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`access` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `user_id` INT UNSIGNED NOT NULL ,
  `role_id` INT UNSIGNED NOT NULL ,
  `site_id` INT UNSIGNED NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_user_id` (`user_id` ASC) ,
  INDEX `fk_role_id` (`role_id` ASC) ,
  INDEX `fk_site_id` (`site_id` ASC) ,
  UNIQUE INDEX `uq_user_id_role_id_site_id` (`user_id` ASC, `role_id` ASC, `site_id` ASC) ,
  CONSTRAINT `fk_access_user_id`
    FOREIGN KEY (`user_id` )
    REFERENCES `cenozo`.`user` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_access_role_id`
    FOREIGN KEY (`role_id` )
    REFERENCES `cenozo`.`role` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_access_site_id`
    FOREIGN KEY (`site_id` )
    REFERENCES `cenozo`.`site` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cenozo`.`system_message`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`system_message` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`system_message` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `service_id` INT UNSIGNED NULL DEFAULT NULL ,
  `site_id` INT UNSIGNED NULL DEFAULT NULL ,
  `role_id` INT UNSIGNED NULL DEFAULT NULL ,
  `title` VARCHAR(255) NOT NULL ,
  `note` TEXT NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_site_id` (`site_id` ASC) ,
  INDEX `fk_role_id` (`role_id` ASC) ,
  INDEX `fk_service_id` (`service_id` ASC) ,
  CONSTRAINT `fk_system_message_site_id`
    FOREIGN KEY (`site_id` )
    REFERENCES `cenozo`.`site` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_system_message_role_id`
    FOREIGN KEY (`role_id` )
    REFERENCES `cenozo`.`role` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_system_message_service_id`
    FOREIGN KEY (`service_id` )
    REFERENCES `cenozo`.`service` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cenozo`.`postcode`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`postcode` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`postcode` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `name` VARCHAR(7) NOT NULL COMMENT 'Postcodes with the same province, tz and dst are grouped.' ,
  `region_id` INT UNSIGNED NOT NULL ,
  `timezone_offset` FLOAT NOT NULL ,
  `daylight_savings` TINYINT(1) NOT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_name` (`name` ASC) ,
  INDEX `fk_region_id` (`region_id` ASC) ,
  CONSTRAINT `fk_postcode_region_id`
    FOREIGN KEY (`region_id` )
    REFERENCES `cenozo`.`region` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cenozo`.`person`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`person` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`person` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  PRIMARY KEY (`id`) )
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`address`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`address` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`address` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `person_id` INT UNSIGNED NOT NULL ,
  `active` TINYINT(1) NOT NULL DEFAULT 1 ,
  `rank` INT NOT NULL ,
  `address1` VARCHAR(512) NOT NULL ,
  `address2` VARCHAR(512) NULL DEFAULT NULL ,
  `city` VARCHAR(100) NOT NULL ,
  `region_id` INT UNSIGNED NOT NULL ,
  `postcode` VARCHAR(10) NOT NULL ,
  `timezone_offset` FLOAT NOT NULL ,
  `daylight_savings` TINYINT(1) NOT NULL ,
  `january` TINYINT(1) NOT NULL DEFAULT 1 ,
  `february` TINYINT(1) NOT NULL DEFAULT 1 ,
  `march` TINYINT(1) NOT NULL DEFAULT 1 ,
  `april` TINYINT(1) NOT NULL DEFAULT 1 ,
  `may` TINYINT(1) NOT NULL DEFAULT 1 ,
  `june` TINYINT(1) NOT NULL DEFAULT 1 ,
  `july` TINYINT(1) NOT NULL DEFAULT 1 ,
  `august` TINYINT(1) NOT NULL DEFAULT 1 ,
  `september` TINYINT(1) NOT NULL DEFAULT 1 ,
  `october` TINYINT(1) NOT NULL DEFAULT 1 ,
  `november` TINYINT(1) NOT NULL DEFAULT 1 ,
  `december` TINYINT(1) NOT NULL DEFAULT 1 ,
  `note` TEXT NULL DEFAULT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_person_id_rank` (`person_id` ASC, `rank` ASC) ,
  INDEX `fk_region_id` (`region_id` ASC) ,
  INDEX `fk_person_id` (`person_id` ASC) ,
  INDEX `dk_city` (`city` ASC) ,
  INDEX `dk_postcode` (`postcode` ASC) ,
  CONSTRAINT `fk_address_region`
    FOREIGN KEY (`region_id` )
    REFERENCES `cenozo`.`region` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_address_person`
    FOREIGN KEY (`person_id` )
    REFERENCES `cenozo`.`person` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`age_group`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`age_group` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`age_group` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `lower` INT NOT NULL ,
  `upper` INT NOT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_lower` (`lower` ASC) ,
  UNIQUE INDEX `uq_upper` (`upper` ASC) )
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`source`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`source` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`source` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `name` VARCHAR(45) NOT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_name` (`name` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cenozo`.`participant`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`participant` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`participant` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `person_id` INT UNSIGNED NOT NULL ,
  `active` TINYINT(1) NOT NULL DEFAULT 1 ,
  `uid` VARCHAR(45) NOT NULL COMMENT 'External unique ID' ,
  `source_id` INT UNSIGNED NULL DEFAULT NULL ,
  `cohort_id` INT UNSIGNED NOT NULL ,
  `first_name` VARCHAR(45) NOT NULL ,
  `last_name` VARCHAR(45) NOT NULL ,
  `gender` ENUM('male','female') NOT NULL ,
  `date_of_birth` DATE NULL DEFAULT NULL ,
  `age_group_id` INT UNSIGNED NULL DEFAULT NULL ,
  `status` ENUM('deceased','deaf','mentally unfit','language barrier','age range','not canadian','federal reserve','armed forces','institutionalized','noncompliant','sourcing required','unreachable','other') NULL DEFAULT NULL ,
  `language` ENUM('en','fr') NULL DEFAULT NULL ,
  `use_informant` TINYINT(1) NULL DEFAULT NULL ,
  `email` VARCHAR(255) NULL DEFAULT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_uid` (`uid` ASC) ,
  UNIQUE INDEX `uq_person_id` (`person_id` ASC) ,
  INDEX `dk_active` (`active` ASC) ,
  INDEX `dk_status` (`status` ASC) ,
  INDEX `dk_uid` (`uid` ASC) ,
  INDEX `fk_person_id` (`person_id` ASC) ,
  INDEX `fk_age_group_id` (`age_group_id` ASC) ,
  INDEX `fk_cohort_id` (`cohort_id` ASC) ,
  INDEX `fk_source_id` (`source_id` ASC) ,
  CONSTRAINT `fk_participant_person_id`
    FOREIGN KEY (`person_id` )
    REFERENCES `cenozo`.`person` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_participant_age_group_id`
    FOREIGN KEY (`age_group_id` )
    REFERENCES `cenozo`.`age_group` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_participant_cohort_id`
    FOREIGN KEY (`cohort_id` )
    REFERENCES `cenozo`.`cohort` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_participant_source_id`
    FOREIGN KEY (`source_id` )
    REFERENCES `cenozo`.`source` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`alternate`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`alternate` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`alternate` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `person_id` INT UNSIGNED NOT NULL ,
  `participant_id` INT UNSIGNED NOT NULL ,
  `alternate` TINYINT(1) NOT NULL ,
  `informant` TINYINT(1) NOT NULL ,
  `proxy` TINYINT(1) NOT NULL ,
  `first_name` VARCHAR(45) NOT NULL ,
  `last_name` VARCHAR(45) NOT NULL ,
  `association` VARCHAR(45) NOT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_person_id` (`person_id` ASC) ,
  INDEX `fk_participant_id` (`participant_id` ASC) ,
  INDEX `fk_person_id` (`person_id` ASC) ,
  CONSTRAINT `fk_alternate_participant`
    FOREIGN KEY (`participant_id` )
    REFERENCES `cenozo`.`participant` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_alternate_person`
    FOREIGN KEY (`person_id` )
    REFERENCES `cenozo`.`person` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`availability`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`availability` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`availability` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `participant_id` INT UNSIGNED NOT NULL ,
  `monday` TINYINT(1) NOT NULL DEFAULT 0 ,
  `tuesday` TINYINT(1) NOT NULL DEFAULT 0 ,
  `wednesday` TINYINT(1) NOT NULL DEFAULT 0 ,
  `thursday` TINYINT(1) NOT NULL DEFAULT 0 ,
  `friday` TINYINT(1) NOT NULL DEFAULT 0 ,
  `saturday` TINYINT(1) NOT NULL DEFAULT 0 ,
  `sunday` TINYINT(1) NOT NULL DEFAULT 0 ,
  `start_time` TIME NOT NULL ,
  `end_time` TIME NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_participant_id` (`participant_id` ASC) ,
  INDEX `dk_start_time` (`start_time` ASC) ,
  INDEX `dk_end_time` (`end_time` ASC) ,
  CONSTRAINT `fk_availability_participant_id`
    FOREIGN KEY (`participant_id` )
    REFERENCES `cenozo`.`participant` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`consent`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`consent` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`consent` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `participant_id` INT UNSIGNED NOT NULL ,
  `event` ENUM('verbal accept','verbal deny','written accept','written deny','retract','withdraw') NOT NULL ,
  `date` DATE NOT NULL ,
  `note` TEXT NULL DEFAULT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_participant_id` (`participant_id` ASC) ,
  INDEX `dk_event` (`event` ASC) ,
  INDEX `dk_date` (`date` ASC) ,
  CONSTRAINT `fk_consent_participant`
    FOREIGN KEY (`participant_id` )
    REFERENCES `cenozo`.`participant` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`jurisdiction`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`jurisdiction` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`jurisdiction` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `postcode` VARCHAR(7) NOT NULL ,
  `site_id` INT UNSIGNED NOT NULL ,
  `longitude` FLOAT NOT NULL ,
  `latitude` FLOAT NOT NULL ,
  `distance` FLOAT NOT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_postcode` (`postcode` ASC) ,
  INDEX `fk_site_id` (`site_id` ASC) ,
  CONSTRAINT `fk_jurisdiction_site_id`
    FOREIGN KEY (`site_id` )
    REFERENCES `cenozo`.`site` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`phone`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`phone` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`phone` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `person_id` INT UNSIGNED NOT NULL ,
  `address_id` INT UNSIGNED NULL DEFAULT NULL ,
  `active` TINYINT(1) NOT NULL DEFAULT 1 ,
  `rank` INT NOT NULL ,
  `type` ENUM('home','home2','work','work2','mobile','mobile2','other','other2') NOT NULL ,
  `number` VARCHAR(45) NOT NULL ,
  `note` TEXT NULL DEFAULT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_person_id_rank` (`person_id` ASC, `rank` ASC) ,
  INDEX `fk_address_id` (`address_id` ASC) ,
  INDEX `fk_person_id` (`person_id` ASC) ,
  CONSTRAINT `fk_phone_address`
    FOREIGN KEY (`address_id` )
    REFERENCES `cenozo`.`address` (`id` )
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_phone_person`
    FOREIGN KEY (`person_id` )
    REFERENCES `cenozo`.`person` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`quota`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`quota` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`quota` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `region_id` INT UNSIGNED NOT NULL ,
  `site_id` INT UNSIGNED NOT NULL ,
  `gender` ENUM('male','female') NOT NULL ,
  `age_group_id` INT UNSIGNED NOT NULL ,
  `population` INT NOT NULL ,
  `disabled` TINYINT(1) NOT NULL DEFAULT 0 ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_region_id_site_id_gender_age_group_id` (`region_id` ASC, `site_id` ASC, `gender` ASC, `age_group_id` ASC) ,
  INDEX `fk_region_id` (`region_id` ASC) ,
  INDEX `fk_age_group_id` (`age_group_id` ASC) ,
  INDEX `fk_site_id` (`site_id` ASC) ,
  CONSTRAINT `fk_quota_region`
    FOREIGN KEY (`region_id` )
    REFERENCES `cenozo`.`region` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_quota_age_group_id`
    FOREIGN KEY (`age_group_id` )
    REFERENCES `cenozo`.`age_group` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_quota_site_id`
    FOREIGN KEY (`site_id` )
    REFERENCES `cenozo`.`site` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`person_note`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`person_note` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`person_note` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `person_id` INT UNSIGNED NOT NULL ,
  `user_id` INT UNSIGNED NOT NULL ,
  `sticky` TINYINT(1) NOT NULL DEFAULT 0 ,
  `datetime` DATETIME NOT NULL ,
  `note` TEXT NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_person_id` (`person_id` ASC) ,
  INDEX `fk_user_id` (`user_id` ASC) ,
  INDEX `dk_sticky_datetime` (`sticky` ASC, `datetime` ASC) ,
  CONSTRAINT `fk_participant_note_person`
    FOREIGN KEY (`person_id` )
    REFERENCES `cenozo`.`person` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_person_note_user_id`
    FOREIGN KEY (`user_id` )
    REFERENCES `cenozo`.`user` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`service_has_participant`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`service_has_participant` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`service_has_participant` (
  `service_id` INT UNSIGNED NOT NULL ,
  `participant_id` INT UNSIGNED NOT NULL ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `preferred_site_id` INT UNSIGNED NULL DEFAULT NULL ,
  `datetime` DATETIME NULL DEFAULT NULL ,
  PRIMARY KEY (`service_id`, `participant_id`) ,
  INDEX `fk_participant_id` (`participant_id` ASC) ,
  INDEX `fk_service_id` (`service_id` ASC) ,
  INDEX `fk_preferred_site_id` (`preferred_site_id` ASC) ,
  CONSTRAINT `fk_service_has_participant_service_id`
    FOREIGN KEY (`service_id` )
    REFERENCES `cenozo`.`service` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_service_has_participant_participant_id`
    FOREIGN KEY (`participant_id` )
    REFERENCES `cenozo`.`participant` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_service_has_participant_preferred_site_id`
    FOREIGN KEY (`preferred_site_id` )
    REFERENCES `cenozo`.`site` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`event`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`event` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`event` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `name` VARCHAR(45) NOT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_name` (`name` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cenozo`.`participant_event`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`participant_event` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`participant_event` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `participant_id` INT UNSIGNED NOT NULL ,
  `event_id` INT UNSIGNED NOT NULL ,
  `datetime` DATETIME NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_participant_id` (`participant_id` ASC) ,
  INDEX `dk_datetime` (`datetime` ASC) ,
  INDEX `fk_event_id` (`event_id` ASC) ,
  CONSTRAINT `fk_participant_event_participant_id`
    FOREIGN KEY (`participant_id` )
    REFERENCES `cenozo`.`participant` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_participant_event_event_id`
    FOREIGN KEY (`event_id` )
    REFERENCES `cenozo`.`event` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`unique_identifier_pool`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`unique_identifier_pool` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`unique_identifier_pool` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `uid` VARCHAR(45) NOT NULL ,
  PRIMARY KEY (`id`) ,
  UNIQUE INDEX `uq_uid` (`uid` ASC) )
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `cenozo`.`service_has_cohort`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cenozo`.`service_has_cohort` ;

CREATE  TABLE IF NOT EXISTS `cenozo`.`service_has_cohort` (
  `service_id` INT UNSIGNED NOT NULL ,
  `cohort_id` INT UNSIGNED NOT NULL ,
  `update_timestamp` TIMESTAMP NOT NULL ,
  `create_timestamp` TIMESTAMP NOT NULL ,
  `grouping` ENUM('region','jurisdiction') NOT NULL DEFAULT 'region' ,
  PRIMARY KEY (`service_id`, `cohort_id`) ,
  INDEX `fk_cohort_id` (`cohort_id` ASC) ,
  INDEX `fk_service_id` (`service_id` ASC) ,
  CONSTRAINT `fk_service_has_cohort_service_id`
    FOREIGN KEY (`service_id` )
    REFERENCES `cenozo`.`service` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_service_has_cohort_cohort_id`
    FOREIGN KEY (`cohort_id` )
    REFERENCES `cenozo`.`cohort` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`person_first_address`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`person_first_address` (`person_id` INT, `address_id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`person_primary_address`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`person_primary_address` (`person_id` INT, `address_id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`participant_first_address`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`participant_first_address` (`participant_id` INT, `address_id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`participant_primary_address`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`participant_primary_address` (`participant_id` INT, `address_id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`participant_last_consent`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`participant_last_consent` (`participant_id` INT, `consent_id` INT, `event` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`participant_last_written_consent`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`participant_last_written_consent` (`participant_id` INT, `consent_id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`participant_site`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`participant_site` (`service_id` INT, `participant_id` INT, `site_id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`alternate_first_address`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`alternate_first_address` (`alternate_id` INT, `address_id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`alternate_primary_address`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`alternate_primary_address` (`alternate_id` INT, `address_id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`participant_default_site`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`participant_default_site` (`service_id` INT, `participant_id` INT, `site_id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `cenozo`.`participant_preferred_site`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cenozo`.`participant_preferred_site` (`service_id` INT, `participant_id` INT, `site_id` INT);

-- -----------------------------------------------------
-- View `cenozo`.`person_first_address`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`person_first_address` ;
DROP TABLE IF EXISTS `cenozo`.`person_first_address`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`person_first_address` AS
SELECT person_id, id AS address_id
FROM address AS t1
WHERE t1.rank = (
  SELECT MIN( t2.rank )
  FROM address AS t2
  WHERE t2.active
  AND t1.person_id = t2.person_id
  AND CASE MONTH( CURRENT_DATE() )
        WHEN 1 THEN t2.january
        WHEN 2 THEN t2.february
        WHEN 3 THEN t2.march
        WHEN 4 THEN t2.april
        WHEN 5 THEN t2.may
        WHEN 6 THEN t2.june
        WHEN 7 THEN t2.july
        WHEN 8 THEN t2.august
        WHEN 9 THEN t2.september
        WHEN 10 THEN t2.october
        WHEN 11 THEN t2.november
        WHEN 12 THEN t2.december
        ELSE 0 END = 1
  GROUP BY t2.person_id );

-- -----------------------------------------------------
-- View `cenozo`.`person_primary_address`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`person_primary_address` ;
DROP TABLE IF EXISTS `cenozo`.`person_primary_address`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`person_primary_address` AS
SELECT person_id, id AS address_id
FROM address AS t1
WHERE t1.rank = (
  SELECT MIN( t2.rank )
  FROM address AS t2, region
  WHERE t2.region_id = region.id
  AND t2.active
  AND region.site_id IS NOT NULL
  AND t1.person_id = t2.person_id
  GROUP BY t2.person_id );

-- -----------------------------------------------------
-- View `cenozo`.`participant_first_address`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`participant_first_address` ;
DROP TABLE IF EXISTS `cenozo`.`participant_first_address`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`participant_first_address` AS
SELECT participant.id AS participant_id, address_id
FROM person_first_address, participant
WHERE person_first_address.person_id = participant.person_id;

-- -----------------------------------------------------
-- View `cenozo`.`participant_primary_address`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`participant_primary_address` ;
DROP TABLE IF EXISTS `cenozo`.`participant_primary_address`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`participant_primary_address` AS
SELECT participant.id AS participant_id, address_id
FROM person_primary_address, participant
WHERE person_primary_address.person_id = participant.person_id;

-- -----------------------------------------------------
-- View `cenozo`.`participant_last_consent`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`participant_last_consent` ;
DROP TABLE IF EXISTS `cenozo`.`participant_last_consent`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`participant_last_consent` AS
SELECT participant.id AS participant_id, t1.id AS consent_id, t1.event AS event
FROM participant
LEFT JOIN consent t1
ON participant.id = t1.participant_id
AND t1.date = (
  SELECT MAX( t2.date )
  FROM consent t2
  WHERE t1.participant_id = t2.participant_id
)
GROUP BY participant.id;

-- -----------------------------------------------------
-- View `cenozo`.`participant_last_written_consent`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`participant_last_written_consent` ;
DROP TABLE IF EXISTS `cenozo`.`participant_last_written_consent`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`participant_last_written_consent` AS
SELECT participant_id, id AS consent_id
FROM consent AS t1
WHERE t1.date = (
  SELECT MAX( t2.date )
  FROM consent AS t2
  WHERE t1.participant_id = t2.participant_id
  AND event LIKE 'written %'
  GROUP BY t2.participant_id );

-- -----------------------------------------------------
-- View `cenozo`.`participant_site`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`participant_site` ;
DROP TABLE IF EXISTS `cenozo`.`participant_site`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`participant_site` AS
SELECT service.id AS service_id,
       participant.id AS participant_id,
       IF(
         ISNULL( service_has_participant.preferred_site_id ),
         IF(
           service_has_cohort.grouping = 'jurisdiction',
           jurisdiction.site_id,
           region.site_id
         ),
         service_has_participant.preferred_site_id
       ) AS site_id
FROM service
CROSS JOIN participant
JOIN service_has_cohort ON service.id = service_has_cohort.service_id
AND service_has_cohort.cohort_id = participant.cohort_id
LEFT JOIN participant_primary_address ON participant.id = participant_primary_address.participant_id
LEFT JOIN address ON participant_primary_address.address_id = address.id
LEFT JOIN jurisdiction ON address.postcode = jurisdiction.postcode
LEFT JOIN region ON address.region_id = region.id
LEFT JOIN service_has_participant ON service.id = service_has_participant.service_id
AND service_has_participant.participant_id = participant.id;

-- -----------------------------------------------------
-- View `cenozo`.`alternate_first_address`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`alternate_first_address` ;
DROP TABLE IF EXISTS `cenozo`.`alternate_first_address`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`alternate_first_address` AS
SELECT alternate.id AS alternate_id, address_id
FROM person_first_address, alternate
WHERE person_first_address.person_id = alternate.person_id;

-- -----------------------------------------------------
-- View `cenozo`.`alternate_primary_address`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`alternate_primary_address` ;
DROP TABLE IF EXISTS `cenozo`.`alternate_primary_address`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`alternate_primary_address` AS
SELECT alternate.id AS alternate_id, address_id
FROM person_primary_address, alternate
WHERE person_primary_address.person_id = alternate.person_id;

-- -----------------------------------------------------
-- View `cenozo`.`participant_default_site`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`participant_default_site` ;
DROP TABLE IF EXISTS `cenozo`.`participant_default_site`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`participant_default_site` AS
SELECT service.id AS service_id,
       participant.id AS participant_id,
       IF(
         service_has_cohort.grouping = 'jurisdiction',
         jurisdiction.site_id,
         region.site_id
       ) AS site_id
FROM service
CROSS JOIN participant
JOIN service_has_cohort ON service.id = service_has_cohort.service_id
AND service_has_cohort.cohort_id = participant.cohort_id
LEFT JOIN participant_primary_address ON participant.id = participant_primary_address.participant_id
LEFT JOIN address ON participant_primary_address.address_id = address.id
LEFT JOIN jurisdiction ON address.postcode = jurisdiction.postcode
LEFT JOIN region ON address.region_id = region.id;

-- -----------------------------------------------------
-- View `cenozo`.`participant_preferred_site`
-- -----------------------------------------------------
DROP VIEW IF EXISTS `cenozo`.`participant_preferred_site` ;
DROP TABLE IF EXISTS `cenozo`.`participant_preferred_site`;
USE `cenozo`;
CREATE OR REPLACE VIEW `cenozo`.`participant_preferred_site` AS
SELECT service.id AS service_id,
       participant.id AS participant_id,
       service_has_participant.preferred_site_id site_id
FROM service
CROSS JOIN participant
JOIN service_has_cohort ON service.id = service_has_cohort.service_id
AND service_has_cohort.cohort_id = participant.cohort_id
LEFT JOIN service_has_participant ON service.id = service_has_participant.service_id
AND service_has_participant.participant_id = participant.id;
USE `cenozo`;

DELIMITER $$

USE `cenozo`$$
DROP TRIGGER IF EXISTS `cenozo`.`remove_uid_from_pool` $$
USE `cenozo`$$


CREATE TRIGGER remove_uid_from_pool BEFORE
INSERT ON participant
FOR EACH ROW BEGIN
  DELETE FROM unique_identifier_pool WHERE uid = new.uid;
END;$$


DELIMITER ;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
