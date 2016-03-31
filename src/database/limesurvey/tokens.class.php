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
  const TOKEN_POSTFIX_LENGTH = 7;

  /**
   * TODO: document
   */
  public static function where_token( $modifier, $db_participant, $repeated = false )
  {
    if( !is_null( $modifier ) && !is_a( $modifier, lib::get_class_name( 'database\modifier' ) ) )
      throw lib::create( 'exception\argument', 'modifier', $modifier, __METHOD__ );
    if( !is_null( $db_participant ) && !is_a( $db_participant, lib::get_class_name( 'database\participant' ) ) )
      throw lib::create( 'exception\argument', 'db_participant', $db_participant, __METHOD__ );

    if( $repeated )
    {
      $like = sprintf( '%s.%s', $db_participant->uid, str_repeat( '_', static::TOKEN_POSTFIX_LENGTH ) );
      $modifier->where( 'token', 'LIKE', $like );
    }
    else $modifier->where( 'token', '=', $db_participant->uid );
  }

  /**
   * Returns the token name based on the participant and whether the script is repeated
   * 
   * If the script is not repeated then the token string is simply the participant's UID.
   * If the script is repeated then a counter is postfixed to the UID.  The largest pre-existing postfix
   * will be found and incremented, or if this is the participant's first token then a postfix of 1 will
   * be added. Postfixes are delimited by a period (.)
   * Note: postfixes are always padded with zeros (0)
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
      // create an counter as a postfix
      $select = lib::create( 'database\select' );
      $select->add_column( 'MAX( tid )', 'max_tid', false );
      $select->from( static::get_table_name() );
      $modifier = lib::create( 'database\modifier' );
      static::where_token( $modifier, $db_participant, true );
      $sub_select = sprintf( '( %s %s )', $select->get_sql(), $modifier->get_sql() );

      $select = lib::create( 'database\select' );
      $select->add_column( 'token' );
      $select->from( static::get_table_name() );
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'tid', '=', $sub_select, false );
      $last_token = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );

      // the following will either be a number of false (which the int cast will resolve to 0)
      $postfix = (int) substr( $last_token, strpos( $last_token, '.' ) + 1 );
      $postfix = str_pad( ++$postfix, static::TOKEN_POSTFIX_LENGTH, 0, STR_PAD_LEFT );

      $token .= '.'.$postfix;
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
