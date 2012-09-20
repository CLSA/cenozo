<?php
/**
 * base_report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Base class for all reports.
 * 
 * Reports are built by gathering all data for the report in the constructor and building
 * the report from that data in the {@link execute} method.
 * 
 * @abstract
 */
abstract class base_report extends \cenozo\ui\pull
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject to retrieve the primary information from.
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'report', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    // check to see if a template exists for this report
    $filename = sprintf( '%s/report/%s.xls', DOC_PATH, $this->get_full_name() );
    $this->report = lib::create( 'business\report', file_exists( $filename ) ? $filename : NULL );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $refresh_cache = $this->get_argument( 'refresh_cache', NULL );

    // only work with the cache system if a refresh_cache argument is present
    if( is_null( $refresh_cache ) )
    {
      $this->build();
    }
    else
    {
      $cache_filename = $this->get_cache_filename();
  
      // is there a cached version of the report created today?
      $cached = false;
      if( file_exists( $cache_filename ) )
        $cached = date( 'Y-m-d' ) == date( 'Y-m-d', filemtime( $cache_filename ) );
  
      // only build if we are explicitely refreshing the cache or it doesn't exist
      if( $refresh_cache || !$cached ) $this->build();
    }
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $refresh_cache = $this->get_argument( 'refresh_cache', NULL );

    // only work with the cache system if a refresh_cache argument is present
    if( is_null( $refresh_cache ) )
    {
      $this->generate();
    }
    else
    {
      $cache_filename = $this->get_cache_filename();

      // is there a cached version of the report created today?
      $cached = false;
      if( file_exists( $cache_filename ) )
        $cached = date( 'Y-m-d' ) == date( 'Y-m-d', filemtime( $cache_filename ) );

      // only generate if we are explicitely refreshing the cache or it doesn't exist
      if( $refresh_cache || !$cached )
      { // generate the file and write it to the cache
        $this->generate();
        
        try
        {
          // create directory if necessary
          $directory = substr( $cache_filename, 0, strrpos( $cache_filename, '/' ) );
          if( !is_dir( $directory ) )
            if( false === mkdir( $directory, 0777, true ) )
              throw sprintf( 'Unable to create directory for %s report cache file "%s"',
                             $this->get_subject(),
                             $cache_filename );
          
          // open the file, write the contents (replacing the existing contents) and close
          $file = fopen( $cache_filename, 'w' );
          if( false === $file )
            throw sprintf( 'Unable to open %s report cache file "%s"',
                           $this->get_subject(),
                           $cache_filename );
          if( false === fwrite( $file, $this->data ) )
            throw sprintf( 'Unable to write to %s report cahce file "%s"',
                           $this->get_subject(),
                           $cache_filename );
          if( false === fclose( $file ) )
            throw sprintf( 'Unable to close %s report cache file "%s"',
                           $this->get_subject(),
                           $cache_filename );
        }
        catch( string $error )
        {
          log::warning( $error );
        }
      }
      else
      {
        // read the cache and store it in the data array
        $this->data = file_get_contents( $cache_filename );
      }
    }
  }

  /**
   * This method is used to build the report (see add_table(), set_title(), etc)
   * Must be implemented by all reports.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   * @abstract
   */
  abstract protected function build();

  /**
   * This method creates the report based on work done in the build() method.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function generate()
  {
    $util_class_name = lib::get_class_name( 'util' );

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
    
    // add in the title(s)
    $row = 1;
    $max_col = 1 < $max ? chr( 64 + $max ) : false;

    $main_title = $this->get_heading();
    if( !is_null( $this->get_argument( 'restrict_site_id', NULL ) ) )
    {
      $restrict_site_id = $this->get_argument( 'restrict_site_id', 0 );
      if( $restrict_site_id )
      {
        $db_site = lib::create( 'database\site', $restrict_site_id );
        $main_title = $main_title.' for '.$db_site->name;
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
      print '<h1>'.$table['title'].'</h1><br>';
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
        $this->report->set_cell( 'A'.$row, $table['title'] );
        $row++;
      }

      // put in the table header
      if( count( $table['header'] ) )
      {
        $this->report->set_background_color( 'CCCCCC' );
        $col = 'A';
        foreach( $table['header'] as $header )
        {
          $this->report->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
          $this->report->set_cell( $col.$row, $header );
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
            $this->report->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
            $this->report->set_cell( $col.$row, $content );
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

    $this->data = $this->report->get_file( $this->get_argument( 'format' ) );
  }

  /**
   * Returns the report's name (always the same as the report's full name)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_file_name()
  {
    return $this->get_full_name();
  }
  
  /**
   * Returns the report type (xls, xlsx, html, pdf or csv)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type()
  {
    return $this->get_argument( 'format' );
  }
  
  /**
   * Adds a title to the report.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $title
   * @access public
   */
  protected function add_title( $title )
  {
    array_push( $this->report_titles, $title );
  }

  /**
   * Adds a table to the report.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $title The title of the report.
   * @param array $header The header row naming each column.
   * @param array $contents The contents of the table.
   * @param array $footer The footer of the table (for each column).
   * @param array $blanks Which rows to skip, leaving them blank
   * @access public
   */
  protected function add_table(
    $title = NULL, $header = array(), $contents = array(), $footer = array(), $blanks = array() )
  {
    array_push( $this->report_tables,
      array( 'title' => $title,
             'header' => $header,
             'contents' => $contents,
             'footer' => $footer,
             'blanks' => $blanks ) );
  }

  /**
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  private function get_cache_filename()
  {
    // md5 the operation and arguments (without the refresh_cache argument)
    $args = $this->arguments;
    if( array_key_exists( 'refresh_cache', $args ) ) unset( $args['refresh_cache'] );
    $md5 = md5( serialize( array( $this->operation_record, $args ) ) );
    
    // make first two pairs of letters directories to avoid having too many files in one directory
    $path = sprintf( '%s/%s/%s',
                     substr( $md5, 0, 2 ),
                     substr( $md5, 2, 2 ),
                     substr( $md5, 4 ) );

    // add the base url and file type
    $format = $this->get_argument( 'format' );
    $path = sprintf( '%s/%s.%s', REPORT_CACHE_PATH, $path, $format );

    return $path;
  }

  /**
   * An array of all titles to put in the report.
   * @var array $report_titles
   * @access private
   */
  private $report_titles = array();

  /**
   * An associative array of all reports to put in the report.
   * @var array $report_titles
   * @access private
   */
  private $report_tables = array();

  /**
   * An instance of the PHPExcel class used to create the report.
   * @var array $report_titles
   * @access private
   */
  protected $report;
}
?>
