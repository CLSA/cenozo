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
    
    $util_class_name = lib::get_class_name( 'util' );
    $db_report_type = $this->db_report->get_report_type();

    try
    {
      // mark the report stage/progress
      $this->db_report->stage = 'reading data';
      $this->db_report->progress = 0.0;
      $this->db_report->save();

      // start by building the report (this is done by extenders to this class)
      $this->build();

      // mark the report stage/progress
      $this->db_report->stage = 'writing data';
      $this->db_report->progress = 0.0;
      $this->db_report->save();

      // estimate the number of lines being written
      $last_progress_save = $this->db_report->progress;
      $line = 0;
      $lines = 0;
      foreach( $this->report_tables as $table ) $lines += count( $table['contents'] );

      $data = '';
      if( 'CSV' == $this->db_report->format )
      {
        $data .= $db_report_type->title;

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

        // mark the report stage/progress
        $this->db_report->stage = 'writing data';
        $this->db_report->progress = 0.0;
        $this->db_report->save();
      }
      else
      {
        /*
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

        // the underlying php-excel library is very inefficient, fail the report if there are more
        // than 20,000 cells to avoid mem/cpu overruns
        $cell_count = 0;
        foreach( $this->report_tables as $table )
        {
          $column_count = max(
            count( $table['header'] ),
            count( $table['footer'] ) );
          $row_count = count( $table['contents'] );

          $cell_count += $column_count * $row_count;
        }
        if( 20000 < $cell_count )
        {
          throw lib::create( 'exception\notice',
            sprintf(
              'Report is too large to create in %s format.  Please try again using CSV format.',
              $this->db_report->format ),
            __METHOD__ );
        }
        
        // add in the title(s)
        $row = 1;
        $max_col = 1 < $max ? chr( 64 + $max ) : false;

        $main_title = $this->db_report_type->title;
        if( !is_null( $this->get_argument( 'restrict_site_id', NULL ) ) )
        {
          $restrict_site_id = $this->get_argument( 'restrict_site_id', 0 );
          if( $restrict_site_id )
          {
            $db_site = lib::create( 'database\site', $restrict_site_id );
            $main_title = $main_title.' for '.$db_site->get_full_name();
          }
          else
          {
            $main_title = $main_title.' for All Sites';
          }
        }
          
        $this->report->set_size( 16 );
        $this->report->set_bold( true );
        $this->report->set_horizontal_alignment( 'center' );
        if( $max_col ) $this->report->merge_cells( 'A'.$row.':'.$max_col.$row );
        $this->report->set_cell( 'A'.$row, $main_title );

        $row++;

        $now_datetime_obj = $util_class_name::get_datetime_object();
        $time_title = 'Generated on '.$now_datetime_obj->format( 'Y-m-d' ).
                       ' at '.$now_datetime_obj->format( 'H:i T' );
        $this->report->set_size( 14 );
        $this->report->set_bold( false );
        if( $max_col ) $this->report->merge_cells( 'A'.$row.':'.$max_col.$row );
        $this->report->set_cell( 'A'.$row, $time_title );

        $row++;

        if( !is_null( $this->get_argument( 'restrict_start_date', NULL ) ) ||
            !is_null( $this->get_argument( 'restrict_end_date', NULL ) ) )
        {
          $restrict_start_date = $this->get_argument( 'restrict_start_date' );
          $restrict_end_date = $this->get_argument( 'restrict_end_date' );
          $now_datetime_obj = $util_class_name::get_datetime_object();
          if( $restrict_start_date )
          {
            $start_datetime_obj = $util_class_name::get_datetime_object( $restrict_start_date );
            if( $start_datetime_obj > $now_datetime_obj )
            {
              $start_datetime_obj = clone $now_datetime_obj;
            }
          }
          if( $restrict_end_date )
          {
            $end_datetime_obj = $util_class_name::get_datetime_object( $restrict_end_date );
            if( $end_datetime_obj > $now_datetime_obj )
            {
              $end_datetime_obj = clone $now_datetime_obj;
            }
          }

          $date_title = '';
          if( $restrict_start_date && $restrict_end_date )
          {
            if( $end_datetime_obj < $start_datetime_obj )
            {
              $start_datetime_obj = $util_class_name::get_datetime_object( $restrict_end_date );
              $end_datetime_obj = $util_class_name::get_datetime_object( $restrict_start_date );
            }
            if( $start_datetime_obj == $end_datetime_obj ) 
            {
              $date_title = 'Dated for '.$start_datetime_obj->format( 'Y-m-d' );
            }
            else
            {
              $date_title = 'Dated from '.$start_datetime_obj->format( 'Y-m-d' ).' to '.
                       $end_datetime_obj->format( 'Y-m-d' );
            }       
          }
          else if( $restrict_start_date && !$restrict_end_date ) 
          {
            if( $start_datetime_obj == $now_datetime_obj )
            {
              $date_title = 'Dated for '.$start_datetime_obj->format( 'Y-m-d' );
            }
            else
            {
              $date_title = 'Dated from '.$start_datetime_obj->format( 'Y-m-d' ).' to '.
                $now_datetime_obj->format( 'Y-m-d' );
            }    
          }
          else if( !$restrict_start_date && $restrict_end_date )
          {
            $date_title = 'Dated up to '.$end_datetime_obj->format( 'Y-m-d' );
          }
          else
          {
            $date_title = 'No date restriction';
          }
          if( $max_col ) $this->report->merge_cells( 'A'.$row.':'.$max_col.$row );
          $this->report->set_cell( 'A'.$row, $date_title );
          $row++;
        }

        $this->report->set_size( 14 );
        $this->report->set_bold( false );

        foreach( $this->report_titles as $title )
        {
          if( $max_col ) $this->report->merge_cells( 'A'.$row.':'.$max_col.$row );
          $this->report->set_cell( 'A'.$row, $title );
          $row++;
        }

        $this->report->set_size( NULL );
        
        // add in each table
        foreach( $this->report_tables as $table )
        {
          $width = max(
            count( $table['header'] ),
            count( $table['footer'] ) );
          $max_col = 1 < $max ? chr( 64 + $width ) : false;

          // always skip a row before each table
          $row++;

          $this->report->set_horizontal_alignment( 'center' );
          $this->report->set_bold( true );

          // put in the table title
          if( !is_null( $table['title'] ) )
          {
            if( $max_col ) $this->report->merge_cells( 'A'.$row.':'.$max_col.$row );
            $this->report->set_background_color( '000000' );
            $this->report->set_foreground_color( 'FFFFFF' );
            $this->report->set_cell( 'A'.$row, $table['title'] );
            $this->report->set_foreground_color( '000000' );
            $row++;
          }

          // put in the table header
          if( count( $table['header'] ) )
          {
            $this->report->set_background_color( 'CCCCCC' );
            $col = 'A';
            foreach( $table['header'] as $header )
            {
              $autosize = !in_array( $col, $table['fixed'] );
              $this->report->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
              $this->report->set_cell( $col.$row, $header, $autosize );
              $col++;
            }
            $row++;
          }

          $this->report->set_bold( false );
          $this->report->set_background_color( NULL );
          
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
                $this->report->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
                $this->report->set_cell( $col.$row, $content, $autosize );
                if( !array_key_exists( $col, $contents_are_numeric ) )
                  $contents_are_numeric[$col] = false;
                $contents_are_numeric[$col] = $contents_are_numeric[$col] || is_numeric( $content );
                $col++;
              }
              
              if( $insert_row && in_array( $content_row, $table['blanks'] ) ) $row++;    
                        
              $content_row++;
              $row++;
            }
          }
          $last_content_row = $row - 1;
          
          $this->report->set_bold( true );

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

              $this->report->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
              $this->report->set_cell( $col.$row, $footer );
              $col++;
            }
            $row++;
          }
        }

        $data = $this->report->get_file( $this->db_report->format );
        */
      }

      // write the data to a file
      $result = file_put_contents( $this->get_filename(), $data, LOCK_EX );
      if( false === $result )
      {
        $this->db_report->stage = 'failed';
      }
      else
      {
        $this->db_report->stage = 'completed';
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
   * Adds a table to the report.
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
             'footer' => $footer ) );
  }

  /**
   * The report active record associated with this report
   * @var database\report $db_report
   * @access protected
   */
  protected $db_report = NULL;

  /**
   * An associative array of all reports to put in the report.
   * @var array $report_tables
   * @access private
   */
  private $report_tables = array();
}
