<?php
/**
 * log_entry.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * log_entry: record
 */
class log_entry extends record
{
  /**
   * Updates all log entries by re-parsing this application's log file
   */
  public static function update()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $application_id = lib::create( 'business\session' )->get_application()->id;

    // the log records times in the server's local timezone, so we need to convert to UTC
    $system_time_zone = system( 'date +%:z' );
    $datetime_string = sprintf( 'CONVERT_TZ(%%s,"%s","UTC")', $system_time_zone );

    // start by deleting all old log entries for this application
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'application_id', '=', $application_id );
    static::db()->execute( sprintf(
      'DELETE FROM log_entry %s',
      $modifier->get_sql()
    ) );

    // now parse the log and load all data into the database
    $rows = [];
    foreach( log::parse() as $entry )
    {
      $datetime = sprintf( '%s %s', $entry['date'], $entry['time'] );
      $lines = is_array( $entry['lines'] ) ? implode( "<br/>\n", $entry['lines'] ) : NULL;
      $trace = is_array( $entry['trace'] ) ? implode( "<br/>\n", $entry['trace'] ) : NULL;
      $rows[] = sprintf(
        '(%d,%s,%s,%s,%s,%s,%s,%s,%s)',
        $application_id,
        sprintf(
          $datetime_string,
          static::db()->format_string( $datetime )
        ),
        static::db()->format_string( $entry['type'] ),
        static::db()->format_string( $entry['user'] ),
        static::db()->format_string( $entry['role'] ),
        static::db()->format_string( $entry['site'] ),
        static::db()->format_string( $entry['service'] ),
        static::db()->format_string( $lines ),
        static::db()->format_string( $trace )
      );
    }

    static::db()->execute(
      sprintf(
        '%s (application_id,datetime,type,user,role,site,service,description,stack_trace) '.
        'VALUES %s',
        static::db()->add_database_names( 'INSERT INTO log_entry' ),
        implode( ',', $rows )
      ),
      false
    );
  }
}
