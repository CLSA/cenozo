<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all patch services.
 */
class patch extends write
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'PATCH', $path, $args, $file );
  }

  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    $this->patch_array = get_object_vars( $this->get_file_as_object() );
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $leaf_record = $this->get_leaf_record();
    if( !is_null( $leaf_record ) )
    {
      foreach( $this->patch_array as $key => $value )
      {
        try
        {
          $leaf_record->$key = $value;
          $this->status->set_code( 204 );
        }
        catch( \cenozo\exception\argument $e )
        {
          $this->status->set_code( 400 );
          throw $e;
        }
      }

      if( 300 > $this->status->get_code() )
      {
        try
        {
          $leaf_record->save();
        }
        catch( \cenozo\exception\notice $e )
        {
          $this->data = $e->get_notice();
          $this->status->set_code( 406 );
        }
        catch( \cenozo\exception\database $e )
        {
          if( $e->is_duplicate_entry() )
          {
            $this->data = $e->get_duplicate_columns( $leaf_record->get_class_name() );
            $this->status->set_code( 409 );
          }
          else
          {
            $this->status->set_code( $e->is_missing_data() ? 400 : 500 );
            throw $e;
          }
        }
      }
    }
  }

  /**
   * An associative array containing all patch instructions
   * @var array
   * @access protected
   */
  protected $patch_array;
}
