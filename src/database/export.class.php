<?php
/**
 * export.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * export: record
 */
class export extends \cenozo\database\record
{
  /**
   * Overrides the parent save method.
   * @author Patrick Emond
   * @access public
   */
  public function save()
  {
    if( is_null( $this->user_id ) ) $this->user_id = lib::create( 'business\session' )->get_user()->id;
    parent::save();
  }
}
