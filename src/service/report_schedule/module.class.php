<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\report_schedule;
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
          $column = 'restrict_'.$report_restriction['name'];

          if( $report_restriction['mandatory'] &&
              ( !array_key_exists( $column, $file ) || is_null( $file[$column] ) ) )
          {
            $this->get_status()->set_code( 400 );
            return;
          }
        }
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
    $modifier->where(
      'report_schedule.application_id', '=', lib::create( 'business\session' )->get_application()->id );
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    parent::pre_write( $record );

    if( 'POST' == $this->get_method() )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $session = lib::create( 'business\session' );

      // set the user, application, site, role and datetime
      $record->user_id = $session->get_user()->id;
      $record->application_id = $session->get_application()->id;
      $record->site_id = $session->get_site()->id;
      $record->role_id = $session->get_role()->id;
    }
  }

  /**
   * Extend parent method
   */
  public function post_write( $record )
  {
    parent::post_write( $record );

    $session = lib::create( 'business\session' );

    if( 'POST' == $this->get_method() )
    {
      $db_application = $session->get_application();
      $db_site = $session->get_site();
      $db_role = $session->get_role();

      // add the restrictions to the record
      $db_report_schedule = $this->get_resource();
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
          $db_report_schedule->set_restriction_value( $report_restriction['id'], $db_site->id );
        else if( array_key_exists( $column, $file ) )
          $db_report_schedule->set_restriction_value( $report_restriction['id'], $file[$column] );
      }
    }
  }
}
