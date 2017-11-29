<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
  protected function get_record_class_name( $index, $relative = false )
  {
    $subject = $this->get_subject( $index );
    if( is_null( $subject ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get record class name for invalid subject (index: %d)', $index ),
        __METHOD__ );

    $class = sprintf( 'database\limesurvey\surveys', $subject );
    return $relative ? $class : lib::get_class_name( $class );

    $subject = $this->get_subject( $index );
    if( 'surveys' == $subject )
    {
      $class = 'database\limesurvey\surveys';
      return $relative ? $class : lib::get_class_name( $class );
    }

    return parent::get_record_class_name( $index, $relative );
  }
}
