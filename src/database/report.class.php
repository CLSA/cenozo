<?php
/**
 * report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * report: record
 */
class report extends \cenozo\database\record
{
  /**
   * TODO: document
   */
  public function get_executer()
  {
    return lib::create( sprintf( 'business\report\%s', $this->get_report_type()->name ), $this );
  }

  /**
   * TODO: document
   */
  public function get_restriction_value_list()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to get report restrictions with no primary key.' );
      return array();
    }

    $select = lib::create( 'database\select' );
    $select->from( 'report_has_report_restriction' );
    $select->add_table_column( 'report_restriction', 'name' );
    $select->add_column( 'value' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join(
      'report_restriction',
      'report_has_report_restriction.report_restriction_id',
      'report_restriction.id' );
    $modifier->where( 'report_has_report_restriction.report_id', '=', $this->id );

    return static::db()->get_all( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
  }

  /**
   * TODO: document
   */
  public function set_restriction_value( $restriction, $value )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $participant_class_name = lib::get_class_name( 'database\participant' );

    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to set restriction of report with no primary key.' );
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
        'DELETE FROM report_has_report_restriction'."\n".
        'WHERE report_id = %s'."\n".
        '  AND report_restriction_id = %s',
        static::db()->format_string( $this->id ),
        static::db()->format_string( $db_report_restriction->id ) );
    }
    else
    {
      // process the value, if necessary
      if( 'uid_list' == $db_report_restriction->restriction_type )
      {
        $uid_list = $participant_class_name::get_valid_uid_list( $value );

        if( $db_report_restriction->mandatory && 0 == count( $uid_list ) )
          throw lib::create( 'exception\notice',
            'The participant list you generated resulted in no participants. '.
            'Please check your input and try again.',
            __METHOD__ );

        $value = implode( ' ', $uid_list );
      }

      $sql = sprintf(
        'INSERT INTO report_has_report_restriction'."\n".
        'SET report_id = %s,'."\n".
        '    report_restriction_id = %s,'."\n".
        '    value = %s',
        static::db()->format_string( $this->id ),
        static::db()->format_string( $db_report_restriction->id ),
        static::db()->format_string( $value ) );
    }

    static::db()->execute( $sql );
  }
}
