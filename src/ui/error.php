<!doctype html>
<html lang="en" ng-app="cenozoApp">
<head>
  <meta charset="utf-8">
  <title><?php echo APP_TITLE; ?></title>
  <link rel="shortcut icon" href="img/favicon.ico">
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/bootstrap/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="<?php print CSS_URL; ?>/cenozo.css?build=<?php print CENOZO_BUILD; ?>">
  <link rel="stylesheet" href="<?php print ROOT_URL; ?>/css/theme.css?_">

  <script src="<?php print LIB_URL; ?>/jquery/dist/jquery.min.js"></script>
  <script src="<?php print LIB_URL; ?>/bootstrap/dist/js/bootstrap.min.js"></script>
</head>
<body class="background">
  <div class="container-fluid jumbotron allow-select">
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
