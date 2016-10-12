<?php
/**
 * base_overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject to retrieve the primary information from.
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $db_overview )
  {
    $class_name = is_null( $db_overview )
                ? NULL
                : is_a( $db_overview, lib::get_class_name( 'database\record' ) )
                ? $db_overview->get_class_name()
                : 'not a database\overview';
    if( 'overview' != $class_name )
      throw lib::create( 'exception\argument', 'db_overview (class)', $class_name, __METHOD__ );
    $this->db_overview = $db_overview;
  }

  /**
   * TODO: document
   */
  public function get_data()
  {
    if( is_null( $this->root_node ) )
    {
      $this->root_node = lib::create( 'business\overview\node', NULL );
      $this->build();
    }
    
    // transform node tree into a simple associative array
    return $this->root_node->get_data();
  }

  /**
   * Abstract function which generates the overview's data
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  abstract protected function build();

  /**
   * TODO: document
   * leave parent_id null when adding a root item
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
   * TODO: document
   */
  protected $root_node = NULL;

  /**
   * The overview active record associated with this overview
   * @var database\overview $db_overview
   * @access protected
   */
  protected $db_overview = NULL;
}
