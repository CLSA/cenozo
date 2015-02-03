<?php
/**
 * base_collection.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all collection-based services
 */
class base_collection extends service
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

    $this->modifier = lib::create( 'database\modifier' );
    $this->modifier->limit( 100 ); // define maximum response size, should probably be a paramter

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
  }

  /**
   * TODO: document
   */
  protected $modifier = NULL;
}
