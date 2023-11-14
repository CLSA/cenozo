<?php
/**
 * module.class.php
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * Defines a module's properties
 */
class module extends \cenozo\base_object
{
  /**
   * Constructor
   * 
   * @param string $subject The module's subject
   */
  public function __construct( $subject )
  {
    $this->subject = $subject;
  }

  /**
   * Gets the module's subject
   */
  public function get_subject()
  {
    return $this->subject;
  }

  /**
   * Determines whether the module has a particular action
   * 
   * @param string $name The name of the action to search for
   */
  public function has_action( $name )
  {
    return array_key_exists( $name, $this->action_list );
  }

  /**
   * Adds a new action to the module (replacing if one by the same name already exists)
   * 
   * @param string $name The name of the action
   * @param string $query The action's query parameter(s)
   */
  public function add_action( $name, $query = '' )
  {
    $this->action_list[$name] = $query;
  }

  /**
   * Removes an action from the module by name
   * 
   * @param string $name The name of the action
   */
  public function remove_action( $name )
  {
    if( array_key_exists( $name, $this->action_list ) ) unset( $this->action_list[$name] );
  }

  /**
   * Removes all actions from the module
   */
  public function remove_all_actions()
  {
    $this->action_list = array();
  }

  /**
   * Gets an action's query parameter(s)
   * 
   * @param string $name The name of the action
   */
  public function get_action_query( $name )
  {
    return array_key_exists( $name, $this->action_list ) ? $this->action_list[$name] : NULL;
  }

  /**
   * Prepends a query parameter to an existing action
   * 
   * @param string $name The name of the action
   * @param string $prepend The query parameter to prepend to the action
   */
  public function prepend_action_query( $name, $prepend )
  {
    if( $this->has_action( $name ) ) $this->add_action( $name, $prepend.$this->action_list[$name] );
  }

  /**
   * Appends a query parameter to an existing action
   * 
   * @param string $name The name of the action
   * @param string $append The query parameter to append to the action
   */
  public function append_action_query( $name, $append )
  {
    if( $this->has_action( $name ) ) $this->add_action( $name, $this->action_list[$name].$append );
  }

  /**
   * Adds (or replaces) a child to the module
   * 
   * @param string $name The child's subject name
   * @param string|int $before May be the name of an existing child or an index
   */
  public function add_child( $name, $before = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $service_class_name = lib::get_class_name( 'database\service' );

    $db_role = lib::create( 'business\session' )->get_role();
    $db_service = $service_class_name::get_unique_record(
      array( 'method', 'subject', 'resource' ),
      array( 'GET', $name, false )
    );

    // if the role doesn't have query access to the module then ignore it
    if( !is_null( $db_service ) && $db_service->restricted )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'service.subject', '=', $name );
      $modifier->where( 'service.method', '=', 'GET' );
      $modifier->where( 'service.resource', '=', 0 );
      if( 0 == $db_role->get_service_count( $modifier ) ) return;
    }

    // remove the child if it already exists
    $index = array_search( $name, $this->child_list );
    if( false !== $index ) array_splice( $this->child_list, $index, 1 );

    if( !is_null( $before ) )
    {
      if( $util_class_name::string_matches_int( $before ) )
      { // an index was provided
        if( count( $this->child_list ) >= $before )
        {
          array_splice( $this->child_list, $before, 0, $name );
        }
        else
        {
          $this->child_list[] = $name;
        }
      }
      else // a child name was provided
      {
        $index = array_search( $before, $this->child_list );
        if( false !== $index )
        {
          array_splice( $this->child_list, $index, 0, $name );
        }
        else
        {
          $this->child_list[] = $name;
        }
      }
    }
    else
    {
      $this->child_list[] = $name;
    }
  }

  /**
   * Removes a child from the module
   * 
   * @param string $name The child's subject name
   */
  public function remove_child( $name )
  {
    $index = array_search( $name, $this->child_list );
    if( false !== $index ) array_splice( $this->child_list, $index, 1 );
  }

  /**
   * Adds (or replaces) a choose to the module
   * 
   * @param string|int $before May be the name of an existing choose or an index
   */
  public function add_choose( $name, $before = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $service_class_name = lib::get_class_name( 'database\service' );

    $db_role = lib::create( 'business\session' )->get_role();
    $db_service = $service_class_name::get_unique_record(
      array( 'method', 'subject', 'resource' ),
      array( 'GET', $name, false )
    );

    // if the role doesn't have query access to the module then ignore it
    if( !is_null( $db_service ) && $db_service->restricted )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'service.subject', '=', $name );
      $modifier->where( 'service.method', '=', 'GET' );
      $modifier->where( 'service.resource', '=', 0 );
      if( 0 == $db_role->get_service_count( $modifier ) ) return;
    }

    // remove the choose if it already exists
    $index = array_search( $name, $this->choose_list );
    if( false !== $index ) array_splice( $this->choose_list, $index, 1 );

    if( !is_null( $before ) )
    {
      if( $util_class_name::string_matches_int( $before ) )
      { // an index was provided
        if( count( $this->choose_list ) >= $before )
        {
          array_splice( $this->choose_list, $before, 0, $name );
        }
        else
        {
          $this->choose_list[] = $name;
        }
      }
      else // a choose name was provided
      {
        $index = array_search( $before, $this->choose_list );
        if( false !== $index )
        {
          array_splice( $this->choose_list, $index, 0, $name );
        }
        else
        {
          $this->choose_list[] = $name;
        }
      }
    }
    else
    {
      $this->choose_list[] = $name;
    }
  }

  /**
   * Removes a choose from the module
   * 
   * @param string $name The choose's subject name
   */
  public function remove_choose( $name )
  {
    $index = array_search( $name, $this->choose_list );
    if( false !== $index ) array_splice( $this->choose_list, $index, 1 );
  }

  /**
   * Sets whether to show the module in the main list menu
   * 
   * @param boolean $list_menu
   */
  public function set_list_menu( $list_menu )
  {
    $this->list_menu = $list_menu;
  }

  /**
   * Gets whether the module will show in the main list menu
   */
  public function get_list_menu()
  {
    return $this->list_menu;
  }

  /**
   * Returns the module as an associative array
   */
  public function as_array()
  {
    return array(
      'actions' => $this->action_list,
      'children' => $this->child_list,
      'choosing' => $this->choose_list,
      'list_menu' => $this->list_menu
    );
  }

  /**
   * The module's subject
   * @var string
   */
  private $subject;

  /**
   * The module's action list
   * @var array
   */
  private $action_list = array();

  /**
   * The module's child list
   * @var array
   */
  private $child_list = array();

  /**
   * The module's choose list
   * @var array
   */
  private $choose_list = array();

  /**
   * The module's list menu
   */
  private $list_menu = false;
}
