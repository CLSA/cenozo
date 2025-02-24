<?php
class arguments
{
  /**
   * The constructor
   * 
   * @param string $filename The filename of the parent script
   */
  public function __construct( $filename = NULL )
  {
    $this->executable = !is_null( $filename ) && is_file( $filename ) && is_executable( $filename );

    // always add the help option
    $this->add_option( 'h', 'help', 'Displays this usage message' );
  }

  /**
   * Sets the script's version
   * 
   * @param string $version
   */
  public function set_version( $version )
  {
    $this->version = $version;
  }

  /**
   * Sets the script's description
   * 
   * @param string $description
   */
  public function set_description( $description )
  {
    $this->description = $description;
  }

  /**
   * Adds an option
   * 
   * @param string $short A single character used to identify the option
   * @param string $long The long form of the option
   * @param string $description The description of the option (used when displaying the usage message)
   * @param boolean $parameter Whether a parameter must be provided with the option
   */
  public function add_option( $short, $long, $description = NULL, $parameter = false, $default = NULL )
  {
    if( !is_string( $short ) || 1 != strlen( $short ) )
    {
      throw new \Exception( sprintf( 'Tried to add option with invalid short value, "%s"', $short ) );
    }

    if( !is_string( $long ) || 1 > strlen( $long ) )
    {
      throw new \Exception( sprintf( 'Tried to add option with invalid long value, "%s"', $long ) );
    }

    if( !is_null( $description ) && !is_string( $description ) )
    {
      throw new \Exception(
        sprintf(
          'Tried to add option with non-string description value, "%s"',
          $description
        )
      );
    }

    if( !is_bool( $parameter ) )
    {
      throw new \Exception( sprintf( 'Tried to add option with non-boolean parameter value, "%s"', $parameter ) );
    }

    $this->option_list[$short] = [
      'short' => $short,
      'long' => $long,
      'description' => $description,
      'parameter' => $parameter,
      'default' => $default
    ];
  }

  /**
   * Adds an input argument
   * 
   * @param string $name The name of the input
   * @param string $description An optional description of the input used in the help text
   * @param boolean $optional Whether the input is optional (default false)
   */
  public function add_input( $name, $description = NULL, $optional = false )
  {
    if( !is_null( $name ) && !is_string( $name ) )
    {
      throw new \Exception( sprintf( 'Tried to add input with non-string name value, "%s"', $name ) );
    }

    if( !is_bool( $optional ) )
    {
      throw new \Exception( sprintf( 'Tried to add input with non-boolean optional value, "%s"', $optional ) );
    }

    if( !is_null( $description ) && !is_string( $description ) )
    {
      throw new \Exception(
        sprintf(
          'Tried to add input with non-string description value, "%s"',
          $description
        )
      );
    }

    $this->input_list[] = [
      'name' => $name,
      'optional' => $optional,
      'description' => $description
    ];
  }

  public function usage()
  {
    $input_print_list = [];
    foreach( $this->input_list as $input )
    {
      // add square brackets around optional inputs
      $name = $input['optional'] ? sprintf( '[%s]', $input['name'] ) : $input['name'];
      $input_print_list[] = $name;
    }

    // add the name, version and usage example
    $usage = sprintf(
      "Script: %s%s%s\n".
      "Usage: %s%s %s\n",
      $this->executable ? '' : 'php ',
      basename( $_SERVER['SCRIPT_FILENAME'] ),
      !is_null( $this->version ) ? sprintf( ' version %s', $this->version ) : '',
      basename( $_SERVER['SCRIPT_FILENAME'] ),
      0 < count( $this->option_list ) ? ' [OPTIONS]' : '',
      implode( ' ', $input_print_list )
    );

    // add the description, if there is one
    if( !is_null( $this->description ) ) $usage .= sprintf( "\n%s\n", $this->description );

    // add the input list
    if( 0 < count( $this->input_list ) )
    {
      $usage .= "\nINPUTS";
      foreach( $this->input_list as $input )
      {
        if( !is_null( $input['description'] ) )
        {
          $usage .= sprintf(
            "\n  %s\n     %s%s",
            $input['name'],
            $input['description'],
            $input['optional'] ? ' (optional)' : ''
          );
        }
      }
      $usage .= "\n";
    }

    // add the option list
    if( 0 < count( $this->option_list ) )
    {
      // sort the option list by short name (case insensitive)
      ksort( $this->option_list, SORT_NATURAL | SORT_FLAG_CASE  );

      $usage .= "\nOPTIONS";
      foreach( $this->option_list as $short => $option )
      {
        if( !is_null( $option['description'] ) )
        {
          $usage .= sprintf(
            "\n  -%s%s%s\n     %s%s",
            $short,
            $option['long'] ? sprintf( ', --%s', $option['long'] ) : '',
            $option['parameter'] ? ' ARGUMENT' : '',
            $option['description'],
            !is_null( $option['default'] ) ? sprintf( ' (default %s)', $option['default'] ) : ''
          );
        }
      }
      $usage .= "\n";
    }

    print $usage;
  }

