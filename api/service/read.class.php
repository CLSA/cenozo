<?php
/**
 * read.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all read services
 */
class read extends service
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

    $select_class_name = lib::get_class_name( 'database\select' );
    $modifier_class_name = lib::get_class_name( 'database\modifier' );

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
    if( is_null( $mod_string ) )
    {
      $this->modifier = lib::create( 'database\modifier' );
    }
    else
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

    // add global modifications (found in extending classes)
    $leaf_subject = $this->get_leaf_subject();
    if( !is_null( $leaf_subject ) )
    {
      $method = strtolower( $this->service_record->method );
      if( 'get' == $method && is_null( $this->get_leaf_record() ) ) $method = 'query';

      $service_class = sprintf( 'service\%s\%s', $leaf_subject, $method );
      if( lib::class_exists( $service_class ) )
      {
        $class_name = lib::get_class_name( $service_class );
        $class_name::add_global_modifications( $this->select, $this->modifier );
      }
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
