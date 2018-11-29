<?php
/**
 * base_report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business\report;
use cenozo\lib, cenozo\log;

/**
 * Base class for all reports.
 * @abstract
 */
abstract class base_report extends \cenozo\base_object
{
  /**
   * Constructor
   * 
   * @param string $subject The subject to retrieve the primary information from.
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $db_report )
  {
    $class_name = is_null( $db_report )
                ? NULL
                : is_a( $db_report, lib::get_class_name( 'database\record' ) )
                ? $db_report->get_class_name()
                : 'not a database\report';
    if( 'report' != $class_name )
      throw lib::create( 'exception\argument', 'db_report (class)', $class_name, __METHOD__ );
    $this->db_report = $db_report;
    $this->db_application = $db_report->get_application();
    $this->db_user = $db_report->get_user();
    $this->db_role = $db_report->get_role();
    $this->db_site = $db_report->get_site();
  }

  /**
   * Returns where the report is saved on the file system
   * 
   * @return string
   * @access public
   */
  public function get_filename()
  {
    return sprintf( '%s/%d.%s', REPORT_PATH, $this->db_report->id, $this->get_extension() );
  }

  /**
   * Returns the report's extension (csv, xlsx or ods)
   * 
   * @return string
   * @access public
   */
  public function get_extension()
  {
    $extension = NULL;
    if( 'CSV' == $this->db_report->format ) $extension = 'csv';
    else if( 'Excel' == $this->db_report->format ) $extension = 'xlsx';
    else if( 'LibreOffice' == $this->db_report->format ) $extension = 'ods';
    return $extension;
  }

  /**
   * Returns the report's mime type
   * 
   * @return string
   * @access public
   */
  public function get_mime_type()
  {
    $mime_type = NULL;
    if( 'CSV' == $this->db_report->format ) $mime_type = 'text/csv';
    else if( 'Excel' == $this->db_report->format )
      $mime_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if( 'LibreOffice' == $this->db_report->format )
      $mime_type = 'application/vnd.oasis.opendocument.spreadsheet';
    return $mime_type;
  }

