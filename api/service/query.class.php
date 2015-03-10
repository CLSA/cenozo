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

    $this->modifier = lib::create( 'database\modifier' );

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

    $this->modifier->limit( 100 ); // define maximum response size, should probably be a paramter
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
      $count_modifier = clone $this->modifier;
      $count_modifier->limit( NULL );

      // if we have a parent then select from it, otherwise do a general select
      $this->data['limit'] = $this->modifier->get_limit();
      $this->data['offset'] = $this->modifier->get_offset();
      $parent_record_method = sprintf( 'get_%s_count', $subject );
      $this->data['total'] = false === $parent_record
                           ? $record_class_name::count( $count_modifier )
                           : $parent_record->$parent_record_method( $count_modifier );
      $parent_record_method = sprintf( 'get_%s_arraylist', $subject );
      $this->data['results'] = false === $parent_record
                             ? $record_class_name::arrayselect( $this->modifier )
                             : $parent_record->$parent_record_method( $this->modifier );
    }
  }

  /**
   * TODO: document
   */
  protected $modifier = NULL;
}
