<!doctype html>
<html lang="en" ng-app="cenozoApp">
<head>
  <meta charset="utf-8">
  <title>Sabretooth</title>
  <link rel="stylesheet" href="<?php print CENOZO_URL; ?>/bower_components/bootstrap/dist/css/bootstrap.css">
  <link rel="stylesheet" href="<?php print CENOZO_URL; ?>/bower_components/angular-snap/angular-snap.css">
  <link rel="stylesheet" href="<?php print CENOZO_URL; ?>/css/app.css">

  <script>window.cnCenozoUrl = "<?php print CENOZO_URL; ?>";</script>
  <script src="<?php print CENOZO_URL; ?>/bower_components/jquery/dist/jquery.js"></script>
  <script src="<?php print CENOZO_URL; ?>/bower_components/bootstrap/dist/js/bootstrap.js"></script>
  <script src="<?php print CENOZO_URL; ?>/bower_components/snapjs/snap.js"></script>
  <script src="<?php print CENOZO_URL; ?>/bower_components/angular/angular.js"></script>
  <script src="<?php print CENOZO_URL; ?>/bower_components/angular-bootstrap/ui-bootstrap.js"></script>
  <script src="<?php print CENOZO_URL; ?>/bower_components/angular-bootstrap/ui-bootstrap-tpls.js"></script>
  <script src="<?php print CENOZO_URL; ?>/bower_components/angular-ui-router/release/angular-ui-router.js"></script>
  <script src="<?php print CENOZO_URL; ?>/bower_components/angular-animate/angular-animate.js"></script>
  <script src="<?php print CENOZO_URL; ?>/bower_components/angular-snap/angular-snap.js"></script>

  <script src="<?php print CENOZO_URL; ?>/app/cenozo/animations.js"></script>
  <script src="<?php print CENOZO_URL; ?>/app/cenozo/controllers.js"></script>
  <script src="<?php print CENOZO_URL; ?>/app/cenozo/directives.js"></script>
  <script src="<?php print CENOZO_URL; ?>/app/cenozo/filters.js"></script>
  <script src="<?php print CENOZO_URL; ?>/app/cenozo/services.js"></script>

  <script src="<?php print CENOZO_URL; ?>/app/app.js"></script>
  <script><?php print $script; ?></script>

  <script data-main="<?php print CENOZO_URL; ?>/app/main.js"
          src="<?php print CENOZO_URL; ?>/bower_components/requirejs/require.js"></script>

</head>
<body>
<?php print $body; ?>
</body>
</html>
