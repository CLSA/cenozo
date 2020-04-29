<?php
/**
 * theme_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * A manager to manage and create the user interface's theme
 */
class theme_manager extends \cenozo\singleton
{
  /**
   * Constructor.
   * 
   * @throws exception\argument
   * @access protected
   */
  protected function __construct()
  {
    // initialize the base theme color array
    $db_application = lib::create( 'business\session' )->get_application();
    $primary_color = $db_application->primary_color;
    $secondary_color = $db_application->secondary_color;
    $this->base_theme_color = array(
      'primary' => array(
        'r' => hexdec( substr( $primary_color, 1, 2 ) ),
        'g' => hexdec( substr( $primary_color, 3, 2 ) ),
        'b' => hexdec( substr( $primary_color, 5, 2 ) )
      ),
      'secondary' => array(
        'r' => hexdec( substr( $secondary_color, 1, 2 ) ),
        'g' => hexdec( substr( $secondary_color, 3, 2 ) ),
        'b' => hexdec( substr( $secondary_color, 5, 2 ) )
      )
    );

    // initialize the theme color list
    $this->theme_color_list = array_combine(
      array_keys( $this->base_theme_color ),
      array_fill( 0, count( $this->base_theme_color ), array() )
    );
  }

  /**
   * Used internally to return RGB-HEX color codes
   * 
   * @param string $type Which color type to return (primary or secondary)
   * @param float $fraction What fraction to show the color at (0.0 to 1.0)
   * @return string
   * @access protected
   */
  protected function get_color( $type = 'primary', $fraction = 1.0 )
  {
    $fraction = strval( $fraction );

    if( !array_key_exists( $type, $this->theme_color_list ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get theme color for type "%s" which doesn\'t exist.', $type ),
        __METHOD__ );

    // add the color if it doesn't exist
    if( !array_key_exists( $fraction, $this->theme_color_list[$type] ) )
    {
      $r = $fraction * $this->base_theme_color[$type]['r'];
      if( 0 > $r ) $r = 0; else if( 255 < $r ) $r = 255;
      $g = $fraction * $this->base_theme_color[$type]['g'];
      if( 0 > $g ) $g = 0; else if( 255 < $g ) $g = 255;
      $b = $fraction * $this->base_theme_color[$type]['b'];
      if( 0 > $b ) $b = 0; else if( 255 < $b ) $b = 255;

      $this->theme_color_list[$type][$fraction] = sprintf( '#%s%s%s', dechex( $r ), dechex( $g ), dechex( $b ) );
    }

    return $this->theme_color_list[$type][$fraction];
  }

  /**
   * Writes the theme.css file to disk
   * 
   * @access public
   */
  public function generate_theme_css()
  {
    $css = $this->css_template;

    // find all color types in the css template
    $regex = sprintf( '/(%s)\(([^)]+)\)/',
                      strtoupper( implode( '|', array_keys( $this->theme_color_list ) ) ) );
    $matches = array();
    preg_match_all( $regex, $css, $matches );

    // replace color references in the css string with actual values
    foreach( $matches[0] as $index => $match )
    {
      $type = strtolower( $matches[1][$index] );
      $fraction = $matches[2][$index];
      $css = str_replace( $match, $this->get_color( $type, $fraction ), $css );
    }

    $filename = sprintf( '%s/web/css/theme.css', APPLICATION_PATH );
    return false !== file_put_contents( $filename, $css );
  }

  /**
   * Internal cache of colors generated for get_color()
   * @var array
   * @access protected
   */
  protected $theme_color_list = array();

  /**
   * The base theme colors.
   * @access protected
   */
  protected $base_theme_color = array();

