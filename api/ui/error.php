<!doctype html>
<html lang="en" ng-app="sabretoothApp">
<head>
  <meta charset="utf-8">
  <title><?php echo ucwords( INSTANCE ); ?></title>
  <link rel="shortcut icon" href="img/favicon.ico" />
  <link href="<?php echo CSS_URL; ?>/app.css" rel="stylesheet" />
</head>

<body>
  <div class="has-error">
    <h2><?php echo $title; ?></h2>
    <div>
      <p><?php echo $message; ?></p>
      <p class="error_code">Error code: I.<?php echo $code; ?></p>
    </div>
  </div>
</body>
