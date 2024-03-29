<?php
/**
 * base_overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business\overview;
use cenozo\lib, cenozo\log;

/**
 * Base class for all overviews.
 * @abstract
 */
abstract class base_overview
{
  /**
   * Constructor
   * 
   * @param string $subject The subject to retrieve the primary information from.
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $db_overview )
  {
    $class_name = 'not a database\overview';
    if( is_null( $db_overview ) ) $class_name = NULL;
    else if( is_a( $db_overview, lib::get_class_name( 'database\record' ) ) )
      $class_name = $db_overview->get_class_name();
    if( 'overview' != $class_name )
      throw lib::create( 'exception\argument', 'db_overview (class)', $class_name, __METHOD__ );
    $this->db_overview = $db_overview;
  }

  /**
   * Used to render the overview
   */
  public function get_data( $modifier = NULL, $flat = false )
  {
    if( is_null( $this->root_node ) )
    {
      $this->root_node = lib::create( 'business\overview\node', NULL );
      $this->build( $modifier );
    }
    
    // transform node tree into an associative array
    $data = $this->root_node->get_data();

    // flatten associative array, if requested
    if( $flat )
    {
      $obj = new \stdClass();
      $obj->last_label = false;
      $obj->category_list = [];
      foreach( $data['value'] as $category ) $obj->category_list[] = $category['label'];
      $obj->key_data = array( '' );
      $obj->flat_data = array( array() );
      $function = function( $value, $key ) use ( $obj )
      {
        if( 'label' == $key && in_array( $value, $obj->category_list ) )
        {
          $obj->key_data[] = $value;
          $obj->flat_data[] = array();
        }
        else
        {
          if( 'label' == $key )
          {
            // add a blank value if there are two labels in a row (node with children instead of a value)
            if( $obj->last_label ) $obj->flat_data[count($obj->flat_data)-1][] = '';
            if( 2 == count( $obj->flat_data ) ) $obj->flat_data[0][] = $value;
            $obj->last_label = true;
          }
          else
          {
            $obj->flat_data[count($obj->flat_data)-1][] = $value;
            $obj->last_label = false;
          }
        }
      };
      array_walk_recursive( $data['value'], $function );

      // now transpose the data
      $data = array();
      foreach( $obj->flat_data as $col => $column )
      {
        $data[] = array();
        foreach( $column as $row => $cell ) $data[$row++][$obj->key_data[$col]] = $cell;
      }
    }

    return $data;
  }

  /**
   * Abstract function which generates the overview's data
   * @param database\modifier $modifier A modifier to be applied by the implementing class
   * @access protected
   */
  abstract protected function build( $modifier = NULL );

  /**
   * Adds a child item to a node (or adds a root node if no parent is provided)
   * 
   * @param business\overview\node $parent_node The parent node (set to NULL when adding a root item)
   * @param string $label The item's label
   * @param mixed $value The item's value
   */
  protected function add_item( $parent_node, $label, $value = NULL )
  {
    if( is_null( $parent_node ) ) $parent_node = $this->root_node;
    if( $parent_node->is_leaf() ) throw new Exception( 'Tried to add overview node to leaf node.' );
    return $parent_node->add_child( new node( $label, $value ) );
  }

  /**
   * Convenience method
   */
  protected function add_root_item( $label, $value = NULL )
  {
    return $this->add_item( NULL, $label, $value );
  }

  /**
   * The overview's root node
   */
  protected $root_node = NULL;

  /**
   * The overview active record associated with this overview
   * @var database\overview $db_overview
   * @access protected
   */
  protected $db_overview = NULL;
}
