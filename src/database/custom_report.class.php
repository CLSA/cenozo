<?php
/**
 * custom_report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * custom_report: record
 */
class custom_report extends \cenozo\database\has_data
{
  protected static $data_column_list = ['report' => 'csv'];

  /**
   * Validates SQL to make sure all dynamic statements are valid.
   * 
   * Dynamic statements in the SQL report must be enclosed by backticks (`) and can be any table.column value
   * where table must be application, role, site or user.
   * return boolean
   */
  public static function validate_report( $sql )
  {
    $matches = [];
    if( preg_match_all( '/`([^`.]+)\.([^`.]+)`/', $sql, $matches ) )
    {
      foreach( $matches[0] as $index => $statement )
      {
        $table = $matches[1][$index];
        $column = $matches[2][$index];

        if( in_array( $table, ['application', 'role', 'site', 'user'] ) )
        {
          if( !static::db()->column_exists( $table, $column ) )
          {
            return sprintf( 'Invalid dynamic property in SQL "%s".', trim( $statement, '`' ) );
          }
        }
        else
        {
          return sprintf( 'Invalid dynamic property in SQL "%s".', trim( $statement, '`' ) );
        }
      }
    }

    return NULL;
  }

  /**
   * Extend parent method
   */
  public function create_data_file( $column_name = 'data' )
  {
    if( 'report' != $column_name ) return parent::create_data_file( $column_name );

    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_role = $session->get_role();
    $db_site = $session->get_site();
    $db_user = $session->get_user();

    // run the query and write the results to the data file
    $sql = base64_decode( $this->data );

    $matches = [];
    if( preg_match_all( '/`([^`.]+)\.([^`.]+)`/', $sql, $matches ) )
    {
      foreach( $matches[0] as $index => $statement )
      {
        $table = $matches[1][$index];
        $column = $matches[2][$index];

        $replace = '';
        if( 'application' == $table ) $replace = $db_application->$column;
        else if( 'role' == $table ) $replace = $db_role->$column;
        else if( 'site' == $table ) $replace = $db_site->$column;
        else if( 'user' == $table ) $replace = $db_user->$column;
        $replace = static::db()->format_string( $replace );
        $sql = str_replace( $statement, $replace, $sql );
      }
    }

    $filename = $this->get_data_filename( $column_name );
    $data_list = static::db()->multi_query( $sql );
    if( 0 == count( $data_list ) )
    {
      return file_put_contents( $filename, 'No results.', LOCK_EX );
    }

    foreach( $data_list as $index => $data )
    {
      if( 0 < $index )
      {
        if( false === file_put_contents( $filename, "\n", LOCK_EX | FILE_APPEND ) ) return false;
      }

      if( false === file_put_contents(
        $filename,
        $util_class_name::get_data_as_csv( $data ),
        LOCK_EX | FILE_APPEND
      ) ) return false;
    }

    return true;
  }
}
