<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\relation;
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

    $modifier->join( 'relation_type', 'relation.relation_type_id', 'relation_type.id' );
    $modifier->join(
      'participant',
      'relation.primary_participant_id',
      'primary_participant.id',
      '',
      'primary_participant'
    );
    $modifier->join( 'participant', 'relation.participant_id', 'participant.id' );

    if( $select->has_column( 'full_relation_type' ) )
    {
      $select->add_column(
        'IFNULL( '.
          'CONCAT( '.
            'relation_type.name, '.
            'IF( '.
              'relation.primary_participant_id = relation.participant_id, '.
              '" (Index)", '.
              '"" '.
            ') '.
          '),'.
          '"(none)" '.
        ')',
        'full_relation_type',
        false
      );
    }

    if( !is_null( $this->get_resource() ) )
    {
      // include the primary participant first/last/uid as supplemental data
      $select->add_column(
        'CONCAT( '.
          'primary_participant.first_name, '.
          '" ", primary_participant.last_name, '.
          '" (", primary_participant.uid, ")" '.
        ')',
        'formatted_primary_participant_id',
        false
      );
      
      // include the participant first/last/uid as supplemental data
      $select->add_column(
        'CONCAT( participant.first_name, " ", participant.last_name, " (", participant.uid, ")" )',
        'formatted_participant_id',
        false
      );
    }
  }
}
