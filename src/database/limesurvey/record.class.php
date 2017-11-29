<?php
/**
 * record.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database\limesurvey;
use cenozo\lib, cenozo\log;

/**
 * This is the abstract database table object for all limesurvey tables.
 */
abstract class record extends \cenozo\database\record
{
  /**
   * Constructor
   * 
   * See parent class's constructor.
   * @param integer $id The primary key for this object.
   * @access public
   */
  public function __construct( $id = NULL )
  {
    parent::__construct( $id );
    $this->write_timestamps = false;
  }

  /**
   * Magic call method.
   * 
   * Disables the parent method so that it is compatible with limesurvey tables.
   * @throws exception\runtime
   * @access public
   */
  public function __call( $name, $args )
  {
    throw lib::create( 'exception\runtime',
      sprintf( 'Call to undefined function: %s::%s().',
               get_called_class(),
               $name ), __METHOD__ );
  }

  /**
   * Returns the record's database.
   * @return database
   * @static
   * @access protected
   */
  public static function db()
  {
    return lib::create( 'business\session' )->get_survey_database();
  }
}
