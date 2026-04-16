<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\participant\relation;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();

    // add the primary participant to the new record
    $this->get_leaf_record()->primary_participant_id = $this->get_parent_record()->id;
  }
}
