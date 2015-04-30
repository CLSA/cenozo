<?php
/**
 * phone.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * phone: record
 */
class phone extends has_rank
{
  /**
   * Override parent method
   */
  public function save()
  {
    // figure out whether alternate or participant is the rank parent
    static::$rank_parent = !is_null( $this->alternate_id ) ? 'alternate' : 'participant';
    parent::save();
    static::$rank_parent = NULL;
  }

  /**
   * Override parent method
   */
  public function delete()
  {
    // figure out whether alternate or participant is the rank parent
    static::$rank_parent = !is_null( $this->alternate_id ) ? 'alternate' : 'participant';
    parent::delete();
    static::$rank_parent = NULL;
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = NULL;
}
