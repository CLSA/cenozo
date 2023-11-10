<?php
/**
 * has_data.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filehas_data
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * has_data: record
 */
abstract class has_data extends \cenozo\database\record
{
  /**
   * Returns an array of all data columns
   * @param string $column_name The name of the column containing the data (default "data")
   * @return array(string)
   * @access public
   */
  public static function get_data_column_list()
  {
    return static::$data_column_list;
  }

  /**
   * Writes the data to disk, returning the number of bytes that were written to the file, or false on failure
   * @param string $column_name The name of the column containing the data (default "data")
   * @return integer The number of bytes that were written to the file, or false on failure
   */
  public function create_data_file( $column_name = 'data' )
  {
    if( !array_key_exists( $column_name, static::$data_column_list ) )
      throw lib::create( 'exception\argument', 'column_name', $column_name );

    return file_put_contents(
      $this->get_data_filename( $column_name ),
      base64_decode( $this->$column_name ),
      LOCK_EX
    );
  }

  /**
   * Deletes the data from disk
   */
  public function delete_data_file( $column_name = 'data' )
  {
    if( !array_key_exists( $column_name, static::$data_column_list ) )
      throw lib::create( 'exception\argument', 'column_name', $column_name );

    $filename = $this->get_data_filename( $column_name );
    if( file_exists( $filename ) ) unlink( $filename );
  }

  /**
   * Gets the path of the data file when written to disk
   * @param string $column_name The name of the column containing the data (default "data")
   * @return string
   * @access public
   */
  public function get_data_filename( $column_name = 'data' )
  {
    if( !array_key_exists( $column_name, static::$data_column_list ) )
      throw lib::create( 'exception\argument', 'column_name', $column_name );

    return sprintf(
      '%s/%s_%s_%d.%s',
      TEMP_PATH,
      static::get_table_name(),
      $column_name,
      $this->id,
      static::$data_column_list[$column_name]
    );
  }

  /**
   * An associative array of all columns containing base64 encoded data (column => file-extension)
   * @var array(filename => extension) An array of all column name/extension pairs
   * @access protected
   * @static
   */
  protected static $data_column_list = ['data' => 'pdf'];
}
