<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\quota;
use cenozo\lib, cenozo\log;

/**
 * The base class of all query (collection-based get) services
 */
class query extends \cenozo\service\query
{
  /**
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    // add the age_group range
    $this->select->add_column( 'CONCAT( age_group.lower, " to ", age_group.upper )', 'age_group_range', false );
    $this->modifier->join( 'age_group', 'quota.age_group_id', 'age_group.id' );
  }
}
