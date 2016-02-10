<!doctype html>
<html lang="en" ng-app="cenozoApp">
<head>
  <meta charset="utf-8">
  <title><?php echo APP_TITLE; ?></title>
  <link rel="shortcut icon" href="img/favicon.ico">
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/bootstrap/dist/css/bootstrap.css">
  <link rel="stylesheet" href="<?php print CSS_URL; ?>/cenozo.css">

  <script src="<?php print LIB_URL; ?>/jquery/dist/jquery.js"></script>
  <script src="<?php print LIB_URL; ?>/bootstrap/dist/js/bootstrap.js"></script>
</head>
<body class="background">
  <div class="container-fluid jumbotron noselect">
    <h2 class="text-info">
      <i class="glyphicon glyphicon-exclamation-sign"></i>
      <?php echo $title; ?>
    </h2>
    <p class="alert">
      <?php echo $message; ?>
    </p>
  </div>
</body>
</html>
