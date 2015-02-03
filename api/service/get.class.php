<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all get services
 */
class get extends service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the get service.
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

    // determine whether we are responding with a list or a single resource
    $this->single = count( $this->resource_value_list ) == count( $this->collection_name_list );

    if( $this->single ) $this->process_resource();
    else $this->process_collection();
  }

  /**
   * TODO: document
   */
  protected function validate()
  {
    parent::validate();

    // if there is a resource, make sure it is valid
    if( $this->single && is_null( $this->record ) ) $this->status->set_code( 404 );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    parent::execute();
    $this->data = $this->single
                ? ( !is_null( $this->record ) ? $this->record->get_column_values() : NULL )
                : $this->list;
  }

  /**
   * TODO: document
   */
  protected function process_collection()
  {
    $modifier_class_name = lib::get_class_name( 'database\modifier' );

    $subject = $this->collection_name_list[0];
    $record_class_name = lib::get_class_name( sprintf( 'database\%s', $subject ) );

    $this->modifier = lib::create( 'database\modifier' );
    $this->modifier->limit( 100 ); // define maximum response size, should probably be a paramter

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

    $this->list = $record_class_name::arrayselect( $this->modifier );
  }

  /**
   * TODO: document
   */
  protected function process_resource()
  {
    $util_class_name = lib::get_class_name( 'util' );

    $subject = $this->collection_name_list[0];
    $identifier = $this->resource_value_list[0];

    $record_class_name = lib::get_class_name( sprintf( 'database\%s', $subject ) );

    if( $util_class_name::string_matches_int( $identifier ) )
    { // there is a resource, get the corresponding record
      try
      {
        $this->record = new $record_class_name( $identifier );
      }
      // ignore runtime exceptions and let the validate function throw an argument exception instead
      catch( \cenozo\exception\runtime $e ) {}
    }
    else if( false !== strpos( $identifier, '=' ) )
    { // check unique keys
      $columns = array();
      $values = array();
      foreach( explode( ';', $identifier ) as $part )
      {
        $pair = explode( '=', $part );
        if( 2 == count( $pair ) )
        {
          $columns[] = $pair[0];
          $values[] = $pair[1];
        }
      }

      if( 0 < count( $columns ) )
        $this->record = $record_class_name::get_unique_record( $columns, $values );
    }
  }

  /**
   * TODO: document
   */
  protected $single = NULL;

  /**
   * TODO: document
   */
  protected $list = NULL;

  /**
   * TODO: document
   */
  protected $record = NULL;

  /**
   * TODO: document
   */
  protected $modifier = NULL;
}
