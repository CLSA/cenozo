<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\note;
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

    if( $this->service->may_continue() )
    {
      // make sure to only respond if the parent is a participant or alternate
      if( !in_array( $this->get_parent_subject(), array( 'alternate', 'participant' ) ) )
        $this->get_status()->set_code( 404 );

      // make sure the application has access to the participant or alternate
      $db_application = lib::create( 'business\session' )->get_application();
      $db_note = $this->get_resource();
      if( !is_null( $db_note ) )
      {
        $db_participant = is_null( $db_note->participant_id )
                        ? $db_note->get_alternate()->get_participant()
                        : $db_note->get_participant();
        if( $db_application->release_based )
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
        if( !is_null( $db_restrict_site ) )
        {
          if( !is_null( $db_participant ) && $db_participant->get_effective_site()->id != $db_restrict_site->id )
            $this->get_status()->set_code( 403 );
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

    $modifier->left_join( 'participant', 'note.participant_id', 'participant.id' );
    $modifier->left_join( 'alternate', 'note.alternate_id', 'alternate.id' );

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where_bracket( true );
      $sub_mod->where( 'note.participant_id', '=', 'participant_site.participant_id', false );
      $sub_mod->or_where( 'alternate.participant_id', '=', 'participant_site.participant_id', false );
      $sub_mod->where_bracket( false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );
    }
  }
}
