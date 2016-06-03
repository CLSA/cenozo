<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\report;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the get meta-resource
 */
class get extends \cenozo\service\get
{
  /**
   * Override parent method to set a better filename
   */
  public function get_filename()
  {
    $filename = parent::get_filename();

    if( $this->get_argument( 'download', false ) )
    {
      $db_report = $this->get_leaf_record();
      if( !is_null( $db_report ) )
      {
        $filename = sprintf( '%s %d.%s',
                             $db_report->get_report_type()->title,
                             $db_report->id,
                             $db_report->get_executer()->get_extension() );
      }
    }

    return $filename;
  }
  
  /**
   * Override parent method since report is not available in all mime types
   */
  public function get_supported_mime_type_list()
  {
    $mime_type_list = parent::get_supported_mime_type_list();

    if( $this->get_argument( 'download', false ) )
    { // only allow the mime type the report was generated as
      $mime_type_list = array();
      $db_report = $this->get_leaf_record();
      if( !is_null( $db_report ) ) $mime_type_list[] = $db_report->get_executer()->get_mime_type();
    }

    return $mime_type_list;
  }

  /**
   * Override parent method since report is a meta-resource
   */
  public function execute()
  {
    parent::execute();

    // replace the data with the actual report, if requested
    if( $this->get_argument( 'download', false ) )
    {
      $db_report = $this->get_leaf_record();
      if( !is_null( $db_report ) )
      {
        // make sure we have the requested mime type


        $this->set_data( file_get_contents( $db_report->get_executer()->get_filename() ) );
        // since the file is already encoded, 
        $this->encode = false;
      }

    }
  }
}
