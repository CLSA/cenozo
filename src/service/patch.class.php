<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
    $util_class_name = lib::get_class_name( 'util' );

    parent::setup();

    $content_type = $util_class_name::get_header( 'Content-Type' );
    $leaf_record = $this->get_leaf_record();
    if( !is_null( $leaf_record ) )
    {
      if( false !== strpos( $content_type, 'application/json' ) )
      {
        foreach( $this->get_file_as_array() as $key => $value )
        {
          try
          {
            $leaf_record->$key = $value;
          }
          catch( \cenozo\exception\argument $e )
          {
            $this->status->set_code( 400 );
            throw $e;
          }
        }
      }
    }

    if( 0 < count( static::$base64_column_list ) )
    {
      $file = $this->get_argument( 'file', NULL );
      if( !is_null( $file ) )
      {
        if( !array_key_exists( $file, static::$base64_column_list ) )
        {
          throw lib::create( 'exception\argument', 'file', $file, __METHOD__ );
        }

        $mime_type = static::$base64_column_list[$file];
        if( in_array( $content_type, [$mime_type, 'application/octet-stream'] ) )
        {
          try
          {
            $this->get_leaf_record()->$file = base64_encode( $this->get_file_as_raw() );
          }
          catch( \cenozo\exception\argument $e )
          {
            $this->status->set_code( 400 );
            throw $e;
          }
        }
      }
    }
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
      try
      {
        $leaf_record->save();
      }
      catch( \cenozo\exception\database $e )
      {
        if( $e->is_duplicate_entry() )
        {
          $this->set_data( $e->get_duplicate_columns( $leaf_record->get_class_name() ) );
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
