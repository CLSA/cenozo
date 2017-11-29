<?php
/**
 * users.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database\limesurvey;
use cenozo\lib, cenozo\log;

/**
 * users: record
 */
class users extends record
{
  protected static $primary_key_name = 'uid';
}
