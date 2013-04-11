<?php
/**
 * service_add_role.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget service add_role
 */
class service_add_role extends base_add_list
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $name The name of the role.
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'service', 'role', $args );
  }

  /**
   * Overrides the role list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_role_count( $modifier = NULL )
  {
    $role_class_name = lib::get_class_name( 'database\role' );

    $existing_role_ids = array();
    foreach( $this->get_record()->get_role_list() as $db_role )
      $existing_role_ids[] = $db_role->id;

    if( 0 < count( $existing_role_ids ) )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', 'NOT IN', $existing_role_ids );
    }

    return $role_class_name::count( $modifier );
  }

  /**
   * Overrides the role list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_role_list( $modifier = NULL )
  {
    $role_class_name = lib::get_class_name( 'database\role' );

    $existing_role_ids = array();
    foreach( $this->get_record()->get_role_list() as $db_role )
      $existing_role_ids[] = $db_role->id;

    if( 0 < count( $existing_role_ids ) )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', 'NOT IN', $existing_role_ids );
    }

    return $role_class_name::select( $modifier );
  }
}
