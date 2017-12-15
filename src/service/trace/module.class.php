<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\trace;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_participant_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    $service_class_name = lib::get_class_name( 'service\service' );

    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      $session = lib::create( 'business\session' );
      $db_application = $session->get_application();

      // make sure the application has access to the participant
      $db_trace = $this->get_resource();
      if( !is_null( $db_trace ) )
      {
        if( $db_application->release_based )
        {
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'participant_id', '=', $db_trace->participant_id );
          if( 0 == $db_application->get_participant_count( $modifier ) ) $this->get_status()->set_code( 404 );
        }

        // make sure the application has access to the participant
        if( $db_application->release_based )
        {
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'participant_id', '=', $db_trace->participant_id );
          if( 0 == $db_application->get_participant_count( $modifier ) )
          {
            $this->get_status()->set_code( 404 );
            return;
          }
        }

        // restrict by site
        $db_restrict_site = $this->get_restricted_site();
        if( !is_null( $db_restrict_site ) )
        {
          if( $db_trace->get_participant()->get_effective_site()->id != $db_restrict_site->id )
          {
            $this->get_status()->set_code( 403 );
            return;
          }
        }
      }

      // make sure new traces are valid
      if( $service_class_name::is_write_method( $this->get_method() ) )
      {
        $db_participant = lib::create( 'database\participant', $db_trace->participant_id );
        $trace_type_id = is_null( $db_trace ) ? NULL : $db_trace->trace_type_id;
        $db_last_trace = $db_participant->get_last_trace();
        $last_trace_type_id = is_null( $db_last_trace ) ? NULL : $db_last_trace->trace_type_id;

        // do not allow manually setting trace type to null (this is done automatically when changing address or
        // phone details
        if( is_null( $trace_type_id ) )
        {
          $this->set_data( 'To remove a participant\'s trace you must add missing contact details.' );
          $this->get_status()->set_code( 306 );
          return;
        }

        // do not write a trace which the participant is already in
        if( $trace_type_id == $last_trace_type_id )
        {
          $this->set_data( 'The participant is already in the requested trace.' );
          $this->get_status()->set_code( 306 );
          return;
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

    $db_application = lib::create( 'business\session' )->get_application();

    $modifier->join( 'participant', 'participant_id', 'participant.id' );
    $modifier->join( 'cohort', 'participant.cohort_id', 'cohort.id' );

    // left join to trace_type, user, site, role and application (since they may be null)
    $modifier->left_join( 'trace_type', 'trace.trace_type_id', 'trace_type.id' );
    $modifier->left_join( 'user', 'trace.user_id', 'user.id' );
    $modifier->left_join( 'site', 'trace.site_id', 'site.id' );
    $modifier->left_join( 'role', 'trace.role_id', 'role.id' );
    $modifier->left_join( 'application', 'trace.application_id', 'application.id' );

    // restrict to participants in this application
    if( $db_application->release_based )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'trace.participant_id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier( 'application_has_participant', $sub_mod );
    }

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'trace.participant_id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );
    }

    if( $select->has_table_columns( 'site' ) ) $modifier->left_join( 'site', 'trace.site_id', 'site.id' );
    if( $select->has_table_columns( 'user' ) ) $modifier->left_join( 'user', 'trace.user_id', 'user.id' );

    if( $select->has_table_columns( 'trace_address' ) || $select->has_table_columns( 'region' ) )
    {
      $modifier->left_join( 'trace_address', 'trace.id', 'trace_address.trace_id' );
      if( $select->has_table_columns( 'region' ) )
        $modifier->left_join( 'region', 'trace_address.region_id', 'region.id' );
    }
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );

    // if no datetime is provided then use the current datetime
    if( is_null( $record->datetime ) ) $record->datetime = $util_class_name::get_datetime_object();

    // fill in the user's details
    $record->user_id = $session->get_user()->id;
    $record->site_id = $session->get_site()->id;
    $record->role_id = $session->get_role()->id;
    $record->application_id = $session->get_application()->id;
  }
}
