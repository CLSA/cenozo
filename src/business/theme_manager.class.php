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
      'PRIMARY' => array(
        'r' => hexdec( substr( $primary_color, 1, 2 ) ),
        'g' => hexdec( substr( $primary_color, 3, 2 ) ),
        'b' => hexdec( substr( $primary_color, 5, 2 ) )
      ),
      'SECONDARY' => array(
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
   * @param string $type Which color type to return (PRIMARY, PRIMARY_DEC, SECONDARY or SECONDARY_DEC)
   * @param float $fraction What fraction to show the color at (0.0 to 1.0)
   * @return string
   * @access protected
   */
  protected function get_color( $type_name = 'PRIMARY', $fraction = 1.0 )
  {
    $fraction = strval( $fraction );

    // add the color if it doesn't exist
    $parts = explode( '_', $type_name );
    $type = $parts[0];
    $decimal = 1 < count( $parts ) && 'DEC' == $parts[1];
    if( !array_key_exists( $fraction, $this->theme_color_list[$type] ) )
    {
      $r = intval( $fraction * $this->base_theme_color[$type]['r'] );
      if( 0 > $r ) $r = 0; else if( 255 < $r ) $r = 255;
      $g = intval( $fraction * $this->base_theme_color[$type]['g'] );
      if( 0 > $g ) $g = 0; else if( 255 < $g ) $g = 255;
      $b = intval( $fraction * $this->base_theme_color[$type]['b'] );
      if( 0 > $b ) $b = 0; else if( 255 < $b ) $b = 255;

      $this->theme_color_list[$type][$fraction] = [
        'dec' => sprintf( '%d, %d, %d', $r, $g, $b ),
        'hex' => sprintf( '#%s%s%s', dechex( $r ), dechex( $g ), dechex( $b ) ),
      ];
    }

    return $this->theme_color_list[$type][$fraction][$decimal ? 'dec' : 'hex'];
  }

  /**
   * Writes the theme.css file to disk
   * 
   * @access public
   */
  public function generate_theme_css()
  {
    $regex = '/(PRIMARY|PRIMARY_DEC|SECONDARY|SECONDARY_DEC)\(([^)]+)\)/';

    // start with the version 2 css theme.css file
    $css = $this->css_template;

    // find all color types in the css template
    $matches = array();
    preg_match_all( $regex, $css, $matches );

    // replace color references in the css string with actual values
    foreach( $matches[0] as $index => $match )
    {
      $type = $matches[1][$index];
      $fraction = $matches[2][$index];
      $css = str_replace( $match, $this->get_color( $type, $fraction ), $css );
    }

    $filename = sprintf( '%s/web/css/theme.css', APPLICATION_PATH );
    $success = false !== file_put_contents( $filename, $css );

    // now generate the version 3 css theme.css file
    $css = $this->css3_template;

    // find all color types in the css template
    $matches = array();
    preg_match_all( $regex, $css, $matches );

    // replace color references in the css string with actual values
    foreach( $matches[0] as $index => $match )
    {
      $type = $matches[1][$index];
      $fraction = $matches[2][$index];
      $css = str_replace( $match, $this->get_color( $type, $fraction ), $css );
    }

    $filename = sprintf( '%s/web3/css/theme.css', APPLICATION_PATH );

    return $success && false !== file_put_contents( $filename, $css );
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

  /**
   * A CSS template used when writing the theme.css file
   * @var
   * @access protected
   */
  protected $css3_template = <<<'CSS'
[data-bs-theme="custom"] {
  --bs-link-color: PRIMARY(1.0);
  --bs-link-color-rgb: PRIMARY_DEC(1.0);
  --bs-primary-rgb: PRIMARY_DEC(1.0);
  --bs-primary-hover-bg: PRIMARY_DEC(1.25);
  --bs-primary-hover-border: PRIMARY_DEC(0.87);
  --bs-primary-active-bg: PRIMARY_DEC(0.75);
  --bs-primary-active-border: PRIMARY_DEC(0.4);

  --bs-info-rgb: SECONDARY_DEC(1.0);
  --bs-info-hover-bg: SECONDARY_DEC(1.25);
  --bs-info-hover-border: SECONDARY_DEC(0.87);
  --bs-info-active-bg: SECONDARY_DEC(0.75);
  --bs-info-active-border: SECONDARY_DEC(0.4);

  .text-bg-primary {
    background-color: rgba(var(--bs-primary-rgb), var(--bs-bg-opacity, 1)) !important;
  }

  .bg-primary {
    background-color: rgba(var(--bs-primary-rgb), var(--bs-bg-opacity)) !important;
  }

  .bg-primary-subtle {
    background-color: var(--bs-primary-rgb-subtle) !important;
  }

  .btn-primary {
    --bs-btn-bg: rgb(var(--bs-primary-rgb));
    --bs-btn-border-color: rgb(var(--bs-primary-rgb));
    --bs-btn-hover-bg: rgb(var(--bs-primary-hover-bg));
    --bs-btn-hover-border-color: rgb(var(--bs-primary-hover-border));
    --bs-btn-active-bg: rgb(var(--bs-primary-active-bg));
    --bs-btn-active-border-color: rgb(var(--bs-primary-active-border));
    --bs-btn-disabled-bg: rgb(var(--bs-primary-rgb));
    --bs-btn-disabled-border-color: rgb(var(--bs-primary-rgb));
  }

  .btn-outline-primary {
    --bs-btn-color: rgb(var(--bs-primary-rgb));
    --bs-btn-border-color: rgb(var(--bs-primary-rgb));
    --bs-btn-hover-bg: rgb(var(--bs-primary-rgb));
    --bs-btn-hover-border-color: rgb(var(--bs-primary-rgb));
    --bs-btn-active-bg: rgb(var(--bs-primary-rgb));
    --bs-btn-active-border-color: rgb(var(--bs-primary-rgb));
    --bs-btn-disabled-color: rgb(var(--bs-primary-rgb));
    --bs-btn-disabled-border-color: rgb(var(--bs-primary-rgb));
  }

  .form-check-input:checked {
    background-color: rgb(var(--bs-primary-rgb));
    border-color: rgb(var(--bs-primary-rgb));
  }

  .form-check-input[type=checkbox]:indeterminate {
    background-color: rgb(var(--bs-primary-rgb));
    border-color: rgb(var(--bs-primary-rgb));
  }

  .form-range::-webkit-slider-thumb {
    background-color: rgb(var(--bs-primary-rgb));
  }

  .form-range::-moz-range-thumb {
    background-color: rgb(var(--bs-primary-rgb));
  }

  .dropdown-menu {
    --bs-dropdown-link-active-bg: rgb(var(--bs-primary-rgb));
  }

  .dropdown-menu-dark {
    --bs-dropdown-link-active-bg: rgb(var(--bs-primary-rgb));
  }

  .nav-pills {
    --bs-nav-pills-link-active-bg: rgb(var(--bs-primary-rgb));
  }

  .list-group {
    --bs-list-group-active-bg: rgb(var(--bs-primary-rgb));
    --bs-list-group-active-border-color: rgb(var(--bs-primary-rgb));
  }

  .text-bg-info {
    color: #000 !important;
    background-color: rgba(var(--bs-info-rgb), var(--bs-bg-opacity, 1)) !important;
  }

  .bg-info {
    background-color: rgba(var(--bs-info-rgb), var(--bs-bg-opacity)) !important;
  }

  .bg-info-subtle {
    background-color: var(--bs-info-rgb-subtle) !important;
  }

  .accordion-button {
    color: #000 !important;
    background-color: rgba(var(--bs-info-rgb), var(--bs-bg-opacity, 1)) !important;
    border-radius: 0px;
  }

  .accordion-button:not(.collapsed) {
    color: inherit;
  }

  .accordion-button:focus{
    box-shadow: inherit;
  }

  .accordion-button:hover{
    background-color: rgba(var(--bs-info-hover-bg), var(--bs-bg-opacity, 1)) !important;
  }

  .pagination {
    --bs-pagination-active-bg: rgb(var(--bs-primary-rgb));
    --bs-pagination-active-border-color: rgb(var(--bs-primary-rgb));
  }

  .progress,
  .progress-stacked {
    --bs-progress-bar-bg: rgb(var(--bs-primary-rgb));
  }

  .btn-info {
    --bs-btn-bg: rgb(var(--bs-info-rgb));
    --bs-btn-border-color: rgb(var(--bs-info-rgb));
    --bs-btn-hover-bg: rgb(var(--bs-info-hover-bg));
    --bs-btn-hover-border-color: rgb(var(--bs-info-hover-border));
    --bs-btn-active-bg: rgb(var(--bs-info-active-bg));
    --bs-btn-active-border-color: rgb(var(--bs-info-active-border));
    --bs-btn-disabled-bg: rgb(var(--bs-info-rgb));
    --bs-btn-disabled-border-color: rgb(var(--bs-info-rgb));
  }

  .btn-outline-info {
    --bs-btn-color: rgb(var(--bs-info-rgb));
    --bs-btn-border-color: rgb(var(--bs-info-rgb));
    --bs-btn-hover-bg: rgb(var(--bs-info-rgb));
    --bs-btn-hover-border-color: rgb(var(--bs-info-rgb));
    --bs-btn-active-bg: rgb(var(--bs-info-rgb));
    --bs-btn-active-border-color: rgb(var(--bs-info-rgb));
    --bs-btn-disabled-color: rgb(var(--bs-info-rgb));
    --bs-btn-disabled-border-color: rgb(var(--bs-info-rgb));
  }
}
CSS;
}
