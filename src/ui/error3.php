<!doctype html>
<html lang="en" data-bs-theme="custom">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

<?php $this->print_libs(); ?>

  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">

  <title><?php echo APP_TITLE; ?></title>
</head>
<body class="background user-select-none">
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary p-0">
    <div class="container-fluid">
      <button type="button" class="btn btn-primary my-1 py-1" disabled>
        <strong><?php echo APP_TITLE; ?></strong>
      </button>
    </div>
  </nav>

  <div class="bg-white pt-2 pb-4">
    <div class="container my-3">
      <img id="logo" class="img-responsive w-50" onerror="this.style.display='none'"></img>
    </div>

    <div class="container">
      <div class="card">
        <div class="card-header text-bg-primary fw-bold fs-4">
          <i class="glyphicon glyphicon-exclamation-sign"></i>
          <?php echo $title; ?>
        </div>
        <div class="card-body">
          <p class="alert">
            <?php echo $message; ?>
          </p>
<?php if( isset( $code ) && $code ) { ?>
          <code class="spacer" style="background-color: inherit;">
            Error Code: <?php echo $code; ?>
          </code>
<?php } ?>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
