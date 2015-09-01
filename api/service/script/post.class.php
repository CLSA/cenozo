<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\script;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    // create a tracking event for completing the new script
    $db_script = $this->get_leaf_record();

    $db_completed_event_type = lib::create( 'database\event_type' );
    $db_completed_event_type->name = sprintf( 'completed (%s)', $db_script->name );
    $db_completed_event_type->description =
      sprintf( 'Completed the "%s" script.', $db_script->name );
    $db_completed_event_type->save();
    $db_script->event_type_id = $db_completed_event_type->id;
  }
}
