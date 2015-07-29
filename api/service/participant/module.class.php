<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\participant;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    // make sure the application has access to the participant
    $db_application = lib::create( 'business\session' )->get_application();
    $db_participant = $this->get_resource();
    if( $db_application->release_based && !is_null( $db_participant ) )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'participant_id', '=', $db_participant->id );
      if( 0 == $db_application->get_participant_count( $modifier ) ) $this->get_status()->set_code( 404 );
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

    // restrict to participants in this application
    if( $db_application->release_based || $select->has_table_columns( 'preferred_site' ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier(
        'application_has_participant', $sub_mod, $db_application->release_based ? '' : 'left' );

      if( $select->has_table_columns( 'preferred_site' ) )
        $modifier->join( 'site', 'application_has_participant.preferred_site_id', 'preferred_site.id',
                         'left', 'preferred_site' );
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

    // join to participant_site table
    if( $select->has_table_columns( 'site' ) || $select->has_table_columns( 'default_site' ) )
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
  }
}
