<?php
/**
 * identifier.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * identifier: record
 */
class identifier extends record
{
  /**
   * Returns the participant given their identifier
   * @param string $identifier
   * @return database\participant
   */
  function get_participant( $identifier )
  {
    $participant_identifier_class_name = lib::get_class_name( 'database\participant_identifier' );
    $db_participant_identifier = $participant_identifier_class_name::get_unique_record( 'value', $identifier );
    return is_null( $db_participant_identifier ) ? NULL : $db_participant_identifier->get_participant();
  }

  /**
   * Checks or imports CSV data as new participant identifiers
   * 
   * @param string $csv_data
   * @param boolean $apply Whether to apply the new identifiers or check for warnings and errors
   * @return array|integer
   * @access true
   */
  public function import( $csv_data, $apply = false )
  {
    ini_set( 'memory_limit', '1G' );
    set_time_limit( 900 ); // 15 minutes max

    $util_class_name = lib::get_class_name( 'util' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $participant_identifier_class_name = lib::get_class_name( 'database\participant_identifier' );

    $setting_manager = lib::create( 'business\setting_manager' );
    $uid_regex = sprintf( '/%s/', $setting_manager->get_setting( 'general', 'uid_regex' ) );
    $identifier_regex = is_null( $this->regex ) ? NULL : sprintf( '/%s/', $this->regex );
    $max_errors = 30;
    $max_warnings = 30;

    $error_list = array();
    $warning_list = array();
    $valid_count = 0;

    foreach( preg_split( '/\r\n|\n|\r/', $csv_data ) as $index => $text )
    {
      $line = $index + 1;
      $text = trim( $text );

      if( 0 < strlen( $text ) )
      {
        $parts = explode( ',', $text );

        if( 2 > count( $parts ) )
        {
          $error_list[] = array(
            'line' => $line,
            'message' => 'Second argument missing'
          );
          if( $apply ) break; else continue;
        }

        $uid = trim( $parts[0], " \t\n\r\0\x0B'\"" );
        $value = trim( $parts[1], " \t\n\r\0\x0B'\"" );

        if( 0 == preg_match( $uid_regex, $uid ) )
        {
          $error_list[$line] = array(
            'line' => $line,
            'message' => sprintf( 'Invalid UID format: "%s"', $uid )
          );
          if( $apply ) break; else continue;
        }

        $db_participant = $participant_class_name::get_unique_record( 'uid', $uid );
        if( is_null( $db_participant ) )
        {
          $error_list[$line] = array(
            'line' => $line,
            'message' => sprintf( 'No such participant UID exists: "%s"', $uid )
          );
          if( $apply ) break; else continue;
        }

        if( !is_null( $identifier_regex ) && 0 == preg_match( $identifier_regex, $value ) )
        {
          $error_list[$line] = array(
            'line' => $line,
            'message' => sprintf( 'Invalid identifier format: "%s"', $value )
          );
          if( $apply ) break; else continue;
        }

        $db_participant_identifier = $participant_identifier_class_name::get_unique_record(
          array( 'identifier_id', 'participant_id' ),
          array( $this->id, $db_participant->id )
        );
        if( !is_null( $db_participant_identifier ) )
        {
          $warning_list[$line] = array(
            'line' => $line,
            'message' => sprintf(
              'Participant "%s" already has identifier "%s", new value will be ignored',
              $uid,
              $db_participant_identifier->value
            )
          );
          continue;
        }

        $db_participant_identifier = $participant_identifier_class_name::get_unique_record(
          array( 'identifier_id', 'value' ),
          array( $this->id, $value )
        );
        if( !is_null( $db_participant_identifier ) )
        {
          $warning_list[$line] = array(
            'line' => $line,
            'message' => sprintf(
              'Identifier "%s" already assigned to "%s", participant will be skipped',
              $db_participant_identifier->value,
              $uid
            )
          );
          continue;
        }

        if( $apply )
        {
          $db_participant_identifier = lib::create( 'database\participant_identifier' );
          $db_participant_identifier->identifier_id = $this->id;
          $db_participant_identifier->participant_id = $db_participant->id;
          $db_participant_identifier->value = $value;
          $db_participant_identifier->save();
        }

        $valid_count++;
      }
    }

    return $apply ?
      $valid_count :
      array(
        // the rest of this stuff we immediately know
        'valid_count' => $valid_count,
        'error_count' => count( $error_list ),
        'error_list' => array_slice( $error_list, 0, $max_errors ),
        'warning_count' => count( $warning_list ),
        'warning_list' => array_slice( $warning_list, 0, $max_warnings )
      );
  }
}
