<?php
/**
 * stratum.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * stratum: record
 */
class stratum extends record
{
  /**
   * Adds/removes a list of participants to/from the stratum
   * 
   * @param database\identifier $db_identifier
   * @param array $identifier_list
   * @param boolean $add If true then participants will be added, if false then removed
   */
  public function set_participants( $db_identifier, $identifier_list, $add )
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $participant_sel = lib::create( 'database\select' );
    $participant_sel->add_column( 'id' );
    $participant_mod = lib::create( 'database\modifier' );
    if( is_null( $db_identifier ) )
    {
      $participant_mod->where( 'uid', 'IN', $identifier_list );
    }
    else
    {
      $participant_mod->join( 'participant_identifier', 'participant.id', 'participant_identifier.participant_id' );
      $participant_mod->where( 'participant_identifier.identifier_id', '=', $db_identifier->id );
      $participant_mod->where( 'participant_identifier.value', 'IN', $identifier_list );
    }
    
    $participant_id_list = array();
    foreach( $participant_class_name::select( $participant_sel, $participant_mod ) as $row ) $participant_id_list[] = $row['id'];
    if( $add ) $this->add_participant( $participant_id_list );
    else $this->remove_participant( $participant_id_list );
  }
}
