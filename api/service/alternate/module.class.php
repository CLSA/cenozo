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
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();

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

    // restrict to participants in this site (for some roles)
    if( !$session->get_role()->all_sites )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $sub_mod->where( 'participant_site.site_id', '=', $session->get_site()->id );
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
