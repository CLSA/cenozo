<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\interview;
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
      $db_application = lib::create( 'business\session' )->get_application();

      // make sure the application has access to the participant
      $db_interview = $this->get_resource();
      if( !is_null( $db_interview ) )
      {
        $db_participant = $this->get_resource()->get_participant();
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
          $db_effective_site = $db_participant->get_effective_site();
          if( is_null( $db_effective_site ) || $db_restrict_site->id != $db_effective_site->id )
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

    $modifier->join( 'participant', 'interview.participant_id', 'participant.id' );

    // restrict by site (or provide link to participant_site table
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) || $select->has_table_columns( 'effective_site' ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );

      if( !is_null( $db_restrict_site ) )
        $modifier->where( 'participant_site.site_id', '=', $db_restrict_site->id );

      if( $select->has_table_columns( 'effective_site' ) )
        $modifier->join( 'site', 'participant_site.site_id', 'effective_site.id', 'left', 'effective_site' );
    }

    if( $select->has_table_columns( 'site' ) )
      $modifier->left_join( 'site', 'interview.site_id', 'site.id' );

    if( $select->has_table_columns( 'user' ) )
    {
      $modifier->join( 'interview_last_assignment', 'interview.id', 'interview_last_assignment.interview_id' );
      $modifier->left_join( 'assignment', 'interview_last_assignment.assignment_id', 'assignment.id' );
      $modifier->left_join( 'user', 'assignment.user_id', 'user.id' );
    }
  }
}
