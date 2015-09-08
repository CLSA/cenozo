<?php
/**
 * tokens.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database\limesurvey;
use cenozo\lib, cenozo\log;

/**
 * Access to limesurvey's tokens_SID tables.
 */
class tokens extends sid_record
{
  /**
   * Returns the token name based on the participant and whether the script is repeated
   * 
   * If the script is not repeated then the token string is simply the participant's UID.
   * If the script is repeated then a counter is postfixed to the UID.  The largest pre-existing postfix
   * will be found and incremented, or if this is the participant's first token then a postfix of 1 will
   * be added.
   * Note: postfixes are always 7 digits long and padded with zeros (0)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\participant $db_participant
   * @param boolean $repeated
   * @static
   * @access public
   */
  public static function determine_token_string( $db_participant, $repeated )
  {
    $token = $db_participant->uid;
    if( $repeated )
    {
      // need to add a postfix to the token; try for an open assignment first
      $select = lib::create( 'database\select' );
      $select->add_column( 'id' );
      $modifier = lib::create( 'database\modifier' );
      $modifier->join( 'interview', 'assignment.interview_id', 'interview.id' );
      $modifier->where( 'interview.participant_id', '=', $db_participant->id );
      $modifier->where( 'assignment.end_datetime', '=', NULL );

      $assignment_id_list = 
        lib::create( 'business\session' )->get_user()->get_assignment_list( $select, $modifier );
      if( 0 < count( $assignment_id_list ) )
      {
        $postfix = '_'.str_pad( current( $assignment_id_list )['id'], 7, '0', STR_PAD_LEFT );
      }
      else // create an counter as a postfix
      {
        $select = lib::create( 'database\select' );
        $select->add_column( 'MAX( tid )', 'max_tid', false );
        $select->from( static::get_table_name() );
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'token', 'LIKE', $db_participant->uid.'_%' );
        $sub_select = sprintf( '( %s %s )', $select->get_sql(), $modifier->get_sql() );

        $select = lib::create( 'database\select' );
        $select->add_column( 'token' );
        $select->from( static::get_table_name() );
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'tid', '=', $sub_select, false );
        $last_token = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );

        $postfix = $last_token ? substr( $last_token, '_' ) : '_0000000';
        $postfix++;
      }

      $token .= $postfix;
    }

    return $token;
  }

  /**
   * Override parent method
   */
  public static function get_unique_record( $column, $value )
  {
    // there are no unique keys in limesurvey, so emulate one for the "token" column
    if( 'token' == $column )
    {
      $select = lib::create( 'database\select' );
      $select->from( static::get_table_name() );
      $select->add_column( static::$primary_key_name );
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'token', '=', $value );
      $id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
      return !is_null( $id ) ? new static( $id ) : NULL;
    }

    return parent::get_unique_record( $column, $value );
  }

  /**
   * The name of the table's primary key column.
   * @var string
   * @access protected
   */
  protected static $primary_key_name = 'tid';
}
