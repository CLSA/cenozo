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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   */
  public function save()
  {
    $session = lib::create( 'business\session' );
    if( is_null( $this->application_id ) ) $this->application_id = $session->get_application()->id;
    if( is_null( $this->user_id ) ) $this->user_id = $session->get_user()->id;
    parent::save();
  }

  /**
   * Overrides the parent method to add the application_id
   * @author Patrick Emond <emondpd@mcmaster.ca>
   */
  public static function get_record_from_identifier( $identifier )
  {
    if( false === strpos( 'application_id=', $identifier ) )
      $identifier .= ';application_id='.lib::create( 'business\session' )->get_application()->id;
    return parent::get_record_from_identifier( $identifier );
  }
}
