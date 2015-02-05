<?php
/**
 * base_resource.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all resource-based services
 */
class base_resource extends service
{
  /** 
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $util_class_name = lib::get_class_name( 'util' );

    if( 0 < count( $this->collection_name_list ) || 0 < count( $this->resource_value_list ) )
    {
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
  }

  /**
   * TODO: document
   */
  protected function validate()
  {
    parent::validate();

    // if there is a resource, make sure it is valid
    if( is_null( $this->record ) ) $this->status->set_code( 404 );
  }

  /**
   * TODO: document
   */
  protected $record = NULL;
}
