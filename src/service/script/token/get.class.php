<?php
/**
 * get.class.php
 * 
 * Note that this service is used for Limesurvey scripts only (not used for Pine)
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\script\token;
use cenozo\lib, cenozo\log;

class get extends \cenozo\service\get
{
  /**
   * Override parent method
   */
  public function get_record_class_name( $index, $relative = false )
  {
    $subject = $this->get_subject( $index );
    if( 'token' != $subject ) return parent::get_record_class_name( $index, $relative );

    $class = 'database\limesurvey\tokens'; // limesurvey pluralizes table names
    return $relative ? $class : lib::get_class_name( $class );
  }

  /**
   * Override parent method
   */
  protected function create_resource( $index )
  {
    $record = NULL;

    if( 'token' == $this->get_subject( $index ) )
    {
      $tokens_class_name = $this->get_record_class_name( $index );

      // make sure to set the token class name SID
      $db_script = $this->get_parent_record();
      if( is_null( $db_script->sid ) )
        throw lib::create( 'exception\runtime', 'Tried to call script/token/get service for Pine script.', __METHOD__ );
      $old_sid = $tokens_class_name::get_sid();
      $tokens_class_name::set_sid( $db_script->sid );

      // handle special case of token resource value being uid=<uid>
      $resource_value = $this->get_resource_value( $index );
      $record = $tokens_class_name::get_record_from_identifier( $resource_value );

      $tokens_class_name::set_sid( $old_sid );
    }
    else
    {
      $record = parent::create_resource( $index );
    }

    return $record;
  }
}
