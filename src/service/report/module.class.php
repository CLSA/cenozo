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
      if( 'POST' == $this->get_method() )
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
        foreach( $db_report_type->get_report_restriction_list( $select ) as $report_restriction )
        {
          if( !array_key_exists( 'restrict_'.$report_restriction['name'], $file ) )
          {
            $this->get_status()->set_code( 400 );
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

    if( 'POST' == $this->get_method() )
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

    if( 'POST' == $this->get_method() )
    {
      // add the restrictions to the record
      $db_report = $this->get_resource();
      $db_report_type = $this->get_parent_resource();
      $file = $this->get_file_as_array();
      $select = lib::create( 'database\select' );
      $select->add_column( 'id' );
      $select->add_column( 'name' );
      foreach( $db_report_type->get_report_restriction_list( $select ) as $report_restriction )
      {
        $column = 'restrict_'.$report_restriction['name'];
        if( array_key_exists( $column, $file ) )
          $db_report->set_restriction_value( $report_restriction['id'], $file[$column] );
      }

      // now run the report
      $report_manager = lib::create( 'business\report_manager' );
      $report_manager->load_data( $db_report );
    }
  }
}
