<?php
/**
 * write.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all write services
 */
class write extends service
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();

    // modify ???? based on the module
    $leaf_subject = $this->get_leaf_subject();
    if( !is_null( $leaf_subject ) )
    {
      $module_class = sprintf( 'service\%s\module', $leaf_subject );
      if( lib::class_exists( $module_class ) )
      {
        $module_class_name = lib::get_class_name( $module_class );
        $module_class_name::modify_write_parameters();
      }
    }
  }
}