  /**
   * Parses input arguments
   * 
   * @param array $arguments The input arguments to parse (typically this comes from $argv)
   */
  function parse_arguments( $input_arguments )
  {
    $parsed_arguments = [
      'option_list' => [],
      'input_list' => []
    ];

    // apply all default option values
    foreach( $this->option_list as $option )
    {
      if( $option['parameter'] && !is_null( $option['default'] ) )
        $parsed_arguments['option_list'][$option['long']] = $option['default'];
    }

    // skip index 0 since that is always the name of the script
    for( $index = 1; $index < count( $input_arguments ); $index++ )
    {
      $arg = $input_arguments[$index];

      // all options start with a -
      if( '-' == $arg[0] )
      {
        if( 1 == strlen( $arg ) )
        {
          printf( "ERROR: Invalid empty option found, aborting\n\n" );
          $this->usage();
          exit( 101 );
        }

        // Search for an option with either the long or short name provided.
        // This depends on whether the short (-) or long (--) prefix was used.
        $current_option = NULL;
        if( '-' == $arg[1] )
        {
          // search for an option with the long name
          $long_name = substr( $arg, 2 );
          foreach( $this->option_list as $option )
          {
            if( $long_name == $option['long'] )
            {
              $current_option = $option;
              break;
            }
          }
        }
        else
        {
          // search for an option with the short name
          $short = substr( $arg, 1 );
          if( array_key_exists( $short, $this->option_list ) ) $current_option = $this->option_list[$short];
        }

        if( is_null( $current_option ) )
        {
          printf( "ERROR: Invalid option \"%s\" found, aborting\n\n", $arg );
          $this->usage();
          exit( 102 );
        }

        // if the help option has been selected then immediately print the usage and exit
        if( 'help' == $current_option['long'] )
        {
          $this->usage();
          exit( 0 );
        }

        // make sure the next argument is a parameter
        $parameter = NULL;
        if( $current_option['parameter'] )
        {
          $next_index = $index+1;
          if( $next_index < count( $input_arguments ) )
          {
            $next_arg = $input_arguments[$next_index];
            if( '-' != $next_arg[0] )
            {
              $parameter = $next_arg;
              $index++;
            }
          }

          if( is_null( $parameter ) )
          {
            printf( "ERROR: Option \"%s\" is missing its ARGUMENT\n\n", $arg );
            $this->usage();
            exit( 104 );
          }
        }

        // Store the parameter under the long name, or store true if there is no parameter.
        // This will indicate that the option has been selected (but no arguments are required).
        $parsed_arguments['option_list'][$current_option['long']] = is_null( $parameter ) ? true : $parameter;
      }
      else // this is not an argument, so it must be an input
      {
        // make sure we don't have too many inputs
        if( count( $parsed_arguments['input_list'] ) == count( $this->input_list ) )
        {
          printf( "ERROR: Found invalid input \"%s\"\n\n", $arg );
          $this->usage();
          exit( 105 );
        }

        $input_index = count( $parsed_arguments['input_list'] );
        $input = $this->input_list[$input_index];
        $parsed_arguments['input_list'][$input['name']] = $arg;
      }
    }

    // now make sure we have enough inputs
    $minimum_inputs = 0;
    foreach( $this->input_list as $input ) if( !$input['optional'] ) $minimum_inputs++;
    if( count( $parsed_arguments['input_list'] ) < $minimum_inputs )
    {
      printf( "ERROR: Not enough inputs provided\n\n" );
      $this->usage();
      exit( 106 );
    }

    // if we got here then the parsed options and inputs are valid
    return $parsed_arguments;
  }

  /**
   * Whether the script is executable
   * @var string
   */
  private $executable = false;

  /**
   * The script's version
   * @var string
   */
  private $version = NULL;

  /**
   * The script's description
   * @var string
   */
  private $description = NULL;

  /**
   * The list of options
   * @var array
   */
  private $option_list = [];

  /**
   * The list of inputs
   * @var array
   */
  private $input_list = [];
}
