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
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      $method = $this->get_method();
      if( 'POST' == $method )
      {
        // make sure that the parent is a report type
        if( 'report_type' != $this->get_parent_subject() )
        {
          $this->get_status()->set_code( 404 );
          return;
        }

        // make sure that all mandatory restrictions are present
        $db_report_type = $this->get_parent_resource();
        $file = $this->get_file_as_array();
        $select = lib::create( 'database\select' );
        $select->add_column( 'name' );
        $select->add_column( 'mandatory', NULL, true, 'boolean' );
        foreach( $db_report_type->get_report_restriction_list( $select ) as $report_restriction )
        {
          if( $report_restriction['mandatory'] &&
              !array_key_exists( 'restrict_'.$report_restriction['name'], $file ) )
          {
            $this->get_status()->set_code( 400 );
            return;
          }
        }
      }
      else if( 'PATCH' == $method )
      {
        // the only patch allowed is setting the stage to 'started' and progress to 1,
        // this will generate (or re-generate) the report
        $file = $this->get_file_as_array();
        if( 2 != count( $file ) ||
            !array_key_exists( 'stage', $file ) ||
            'started' != $file['stage'] ||
            !array_key_exists( 'progress', $file ) ||
            1 != $file['progress'] ) $this->get_status()->set_code( 403 );
      }
      else
      {
        $session = lib::create( 'business\session' );
        $record = $this->get_resource();

        if( !is_null( $record ) )
        {
          // restrict by application
          $db_application = $session->get_application();
          if( $record->application_id != $session->get_application()->id )
          {
            $this->get_status()->set_code( 404 );
            return;
          }

          // restrict by role
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'role_id', '=', $session->get_role()->id );
          if( 0 == $record->get_report_type()->get_role_count( $modifier ) )
          {
            $this->get_status()->set_code( 404 );
            return;
          }
        }
      }
    }
  }


  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // restrict by application
    $modifier->where( 'report.application_id', '=', lib::create( 'business\session' )->get_application()->id );

    if( $select->has_column( 'report_schedule' ) )
      $select->add_column( 'report_schedule_id IS NOT NULL', 'report_schedule', true, 'boolean' );

    if( $select->has_column( 'restrict_placeholder' ) ) $select->remove_column( NULL, 'restrict_placeholder' );
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    parent::pre_write( $record );

    $method = $this->get_method();
    if( 'DELETE' == $method )
    {
      // make note of the report's filename to delete after the record has been removed
      $this->filename = $record->get_executer()->get_filename();
    }
    else if( 'POST' == $method )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $session = lib::create( 'business\session' );

      // set the user, application, site, role and datetime
      $record->user_id = $session->get_user()->id;
      $record->application_id = $session->get_application()->id;
      $record->site_id = $session->get_site()->id;
      $record->role_id = $session->get_role()->id;
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
      $db_site = $session->get_site();
      $db_role = $session->get_role();

      // add the restrictions to the record
      $db_report = $this->get_resource();
      $db_report_type = $this->get_parent_resource();
      $file = $this->get_file_as_array();
      $select = lib::create( 'database\select' );
      $select->add_column( 'id' );
      $select->add_column( 'name' );
      $select->add_column( 'subject' );
      foreach( $db_report_type->get_report_restriction_list( $select ) as $report_restriction )
      {
        $column = 'restrict_'.$report_restriction['name'];

        // treat restrictions with subject=site special (if the role doesn't have all-sites access)
        if( 'site' == $report_restriction['subject'] && !$db_role->all_sites )
          $db_report->set_restriction_value( $report_restriction['id'], $db_site->id );
        else if( array_key_exists( $column, $file ) )
          $db_report->set_restriction_value( $report_restriction['id'], $file[$column] );
      }

      $setting_manager = lib::create( 'business\setting_manager' );
      $authentication = sprintf( '%s:%s',
        $setting_manager->get_setting( 'utility', 'username' ),
        $setting_manager->get_setting( 'utility', 'password' ) );
      $command = sprintf(
        'curl -v -H %s -k %s -X PATCH -d %s &',
        sprintf( "'Authorization:Basic %s'", base64_encode( $authentication ) ),
        sprintf( "'%s/api/report/%d'", $db_application->url, $db_report->id ),
        "'{\"stage\":\"started\",\"progress\":1}'" );

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
