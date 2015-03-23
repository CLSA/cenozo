<!doctype html>
<html lang="en" ng-app="cenozoApp">
<head>
  <meta charset="utf-8">
  <title>Sabretooth</title>
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/bootstrap/dist/css/bootstrap.css">
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/angular-snap/angular-snap.css">
  <link rel="stylesheet" href="<?php print CSS_URL; ?>/app.css">

  <script>window.cnCenozoUrl = "<?php print CENOZO_URL; ?>";</script>
  <script src="<?php print LIB_URL; ?>/jquery/dist/jquery.js"></script>
  <script src="<?php print LIB_URL; ?>/bootstrap/dist/js/bootstrap.js"></script>
  <script src="<?php print LIB_URL; ?>/snapjs/snap.js"></script>
  <script src="<?php print LIB_URL; ?>/angular/angular.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-bootstrap/ui-bootstrap.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-bootstrap/ui-bootstrap-tpls.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-ui-router/release/angular-ui-router.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-animate/angular-animate.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-snap/angular-snap.js"></script>

  <script src="<?php print APP_URL; ?>/cenozo/animations.js"></script>
  <script src="<?php print APP_URL; ?>/cenozo/controllers.js"></script>
  <script src="<?php print APP_URL; ?>/cenozo/directives.js"></script>
  <script src="<?php print APP_URL; ?>/cenozo/filters.js"></script>
  <script src="<?php print APP_URL; ?>/cenozo/services.js"></script>

  <script src="<?php print APP_URL; ?>/app.js"></script>
  <script><?php print $script; ?></script>

  <script data-main="<?php print APP_URL; ?>/main.js"
          src="<?php print LIB_URL; ?>/requirejs/require.js"></script>

</head>
<body>
<?php print $body; ?>
</body>
</html>
