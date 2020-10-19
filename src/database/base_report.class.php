<?php
/**
 * base_report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * base_report: record
 */
abstract class base_report extends \cenozo\database\record
{
  /**
   * Returns an array of all report restrictions
   * 
   * @return array
   * @access public
   */
  public function get_restriction_value_list()
  {
    $subject_name = static::get_table_name();

    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( sprintf( 'Tried to get %s restrictions with no primary key.', $subject_name ) );
      return array();
    }

    $select = lib::create( 'database\select' );
    $select->from( $subject_name.'_has_report_restriction' );
    $select->add_table_column( 'report_restriction', 'name' );
    $select->add_column( 'value' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join(
      'report_restriction',
      $subject_name.'_has_report_restriction.report_restriction_id',
      'report_restriction.id' );
    $column = sprintf( '%s_has_report_restriction.%s_id', $subject_name, $subject_name );
    $modifier->where( $column, '=', $this->id );

    return static::db()->get_all( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
  }

  /**
   * Set's a report's restriction value
   * 
   * @param integer|string|database\report_restriction $restriction
   * @param string $value
   * @access public
   */
  public function set_restriction_value( $restriction, $value )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $subject_name = static::get_table_name();

    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( sprintf( 'Tried to set restriction of %s with no primary key.', $subject_name ) );
      return;
    }

    // get the restriction_type_id by determining the restriction parameter's type
    $db_report_restriction = NULL;
    if( is_a( $restriction, lib::get_class_name( 'database\report_restriction' ) ) )
    {
      $db_report_restriction = $restriction;
    }
    else if( $util_class_name::string_matches_int( $restriction ) )
    {
      $db_report_restriction = lib::create( 'database\report_restriction', $restriction );
    }
    else
    {
      $db_report_restriction = $report_restriction_class_name::get_unique_record( 'name', $restriction );
    }

    // make sure we have a restriction id
    if( is_null( $db_report_restriction ) )
      throw lib::create( 'exception\argument', 'restriction', $restriction );

    // delete value if null, otherwise set it
    if( is_null( $value ) )
    {
      $sql = sprintf(
        'DELETE FROM %s_has_report_restriction'."\n".
        'WHERE %s_id = %s'."\n".
        '  AND report_restriction_id = %s',
        $subject_name,
        $subject_name,
        static::db()->format_string( $this->id ),
        static::db()->format_string( $db_report_restriction->id ) );
    }
    else
    {
      // process the value, if necessary
      if( 'identifier_list' == $db_report_restriction->restriction_type )
      {
        // check the identifier restriction
        $select = lib::create( 'database\select' );
        $select->from( 'report_has_report_restriction' );
        $select->add_column( 'value' );
        $modifier = lib::create( 'database\modifier' );
        $modifier->join( 'report_restriction', 'report_has_report_restriction.report_restriction_id', 'report_restriction.id' );
        $modifier->where( 'report_id', '=', $this->id );
        $modifier->where( 'report_restriction.restriction_type', '=', 'table' );
        $modifier->where( 'report_restriction.subject', '=', 'identifier' );

        $sql = sprintf( '%s%s', $select->get_sql(), $modifier->get_sql() );
        $identifier_id = static::db()->execute( $sql );

        $db_identifier = '_NULL_' == $identifier_id ? NULL : lib::create( 'database\identifier', $identifier_id );
        $identifier_list = $participant_class_name::get_valid_identifier_list( $db_identifier, $value );

        if( $db_report_restriction->mandatory && 0 == count( $identifier_list ) )
        {
          throw lib::create( 'exception\notice',
            'The participant list you provided resulted in no participants.  Please check your input and try again.',
            __METHOD__
          );
        }

        $value = implode( ' ', $identifier_list );
      }

      $sql = sprintf(
        'INSERT INTO %s_has_report_restriction'."\n".
        'SET create_timestamp = NULL,'."\n".
        '    %s_id = %s,'."\n".
        '    report_restriction_id = %s,'."\n".
        '    value = %s',
        $subject_name,
        $subject_name,
        static::db()->format_string( $this->id ),
        static::db()->format_string( $db_report_restriction->id ),
        static::db()->format_string( $value ) );
    }

    static::db()->execute( $sql );
  }
}
