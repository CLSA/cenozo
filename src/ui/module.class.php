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
   * TODO: document
   */
  public function __construct( $subject )
  {
    $this->subject = $subject;
  }

  /**
   * TODO: document
   */
  public function get_subject()
  {
    return $this->subject;
  }

  /**
   * TODO: document
   */
  public function has_action( $name )
  {
    return array_key_exists( $name, $this->action_list );
  }

  /**
   * TODO: document
   */
  public function add_action( $name, $query = '' )
  {
    $this->action_list[$name] = $query;
  }

  /**
   * TODO: document
   */
  public function remove_action( $name )
  {
    if( array_key_exists( $name, $this->action_list ) ) unset( $this->action_list[$name] );
  }

  /**
   * TODO: document
   */
  public function remove_all_actions()
  {
    $this->action_list = array();
  }

  /**
   * TODO: document
   */
  public function get_action_query( $name )
  {
    return array_key_exists( $name, $this->action_list ) ? $this->action_list[$name] : NULL;
  }

  /**
   * TODO: document
   */
  public function prepend_action_query( $name, $prepend )
  {
    if( $this->has_action( $name ) ) $this->add_action( $name, $prepend.$this->action_list[$name] );
  }

  /**
   * TODO: document
   */
  public function append_action_query( $name, $append )
  {
    if( $this->has_action( $name ) ) $this->add_action( $name, $this->action_list[$name].$append );
  }

  /**
   * TODO: document
   * @param string|int $before May be the name of an existing child or an index
   */
  public function add_child( $name, $before = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );

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
   * TODO: document
   * @param string|int $before May be the name of an existing choose or an index
   */
  public function add_choose( $name, $before = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );

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
   * TODO: document
   */
  public function set_list_menu( $list_menu )
  {
    $this->list_menu = $list_menu;
  }

  /**
   * TODO: document
   */
  public function get_list_menu()
  {
    return $this->list_menu;
  }

  /**
   * TODO: document
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
   * TODO: document
   */
  private $subject;

  /**
   * TODO: document
   */
  private $action_list = array();

  /**
   * TODO: document
   */
  private $child_list = array();

  /**
   * TODO: document
   */
  private $choose_list = array();

  /**
   * TODO: document
   */
  private $list_menu = false;
}
