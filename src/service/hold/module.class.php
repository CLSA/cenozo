<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\hold;
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

    if( $this->service->may_continue() )
    {
      $session = lib::create( 'business\session' );
      $db_application = $session->get_application();
      $db_role = $session->get_role();

      // make sure the application has access to the participant
      $db_hold = $this->get_resource();
      if( !is_null( $db_hold ) )
      {
        if( $db_application->release_based )
        {
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'participant_id', '=', $db_hold->participant_id );
          if( 0 == $db_application->get_participant_count( $modifier ) ) $this->get_status()->set_code( 404 );
        }

        // make sure the application has access to the participant
        if( $db_application->release_based )
        {
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'participant_id', '=', $db_hold->participant_id );
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
          if( $db_hold->get_participant()->get_effective_site()->id != $db_restrict_site->id )
          {
            $this->get_status()->set_code( 403 );
            return;
          }
        }
      }

      // make sure new holds are valid
      if( $service_class_name::is_write_method( $this->get_method() ) )
      {
        $db_participant = lib::create( 'database\participant', $db_hold->participant_id );
        $db_hold_type = is_null( $db_hold ) || is_null( $db_hold->hold_type_id )
                      ? NULL
                      : $db_hold->get_hold_type();
        $db_last_hold = $db_participant->get_last_hold();
        $db_last_hold_type = is_null( $db_last_hold ) || is_null( $db_last_hold->hold_type_id )
                           ? NULL
                           : $db_last_hold->get_hold_type();

        // make sure the role has access to the hold_type
        $hold_type_mod = lib::create( 'database\modifier' );
        $hold_type_mod->where( 'role_id', '=', $db_role->id );
        if( !is_null( $db_hold_type ) && 0 == $db_hold_type->get_role_count( $hold_type_mod ) )
        {
          $this->set_data( sprintf( 'You do not have access to the "%s" hold type.',
                                    $db_hold_type->to_string() ) );
          $this->get_status()->set_code( 306 );
          return;
        }

        // make sure the participant is enrolled
        if( !is_null( $db_participant->exclusion_id ) )
        {
          $this->set_data( 'Cannot change a non-enrolled participant\'s hold.' );
          $this->get_status()->set_code( 306 );
          return;
        }

        // make sure not to override system holds
        if( !is_null( $db_last_hold_type ) && $db_last_hold_type->system )
        {
          $this->set_data( 'The participant\'s current hold cannot be changed.' );
          $this->get_status()->set_code( 306 );
          return;
        }

        // do not write system holds
        if( !is_null( $db_hold_type ) && $db_hold_type->system )
        {
          $this->set_data( 'This hold type can only be set internally.' );
          $this->get_status()->set_code( 306 );
          return;
        }

        // do not write a hold which the participant is already in
        if( $db_hold_type == $db_last_hold_type )
        {
          $this->set_data( 'The participant is already in the requested hold.' );
          $this->get_status()->set_code( 306 );
          return;
        }

        // when the participant is already in a final hold
        if( !is_null( $db_last_hold_type ) && 'final' == $db_last_hold_type->type )
        {
          // final holds cannot be replaced with non-final holds
          if( !is_null( $db_hold_type ) && 'final' != $db_hold_type->type )
          {
            $this->set_data( 'The participant must be removed from their final hold before you can proceed.' );
            $this->get_status()->set_code( 306 );
            return;
          }
          
          // only tier-3 roles can override an existing final hold
          if( 3 > $db_role->tier )
          {
            $this->get_status()->set_code( 403 );
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

    $db_application = lib::create( 'business\session' )->get_application();

    // left join to hold_type, user, site, role and application (since they may be null)
    $modifier->left_join( 'hold_type', 'hold.hold_type_id', 'hold_type.id' );
    $modifier->left_join( 'user', 'hold.user_id', 'user.id' );
    $modifier->left_join( 'site', 'hold.site_id', 'site.id' );
    $modifier->left_join( 'role', 'hold.role_id', 'role.id' );
    $modifier->left_join( 'application', 'hold.application_id', 'application.id' );

    // restrict to participants in this application
    if( $db_application->release_based )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'hold.participant_id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier( 'application_has_participant', $sub_mod );
    }

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'hold.participant_id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );
    }

    if( $select->has_table_columns( 'site' ) ) $modifier->left_join( 'site', 'hold.site_id', 'site.id' );
    if( $select->has_table_columns( 'user' ) ) $modifier->left_join( 'user', 'hold.user_id', 'user.id' );

    if( $select->has_table_columns( 'hold_address' ) || $select->has_table_columns( 'region' ) )
    {
      $modifier->left_join( 'hold_address', 'hold.id', 'hold_address.hold_id' );
      if( $select->has_table_columns( 'region' ) )
        $modifier->left_join( 'region', 'hold_address.region_id', 'region.id' );
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
