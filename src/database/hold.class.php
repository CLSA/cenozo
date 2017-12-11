<?php
/**
 * hold.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * hold: record
 */
class hold extends record
{
  /**
   * Overrides the parent save method.
   * @access public
   */
  public function save()
  {
    $db_participant = lib::create( 'database\participant', $this->participant_id );

    // when adding new holds, make sure the last hold's type is not empty
    if( is_null( $this->id ) && is_null( $this->hold_type_id ) )
    {
      $db_hold = $db_participant->get_last_hold();
      if( is_null( $db_hold ) || is_null( $db_hold->hold_type_id ) )
        throw lib::create( 'exception\runtime', 'Tried to unnecessarily cancel a hold.', __METHOD__ );
    }

    parent::save();
  }

  /**
   * Adds a new hold based on a new participation consent record
   * @access public
   */
  public static function add_withdrawn_hold( $db_consent )
  {
    $hold_type_class_name = lib::get_class_name( 'database\hold_type' );
    $session = lib::create( 'business\session' );
    $consent_type = $db_consent->get_consent_type()->name;

    if( 'participation' != $consent_type )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to create withdraw hold for %s consent record.', $consent_type ),
        __METHOD__ );

    $db_hold = new static();
    $db_hold->participant_id = $db_consent->participant_id;
    $db_hold->hold_type_id = $db_consent->accept
                           ? NULL
                           : $hold_type_class_name::get_unique_record(
                               array( 'type', 'name' ),
                               array( 'final', 'withdrawn' ) )->id;
    $db_hold->datetime = $db_consent->datetime;
    $db_hold->user_id = $session->get_user()->id;
    $db_hold->site_id = $session->get_site()->id;
    $db_hold->role_id = $session->get_role()->id;
    $db_hold->application_id = $session->get_application()->id;

    try { $db_hold->save(); }
    // ignore duplicates (the hold already exists so we don't need to create it)
    catch( \cenozo\exception\database $e ) { if( !$e->is_duplicate_entry() ) throw $e; }
  }
}
