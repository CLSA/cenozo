<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all query (collection-based get) services
 */
class query extends read
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( 'GET', $path, $args );
  }

  /**
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();

    $setting_manager = lib::create( 'business\setting_manager' );
    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    $leaf_subject = $this->get_leaf_subject();

    if( !is_null( $leaf_subject ) )
    {
      $relationship = $this->get_leaf_parent_relationship();
      if( !is_null( $relationship ) && $relationship_class_name::NONE == $relationship )
      {
        $this->status->set_code( 404 );
      }
      else if( $this->get_argument( 'choosing', false ) )
      { // process "choosing" mode
        if( $relationship_class_name::MANY_TO_MANY !== $relationship )
        { // must have table1/<id>/table2 where table1 N-to-N table2
          $this->status->set_code( 400 );
          throw lib::create( 'exception\runtime',
            'Many-to-many relationship not found for choosing mode',
            __METHOD__ );
        }
        else
        {
          // create a sub-query identifying chosen records
          $parent_record = $this->get_parent_record();
          $table_name = $parent_record::get_joining_table_name( $leaf_subject );
          $select = lib::create( 'database\select' );
          $select->from( $table_name );
          $select->add_column( 'COUNT(*)', 'total', false );
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( sprintf( '%s_id', $parent_record::get_table_name() ), '=', $parent_record->id );
          $modifier->where( sprintf( '%s_id', $leaf_subject ), '=', sprintf( '%s.id', $leaf_subject ), false );
          $sub_query = sprintf( '( %s %s )', $select->get_sql(), $modifier->get_sql() );
          $this->select->add_column( $sub_query, 'chosen', false );
        }
      }
    }

    if( is_null( $this->modifier->get_limit() ) )
    {
      // query limit of 100 needs to be hard-coded (really, it needs to be evenly divided by the number of
      // items per page shown by the web UI)
      $this->modifier->limit( 100 );
      $assert_offset = $this->get_argument( 'assert_offset', NULL );
      // Set the offset such that the assert-offset will fall inside the query-limit
      if( !is_null( $assert_offset ) )
        $this->modifier->offset( 100 * ( ceil( $assert_offset / 100 ) - 1 ) );
    }
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    // get the list of the LAST collection
    $leaf_subject = $this->get_leaf_subject();
    if( !is_null( $leaf_subject ) )
    {
      $record_class_name = $this->get_leaf_record_class_name();
      $this->headers['Limit'] = $this->modifier->get_limit();
      $this->headers['Offset'] = $this->modifier->get_offset();
      $this->headers['Total'] = $this->get_record_count();
      if( !$this->get_argument( 'count', false ) ) $this->set_data( $this->get_record_list() );
    }
  }

  /**
   * Extends parent method
   */
  protected function get_record_count()
  {
    $parent_record = $this->get_parent_record();
    $record_class_name = $this->get_leaf_record_class_name();
    $parent_record_method = sprintf( 'get_%s_count', $this->get_leaf_subject() );
    $modifier = clone $this->modifier;

    // find aliases in the select and translate them in the modifier
    $this->select->apply_aliases_to_modifier( $modifier );

    return is_null( $parent_record ) || $this->get_argument( 'choosing', false ) ?
           $record_class_name::count( $modifier ) :
           $parent_record->$parent_record_method( $modifier );
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $parent_record = $this->get_parent_record();
    $record_class_name = $this->get_leaf_record_class_name();
    $parent_record_method = sprintf( 'get_%s_list', $this->get_leaf_subject() );
    $modifier = clone $this->modifier;

    // find aliases in the select and translate them in the modifier
    $this->select->apply_aliases_to_modifier( $modifier );

    $list = is_null( $parent_record ) || $this->get_argument( 'choosing', false )
          ? $record_class_name::select( $this->select, $modifier )
          : $parent_record->$parent_record_method( $this->select, $modifier );

    // format the chosen column as a boolean
    if( $this->get_argument( 'choosing', false ) )
      foreach( $list as $index => $row ) $list[$index]['chosen'] = 1 == $row['chosen'];

    return $list;
  }
}
