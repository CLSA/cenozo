<?php
/**
 * survey.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database\limesurvey;
use cenozo\lib, cenozo\log;

/**
 * Access to limesurvey's survey_SID tables.
 */
class survey extends sid_record
{
  /**
   * Returns a list of all tokens records which match the survey's token column
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access public
   */
  public function get_tokens_list()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query survey with no primary key.' );
      return array();
    }

    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
    $old_sid = $tokens_class_name::get_sid();
    $tokens_class_name::set_sid( static::get_sid() );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'token', '=', $this->token );
    $tokens_list = $tokens_class_name::select_objects( $modifier );

    $tokens_class_name::set_sid( $old_sid );

    return $tokens_list;
  }

  /**
   * Returns a response to this survey
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $question_code
   * @return string
   * @access public
   */
  public function get_response( $question_code )
  {
    $column_name = static::get_column_name_for_question_code( $question_code );
    if( is_null( $column_name ) )
      throw lib::create( 'exception\runtime', 'Question code not found in survey.', __METHOD__ );

    return $this->$column_name;
  }

  /**
   * Returns a participant's response to a particular question.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $question_code
   * @param database\modifier $modifier A modifier applied to the survey selection
   * @return string
   * @access public
   */
  public static function get_responses( $question_code, $modifier = NULL )
  {
    $column_name = static::get_column_name_for_question_code( $question_code );
    if( is_null( $column_name ) )
      throw lib::create( 'exception\runtime', 'Question code not found in survey.', __METHOD__ );

    $select = lib::create( 'database\select' );
    $select->add_column( $column_name );
    $select->from( static::get_table_name() );

    $sql = $select->get_sql();
    if( !is_null( $modifier ) ) $sql .= ' '.$modifier->get_sql();
    return static::db()->get_col( $sql );
  }

  /**
   * Returns the total time in seconds spent on this survey (by all participants)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier
   * @return double
   * @static
   */
  public static function get_total_time( $modifier = NULL )
  {
    $table_name = static::get_table_name();
    $timing_table_name = $table_name.'_timings';

    $select = lib::create( 'database\select' );
    $select->from( $table_name );
    $select->add_column( 'SUM( IFNULL( interviewtime, 0 ) )', 'total', false );

    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->join( $timing_table_name, $table_name.'.id', $timing_table_name.'.id' );

    return static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
  }

  /**
   * Returns the table's column name for the given question code
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $question_code
   * @return string
   * @access public
   * @static
   */
  public static function get_column_name_for_question_code( $question_code )
  {
    $column_name = NULL;

    $select = lib::create( 'database\select' );
    $select->add_column( 'gid' );
    $select->add_column( 'qid' );
    $select->add_column( 'parent_qid' );
    $select->from( 'questions' );

    // the questions table has more than one column in its primary key so custom sql is needed
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'sid', '=', static::get_sid() );
    $modifier->where( 'title', '=', $question_code );
    $modifier->group( 'sid' );
    $modifier->group( 'gid' );
    $modifier->group( 'qid' );
    $sql = sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() );

    $row = static::db()->get_row( $sql );
    if( 0 < count( $row ) )
    {
      $column_name = $row['parent_qid']
                   ? sprintf( '%sX%sX%s%s', static::get_sid(), $row['gid'], $row['parent_qid'], $question_code )
                   : sprintf( '%sX%sX%s', static::get_sid(), $row['gid'], $row['qid'] );
    }

    return $column_name;
  }

  /**
   * The name of the table's primary key column.
   * @var string
   * @access protected
   */
  protected static $primary_key_name = 'id';
}
