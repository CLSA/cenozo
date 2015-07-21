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
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    $valid = parent::validate();

    // make sure to only respond if the parent is a participant
    if( $valid ) $valid = 'participant' == $this->get_parent_subject();
    return $valid;
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );

    $modifier->join( 'participant', 'note.participant_id', 'participant.id' );

    // restrict to participants in this site (for some roles)
    if( !$session->get_role()->all_sites )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant_id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $session->get_application()->id );
      $sub_mod->where( 'participant_site.site_id', '=', $session->get_site()->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );
    }
  }
}