  /**
   * A CSS template used when writing the theme.css file
   * @var
   * @access protected
   */
  protected $css_template = <<<'CSS'
/* primary colours */
a, .text-primary,
.pagination > li > a,
.pagination > li > span {
  color: PRIMARY(1.0);
}
a.text-primary:hover,
a.text-primary:focus {
  color: PRIMARY(0.75);
}
.bg-primary,
.btn-primary {
  color: #fff;
  background-color: PRIMARY(1.0);
}
.btn-primary .badge {
  color: PRIMARY(1.0);
  background-color: #fff;
}
.btn-primary,
.btn-primary.disabled,
.btn-primary[disabled],
fieldset[disabled] .btn-primary,
.btn-primary.disabled:hover,
.btn-primary[disabled]:hover,
fieldset[disabled] .btn-primary:hover,
.btn-primary.disabled:focus,
.btn-primary[disabled]:focus,
fieldset[disabled] .btn-primary:focus,
.btn-primary.disabled.focus,
.btn-primary[disabled].focus,
fieldset[disabled] .btn-primary.focus,
.btn-primary.disabled:active,
.btn-primary[disabled]:active,
fieldset[disabled] .btn-primary:active,
.btn-primary.disabled.active,
.btn-primary[disabled].active,
fieldset[disabled] .btn-primary.active,
.pagination > .active > a,
.pagination > .active > span,
.pagination > .active > a:hover,
.pagination > .active > span:hover,
.pagination > .active > a:focus,
.pagination > .active > span:focus {
  background-color: PRIMARY(1.0);
  border-color: PRIMARY(0.67);
}
.btn-primary:focus,
.btn-primary.focus,
.btn-primary:hover {
  color: #fff;
  background-color: PRIMARY(1.25);
  border-color: PRIMARY(0.87);
}
.btn-primary:active,
.btn-primary.active,
.open > .dropdown-toggle.btn-primary,
.btn-primary:active:hover,
.btn-primary.active:hover,
.open > .dropdown-toggle.btn-primary:hover,
.btn-primary:active:focus,
.btn-primary.active:focus,
.open > .dropdown-toggle.btn-primary:focus,
.btn-primary:active.focus,
.btn-primary.active.focus,
.open > .dropdown-toggle.btn-primary.focus {
  color: #fff;
  background-color: PRIMARY(0.75);
  border-color: PRIMARY(0.4);
}
.panel-primary {
  border-color: PRIMARY(1.0);
}
.panel-primary > .panel-heading {
  background-color: PRIMARY(1.0);
  border-color: PRIMARY(1.0);
}
.panel-primary > .panel-heading + .panel-collapse > .panel-body {
  border-top-color: PRIMARY(1.0);
}
.panel-primary > .panel-heading .badge {
  color: PRIMARY(1.0);
}
.panel-primary > .panel-footer + .panel-collapse > .panel-body {
  border-bottom-color: PRIMARY(1.0);
}

/* info colours */
a, .text-info {
  color: SECONDARY(1.0);
}
a.text-info:hover,
a.text-info:focus,
.navbar-link:focus,
.navbar-link:hover,
.navbar-brand:focus,
.navbar-brand:hover {
  /* important required by navbar */
  color: SECONDARY(0.75) !important;
}
.bg-info,
.table > thead > tr > td.info,
.table > tbody > tr > td.info,
.table > tfoot > tr > td.info,
.table > thead > tr > th.info,
.table > tbody > tr > th.info,
.table > tfoot > tr > th.info,
.table > thead > tr.info > td,
.table > tbody > tr.info > td,
.table > tfoot > tr.info > td,
.table > thead > tr.info > th,
.table > tbody > tr.info > th,
.table > tfoot > tr.info > th,
.alert-info,
.list-group-item-info,
.btn-info {
  color: #fff;
  background-color: SECONDARY(1.0);
}
.btn-info .badge {
  color: SECONDARY(1.0);
  background-color: #fff;
}
.btn-info,
.btn-info.disabled,
.btn-info[disabled],
fieldset[disabled] .btn-info,
.btn-info.disabled:hover,
.btn-info[disabled]:hover,
fieldset[disabled] .btn-info:hover,
.btn-info.disabled:focus,
.btn-info[disabled]:focus,
fieldset[disabled] .btn-info:focus,
.btn-info.disabled.focus,
.btn-info[disabled].focus,
fieldset[disabled] .btn-info.focus,
.btn-info.disabled:active,
.btn-info[disabled]:active,
fieldset[disabled] .btn-info:active,
.btn-info.disabled.active,
.btn-info[disabled].active,
fieldset[disabled] .btn-info.active {
  background-color: SECONDARY(0.87);
  border-color: SECONDARY(0.67);
}
.btn-info:focus,
.btn-info.focus,
.btn-info:hover {
  color: #fff;
  background-color: SECONDARY(1.1);
  border-color: SECONDARY(1.0);
}
.btn-info:active,
.btn-info.active,
.open > .dropdown-toggle.btn-info,
.btn-info:active:hover,
.btn-info.active:hover,
.open > .dropdown-toggle.btn-info:hover,
.btn-info:active:focus,
.btn-info.active:focus,
.open > .dropdown-toggle.btn-info:focus,
.btn-info:active.focus,
.btn-info.active.focus,
.open > .dropdown-toggle.btn-info.focus {
  color: #fff;
  background-color: SECONDARY(0.75);
  border-color: SECONDARY(0.4);
}
.panel-info > .panel-heading {
  background-color: SECONDARY(1.25);
}
.panel-info {
  border-color: SECONDARY(1.0);
}
.panel-info > .panel-heading {
  color: SECONDARY(0.3);
  background-color: SECONDARY(1.1);
  border-color: SECONDARY(1.0);
}
.panel-info > .panel-heading + .panel-collapse > .panel-body {
  border-top-color: SECONDARY(1.0);
}
.panel-info > .panel-heading .badge {
  color: SECONDARY(1.1);
  background-color: SECONDARY(0.6);
}
.panel-info > .panel-footer + .panel-collapse > .panel-body {
  border-bottom-color: SECONDARY(1.0);
}
CSS;
}
