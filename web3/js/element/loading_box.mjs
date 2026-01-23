  /**
   * Creates a large loading box
   * @return Element
   */
  create_loading_box: function (text = null) {
    if (null == text) text = "Loading...";
    return this.create(`
      <div class="container-fluid loading text-primary text-center fs-5 fw-bold" style="height: 9em;">
       ${text}
      </div>
    `);
  },
