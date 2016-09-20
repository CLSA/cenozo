<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class base_report_module extends \cenozo\service\site_restricted_module
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
        $db_application = $session->get_application();
        $db_role = $session->get_role();
        $record = $this->get_resource();

        if( !is_null( $record ) )
        {
          // restrict by application
          if( $record->application_id != $db_application->id )
          {
            $this->get_status()->set_code( 404 );
            return;
          }

          // restrict report type by role
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'role_id', '=', $db_role->id );
          if( 0 == $record->get_report_type()->get_role_count( $modifier ) )
          {
            $this->get_status()->set_code( 404 );
            return;
          }

          // restrict by role (if not tier 3)
          if( 3 > $db_role->tier && $record->role_id != $db_role->id )
          {
            $this->get_status()->set_code( 403 );
            return;
          }

          // restrict by site
          $db_restrict_site = $this->get_restricted_site();
          if( !is_null( $db_restrict_site ) )
          {
            if( $record->site_id != $db_restrict_site->id )
            {
              $this->get_status()->set_code( 403 );
              return;
            }
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

    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_role = $session->get_role();
    $subject = $this->get_subject();

    // restrict by application
    $modifier->where( $subject.'.application_id', '=', $db_application->id );

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
      $modifier->where( $subject.'.site_id', '=', $db_restrict_site->id );

    // restrict by role
    if( 3 > $db_role->tier ) $modifier->where( $subject.'.role_id', '=', $db_role->id );
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
      $record = $this->get_resource();
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
          $record->set_restriction_value( $report_restriction['id'], $db_site->id );
        else if( array_key_exists( $column, $file ) )
          $record->set_restriction_value( $report_restriction['id'], $file[$column] );
      }
    }
  }
}
