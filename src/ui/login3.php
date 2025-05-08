<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <script>
    const ROOT_URL = "<?php print ROOT_URL; ?>";
    const APP_TITLE = "<?php print APP_TITLE; ?>";
    const FIREFOX_MIN_VER = <?php echo $firefox_minimum_version; ?>;
    const CHROME_MIN_VER = <?php echo $chrome_minimum_version; ?>;
  </script>

<?php $this->print_libs(); ?>

  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">

  <title><?php echo APP_TITLE; ?></title>
</head>
<body class="background user-select-none">
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary p-0">
    <div class="container-fluid">
      <button type="button" class="btn btn-primary my-1 py-1" disabled>
        <img class="" src="img/favicon.ico" alt="<?php echo APP_TITLE; ?>" height="20"/>
      </button>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item text-light fw-bold ms-2">/</li>
          <li class="nav-item text-light fw-bold ms-2">Home</li>
        </ul>
      </div>
    </div>
  </nav>

  <div class="container my-3">
    <img
      id="logo"
      class="img-responsive"
      onerror="this.style.display='none'"
      alt=""
    />
  </div>

  <div class="container">
    <div class="card">
      <form name="login">
        <div class="card-header text-bg-primary fw-bold fs-4">
          Login Required
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div>
              <label for="username" class="form-label">Email address</label>
              <input type="username" class="form-control" id="username" placeholder="Username" required>
            </div>
            <div>
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" placeholder="Password" required>
            </div>
          </div>
        </div>
        <div class="card-footer text-bg-info p-3">
          <button name="submit" type="button" class="btn btn-lg btn-primary" autofocus>Submit</button>
          <span name="login-message" class="text-danger mx-3"></span>
        </div>
      </form>
    </div>
  </div>
</body>
</html>
