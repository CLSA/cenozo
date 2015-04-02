<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all query (collection-based get) services
 */
class query extends service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the service.
   * @access public
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( 'GET', $path, $args );
  }

  /**
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $setting_manager = lib::create( 'business\setting_manager' );
        
    $select_class_name = lib::get_class_name( 'database\select' );
    $modifier_class_name = lib::get_class_name( 'database\modifier' );
    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    // set up the select
    $sel_string = $this->get_argument( 'select', NULL );
    if( is_null( $sel_string ) )
    {
      $this->select = lib::create( 'database\select' );
      $this->select->add_all_table_columns();
    }
    else
    {
      try
      {
        $this->select = $select_class_name::from_json( $sel_string );
        $this->select->add_column( 'id' ); // make sure id is in the select list
      }
      catch( \cenozo\exception\base_exception $e )
      {
        $this->status->set_code( 400 );
      }
    }

    // set up the modifier
    $mod_string = $this->get_argument( 'modifier', NULL );
    if( !is_null( $mod_string ) )
    {
      try
      {
        $this->modifier = $modifier_class_name::from_json( $mod_string );
      }
      catch( \cenozo\exception\base_exception $e )
      {
        $this->status->set_code( 400 );
      }
    }
    else $this->modifier = lib::create( 'database\modifier' );

    // add global modifications (found in extending query classes)
    $index = count( $this->collection_name_list ) - 1;
    if( 0 <= $index )
    {
      $leaf_subject = $this->collection_name_list[$index];
      $query_string = sprintf( 'service\%s\query', $leaf_subject );
      if( lib::class_exists( $query_string ) )
      {
        $query_class_name = lib::get_class_name( $query_string );
        $query_class_name::add_global_modifications( $this->select, $this->modifier );
      }

      // process "selected" mode
      $selected_mode = $this->get_argument( 'select_mode', false );
      if( $selected_mode )
      {
        $parent_record = end( $this->record_list );
        if( $relationship_class_name::MANY_TO_MANY != $parent_record::get_relationship( $leaf_subject ) )
        { // must have table1/<id>/table2 where table1 N-to-N table2
          $this->status->set_code( 406 );
        }
        else
        {
          // create a sub-query identifying selected records
          $table_name = $parent_record::get_joining_table_name( $leaf_subject );
          $select = lib::create( 'database\select' );
          $select->from( $table_name );
          $select->add_column( 'COUNT(*)', 'total', false );
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( sprintf( '%s_id', $parent_record::get_table_name() ), '=', $parent_record->id );
          $modifier->where( sprintf( '%s_id', $leaf_subject ), '=', sprintf( '%s.id', $leaf_subject ), false );
          $sub_query = sprintf( '( %s %s )', $select->get_sql(), $modifier->get_sql() );
          $this->select->add_column( $sub_query, 'selected', false ); 
        }
      }
    }

    $this->modifier->limit( $setting_manager->get_setting( 'db', 'query_limit' ) );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    parent::execute();

    // get the list of the LAST collection
    $index = count( $this->collection_name_list ) - 1;
    if( 0 <= $index )
    {
      $leaf_subject = $this->collection_name_list[$index];
      $record_class_name = lib::get_class_name( sprintf( 'database\%s', $leaf_subject ) );
      $parent_record = end( $this->record_list );

      $count_modifier = clone $this->modifier;
      if( false === $parent_record || $this->get_argument( 'select_mode', false ) )
      { // if we have a parent then select from it, or if we are in "selected" mode
        $total = $record_class_name::count( $count_modifier );
        $results = $record_class_name::select( $this->select, $this->modifier );
      }
      else
      {
        $parent_record_method = sprintf( 'get_%s_count', $leaf_subject );
        $total = $parent_record->$parent_record_method( $count_modifier );
        $parent_record_method = sprintf( 'get_%s_list', $leaf_subject );
        $results = $parent_record->$parent_record_method( $this->select, $this->modifier );
      }

      $details = $record_class_name::db()->get_column_details( $leaf_subject );

      $this->headers['Columns'] = $details;
      $this->headers['Limit'] = $this->modifier->get_limit();
      $this->headers['Offset'] = $this->modifier->get_offset();
      $this->headers['Total'] = $total;
      $this->data = $results;
    }
  }

  /**
   * TODO: document
   */
  protected static function add_global_modifications( $select, $modifier ) {}

  /**
   * TODO: document
   */
  protected $select = NULL;

  /**
   * TODO: document
   */
  protected $modifier = NULL;
}
