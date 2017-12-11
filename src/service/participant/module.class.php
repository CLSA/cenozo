<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\participant;
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
    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      $db_application = lib::create( 'business\session' )->get_application();

      // make sure the application has access to the participant
      $db_participant = $this->get_resource();
      if( $db_application->release_based && !is_null( $db_participant ) )
      {
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'participant_id', '=', $db_participant->id );
        if( 0 == $db_application->get_participant_count( $modifier ) )
        {
          $this->get_status()->set_code( 404 );
          return;
        }
      }

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_participant ) && !is_null( $db_restrict_site ) )
      {
        $db_effective_site = $db_participant->get_effective_site();
        if( is_null( $db_effective_site ) || $db_restrict_site->id != $db_effective_site->id )
          $this->get_status()->set_code( 403 );
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

    $modifier->left_join( 'enrollment', 'participant.enrollment_id', 'enrollment.id' );

    $modifier->join( 'participant_last_hold', 'participant.id', 'participant_last_hold.participant_id' );
    $modifier->left_join( 'hold', 'participant_last_hold.hold_id', 'hold.id' );
    $modifier->left_join( 'hold_type', 'hold.hold_type_id', 'hold_type.id' );

    $modifier->join( 'participant_last_proxy', 'participant.id', 'participant_last_proxy.participant_id' );
    $modifier->left_join( 'proxy', 'participant_last_proxy.proxy_id', 'proxy.id' );
    $modifier->left_join( 'proxy_type', 'proxy.proxy_type_id', 'proxy_type.id' );

    $modifier->join( 'participant_last_trace', 'participant.id', 'participant_last_trace.participant_id' );
    $modifier->left_join( 'trace', 'participant_last_trace.trace_id', 'trace.id' );
    $modifier->left_join( 'trace_type', 'trace.trace_type_id', 'trace_type.id' );

    if( $select->has_column( 'enrollment' ) )
    {
      $select->add_column(
        'IF( participant.enrollment_id IS NULL, "Yes", CONCAT( "No: ", enrollment.name ) )',
        'enrollment',
        false
      );
    }

    if( $select->has_column( 'enrollment' ) )
    {
      $select->add_column(
        'IF( participant.enrollment_id IS NULL, "Yes", CONCAT( "No: ", enrollment.name ) )',
        'enrollment',
        false
      );
    }

    if( $select->has_column( 'status' ) )
    {
      // this should be identical to what is returned by database\participant::get_status()
      $select->add_column(
        "IF( enrollment.name IS NOT NULL, 'not enrolled',\n".
        "IF( hold_type.type = 'final', CONCAT( 'final: ', hold_type.name ),\n".
        "IF( trace_type.name IS NOT NULL, CONCAT( 'trace: ', trace_type.name ),\n".
        "IF( hold_type.type IS NOT NULL, CONCAT( hold_type.type, ': ', hold_type.name ),\n".
        "IF( proxy_type.name IS NOT NULL, CONCAT( 'proxy: ', proxy_type.name ), 'active' )))))",
        'status',
        false
      );
    }

    // add the total number of addresss
    if( $select->has_column( 'active_address_count' ) ) 
    {   
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'address' );
      $join_sel->add_column( 'participant_id' );
      $join_sel->add_column( 'COUNT(*)', 'active_address_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'active', '=', true );
      $join_mod->group( 'participant_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS participant_join_address', $join_sel->get_sql(), $join_mod->get_sql() ),
        'participant.id',
        'participant_join_address.participant_id' );
      $select->add_column( 'IFNULL( active_address_count, 0 )', 'active_address_count', false );
    }   

    // add the total number of phones
    if( $select->has_column( 'active_phone_count' ) ) 
    {   
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'phone' );
      $join_sel->add_column( 'participant_id' );
      $join_sel->add_column( 'COUNT(*)', 'active_phone_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'active', '=', true );
      $join_mod->group( 'participant_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS participant_join_phone', $join_sel->get_sql(), $join_mod->get_sql() ),
        'participant.id',
        'participant_join_phone.participant_id' );
      $select->add_column( 'IFNULL( active_phone_count, 0 )', 'active_phone_count', false );
    }   

    // restrict to participants in this application
    if( $db_application->release_based || $select->has_table_columns( 'preferred_site' ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      if( $db_application->release_based ) $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier(
        'application_has_participant', $sub_mod, $db_application->release_based ? '' : 'left' );

      if( $select->has_table_columns( 'preferred_site' ) )
        $modifier->join( 'site', 'application_has_participant.preferred_site_id', 'preferred_site.id',
                         'left', 'preferred_site' );
    }

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );
    }

    // join to participant_site table
    if( $select->has_table_columns( 'site' ) ||
        $select->has_table_columns( 'default_site' ) ||
        $modifier->has_where( 'site.id' ) )
    {
      if( !$modifier->has_join( 'participant_site' ) )
      {
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
        $join_mod->where(
          'participant_site.application_id', '=', $db_application->id );
        $modifier->join_modifier( 'participant_site', $join_mod );
      }

      $modifier->left_join( 'site', 'participant_site.site_id', 'site.id' );
      $modifier->left_join( 'site', 'participant_site.default_site_id', 'default_site.id', 'default_site' );
    }

    if( $select->has_column( 'withdrawn' ) )
    {
      $db_participant = $this->get_resource();

      // update the withdraw if needed
      if( !is_null( $db_participant ) && !is_null( $db_participant->check_withdraw ) )
      {
        $survey_manager = lib::create( 'business\survey_manager' );
        $survey_manager->process_withdraw( $db_participant );
      }

      $modifier->join( 'participant_last_consent', 'participant.id', 'participant_last_consent.participant_id' );
      $modifier->join( 'consent_type', 'participant_last_consent.consent_type_id', 'consent_type.id' );
      $modifier->where( 'consent_type.name', '=', 'participation' );
      $modifier->left_join( 'consent', 'participant_last_consent.consent_id', 'consent.id' );
      $select->add_column( 'consent.accept <=> false', 'withdrawn', false, 'boolean' );
    }

    if( $select->has_table_columns( 'language' ) )
      $modifier->join( 'language', 'participant.language_id', 'language.id' );

    if( $select->has_table_columns( 'availability_type' ) )
      $modifier->left_join( 'availability_type', 'participant.availability_type_id', 'availability_type.id' );

    if( $select->has_table_columns( 'next_of_kin' ) )
      $modifier->left_join( 'next_of_kin', 'participant.id', 'next_of_kin.participant_id' );
  }
}
