<?php
/**
 * base_overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business\overview;
use cenozo\lib, cenozo\log;

/**
 * Class used by base_overview to help define nested overview data
 */
class node
{
  /**
   * Constructor
   * 
   * @access public
   */
  public function __construct( $label, $value = NULL )
  {
    $this->label = $label;
    $this->value = is_null( $value ) ? array() : $value;
  }

  /**
   * Clone method
   * 
   * @access public
   */
  public function __clone()
  {
    // create a deep-copy of all child nodes
    if( !$this->is_leaf() )
      for( $index = 0; $index < count( $this->value ); $index++ )
        $this->value[$index] = clone $this->value[$index];
  }

  /**
   * Determines whether the node has no children
   */
  public function is_leaf()
  {
    return !is_array( $this->value );
  }

  /**
   * Gets the node's label
   */
  public function get_label()
  {
    return $this->label;
  }

  /**
   * Sets the node's label
   */
  public function set_label( $label )
  {
    $this->label = $label;
  }

  /**
   * Gets the node's value
   */
  public function get_value()
  {
    if( !$this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Tried to get value of non-leaf node.', __METHOD__ );
    return $this->value;
  }

  /**
   * Sets the node's value
   */
  public function set_value( $value )
  {
    if( !$this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Tried to set value of non-leaf node.', __METHOD__ );
    $this->value = $value;
  }

  /**
   * Adds a child to the node
   */
  public function add_child( $node, $first = false )
  {
    if( $this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Tried to add a child to a leaf node.', __METHOD__ );

    if( !is_null( $node ) )
    {
      if( $first ) array_unshift( $this->value, $node );
      else array_push( $this->value, $node );
    }
    return $node;
  }

  /**
   * Removes a child from the node
   */
  public function remove_child( $index )
  {
    if( $this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Tried to remove a child from a leaf node.', __METHOD__ );

    array_splice( $this->value, $index, 1 );
  }

  /**
   * Removes a child from the node based on the child's label
   */
  public function remove_child_by_label( $label )
  {
    if( $this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Tried to remove a child from a leaf node.', __METHOD__ );

    $this->value = array_filter( $this->value, function( $node ) use ( $label ) {
      return ( is_string( $label ) && $label != $node->label ) ||
             ( is_array( $label ) && !in_array( $node->label, $label ) );
    } );
  }

  /**
   * Removes all empty children
   */
  public function remove_empty_children()
  {
    if( $this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Tried to remove empty children of a leaf node.', __METHOD__ );
    $removed_label_list = array();
    $this->value = array_filter( $this->value, function( $node ) use( &$removed_label_list ) {
      $keep = (bool)$node->value;
      if( !$keep ) $removed_label_list[] = $node->label;
      return $keep;
    } );
    return $removed_label_list;
  }

  /**
   * Finds a node based on its label
   */
  public function find_node( $search_label )
  {
    if( !$this->is_leaf() ) 
    {   
      foreach( $this->value as $node )
      {   
        $found_node = $search_label == $node->label ? $node : $node->find_node( $search_label );
        if( !is_null( $found_node ) ) return $found_node;
      }   
    }   
    return NULL;
  }

  /**
   * Sorts the node's children based on a provided function
   */
  public function sort_children( $function )
  {
    if( $this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Tried to sort children of a leaf node.', __METHOD__ );
    if( !usort( $this->value, $function ) )
      throw lib::create( 'exception\runtime', 'Node sort function failed.', __METHOD__ );
  }

  /**
   * Runs the provided function on all child nodes
   */
  public function each( $function )
  {
    if( $this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Called each on leaf node.', __METHOD__ );
    array_walk( $this->value, $function );
  }

  public function reverse_child_order()
  {
    if( $this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Tried to reverse child order of a leaf node.', __METHOD__ );
    $this->value = array_reverse( $this->value );
  }

  /**
   * Generates and returns this node's summary node
   */
  public function get_summary_node()
  {
    if( $this->is_leaf() )
      throw lib::create( 'exception\runtime', 'Tried to get summary of leaf node.', __METHOD__ );

    $summary_node = NULL;
    if( 0 < count( $this->value ) )
    {
      foreach( $this->value as $node )
      {
        if( is_null( $summary_node ) )
        {
          // clone the first item in the list
          $summary_node = clone $node;
          $summary_node->label = 'Summary';
        }
        else
        {
          // add values for this item to the summary node
          $summary_node->add_values( $node );
        }
      }
    }

    return $summary_node;
  }

  /**
   * Returns this node's data
   */
  public function get_data()
  {
    $value = NULL;
    if( !$this->is_leaf() )
    {
      $value = array();
      foreach( $this->value as $node )
      {
        $data = $node->get_data();
        if( !is_null( $data ) ) $value[] = $node->get_data();
      }
    }
    else // is leaf
    {
      $value = (string) $this->value;
    }

    return is_array( $value ) && 0 == count( $value ) ? NULL : array( 'label' => $this->label, 'value' => $value );
  }

  /**
   * Internal method
   */
  private function add_values( $node )
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( $this->is_leaf() )
    {
      if( !$node->is_leaf() )
        throw lib::create( 'exception\runtime', 'Node mismatch found while adding node values.', __METHOD__ );
      if( $util_class_name::string_matches_int( $this->value ) )
        $this->value += $node->value;
      else $this->value .= ','.$node->value;
    }
    else
    {
      if( $node->is_leaf() )
        throw lib::create( 'exception\runtime', 'Node mismatch found while adding node values.', __METHOD__ );

      foreach( $node->value as $copy_child_node )
      {
        $found = false;
        foreach( $this->value as $this_child_node )
        {
          if( $this_child_node->label == $copy_child_node->label )
          {
            $this_child_node->add_values( $copy_child_node );
            $found = true;
            break;
          }
        }
        if( !$found ) $this->add_child( clone $copy_child_node );
      }
    }
  }

  /**
   * The node's label
   */
  private $label = NULL;

  /**
   * The node's value
   */
  private $value = NULL;
}