  /**
   * Converts a report's tables into a spreadsheet or CSV data
   * @access protected
   */
  public function generate()
  {
    // check the report's primary key value
    if( is_null( $this->db_report->id ) )
    {
      log::warning( 'Tried to generate report without a valid report record.' );
      return;
    }

    $setting_manager = lib::create( 'business\setting_manager' );
    $util_class_name = lib::get_class_name( 'util' );
    $db_report_type = $this->db_report->get_report_type();

    // set report time limit
    set_time_limit( $setting_manager->get_setting( 'report', 'time_limit' ) );

    try
    {
      // mark the report stage/progress
      $this->db_report->stage = 'reading data';
      $this->db_report->progress = 0.0;
      $this->db_report->save();

      // start by building the report (this is done by extenders to this class)
      $this->build();

      // make sure the report hasn't been deleted
      try { $db_test_report = lib::create( 'database\report', $this->db_report->id ); }
      catch( \cenozo\exception\runtime $e ) { return; }

      // mark the report stage/progress
      $this->db_report->stage = 'writing data';
      $this->db_report->progress = 0.0;
      $this->db_report->save();

      // estimate the number of lines being written
      $last_progress_save = 0;
      $line = 0;
      $lines = 0;
      foreach( $this->report_tables as $table ) $lines += count( $table['contents'] );

      $data = '';
      if( 'CSV' == $this->db_report->format )
      {
        foreach( $this->report_tables as $table )
        {
          // add the title
          if( !is_null( $table['title'] ) ) $data .= $table['title']."\n";

          // add the header row
          if( 0 < count( $table['header'] ) )
          {
            $cells = array_map(
              function( $value ) { return sprintf( '"%s"', str_replace( '"', '""', $value ) ); },
              $table['header']
            );
            $data .= implode( ',', $cells )."\n";
          }

          // add the content rows
          foreach( $table['contents'] as $content )
          {
            $cells = array_map(
              function( $value ) { return sprintf( '"%s"', str_replace( '"', '""', $value ) ); },
              $content
            );
            $data .= implode( ',', $cells )."\n";

            $this->db_report->progress = ++$line / $lines;
            if( $this->db_report->progress >= $last_progress_save + 0.1 )
            {
              $this->db_report->save();
              $last_progress_save = $this->db_report->progress;
            }
          }

          // add the footer row
          if( 0 < count( $table['footer'] ) )
          {
            $cells = array_map(
              function( $value ) { return sprintf( '"%s"', str_replace( '"', '""', $value ) ); },
              $table['footer']
            );
            $data .= implode( ',', $cells )."\n";
          }

          $data .= "\n";
        }

        $data = iconv( 'UTF-8', 'Windows-1252', $data );
      }
      else
      {
        // define the spreadsheet data
        $max_cells = $setting_manager->get_setting( 'report', 'max_cells' );
        $spreadsheet = lib::create( 'business\spreadsheet' );
        $spreadsheet->set_user( $this->db_user );
        $spreadsheet->load_data( $this->report_tables, $db_report_type->title.' Report' );

        // put the report settings in a separate worksheet
        $select = lib::create( 'database\select' );
        $select->add_table_column( 'report_restriction', 'title' );
        $select->add_table_column( 'report_restriction', 'restriction_type', 'type' );
        $select->add_table_column( 'report_restriction', 'subject' );
        $select->add_column( 'IF( "_NULL_" = value, "(empty)", value )', 'Value', false );
        $modifier = lib::create( 'database\modifier' );
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where(
          'report_restriction.id',
          '=',
          'report_has_report_restriction.report_restriction_id',
          false
        );
        $join_mod->where( 'report_has_report_restriction.report_id', '=', $this->db_report->id );
        $modifier->join_modifier( 'report_has_report_restriction', $join_mod, 'left' );
        $modifier->where( 'report_restriction.restriction_type', '!=', 'uid_list' );
        $modifier->order( 'report_restriction.rank' );
        $rows = $this->db_report->get_report_type()->get_report_restriction_list( $select, $modifier );
        $settings = array();
        foreach( $rows as $index => $setting )
        {
          $value = $setting['Value'];
          if( '(empty)' != $value )
          {
            if( 'table' == $setting['type'] )
            {
              if( is_null( $value ) ) $value = '(all)';
              else
              {
                $record = lib::create( sprintf( 'database\%s', $setting['subject'] ), $value );
                $value = $record->name;
              }
            }
            else if( 'date' == $setting['type'] )
            {
              $value = is_null( $value ) ? '(empty)' : preg_replace( '/T.*/', '', $value );
            }
            else if( 'time' == $setting['type'] )
            {
              $value = is_null( $value ) ? '(empty)' : preg_replace( '/.*T/', '', $value );
            }
            else if( 'boolean' == $setting['type'] )
            {
              $value = is_null( $value ) ? '(all)' : $value ? 'Yes' : 'No';
            }
            else
            {
              $value = is_null( $value ) ? '(all)' : $value;
            }
          }
          $settings[] = array( 'Parameter' => $setting['title'], 'Value' => $value );
        }

        $spreadsheet->load_data( $settings, NULL, 'Parameters' );

        $data = $spreadsheet->get_file( $this->get_mime_type() );
      }

      // make sure the report hasn't been deleted
      try { $db_test_report = lib::create( 'database\report', $this->db_report->id ); }
      catch( \cenozo\exception\runtime $e ) { return; }

      // mark the report stage/progress
      $this->db_report->stage = 'writing data';
      $this->db_report->progress = 1.0;
      $this->db_report->save();

      // write the data to a file
      $result = file_put_contents( $this->get_filename(), $data, LOCK_EX );
      if( false === $result )
      {
        $this->db_report->stage = 'failed';
      }
      else
      {
        $this->db_report->stage = 'completed';
        $this->db_report->elapsed = $util_class_name::get_elapsed_time();
        $this->db_report->progress = 1.0;
        $this->db_report->size = $result;
      }
      $this->db_report->save();
    }
    catch( \Exception $e )
    {
      $this->db_report->stage = 'failed';
      $this->db_report->save();

      throw lib::create( 'exception\runtime',
        sprintf( 'Failed to create file for %s report id %d.', $db_report_type->name, $this->db_report->id ),
        __METHOD__, $e );
    }
  }

  /**
   * This method is used to build the report (see add_table(), set_title(), etc)
   * Must be implemented by all reports which extend this class
   * @access protected
   * @abstract
   */
  abstract protected function build();

