-- MySQL dump 10.15  Distrib 10.0.38-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: patrick_cenozo
-- ------------------------------------------------------
-- Server version	10.0.38-MariaDB-0ubuntu0.16.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `script`
--

DROP TABLE IF EXISTS `script`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `script` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `update_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_timestamp` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `name` varchar(255) NOT NULL,
  `started_event_type_id` int(10) unsigned DEFAULT NULL,
  `finished_event_type_id` int(10) unsigned DEFAULT NULL,
  `sid` int(11) NOT NULL,
  `repeated` tinyint(1) NOT NULL DEFAULT '0',
  `supporting` tinyint(1) NOT NULL DEFAULT '0',
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_name` (`name`),
  UNIQUE KEY `uq_sid` (`sid`),
  KEY `fk_started_event_type_id` (`started_event_type_id`),
  KEY `fk_finished_event_type_id` (`finished_event_type_id`),
  CONSTRAINT `fk_script_finished_event_type_id` FOREIGN KEY (`finished_event_type_id`) REFERENCES `event_type` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_script_started_event_type_id` FOREIGN KEY (`started_event_type_id`) REFERENCES `event_type` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `script`
--

LOCK TABLES `script` WRITE;
/*!40000 ALTER TABLE `script` DISABLE KEYS */;
INSERT INTO `script` VALUES (1,'2016-11-06 16:47:33','0000-00-00 00:00:00','Master Withdrawal Script',NULL,NULL,99144,0,1,NULL),(5,'2016-11-06 17:09:15','0000-00-00 00:00:00','Master F1 Consent Verification',40,41,281973,0,0,NULL),(6,'2016-11-06 17:09:15','0000-00-00 00:00:00','Master F1 Intro',NULL,NULL,198291,1,0,NULL),(7,'2016-11-06 17:09:15','0000-00-00 00:00:00','Comprehensive FU1 Schedule DCS Visit Script',NULL,NULL,923936,1,0,NULL),(10,'2016-11-06 17:22:28','0000-00-00 00:00:00','Tracking MC1 Administration Script',43,44,42891,0,0,NULL),(11,'2016-11-06 17:22:28','0000-00-00 00:00:00','Tracking MC1 Main Script',45,46,12851,0,0,NULL),(13,'2016-11-06 17:22:28','0000-00-00 00:00:00','Tracking MC1 Introduction Script',NULL,NULL,15726,1,0,NULL),(15,'2016-11-06 17:28:48','0000-00-00 00:00:00','Tracking F1 Main Part 1',50,51,295849,0,0,NULL),(16,'2016-11-06 17:28:48','0000-00-00 00:00:00','Tracking F1 Main Part 2',52,53,715739,0,0,NULL),(17,'2016-11-06 17:28:48','0000-00-00 00:00:00','Tracking F1 Main Part 3',54,55,854997,0,0,NULL),(19,'2019-04-21 23:27:29','0000-00-00 00:00:00','Master Proxy Initiation',NULL,NULL,818761,0,1,NULL),(20,'2018-04-02 15:43:49','2018-04-02 15:43:49','Comprehensive F2 Schedule DCS Visit Script',NULL,NULL,474394,1,0,NULL),(21,'2018-04-02 15:44:15','2018-04-02 15:44:15','Master F2 Consent Verification',72,73,865795,0,0,NULL),(22,'2018-04-02 15:45:59','2018-04-02 15:45:59','Master F2 Intro',NULL,NULL,568998,1,0,NULL),(23,'2018-06-12 04:19:37','2018-06-12 04:19:37','Tracking F2 Main Part 1',74,75,357653,0,0,NULL),(24,'2018-06-12 04:19:44','2018-06-12 04:19:44','Tracking F2 Main Part 2',76,77,126673,0,0,NULL),(25,'2018-06-12 04:19:53','2018-06-12 04:19:53','Tracking F2 Main Part 3',78,79,155575,0,0,NULL),(26,'2018-08-29 05:01:02','2018-08-29 05:01:02','Master Decedent Questionnaire',99,100,171639,0,1,NULL),(27,'2019-02-08 19:51:37','2018-12-10 19:24:56','Tracking F1 Quality Control',101,102,241987,0,0,NULL),(28,'2018-12-10 19:25:20','2018-12-10 19:25:20','Tracking F2 Quality Control',103,104,917399,0,1,NULL);
/*!40000 ALTER TABLE `script` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-11-07 11:19:15
