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
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    $db_application = lib::create( 'business\session' )->get_application();

    // make sure the application has access to the participant
    $db_participant = $this->get_resource();
    if( $db_application->release_based && !is_null( $db_participant ) )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'participant_id', '=', $db_participant->id );
      if( 0 == $db_application->get_participant_count( $modifier ) ) $this->get_status()->set_code( 404 );
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

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();

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

    if( $select->has_table_columns( 'language' ) )
      $modifier->join( 'language', 'participant.language_id', 'language.id' );
  }
}