  /**
   * Applies the report's restrictions to the given modifier
   * 
   * This method is usually called in the extending class' build() method.
   * Note that restrictions marked as "default" will be ignored, and it assumed that extending
   * report classes will handle them.
   * @access protected
   */
  protected function apply_restrictions( &$modifier )
  {
    // check the report's primary key value
    if( is_null( $this->db_report->id ) )
    {
      log::warning( 'Tried to apply restrictions for a report without a valid report record.' );
      return;
    }

    $util_class_name = lib::get_class_name( 'util' );
    $db_report_type = $this->db_report->get_report_type();
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    $subject_class_name = lib::get_class_name( sprintf( 'database\%s', $db_report_type->subject ) );

    // if the report's subject is participant then restrict to this application's participants
    if( 'participant' == $db_report_type->subject && $this->db_application->release_based )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'application_has_participant.participant_id', '=', 'participant.id', false );
      $join_mod->where( 'application_has_participant.application_id', '=', $this->db_application->id );
      $join_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier( 'application_has_participant', $join_mod );
    }

    // join to the participant's site if there is a site restriction type (even if it isn't specified)
    if( 'participant' == $db_report_type->subject || $modifier->has_join( 'participant' ) )
    {
      $report_restriction_mod = lib::create( 'database\modifier' );
      $report_restriction_mod->where( 'report_restriction.subject', '=', 'site' );
      if( 0 < $db_report_type->get_report_restriction_count( $report_restriction_mod ) )
      {
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
        $join_mod->where( 'participant_site.application_id', '=', $this->db_application->id );
        $modifier->join_modifier( 'participant_site', $join_mod );
        $modifier->join( 'site', 'participant_site.site_id', 'site.id' );
      }
    }

    foreach( $this->get_restriction_list( false ) as $restriction )
    {
      $value = $restriction['value'];
      if( '_NULL_' == $value )
      {
        if( !$restriction['null_allowed'] )
          throw lib::create( 'exception\runtime',
            sprintf( 'Report restriction value for %s is null but null values are not allowed.',
                     $restriction['subject'] ),
            __METHOD__ );
        $value = '_NULL_' == $restriction['value'] ? NULL : $restriction['value'];
      }

      if( 'table' == $restriction['restriction_type'] )
      {
        // define the participant-site relationship
        if( 'site' == $restriction['subject'] && $modifier->has_join( 'participant_site' ) )
        {
          $modifier->where( 'participant_site.site_id', '=', $value );
        }
        else // determine all other relationships directly
        {
          $restriction_table_class_name =
            lib::get_class_name( sprintf( 'database\%s', $restriction['subject'] ) );
          $relationship = $restriction_table_class_name::get_relationship( $db_report_type->subject );
          if( $relationship_class_name::ONE_TO_MANY == $relationship )
          {
            $column = sprintf( '%s_id', $restriction['subject'] );
            if( $subject_class_name::column_exists( $column ) )
              $modifier->where( $column, '=', $value );
          }
          else if( $relationship_class_name::MANY_TO_MANY == $relationship )
          {
            $joining_table = $subject_class_name::get_joining_table_name( $restriction['subject'] );
            $modifier->join(
              $joining_table,
              sprintf( '%s.id', $db_report_type->subject ),
              sprintf( '%s.%s_id', $joining_table, $db_report_type->subject ) );
            $modifier->where( sprintf( '%s.%s_id', $joining_table, $restriction['subject'] ), '=', $value );
          }
        }
      }
      else if( 'uid_list' == $restriction['restriction_type'] )
      {
        // use the raw value since the uid list cannot be _NULL_
        $modifier->where( 'uid', 'IN', explode( ' ', $restriction['value'] ) );
      }
      else if( 'string' == $restriction['restriction_type'] )
      {
      }
      else if( 'integer' == $restriction['restriction_type'] )
      {
      }
      else if( 'decimal' == $restriction['restriction_type'] )
      {
      }
      else if( 'boolean' == $restriction['restriction_type'] || 'enum' == $restriction['restriction_type'] )
      {
        $modifier->where( $restriction['subject'], '=', $value );
      }
      else if( 'date' == $restriction['restriction_type'] ||
               'datetime' == $restriction['restriction_type'] ||
               'time' == $restriction['restriction_type'] )
      {
        // convert to the correct datetime format
        if( !is_null( $value ) )
        {
          $datetime_obj = $util_class_name::get_datetime_object( $value );
          if( 'date' == $restriction['restriction_type'] ) $format = 'Y-m-d';
          elseif( 'time' == $restriction['restriction_type'] ) $format = 'H:i:s';
          else $format = 'Y-m-d H:i:s';
          $value = $datetime_obj->format( $format );
        }

        $modifier->where(
          $this->get_datetime_column( $restriction['subject'], $restriction['restriction_type'] ),
          $restriction['operator'],
          $value
        );
      }
    }
  }

  /**
   * Adds a table to the report
   * 
   * @param string $title The title of the report.
   * @param array $header The header row naming each column.
   * @param array $contents The contents of the table.
   * @param array $footer The footer of the table (for each column).
   * @access public
   */
  protected function add_table( $title = NULL, $header = array(), $contents = array(), $footer = array() )
  {
    array_push( $this->report_tables,
      array( 'title' => $title,
             'header' => $header,
             'contents' => $contents,
             'footer' => $footer ) );
  }

  /**
   * Convenience method
   * 
   * @param string $title The title of the report.
   * @param array $rows The result set returned from calling an active record's select command
   * @access public
   */
  protected function add_table_from_select( $title = NULL, $rows )
  {
    // set up the content
    $content = array();
    $row = NULL;
    foreach( $rows as $row ) $content[] = array_values( $row );

    // set up the header
    $header = array();
    if( !is_null( $row ) )
      foreach( $row as $column => $value ) $header[] = ucwords( str_replace( '_', ' ', $column ) );

    $this->add_table( $title, $header, $content );
  }

  /**
   * Returns an array of this report's restrictions
   * @param boolean $custom Whether to return custom or non-custom parameters (extending classes should 
   *                        only use custom restrictions)
   * @return array
   * @access public
   */
  protected function get_restriction_list( $custom = true )
  {
    $select = lib::create( 'database\select' );
    $select->add_table_column( 'report_has_report_restriction', 'value' );
    $select->add_column( 'restriction_type' );
    $select->add_column( 'name' );
    $select->add_column( 'subject' );
    $select->add_column( 'operator' );
    $select->add_column( 'null_allowed' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'custom', '=', $custom );
    return $this->db_report->get_report_restriction_list( $select, $modifier );
  }

  /**
   * Used by implementing classes to get the SQL for fetching formatted datetime column data
   * 
   * @param string $column The database column to format (may include a table prefix)
   * @param string $type Can be "datetime", "date" or "time
   * @return string
   * @access protected
   */
  protected function get_datetime_column( $column, $type = 'datetime' )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // get the timezone abbreviation
    $date = $util_class_name::get_datetime_object();
    $date->setTimezone( $this->db_user->get_timezone_object() );

    $format = '';
    if( 'date' == $type )
    {
      $format = '%Y-%m-%d';
    }
    else if( 'time' == $type )
    {
      $format = sprintf( '%s %s',
                         $this->db_user->use_12hour_clock ? '%l:%i %p' : '%H:%i',
                         $date->format( 'T' ) );
    }
    else
    {
      $format = sprintf( '%s %s',
                         $this->db_user->use_12hour_clock ? '%Y-%m-%d %l:%i %p' : '%Y-%m-%d %H:%i',
                         $date->format( 'T' ) );
    }

    return sprintf( 'DATE_FORMAT( CONVERT_TZ( %s, "UTC", "%s" ), "%s" )',
                    $column,
                    $this->db_user->timezone,
                    $format );
  }

  /**
   * The report active record associated with this report
   * @var database\report $db_report
   * @access protected
   */
  protected $db_report = NULL;

  /**
   * The application active record associated with this report
   * @var database\application $db_application
   * @access protected
   */
  protected $db_application = NULL;

  /**
   * The user active record associated with this report
   * @var database\user $db_user
   * @access protected
   */
  protected $db_user = NULL;

  /**
   * The role active record associated with this report
   * @var database\role $db_role
   * @access protected
   */
  protected $db_role = NULL;

  /**
   * The site active record associated with this report
   * @var database\site $db_site
   * @access protected
   */
  protected $db_site = NULL;

  /**
   * An associative array of all reports to put in the report.
   * @var array $report_tables
   * @access private
   */
  private $report_tables = array();
}
