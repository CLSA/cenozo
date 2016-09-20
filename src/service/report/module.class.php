<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\report;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\base_report_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      if( 'PATCH' == $this->get_method() )
      {
        $session = lib::create( 'business\session' );
        $setting_manager = lib::create( 'business\setting_manager' );

        // only the utility user can patch reports, and only to set the stage to started or failed
        $file = $this->get_file_as_array();
        if( $session->get_user()->name != $setting_manager->get_setting( 'utility', 'username' ) ||
           2 != count( $file ) ||
           !array_key_exists( 'stage', $file ) ||
           !in_array( $file['stage'], array( 'failed', 'started' ) ) ||
           !array_key_exists( 'progress', $file ) ||
           1 != $file['progress'] ) $this->get_status()->set_code( 403 );
      }
    }
  }


  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    if( $select->has_column( 'report_schedule' ) )
      $select->add_column( 'report_schedule_id IS NOT NULL', 'report_schedule', true, 'boolean' );

    // pretty-print the elapsed time
    if( $select->has_column( 'formatted_elapsed' ) )
    {
      $select->add_column(
        'CONCAT_WS( ", ",'."\n".
        '  IF('."\n".
        '    elapsed >= 3600,'."\n".
        '    CONCAT('."\n".
        '      TIME_FORMAT( SEC_TO_TIME( elapsed ), "%k" ),'."\n".
        '      " hour",'."\n".
        '      IF( FLOOR( elapsed/3600 ) != 1, "s", "" )'."\n".
        '    ),'."\n".
        '    NULL'."\n".
        '  ),'."\n".
        '  IF('."\n".
        '    elapsed >= 60 && MOD( elapsed, 3600 ) > 60,'."\n".
        '    CONCAT('."\n".
        '      TRIM( LEADING "0" FROM TIME_FORMAT( SEC_TO_TIME( elapsed ), "%i" ) ),'."\n".
        '      " minute",'."\n".
        '      IF( FLOOR( MOD( elapsed, 3600 )/60 ) != 1, "s", "" )'."\n".
        '    ),'."\n".
        '    NULL'."\n".
        '  ),'."\n".
        '  IF('."\n".
        '    MOD( elapsed, 60 ),'."\n".
        '    CONCAT('."\n".
        '      ROUND( MOD( elapsed, 60 ), IF( MOD( elapsed, 1 ), 2, 1 ) ),'."\n".
        '      " second",'."\n".
        '      IF( MOD( elapsed, 60 ) = 1, "", "s" )'."\n".
        '    ),'."\n".
        '    NULL'."\n".
        '  )'."\n".
        ')',
        'formatted_elapsed',
        false );
    }
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    parent::pre_write( $record );

    $util_class_name = lib::get_class_name( 'util' );

    $method = $this->get_method();
    if( 'DELETE' == $method )
    {
      // make note of the report's filename to delete after the record has been removed
      $this->filename = $record->get_executer()->get_filename();
    }
    else if( 'POST' == $method )
    {
      // set the datetime
      $record->datetime = $util_class_name::get_datetime_object()->format( 'Y-m-d H:i:s' );
    }
  }

  /**
   * Extend parent method
   */
  public function post_write( $record )
  {
    parent::post_write( $record );

    $session = lib::create( 'business\session' );

    $method = $this->get_method();
    if( 'DELETE' == $method )
    {
      if( file_exists( $this->filename ) ) unlink( $this->filename );
    }
    else if( 'PATCH' == $method )
    {
      // execute the report if the stage has been set to started and the progress to 1
      $file = $this->get_file_as_array();
      if( 2 == count( $file ) &&
          array_key_exists( 'stage', $file ) && 'started' == $file['stage'] &&
          array_key_exists( 'progress', $file ) && 1 == $file['progress'] )
      {
        // we need to complete any transactions before continuing
        $session->get_database()->complete_transaction();

        // get the report's executer and generate the report file
        $this->get_resource()->get_executer()->generate();
      }
    }
    else if( 'POST' == $method )
    {
      $db_application = $session->get_application();

      $setting_manager = lib::create( 'business\setting_manager' );
      $authentication = sprintf( '%s:%s',
        $setting_manager->get_setting( 'utility', 'username' ),
        $setting_manager->get_setting( 'utility', 'password' ) );
      $curl = sprintf( 'curl -f -H %s -k %s',
        sprintf( "'Authorization:Basic %s'", base64_encode( $authentication ) ),
        sprintf( "'%s/api/report/%d'", $db_application->url, $this->get_resource()->id )
      );
      $command = sprintf(
        '( %s -X PATCH -d %s; if [ "0" != $? ]; then %s -X PATCH -d %s; fi ) &',
        $curl, "'{\"stage\":\"started\",\"progress\":1}'",
        $curl, "'{\"stage\":\"failed\",\"progress\":1}'" );

      fclose( popen( $command, 'r' ) );
    }
  }

  /**
   * Stores a report's filename so it can be deleted after the record is removed
   * @var string $filename
   * @access private
   */
  private $filename = NULL;
}
