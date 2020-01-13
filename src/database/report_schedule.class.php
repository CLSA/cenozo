<?php
/**
 * report_schedule.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * report_schedule: record
 */
class report_schedule extends base_report
{
  /**
   * Runs any scheduled report who's schedule indicates a new report must be generated.
   * 
   * @access public
   */
  public static function update_all()
  {
    $util_class_name = lib::get_class_name( 'util' );

    $modifier = lib::create( 'database\modifier' );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'report_schedule.id', '=', 'report.report_schedule_id', false );
    $join_mod->where(
      "CASE report_schedule.schedule\n".
      "  WHEN 'daily' THEN\n".
      "    DATE( report.datetime ) < DATE( UTC_TIMESTAMP() )\n".
      "  WHEN 'weekly' THEN\n".
      "    YEAR( report.datetime ) < YEAR( UTC_TIMESTAMP() ) OR\n".
      "    WEEK( report.datetime ) < WEEK( UTC_TIMESTAMP() )\n".
      "  WHEN 'monthly' THEN\n".
      "    YEAR( report.datetime ) < YEAR( UTC_TIMESTAMP() ) OR\n".
      "    MONTH( report.datetime ) < MONTH( UTC_TIMESTAMP() )\n".
      "  ELSE false\n".
      "END", '=', false );
    $modifier->join_modifier( 'report', $join_mod, 'left' );
    $modifier->where( 'report.id', '=', NULL );
    $modifier->where( 'report_schedule.application_id', '=',
      lib::create( 'business\session' )->get_application()->id );

    foreach( static::select_objects( $modifier ) as $db_report_schedule )
    {
      // create the report
      $db_report = lib::create( 'database\report' );
      $db_report->report_type_id = $db_report_schedule->report_type_id;
      $db_report->report_schedule_id = $db_report_schedule->id;
      $db_report->user_id = $db_report_schedule->user_id;
      $db_report->application_id = $db_report_schedule->application_id;
      $db_report->site_id = $db_report_schedule->site_id;
      $db_report->role_id = $db_report_schedule->role_id;
      $db_report->format = $db_report_schedule->format;
      $db_report->stage = 'started';
      $db_report->progress = 1;
      $db_report->datetime = $util_class_name::get_datetime_object()->format( 'Y-m-d H:i:s' );
      $db_report->save();

      // add the restrictions, generate the report then log the result
      $db_report->copy_report_schedule_restrictions();
      $db_report->get_executer()->generate();

      log::info( sprintf(
        'Finished creating %s report #%d for %s schedule #%d.',
        $db_report->get_report_type()->title,
        $db_report->id,
        $db_report_schedule->schedule,
        $db_report_schedule->id ) );
    }
  }
}
