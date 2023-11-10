<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\custom_report;
use cenozo\lib, cenozo\log;

class patch extends \cenozo\service\patch
{
  /**
   * Extend parent property
   */
  protected static $base64_column_list = ['data' => 'text/sql'];

  /**
   * Extend parent method
   */
  public function validate()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $custom_report_class_name = lib::get_class_name( 'database\custom_report' );

    parent::validate();

    $file = $this->get_argument( 'file', NULL );
    if(
      false !== strpos( $util_class_name::get_header( 'Content-Type' ), 'text/sql' ) &&
      !is_null( $file )
    ) {
      if( 'data' != $file ) throw lib::create( 'exception\argument', 'file', $file, __METHOD__ );

      // validate dynamic content in the file data
      $error = $custom_report_class_name::validate_report( $this->get_file_as_raw() );
      if( !is_null( $error ) )
      {
        throw lib::create( 'exception\notice',
          sprintf(
            "There was an error in the uploaded report SQL file:\n".
            "%s\nPlease check the file and try re-uploading it.",
            $error
          ),
          __METHOD__
        );
      }
    }
  }
}
