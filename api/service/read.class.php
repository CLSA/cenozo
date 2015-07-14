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
   * Extends parent method
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
        // make sure the primary key is in the select list
        $class_name = $this->get_leaf_record_class_name();
        $this->select->add_column( $class_name::get_primary_key_name() );
      }
      catch( \cenozo\exception\base_exception $e )
      {
        $this->status->set_code( 400 );
        throw $e;
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
        // merge the service request's modifier so that where and having statements are enclosed in brackets
        $modifier = $modifier_class_name::from_json( $mod_string );
        $this->modifier = lib::create( 'database\modifier' );
        $this->modifier->merge( $modifier );
        $this->modifier->limit( $modifier->get_limit() );
        $this->modifier->offset( $modifier->get_offset() );
      }
      catch( \cenozo\exception\base_exception $e )
      {
        $this->status->set_code( 400 );
        throw $e;
      }
    }

    // modify the select and modifier based on the module
    $leaf_module = $this->get_leaf_module();
    if( !is_null( $leaf_module ) ) $leaf_module->prepare_read( $this->select, $this->modifier );
  }

  /**
   * Extends parent method
   */
  protected function finish()
  {
    parent::finish();

    // modify the data after it has been fetched
    $leaf_module = $this->get_leaf_module();
    if( !is_null( $leaf_module ) )
    {
      if( is_array( $this->data ) && is_array( current( $this->data ) ) )
        foreach( $this->data as $row ) $leaf_module->post_read( $row );
      else $leaf_module->post_read( $this->data );
    }
  }

  /**
   * The select used to process this read service
   * @var database\select
   * @access protected
   */
  protected $select = NULL;

  /**
   * The modifier used to process this read service
   * @var database\modifier
   * @access protected
   */
  protected $modifier = NULL;
}
