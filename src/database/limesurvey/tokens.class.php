<?php
/**
 * tokens.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Returns a list of all survey records which match the token column
   * 
   * @return array
   * @access public
   */
  public function get_survey_list()
  {
    // check the primary key value
    if( is_null( $this->tid ) )
    {
      log::warning( 'Tried to query token with no primary key.' );
      return array();
    }

    $survey_class_name = lib::get_class_name( 'database\limesurvey\survey' );
    $old_sid = $survey_class_name::get_sid();
    $survey_class_name::set_sid( static::get_sid() );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'token', '=', $this->token );
    $survey_list = $survey_class_name::select_objects( $modifier );

    $survey_class_name::set_sid( $old_sid );

    return $survey_list;
  }

  /**
   * Returns the script this token was created for
   * 
   * @return database\script
   * @access public
   */
  public function get_script()
  {
    $script_class_name = lib::get_class_name( 'database\script' );
    return $script_class_name::get_unique_record( 'sid', static::get_sid() );
  }

  /**
   * Returns the participant this token was created for
   * 
   * @return database\participant
   * @access public
   */
  public function get_participant()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $db_participant = NULL;
    $db_script = $this->get_script();

    if( !is_null( $db_script ) )
    {
      $uid = $db_script->repeated ? substr( $this->token, 0, strpos( $this->token, '.' ) ) : $this->token;
      $db_participant = $participant_class_name::get_unique_record( 'uid', $uid );
    }

    return $db_participant;
  }

  /**
   * Adds where statements to a modifier to restrict it to participant's token
   * 
   * @param database\modifier $modifier The modifier which will be changed by this function
   * @param database\participant $db_participant
   * @param boolean $repeated Whether the token is for a repeating script
   * @access public
   * @static
   */
  public static function where_token( $modifier, $db_participant, $repeated = false )
  {
    if( is_null( $modifier ) || !is_a( $modifier, lib::get_class_name( 'database\modifier' ) ) )
      throw lib::create( 'exception\argument', 'modifier', $modifier, __METHOD__ );
    if( is_null( $db_participant ) || !is_a( $db_participant, lib::get_class_name( 'database\participant' ) ) )
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
   * The name of the table's primary key column.
   * @var string
   * @access protected
   */
  protected static $primary_key_name = 'tid';
}
