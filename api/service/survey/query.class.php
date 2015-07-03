<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\survey;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  public function get_subject( $index )
  {
    $subject = parent::get_subject( $index );
    if( 'survey' == $subject ) $subject = 'surveys';
    return $subject;
  }

  /**
   * Extends parent method
   */
  protected function get_record_class_name( $index )
  {
    $subject = $this->get_subject( $index );
    return 'surveys' == $subject ?
      lib::get_class_name( 'database\limesurvey\surveys' ) : parent::get_record_class_name( $index );
  }
}
