<?php
/**
 * base_report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
    $this->db_user = $db_report->get_user();
    $this->db_role = $db_report->get_role();
    $this->db_site = $db_report->get_site();
  }

  /**
   * TODO: document
   */
  public function get_filename()
  {
    return sprintf( '%s/%d.%s', REPORT_PATH, $this->db_report->id, $this->get_extension() );
  }

  /**
   * TODO: document
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
   * TODO: document
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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

    // set time limit (from here on out) to 2 minutes since some reports are big
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
        $data .= $db_report_type->title."\n";

        foreach( $this->report_tables as $table )
        {
          $data .= "\n";

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
        }
      }
      else
      {
        $max_cells = $setting_manager->get_setting( 'report', 'max_cells' );
        $spreadsheet = lib::create( 'business\spreadsheet' );

        // determine the widest table size
        $max = 1;
        foreach( $this->report_tables as $table )
        {
          if( is_array( $table['header'] ) )
          {
            $width = max(
              count( $table['header'] ),
              count( $table['footer'] ) );
            if( $max < $width ) $max = $width;
          }
        }

        // determine the total number of cells in the report
        $cell_count = 0;
        foreach( $this->report_tables as $table )
        {
          $column_count = max(
            count( $table['header'] ),
            count( $table['footer'] ) );
          $row_count = count( $table['contents'] );

          $cell_count += $column_count * $row_count;
        }
        
        // add in the title
        $row = 1;
        $max_col = 1 < $max ? chr( 64 + $max ) : false;

        $main_title = $db_report_type->title;
          
        $spreadsheet->set_size( 16 );
        $spreadsheet->set_bold( true );
        $spreadsheet->set_horizontal_alignment( 'center' );
        if( $max_col ) $spreadsheet->merge_cells( 'A'.$row.':'.$max_col.$row );
        $spreadsheet->set_cell( 'A'.$row, $main_title );

        $row++;

        if( $max_cells < $cell_count )
        {
          $spreadsheet->set_size( 14 );

          $spreadsheet->set_cell( 'A'.$row, 'WARNING: report truncated since it is too large' );
          $row++;
        }

        $spreadsheet->set_size( NULL );
        
        // the underlying php-excel library is very inefficient so truncate the report after 20,000 cells
        $cell_count = 0;
        
        // add in each table
        foreach( $this->report_tables as $table )
        {
          $width = max(
            count( $table['header'] ),
            count( $table['footer'] ) );
          $max_col = 1 < $max ? chr( 64 + $width ) : false;

          // always skip a row before each table
          $row++;

          $spreadsheet->set_horizontal_alignment( 'center' );
          $spreadsheet->set_bold( true );

          // put in the table title
          if( !is_null( $table['title'] ) )
          {
            if( $max_col ) $spreadsheet->merge_cells( 'A'.$row.':'.$max_col.$row );
            $spreadsheet->set_background_color( '000000' );
            $spreadsheet->set_foreground_color( 'FFFFFF' );
            $spreadsheet->set_cell( 'A'.$row, $table['title'] );
            $spreadsheet->set_foreground_color( '000000' );
            $row++;
          }

          // put in the table header
          if( count( $table['header'] ) )
          {
            $spreadsheet->set_background_color( 'CCCCCC' );
            $col = 'A';
            foreach( $table['header'] as $header )
            {
              $autosize = !in_array( $col, $table['fixed'] );
              $spreadsheet->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
              $spreadsheet->set_cell( $col.$row, $header, $autosize );
              $col++;
            }
            $row++;
          }

          $spreadsheet->set_bold( false );
          $spreadsheet->set_background_color( NULL );
          
          $first_content_row = $row;

          // put in the table contents
          $contents_are_numeric = array();
          if( count( $table['contents'] ) )
          {
            $content_row = 0;
            $insert_row = count( $table['blanks'] ) > 0 ? true : false;
            foreach( $table['contents'] as $contents )
            {
              $col = 'A';
              foreach( $contents as $content )
              {
                $autosize = !in_array( $col, $table['fixed'] );
                $spreadsheet->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
                $spreadsheet->set_cell( $col.$row, $content, $autosize );
                if( !array_key_exists( $col, $contents_are_numeric ) )
                  $contents_are_numeric[$col] = false;
                $contents_are_numeric[$col] = $contents_are_numeric[$col] || is_numeric( $content );
                $col++;
              }
              
              if( $insert_row && in_array( $content_row, $table['blanks'] ) ) $row++;    
                        
              $cell_count += count( $contents );
              $content_row++;
              $row++;

              if( $max_cells < $cell_count )
              {
                $spreadsheet->set_cell( 'A'.$row, '(report truncated)' );
                break;
              }
            }
          }

          if( $max_cells < $cell_count ) break;

          $last_content_row = $row - 1;
          
          $spreadsheet->set_bold( true );

          // put in the table footer
          if( count( $table['footer'] ) )
          {
            $col = 'A';
            foreach( $table['footer'] as $footer )
            {
              // the footer may be a function, convert if necessary
              if( preg_match( '/[0-9a-zA-Z_]+\(\)/', $footer ) )
              {
                if( $first_content_row == $last_content_row + 1 || !$contents_are_numeric[ $col ] )
                {
                  $footer = 'N/A';
                }
                else
                {
                  $coordinate = sprintf( '%s%s:%s%s',
                                         $col,
                                         $first_content_row,
                                         $col,
                                         $last_content_row );
                  $footer = '='.preg_replace( '/\(\)/', '('.$coordinate.')', $footer );
                }
              }

              $spreadsheet->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
              $spreadsheet->set_cell( $col.$row, $footer );
              $col++;
            }
            $row++;
          }
        }

        $data = $spreadsheet->get_file( $this->db_report->format );
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
    
    $report_type_subject = $this->db_report->get_report_type()->subject;
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    $subject_class_name = lib::get_class_name( sprintf( 'database\%s', $report_type_subject ) );
    $db_application = lib::create( 'business\session' )->get_application();

    // if the report's subject is participant then restrict to this application's participants
    if( 'participant' == $report_type_subject )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'application_has_participant.participant_id', '=', 'participant.id', false );
      $join_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $join_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier( 'application_has_participant', $join_mod );
    }

    $report_restriction_sel = lib::create( 'database\select' );
    $report_restriction_sel->add_table_column( 'report_has_report_restriction', 'value' );
    $report_restriction_sel->add_column( 'restriction_type' );
    $report_restriction_sel->add_column( 'subject' );
    $report_restriction_sel->add_column( 'operator' );
    $report_restriction_mod = lib::create( 'database\modifier' );
    $report_restriction_mod->where( 'custom', '=', false );
    $restriction_list =
      $this->db_report->get_report_restriction_list( $report_restriction_sel, $report_restriction_mod );
    foreach( $restriction_list as $restriction )
    {
      if( 'table' == $restriction['restriction_type'] )
      {
        // define the participant-site relationship
        if( 'site' == $restriction['subject'] && 'participant' == $report_type_subject )
        {
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
          $join_mod->where( 'participant_site.application_id', '=', $db_application->id );
          $modifier->join_modifier( 'participant_site', $join_mod );
          $modifier->where( 'participant_site.site_id', '=', $restriction['value'] );
        }
        else // determine all other relationships directly
        {
          $relationship = $subject_class_name::get_relationship( $restriction['subject'] );
          if( $relationship_class_name::ONE_TO_MANY == $relationship )
          {
            $column = sprintf( '%s_id', $restriction['subject'] );
            if( $subject_class_name::column_exists( $column ) )
              $modifier->where( $column, '=', $restriction['value'] );
          }
          else if( $relationship_class_name::MANY_TO_MANY == $relationship )
          {
            $joining_table = $subject_class_name::get_joining_table_name( $restriction['subject'] );
            $modifier->join(
              $joining_table,
              sprintf( '%s.id', $report_type_subject ),
              sprintf( '%s.%s_id', $joining_table, $report_type_subject ) );
            $modifier->where(
              sprintf( '%s.%s_id', $joining_table, $restriction['subject'] ),
              '=',
              $restriction['value'] );
          }
        }
      }
      else if( 'uid_list' == $restriction['restriction_type'] )
      {
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
      else if( 'boolean' == $restriction['restriction_type'] )
      {
        $modifier->where( $restriction['subject'], '=', $restriction['value'] );
      }
      else if( 'date' == $restriction['restriction_type'] ||
               'datetime' == $restriction['restriction_type'] ||
               'time' == $restriction['restriction_type'] )
      {
        $modifier->where( $restriction['subject'], $restriction['operator'], $restriction['value'] );
      }
    }
  }

  /**
   * Adds a table to the report
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
             'fixed' => array(), // TODO: to implement or remove
             'blanks' => array(), // TODO: to implement or remove
             'footer' => $footer ) );
  }

  /**
   * Convenience method
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * TODO: document
   */
  protected function get_datetime_column( $column, $type = 'datetime' )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // get the timezone abbreviation
    $date = $util_class_name::get_datetime_object();
    $date->setTimezone( new \DateTimeZone( $this->db_user->timezone ) );

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
