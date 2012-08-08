<?php
/**
 * relationship.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * This is an enum class which defines all types of database table relationships.
 */
class relationship
{
  const NONE = 0;
  const ONE_TO_ONE = 1;
  const ONE_TO_MANY = 2;
  const MANY_TO_MANY = 3;
}
?>
