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

    $this->modifier = lib::create( 'database\modifier' );

    // restrict some roles when subject is related to a site
    $index = count( $this->collection_name_list ) -1;
    if( 0 <= $index )
    {
      $subject = $this->collection_name_list[$index];
      $record_class_name = lib::get_class_name( sprintf( 'database\%s', $subject ) );
      $session = lib::create( 'business\session' );

      if( !$session->get_role()->all_sites )
      {
        $db_site = $session->get_site();
        if( 'site' == $subject )
        {
          $this->modifier->where( 'id', '=', $db_site->id );
        }
        else
        {
          if( $record_class_name::column_exists( 'site_id' ) )
            $this->modifier->where( 'site_id', '=', $db_site->id );
        }
      }
    }

    // set up the select
    $sel_string = $this->get_argument( 'select', NULL );
    if( is_null( $sel_string ) ) $this->select = lib::create( 'database\select' );
    else
    {
      try
      {
        $select_class_name = lib::get_class_name( 'database\select' );
        $this->select = $select_class_name::from_json( $sel_string );
      }
      catch( \cenozo\exception\base_exception $e )
      {
        $this->status->set_code( 400 );
      }
    }

    $this->select->add_column( 'id' );

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

    $this->modifier->limit( $setting_manager->get_setting( 'db', 'query_limit' ) );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    parent::execute();

    // get the list of the LAST collection
    $index = count( $this->collection_name_list ) -1;
    if( 0 <= $index )
    {
      $subject = $this->collection_name_list[$index];
      $record_class_name = lib::get_class_name( sprintf( 'database\%s', $subject ) );
      $parent_record = end( $this->record_list );

      // if we have a parent then select from it, otherwise do a general select
      $parent_record_method = sprintf( 'get_%s_count', $subject );
      $total = false === $parent_record
             ? $record_class_name::count( $this->modifier )
             : $parent_record->$parent_record_method( $this->modifier );
      $parent_record_method = sprintf( 'get_%s_list', $subject );
      $results = false === $parent_record
               ? $record_class_name::select( $this->select, $this->modifier )
               : $parent_record->$parent_record_method( $this->select, $this->modifier );

      $this->data['limit'] = $this->modifier->get_limit();
      $this->data['offset'] = $this->modifier->get_offset();
      $this->data['total'] = $total;
      $this->data['results'] = $results;
    }
  }

  /**
   * TODO: document
   */
  protected $select = NULL;

  /**
   * TODO: document
   */
  protected $modifier = NULL;
}
