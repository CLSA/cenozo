<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\stratum\participant;
use cenozo\lib, cenozo\log;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\write
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'POST', $path, $args, $file );
  }

  /**
   * Extends parent method
   */
  protected function validate()
  {
    parent::validate();

    if( $this->may_continue() )
    {
      $file = $this->get_file_as_object();
      if( !property_exists( $file, 'mode' ) ||
          !in_array( $file->mode, ['confirm', 'update'] ) ||
          !property_exists( $file, 'operation' ) ||
          !in_array( $file->operation, ['add', 'remove'] ) ||
          !property_exists( $file, 'identifier_list' ) ) $this->status->set_code( 400 );
    }
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $participant_identifier_class_name = lib::get_class_name( 'database\participant_identifier' );
    $db_stratum = $this->get_parent_record();
    $file = $this->get_file_as_object();

    $modifier = lib::create( 'database\modifier' );

    if( 'add' == $file->operation )
    {
      // make sure the participant doesn't belong to any stratum
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant.id', '=', 'stratum_has_participant.participant_id', false );
      $join_mod->where( 'stratum_has_participant.stratum_id', '=', $db_stratum->id );
      $modifier->join_modifier( 'stratum_has_participant', $join_mod, 'left' );
      $modifier->where( 'stratum_has_participant.participant_id', '=', NULL );
    }
    else
    {
      // make sure the participant belongs to the stratum
      $modifier->join( 'stratum_has_participant', 'participant.id', 'stratum_has_participant.participant_id' );
      $modifier->where( 'stratum_has_participant.stratum_id', '=', $db_stratum->id );
    }

    $identifier_id = property_exists( $file, 'identifier_id' ) ? $file->identifier_id : NULL;
    $db_identifier = is_null( $identifier_id ) ? NULL : lib::create( 'database\identifier', $identifier_id );
    $identifier_list = $participant_class_name::get_valid_identifier_list( $db_identifier, $file->identifier_list, $modifier );

    if( 'confirm' == $file->mode )
    { // return a list of all valid identifiers
      $this->set_data( $identifier_list );
    }
    else if( 0 < count( $identifier_list ) )
    {
      // add or remove the list of participants
      $db_stratum->set_participants( $db_identifier, $identifier_list, 'add' == $file->operation );
    }
  }

  /**
   * Overrides the parent method (this service not meant for creating resources)
   */
  protected function create_resource( $index )
  {
    return 0 == $index ? parent::create_resource( $index ) : NULL;
  }
}
