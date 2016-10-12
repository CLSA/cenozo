<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\overview;
use cenozo\lib, cenozo\log;

/**
 * The base class of all get (single-resource) services
 */
class get extends \cenozo\service\get
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    $data = NULL;

    // add the overview's data
    $db_overview = $this->get_leaf_record();
    if( !is_null( $db_overview ) )
    {
      $data = $db_overview->get_column_values( $this->select, $this->modifier );
      $data['data'] = $db_overview->get_executer()->get_data();
    }

    $this->set_data( $data );
  }
}
