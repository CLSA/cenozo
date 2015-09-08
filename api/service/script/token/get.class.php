<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\script\token;
use cenozo\lib, cenozo\log;

class get extends \cenozo\service\get
{
  /**
   * Override parent method
   */
  protected function get_record_class_name( $index, $relative = false )
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
    if( 'token' == $this->get_subject( $index ) )
    {
      // make sure to set the token class name SID
      $db_script = $this->get_parent_record();
      $tokens_class_name = $this->get_record_class_name( $index );
      $tokens_class_name::set_sid( $db_script->sid );

      // handle special case of token resource value being uid=<uid>
      $resource_value = $this->get_resource_value( $index );
      $matches = array();
      if( 1 === preg_match( '/^token=([^;=]+)$/', $resource_value, $matches ) )
      {
        return $tokens_class_name::get_unique_record( 'token', $matches[1] );
      }
      else if( 1 === preg_match( '/^uid=([^;=]+)$/', $resource_value, $matches ) )
      {
        // translate uid and parent script into token string
        $participant_class_name = lib::get_class_name( 'database\participant' );
        $db_participant = $participant_class_name::get_unique_record( 'uid', $matches[1] );
        $token = $tokens_class_name::determine_token_string( $db_participant, $db_script->repeated );
        return $tokens_class_name::get_unique_record( 'token', $token );
      }
    }

    return parent::create_resource( $index );
  }
}
