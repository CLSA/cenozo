<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\custom_report;
use cenozo\lib, cenozo\log;

class get extends \cenozo\service\downloadable
{
  /**
   * Extend parent property
   */
  protected static $base64_column_list = ['data' => 'text/sql'];

  /**
   * Replace parent method
   * 
   * When the client calls for a file we return the custom_report's file
   */
  protected function get_downloadable_mime_type_list()
  {
    return array( 'text/csv' );
  }

  /**
   * Replace parent method
   * 
   * When the client calls for a file we return the custom_report's file
   */
  protected function get_downloadable_public_name()
  {
    $db_custom_report = $this->get_leaf_record();
    $file = $this->get_argument( 'file', NULL );
    if( 'report' == $file ) return basename( $db_custom_report->get_data_filename( $file ) );
    throw lib::create( 'exception\argument', 'file', $file, __METHOD__ );
  }

  /**
   * Replace parent method
   * 
   * When the client calls for a file we return the custom_report's file
   */
  protected function get_downloadable_file_path()
  {
    $file = $this->get_argument( 'file', NULL );
    $db_custom_report = $this->get_leaf_record();

    if( 'report' == $file )
    {
      $db_custom_report->create_data_file( $file );
      return $db_custom_report->get_data_filename( $file );
    }

    throw lib::create( 'exception\argument', 'file', $file, __METHOD__ );
  }

  /**
   * Extend parent method
   */
  public function finish()
  {
    parent::finish();

    // clean up by deleting temporary files
    $db_custom_report = $this->get_leaf_record();
    $file = $this->get_argument( 'file', NULL );
    if( 'report' == $file ) $db_custom_report->delete_data_file( $file );
  }
}
