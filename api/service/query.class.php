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
        $select_class_name = lib::get_class_name( 'database\select' );
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
        $modifier_class_name = lib::get_class_name( 'database\modifier' );
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

      // if we have a parent then select from it, otherwise do a general select
      $parent_record_method = sprintf( 'get_%s_count', $leaf_subject );
      $details = $record_class_name::db()->get_column_details( $leaf_subject );
      $total = false === $parent_record
             ? $record_class_name::count( $this->modifier )
             : $parent_record->$parent_record_method( $this->modifier );
      $parent_record_method = sprintf( 'get_%s_list', $leaf_subject );
      $results = false === $parent_record
               ? $record_class_name::select( $this->select, $this->modifier )
               : $parent_record->$parent_record_method( $this->select, $this->modifier );

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
