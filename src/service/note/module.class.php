<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\note;
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
    $valid = parent::validate();

    // make sure to only respond if the parent is a participant
    if( 'participant' != $this->get_parent_subject() ) $this->get_status()->set_code( 404 );

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

    $modifier->join( 'participant', 'note.participant_id', 'participant.id' );

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'note.participant_id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );
    }
  }
}
