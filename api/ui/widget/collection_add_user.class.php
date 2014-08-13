<?php
/**
 * collection_add_user.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget collection add_user
 */
class collection_add_user extends base_add_list
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $name The name of the user.
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'collection', 'user', $args );
    $this->set_heading( '' );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  public function prepare()
  {
    parent::prepare();

    $this->list_widget->set_heading( 'Choose Users To Grant Access To The Collection' );
  }

  /**
   * Overrides the user list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_user_count( $modifier = NULL )
  {
    $user_class_name = lib::get_class_name( 'database\user' );

    $existing_user_ids = array();
    foreach( $this->get_record()->get_user_list() as $db_user )
      $existing_user_ids[] = $db_user->id;

    if( 0 < count( $existing_user_ids ) )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', 'NOT IN', $existing_user_ids );
    }

    return $user_class_name::count( $modifier );
  }

  /**
   * Overrides the user list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_user_list( $modifier = NULL )
  {
    $user_class_name = lib::get_class_name( 'database\user' );

    $existing_user_ids = array();
    foreach( $this->get_record()->get_user_list() as $db_user )
      $existing_user_ids[] = $db_user->id;

    if( 0 < count( $existing_user_ids ) )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', 'NOT IN', $existing_user_ids );
    }

    return $user_class_name::select( $modifier );
  }
}
