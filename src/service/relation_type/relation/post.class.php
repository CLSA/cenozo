<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\relation_type\relation;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Extend parent method
   */
  protected function execute()
  {
    $relation_class_name = lib::get_class_name( 'database\relation' );

    parent::execute();

    if( 409 == $this->status->get_code() )
    {
      if( '[]' == $this->get_data() )
      {
        $db_relation = $this->get_leaf_record();
        $db_existing_relation = $relation_class_name::get_unique_record(
          'participant_id',
          $db_relation->primary_participant_id
        );

        if( !is_null( $db_existing_relation ) )
        {
          // no conflict columns means we tried to make a non-index participant the index to a new relation
          throw lib::create( 'exception\notice',
            sprintf(
              'You cannot create a new relationship with the Index Participant "%s" as they are already '.
              'related to another Index Participant, "%s"',
              $db_existing_relation->get_participant()->uid,
              $db_existing_relation->get_primary_participant()->uid
            ),
            __METHOD__
          );
        }
      }
    }
  }
}
