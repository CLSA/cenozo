<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\alternate;
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

    // make sure the application has access to the participant
    $db_application = lib::create( 'business\session' )->get_application();
    $record = $this->get_resource();
    if( !is_null( $record ) )
    {
      if( $db_application->release_based )
      {
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'participant_id', '=', $record->participant_id );
        if( 0 == $db_application->get_participant_count( $modifier ) ) $this->get_status()->set_code( 404 );
      }

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) )
      {
        $db_participant = $record->get_participant();
        if( !is_null( $db_participant ) && $db_participant->get_effective_site()->id != $db_restrict_site->id )
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

    // include the participant first/last/uid as supplemental data
    $modifier->join( 'participant', 'alternate.participant_id', 'participant.id' );
    $select->add_column(
      'CONCAT( participant.first_name, " ", participant.last_name, " (", participant.uid, ")" )',
      'formatted_participant_id',
      false );

    // restrict to participants in this application
    if( $db_application->release_based )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier(
        'application_has_participant', $sub_mod, $db_application->release_based ? '' : 'left' );
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

    // add the "types" column if needed
    if( $select->has_column( 'types' ) )
    {
      $column = sprintf( 'REPLACE( TRIM( CONCAT( %s, %s, %s ) ), "  ", ", " )',
                  'IF( alternate, " alternate ", "" )',
                  'IF( informant, " informant ", "" )',
                  'IF( proxy, " proxy ", "" )' );
      $select->add_column( $column, 'types', false );
    }
  }
}
